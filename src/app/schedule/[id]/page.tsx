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
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <button
            onClick={() => router.push('/schedule')}
            className="btn btn-ghost btn-sm gap-2 mb-4"
          >
            <BackIcon />
            {t.attendanceManagement.back}
          </button>
          
          {user?.role === 'admin' && (
            <div className="flex gap-2">
              <button
                className="btn btn-ghost btn-sm text-error"
                onClick={() => setDeleteModalOpen(true)}
              >
                {t.users.delete}
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => router.push(`/schedule/${courseId}/edit`)}
              >
                {t.users.edit}
              </button>
            </div>
          )}
          {user?.role === 'teacher' && course?.teacherId?.toString() === user?.profileId && (
            <div className="flex gap-2">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => router.push(`/schedule/${courseId}/edit`)}
              >
                {t.users.edit}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Image
              src="/menu-icon/document.png"
              alt="Course Icon"
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
            />
            {course.courseName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-primary font-mono">{course.courseCode}</span>
          <span className="text-base-content/70">
            {course.semester} / {course.academicYear}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title text-lg">{t.course.teacher}</h3>
            <p className="text-xl font-semibold">{course.teacherName}</p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title text-lg">{t.course.room}</h3>
            <p className="text-xl font-semibold">{course.room}</p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="card-title text-lg">{t.course.enrolledStudents}</h3>
            <p className="text-xl font-semibold">{course.enrolledStudents.length}</p>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body">
          <h3 className="card-title">{t.course.schedule}</h3>
          <div className="space-y-2">
            {course.schedule.map((slot, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-base-200 rounded-lg">
                <span className="font-semibold">{getDayName(slot.dayOfWeek)}</span>
                <span className="badge">{slot.startTime} - {slot.endTime}</span>
                <span className="text-sm text-base-content/60">
                  {t.course.graceMinutes}: {slot.graceMinutes} {t.attendanceManagement.minutes}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {canManageCourse && (
        <>
          <div className="card bg-base-100 shadow-lg mb-6">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="card-title">
                    {activeSession ? t.course.activeSession : t.course.sessionControl}
                  </h3>
                  {activeSession && (
                    <p className="text-sm text-base-content/60 mt-1">
                      {getDayName(activeSession.dayOfWeek)} - {new Date(activeSession.sessionDate).toLocaleDateString('th-TH')} • {activeSession.startTime} - {activeSession.endTime}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {activeSession ? (
                    <button
                      className="btn btn-error gap-2"
                      onClick={handleCloseSession}
                      disabled={closingSession}
                    >
                      {closingSession ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          {t.attendanceManagement.closing}
                        </>
                      ) : (
                        <>
                          <StopIcon />
                          {t.course.closeSession}
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      className="btn btn-success gap-2"
                      onClick={() => setOpenSessionModalOpen(true)}
                    >
                      <PlayIcon />
                      {t.course.openSession}
                    </button>
                  )}
                </div>
              </div>

              {activeSession && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                  <div className="stat p-3 bg-base-200 rounded-lg">
                    <div className="stat-title text-xs">{t.attendanceManagement.expected}</div>
                    <div className="stat-value text-xl">{activeSession.stats.expectedCount}</div>
                  </div>
                  <div className="stat p-3 bg-success/10 rounded-lg">
                    <div className="stat-title text-xs text-success">{t.attendanceManagement.present}</div>
                    <div className="stat-value text-xl text-success">{activeSession.stats.presentCount}</div>
                  </div>
                  <div className="stat p-3 bg-base-200 rounded-lg">
                    <div className="stat-title text-xs">{t.attendanceManagement.statusNormal}</div>
                    <div className="stat-value text-xl">{activeSession.stats.normalCount}</div>
                  </div>
                  <div className="stat p-3 bg-warning/10 rounded-lg">
                    <div className="stat-title text-xs text-warning">{t.attendanceManagement.statusLate}</div>
                    <div className="stat-value text-xl text-warning">{activeSession.stats.lateCount}</div>
                  </div>
                  <div className="stat p-3 bg-error/10 rounded-lg">
                    <div className="stat-title text-xs text-error">{t.attendanceManagement.statusAbsent}</div>
                    <div className="stat-value text-xl text-error">{activeSession.stats.absentCount}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {activeSession && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">{t.attendanceManagement.attendanceRecords}</h2>
              <AttendanceTable
                records={attendanceRecords}
                user={user!}
                onRefresh={handleRefreshAttendance}
              />
            </div>
          )}
        </>
      )}

      {user?.role === 'admin' && (
        <div className="mb-6">
          <EnrollmentManager course={course} onUpdate={fetchCourseDetails} />
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-4">{t.course.sessionHistory}</h2>
        <SessionHistory
          sessions={sessions.filter((s) => s.status !== 'active')}
          courseId={courseId}
        />
      </div>

      {canManageCourse && course && (
        <OpenSessionModal
          isOpen={openSessionModalOpen}
          course={course}
          onClose={() => setOpenSessionModalOpen(false)}
          onSuccess={handleOpenSessionSuccess}
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
