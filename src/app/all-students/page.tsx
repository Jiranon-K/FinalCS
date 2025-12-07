'use client';

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/useLocale';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import StudentTable, { Student } from '@/components/students/StudentTable';
import StudentDetailModal from '@/components/students/StudentDetailModal';
import StudentFilterCard from '@/components/students/StudentFilterCard';

import { faFileExcel } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function AllStudentsPage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [grade, setGrade] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Access control
  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'teacher') {
      router.push('/');
      showToast({ message: t.common.accessDenied, type: 'error' });
    }
  }, [user, router, showToast, t]);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (department) params.append('department', department);
      if (grade) params.append('grade', grade);
      if (studentClass) params.append('class', studentClass);
      params.append('limit', '100'); 

      const response = await fetch(`/api/students?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setStudents(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      showToast({
        message: error instanceof Error ? error.message : t.students.noStudents,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [search, department, grade, studentClass, showToast, t]);

 
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'teacher')) {
        const timer = setTimeout(() => {
            fetchStudents();
        }, 300); 
        return () => clearTimeout(timer);
    }
  }, [user, fetchStudents, search, department, grade, studentClass]);

  if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
    return null;
  }

  const handleImport = () => {
    showToast({ message: t.settings.comingSoon, type: 'info' });
  };

  return (
    <div className="min-h-screen bg-base-100 pb-10">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold">{t.students.title}</h1>
                <p className="text-base-content/60">{t.students.subtitle}</p>
            </div>
            
            <button 
                className="btn btn-success text-white btn-sm gap-2 shadow-lg shadow-success/20 hover:shadow-success/40 transition-all"
                onClick={handleImport}
            >
                <FontAwesomeIcon icon={faFileExcel} />
                {t.students.importExcel}
            </button>
        </div>

        <StudentFilterCard
          search={search}
          department={department}
          grade={grade}
          studentClass={studentClass}
          onSearchChange={setSearch}
          onDepartmentChange={setDepartment}
          onGradeChange={setGrade}
          onClassChange={setStudentClass}
          onClearFilters={() => {
            setSearch('');
            setDepartment('');
            setGrade('');
            setStudentClass('');
          }}
        />

        <StudentTable
          students={students}
          loading={loading}
          onView={setSelectedStudent}
        />

        <StudentDetailModal 
            student={selectedStudent} 
            isOpen={!!selectedStudent} 
            onClose={() => setSelectedStudent(null)} 
        />
      </div>
    </div>
  );
}
