import { useState, useEffect } from 'react';
import { Student } from './StudentTable';
import { useLocale } from '@/hooks/useLocale';
import { getSafeRegisterString } from '@/utils/translation';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUser, faBook, faClock, faSpinner } from '@fortawesome/free-solid-svg-icons';

interface StudentDetailModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

interface AttendanceRecord {
  id: string;
  courseId: string | {
      _id: string;
      courseName: string;
      courseCode: string;
  };
  sessionId: string;
  status: 'present' | 'absent' | 'late' | 'leave' | 'normal';
  checkInTime: string;
  createdAt: string;
  session?: {
      courseName?: string;
  }
}

interface Course {
  id: string;
  courseCode: string;
  courseName: string;
  semester: string;
  academicYear: string;
}

export default function StudentDetailModal({ student, isOpen, onClose }: StudentDetailModalProps) {
  const { t, locale } = useLocale();
  const [activeTab, setActiveTab] = useState<'profile' | 'courses' | 'attendance'>('profile');
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);


  useEffect(() => {
    const fetchAttendance = async () => {
      if (!student) return;
      try {
        setLoadingAttendance(true);
        const response = await fetch(`/api/attendance/records?studentId=${student._id}&limit=20`);
        const result = await response.json();
        if (result.success) {
          setAttendance(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch attendance:', error);
      } finally {
        setLoadingAttendance(false);
      }
    };

    if (isOpen && student && activeTab === 'attendance') {
      fetchAttendance();
    }
  }, [isOpen, student, activeTab]);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!student) return;
      try {
        setLoadingCourses(true);
        const response = await fetch(`/api/courses?studentId=${student._id}`);
        const result = await response.json();
        if (result.success) {
          setCourses(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoadingCourses(false);
      }
    };

    if (isOpen && student && activeTab === 'courses') {
      fetchCourses();
    }
  }, [isOpen, student, activeTab]);

  if (!isOpen || !student) return null;

  return (
    <div className="modal modal-open bg-black/50 backdrop-blur-sm">
      <div className="modal-box w-11/12 max-w-4xl p-0 overflow-hidden bg-base-100 rounded-2xl shadow-2xl">
        
        {/* Header */}
        <div className="bg-primary/5 p-6 border-b border-base-200 flex justify-between items-start">
            <div className="flex gap-4 items-center">
                <div className="avatar">
                    <div className="w-20 h-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                        {student.imageUrl ? (
                            <Image 
                                src={student.imageUrl} 
                                alt={student.name} 
                                width={80} 
                                height={80} 
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-neutral text-neutral-content flex items-center justify-center text-3xl font-bold">
                                {student.name.substring(0, 1).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-2xl">{student.name}</h3>
                    <p className="text-base-content/60 font-mono">{student.studentId}</p>
                    <div className="flex gap-2 mt-2">
                        <span className="badge badge-primary badge-outline bg-primary/5">
                            {getSafeRegisterString(t.register, `dept${student.department}`) || student.department}
                        </span>
                    </div>
                </div>
            </div>
            <button 
                onClick={onClose}
                className="btn btn-ghost btn-circle btn-sm hover:bg-base-200"
            >
                <FontAwesomeIcon icon={faTimes} className="text-lg" />
            </button>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-bordered px-6 pt-4">
            <a 
                className={`tab tab-lg gap-2 ${activeTab === 'profile' ? 'tab-active font-bold border-primary text-primary' : ''}`}
                onClick={() => setActiveTab('profile')}
            >
                <FontAwesomeIcon icon={faUser} />
                {t.students.details.tabs.profile}
            </a>
            <a 
                className={`tab tab-lg gap-2 ${activeTab === 'attendance' ? 'tab-active font-bold border-primary text-primary' : ''}`}
                onClick={() => setActiveTab('attendance')}
            >
                <FontAwesomeIcon icon={faClock} />
                {t.students.details.tabs.attendance}
            </a>
            <a 
                className={`tab tab-lg gap-2 ${activeTab === 'courses' ? 'tab-active font-bold border-primary text-primary' : ''}`}
                onClick={() => setActiveTab('courses')}
            >
                <FontAwesomeIcon icon={faBook} />
                {t.students.details.tabs.courses}
            </a>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[400px]">
            
            {activeTab === 'profile' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="form-control w-full">
                        <label className="label text-base-content/50 text-sm font-medium uppercase tracking-wider">{t.register.name}</label>
                        <div className="text-lg font-medium border-b border-base-200 pb-2">{student.name}</div>
                    </div>
                    <div className="form-control w-full">
                        <label className="label text-base-content/50 text-sm font-medium uppercase tracking-wider">{t.register.email}</label>
                        <div className="text-lg font-medium border-b border-base-200 pb-2">{student.email || '-'}</div>
                    </div>
                    <div className="form-control w-full">
                        <label className="label text-base-content/50 text-sm font-medium uppercase tracking-wider">{t.register.phone}</label>
                        <div className="text-lg font-medium border-b border-base-200 pb-2">{student.phone || '-'}</div>
                    </div>
                    <div className="form-control w-full">
                        <label className="label text-base-content/50 text-sm font-medium uppercase tracking-wider">{t.register.department}</label>
                        <div className="text-lg font-medium border-b border-base-200 pb-2">
                            {getSafeRegisterString(t.register, `dept${student.department}`) || student.department || '-'}
                        </div>
                    </div>
                    <div className="form-control w-full">
                         <label className="label text-base-content/50 text-sm font-medium uppercase tracking-wider">{t.register.grade}</label>
                         <div className="text-lg font-medium border-b border-base-200 pb-2">
                            {getSafeRegisterString(t.register, `gradeYear${student.grade}`) || student.grade || '-'}
                         </div>
                    </div>
                    <div className="form-control w-full">
                         <label className="label text-base-content/50 text-sm font-medium uppercase tracking-wider">{t.register.class}</label>
                         <div className="text-lg font-medium border-b border-base-200 pb-2">
                             {getSafeRegisterString(t.register, `class${student.class}`) || student.class || '-'}
                         </div>
                    </div>
                </div>
            )}

            {activeTab === 'attendance' && (
                <div className="overflow-x-auto">
                    {loadingAttendance ? (
                        <div className="flex justify-center py-20">
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-primary/50" />
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr className="bg-base-200/50">
                                    <th>{t.students.details.attendance.date}</th>
                                    <th>{t.students.details.attendance.course}</th>
                                    <th>{t.students.details.attendance.status}</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendance.length > 0 ? attendance.map((record) => (
                                    <tr key={record.id}>
                                        <td>{new Date(record.createdAt).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US')}</td>
                                        <td>
                                            {typeof record.courseId === 'object' && record.courseId ? (
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-xs">{record.courseId.courseCode}</span>
                                                    <span className="text-xs opacity-70">{record.courseId.courseName}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs opacity-50">-</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className={`badge ${
                                                (record.status === 'present' || record.status === 'normal') ? 'badge-success text-white' :
                                                record.status === 'absent' ? 'badge-error text-white' :
                                                record.status === 'late' ? 'badge-warning' : 'badge-ghost'
                                            }`}>
                                                {(record.status === 'present' || record.status === 'normal') ? t.attendance.present :
                                                  record.status === 'absent' ? t.attendance.absent :
                                                  record.status === 'late' ? t.attendance.late :
                                                  record.status === 'leave' ? (t.attendanceManagement.statusLeave || 'Leave') : record.status}
                                            </div>
                                        </td>
                                        <td className="font-mono text-sm opacity-70">
                                            {new Date(record.checkInTime).toLocaleTimeString(locale === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-10 opacity-50">
                                            {t.students.details.attendance.noRecords}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {activeTab === 'courses' && (
                <div className="overflow-x-auto">
                    {loadingCourses ? (
                        <div className="flex justify-center py-20">
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-primary/50" />
                        </div>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr className="bg-base-200/50">
                                    <th>{t.students.details.courses.code}</th>
                                    <th>{t.students.details.courses.name}</th>
                                    <th>{t.students.details.courses.semester}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.length > 0 ? courses.map((course) => (
                                    <tr key={course.id}>
                                        <td className="font-mono font-bold">{course.courseCode}</td>
                                        <td>{course.courseName}</td>
                                        <td>
                                            <div className="badge badge-ghost badge-sm">
                                                {course.semester}/{course.academicYear}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="text-center py-10 opacity-50">
                                            {t.students.details.courses.noCourses}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
