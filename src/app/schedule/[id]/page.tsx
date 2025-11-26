'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { Course } from '@/types/course';
import { AttendanceSession } from '@/types/session';
import { AttendanceRecord } from '@/types/attendance';
import Image from 'next/image';
import Loading from '@/components/ui/Loading';
import OpenSessionModal from '@/components/course/OpenSessionModal';
import EnrollmentManager from '@/components/course/EnrollmentManager';
import AttendanceTable from '@/components/course/AttendanceTable';
import SessionHistory from '@/components/course/SessionHistory';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';

// Icons
const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
  </svg>
);

const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLocale();
  const { showToast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSessionModalOpen, setOpenSessionModalOpen] = useState(false);
  const [closingSession, setClosingSession] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canManageCourse = user?.role === 'admin' || user?.role === 'teacher';

  const fetchCourseDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${courseId}`);
      const result = await response.json();

      if (result.success) {
        setCourse(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      showToast({
        message: error instanceof Error ? error.message : t.course.createError,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [courseId, showToast, t]);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch(`/api/attendance/sessions?courseId=${courseId}`);
      const result = await response.json();

      if (result.success) {
        setSessions(result.data);
        const active = result.data.find((s: AttendanceSession) => s.status === 'active');
        setActiveSession(active || null);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  }, [courseId]);

  const fetchAttendanceRecords = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/attendance/sessions/${sessionId}`);
      const result = await response.json();

      if (result.success) {
        setAttendanceRecords(result.data.records || []);
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      fetchCourseDetails();
      fetchSessions();
    }
  }, [authLoading, user, fetchCourseDetails, fetchSessions]);

  useEffect(() => {
    if (activeSession) {
      fetchAttendanceRecords(activeSession.id);
    } else {
      setAttendanceRecords([]);
    }
  }, [activeSession, fetchAttendanceRecords]);

  const handleCloseSession = async () => {
    if (!activeSession) return;

    try {
      setClosingSession(true);
      const response = await fetch(`/api/attendance/sessions/${activeSession.id}/close`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        showToast({ message: t.attendanceManagement.closeSessionSuccess, type: 'success' });
        fetchSessions();
      } else {
        throw new Error(result.error || t.attendanceManagement.closeSessionError);
      }
    } catch (error) {
      console.error('Error closing session:', error);
      showToast({
        message: error instanceof Error ? error.message : t.attendanceManagement.closeSessionError,
        type: 'error',
      });
    } finally {
      setClosingSession(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        showToast({ message: t.course.deleteSuccess, type: 'success' });
        router.push('/schedule');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      showToast({
        message: error instanceof Error ? error.message : t.course.deleteError,
        type: 'error',
      });
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const handleOpenSessionSuccess = () => {
    fetchSessions();
  };

  const handleRefreshAttendance = () => {
    if (activeSession) {
      fetchAttendanceRecords(activeSession.id);
      fetchSessions();
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const days = [
      t.schedule.sunday,
      t.schedule.monday,
      t.schedule.tuesday,
      t.schedule.wednesday,
      t.schedule.thursday,
      t.schedule.friday,
      t.schedule.saturday,
    ];
    return days[dayOfWeek] || '';
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl flex justify-center items-center min-h-[50vh]">
        <Loading variant="spinner" size="lg" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="alert alert-error">
          <span>{t.course.noCourses}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-8 max-w-7xl space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-sm breadcrumbs mb-2">
            <ul>
              <li><a onClick={() => router.push('/schedule')}>{t.schedule.title}</a></li>
              <li>{course.courseCode}</li>
            </ul>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            {course.courseName}
            <div className="badge badge-primary badge-lg">{course.courseCode}</div>
          </h1>
          <p className="text-base-content/70 mt-1">
            {t.course.semester} {course.semester} / {course.academicYear} • {course.teacherName}
          </p>
        </div>

        <div className="flex gap-2">
          {canManageCourse && (
            <>
              {user?.role === 'admin' && (
                 <button
                 className="btn btn-ghost btn-sm text-error gap-2"
                 onClick={() => setDeleteModalOpen(true)}
               >
                 <TrashIcon />
                 {t.users.delete}
               </button>
              )}
             
              <button
                className="btn btn-ghost btn-sm gap-2"
                onClick={() => router.push(`/schedule/${courseId}/edit`)}
              >
                <EditIcon />
                {t.users.edit}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats shadow w-full bg-base-100">
        <div className="stat">
          <div className="stat-figure text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          </div>
          <div className="stat-title">{t.course.enrolledStudents}</div>
          <div className="stat-value text-primary">{course.enrolledStudents.length}</div>
          <div className="stat-desc">{t.course.students}</div>
        </div>
        
        <div className="stat">
          <div className="stat-figure text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div className="stat-title">{t.course.scheduleSlots}</div>
          <div className="stat-value text-secondary">{course.schedule.length}</div>
          <div className="stat-desc">{t.schedule.weeklySchedule}</div>
        </div>

        <div className="stat">
          <div className="stat-figure text-accent">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          </div>
          <div className="stat-title">{t.course.room}</div>
          <div className="stat-value text-accent text-2xl">{course.room}</div>
          <div className="stat-desc">{t.course.defaultRoom}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Session Control */}
          {canManageCourse && (
            <div className="card bg-base-100 shadow-lg border border-base-200">
              <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="card-title text-xl">
                    {activeSession ? (
                      <span className="flex items-center gap-2 text-success">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                        </span>
                        {t.course.activeSession}
                      </span>
                    ) : (
                      t.course.sessionControl
                    )}
                  </h2>
                  
                  {activeSession ? (
                    <button
                      className="btn btn-error btn-sm gap-2"
                      onClick={handleCloseSession}
                      disabled={closingSession}
                    >
                      {closingSession ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <StopIcon />
                      )}
                      {t.course.closeSession}
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm gap-2"
                      onClick={() => {
                        fetchSessions();
                        setOpenSessionModalOpen(true);
                      }}
                    >
                      <PlayIcon />
                      {t.course.openSession}
                    </button>
                  )}
                </div>

                {activeSession ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex flex-col p-3 bg-base-200 rounded-box text-center">
                        <span className="text-xs uppercase tracking-wider opacity-70">{t.attendanceManagement.expected}</span>
                        <span className="text-2xl font-bold">{activeSession.stats.expectedCount}</span>
                      </div>
                      <div className="flex flex-col p-3 bg-success/10 text-success rounded-box text-center">
                         <span className="text-xs uppercase tracking-wider opacity-70">{t.attendanceManagement.present}</span>
                        <span className="text-2xl font-bold">{activeSession.stats.presentCount}</span>
                      </div>
                      <div className="flex flex-col p-3 bg-warning/10 text-warning rounded-box text-center">
                         <span className="text-xs uppercase tracking-wider opacity-70">{t.attendanceManagement.statusLate}</span>
                        <span className="text-2xl font-bold">{activeSession.stats.lateCount}</span>
                      </div>
                      <div className="flex flex-col p-3 bg-error/10 text-error rounded-box text-center">
                         <span className="text-xs uppercase tracking-wider opacity-70">{t.attendanceManagement.statusAbsent}</span>
                        <span className="text-2xl font-bold">{activeSession.stats.absentCount}</span>
                      </div>
                    </div>

                    <div className="divider"></div>
                    
                    <div>
                      <h3 className="font-bold mb-4">{t.attendanceManagement.attendanceRecords}</h3>
                      <AttendanceTable
                        records={attendanceRecords}
                        user={user!}
                        onRefresh={handleRefreshAttendance}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-base-content/50">
                    <p>{t.course.noActiveSessions}</p>
                    <p className="text-sm mt-2">{t.course.openSession} {t.attendanceManagement.checkIn}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Session History */}
          <div className="card bg-base-100 shadow-lg border border-base-200">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">{t.course.sessionHistory}</h2>
              <SessionHistory
                sessions={sessions.filter((s) => s.status !== 'active')}
                courseId={courseId}
              />
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-8">
          
          {/* Schedule Info */}
          <div className="card bg-base-100 shadow-lg border border-base-200">
            <div className="card-body">
              <h3 className="card-title text-lg mb-4">{t.course.schedule}</h3>
              <div className="space-y-3">
                {course.schedule.map((slot, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                    <div className="flex flex-col">
                      <span className="font-bold">{getDayName(slot.dayOfWeek)}</span>
                      <span className="text-xs opacity-70">{t.course.graceMinutes}: {slot.graceMinutes}m</span>
                    </div>
                    <div className="badge badge-neutral">{slot.startTime} - {slot.endTime}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Manager (Admin Only) - Full Width Section */}
      {user?.role === 'admin' && (
        <div className="card bg-base-100 shadow-lg border border-base-200">
          <div className="card-body">
            <h3 className="card-title text-lg mb-4">{t.course.manageEnrollment}</h3>
            <EnrollmentManager course={course} onUpdate={fetchCourseDetails} />
          </div>
        </div>
      )}

      {/* Modals */}
      {canManageCourse && course && (
        <OpenSessionModal
          isOpen={openSessionModalOpen}
          course={course}
          onClose={() => setOpenSessionModalOpen(false)}
          onSuccess={handleOpenSessionSuccess}
          existingSessions={sessions}
        />
      )}

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title={t.course.deleteCourse}
        message={`${t.course.confirmDelete} "${course?.courseName}"?`}
        confirmLabel={t.users.delete}
        cancelLabel={t.users.cancel}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
        loading={deleting}
      />
    </div>
  );
}
