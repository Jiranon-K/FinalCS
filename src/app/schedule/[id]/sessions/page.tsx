'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { Course } from '@/types/course';
import { AttendanceSession } from '@/types/session';
import { AttendanceRecord } from '@/types/attendance';
import Loading from '@/components/ui/Loading';
import OpenSessionModal from '@/components/course/OpenSessionModal';
import AttendanceTable from '@/components/course/AttendanceTable';
import SessionHistory from '@/components/course/SessionHistory';

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

export default function SessionsPage() {
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
      const response = await fetch(`/api/attendance/sessions/${sessionId}`, {
        cache: 'no-store'
      });
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
    let interval: NodeJS.Timeout;
    if (activeSession) {
      fetchAttendanceRecords(activeSession.id);
      interval = setInterval(() => {
        fetchAttendanceRecords(activeSession.id);
      }, 5000);
    } else {
      setAttendanceRecords([]);
    }
    return () => clearInterval(interval);
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

  const handleOpenSessionSuccess = () => {
    fetchSessions();
  };

  const handleRefreshAttendance = () => {
    if (activeSession) {
      fetchAttendanceRecords(activeSession.id);
      fetchSessions();
    }
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-sm breadcrumbs mb-2">
            <ul>
              <li><a onClick={() => router.push('/schedule')}>{t.schedule.title}</a></li>
              <li>{course.courseCode}</li>
              <li>{t.course.sessionControl}</li>
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
      </div>

      {(canManageCourse || user?.role === 'student') && (
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

              {canManageCourse && (
                activeSession ? (
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
                )
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

      <div className="card bg-base-100 shadow-lg border border-base-200">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">{t.course.sessionHistory}</h2>
          <SessionHistory
            sessions={sessions.filter((s) => s.status !== 'active')}
            courseId={courseId}
          />
        </div>
      </div>

      {canManageCourse && course && (
        <OpenSessionModal
          isOpen={openSessionModalOpen}
          course={course}
          onClose={() => setOpenSessionModalOpen(false)}
          onSuccess={handleOpenSessionSuccess}
          existingSessions={sessions}
        />
      )}
    </div>
  );
}
