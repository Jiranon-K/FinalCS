'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/useLocale';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import StudentTable from '@/components/students/StudentTable';
import { Student } from '@/types/student';
import StudentDetailModal from '@/components/students/StudentDetailModal';
import StudentFilterCard from '@/components/students/StudentFilterCard';
import ImportStudentsModal from '@/components/students/ImportStudentsModal';
import PendingStudentTable from '@/components/users/PendingStudentTable';
import ActivateStudentModal from '@/components/users/ActivateStudentModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileImport, faCheckCircle, faClock } from '@fortawesome/free-solid-svg-icons';

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
  const [importModalOpen, setImportModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<'active' | 'waiting'>('active');
  const [activateModalStudent, setActivateModalStudent] = useState<Student | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);

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
      params.append('limit', '1000'); 

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

  const handleActivate = (student: Student) => {
    setActivateModalStudent(student);
  };

  const handleConfirmActivate = async (studentId: string, email: string) => {
    try {
      setActivatingId(studentId);
      const res = await fetch('/api/users/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, email })
      });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }

      showToast({ message: t.users.activateSuccess, type: 'success' });
      fetchStudents();
    } catch (error) {
           showToast({ message: error instanceof Error ? error.message : t.users.activateError, type: 'error' });
           throw error; 
    } finally {
      setActivatingId(null);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
    return null;
  }

  const activeStudents = students.filter(s => s.accountStatus === 'active' || (!s.accountStatus && s.userId));
  const waitingStudents = students.filter(s => s.accountStatus === 'waiting' || (!s.accountStatus && !s.userId));

  return (
    <div className="min-h-screen bg-base-100 pb-10">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold">{t.students.title}</h1>
              <p className="text-base-content/60">{t.students.subtitle}</p>
          </div>
          
          {user?.role === 'admin' && (
              <button 
                  className="btn btn-primary gap-2"
                  onClick={() => setImportModalOpen(true)}
              >
                  <FontAwesomeIcon icon={faFileImport} />
                  {t.students.importModal.title}
              </button>
          )}
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

        <div role="tablist" className="tabs tabs-boxed mb-6 bg-base-200/50 p-1 w-fit">
            <a 
                role="tab" 
                className={`tab gap-2 ${activeTab === 'active' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('active')}
            >
                <FontAwesomeIcon icon={faCheckCircle} className={activeTab === 'active' ? '' : 'opacity-50'} />
                {t.users.tabs.activeUsers}
                <div className={`badge badge-sm ${activeTab === 'active' ? 'badge-primary' : 'badge-ghost'}`}>
                    {activeStudents.length}
                </div>
            </a>
            {user?.role === 'admin' && (
                <a 
                    role="tab" 
                    className={`tab gap-2 ${activeTab === 'waiting' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('waiting')}
                >
                    <FontAwesomeIcon icon={faClock} className={activeTab === 'waiting' ? '' : 'opacity-50'} />
                    {t.users.tabs.pendingActivation} 
                    <div className={`badge badge-sm ${activeTab === 'waiting' ? 'badge-warning' : 'badge-ghost'}`}>
                        {waitingStudents.length}
                    </div>
                </a>
            )}
        </div>

        {activeTab === 'active' || user?.role !== 'admin' ? (
            <StudentTable
            students={activeStudents}
            loading={loading}
            onView={setSelectedStudent}
            />
        ) : (
            <PendingStudentTable
                students={waitingStudents}
                loading={loading}
                onActivate={handleActivate}
                activatingId={activatingId}
            />
        )}

        <StudentDetailModal 
            student={selectedStudent} 
            isOpen={!!selectedStudent} 
            onClose={() => setSelectedStudent(null)} 
        />

        <ImportStudentsModal 
            isOpen={importModalOpen} 
            onClose={() => setImportModalOpen(false)} 
            onSuccess={() => {
                fetchStudents();
                setActiveTab('waiting');
            }}
        />

        <ActivateStudentModal
            isOpen={!!activateModalStudent}
            student={activateModalStudent}
            onClose={() => setActivateModalStudent(null)}
            onConfirm={handleConfirmActivate}
        />
      </div>
    </div>
  );
}
