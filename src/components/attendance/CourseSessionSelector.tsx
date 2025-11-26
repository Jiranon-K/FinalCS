'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import Loading from '@/components/ui/Loading';
import type { Course } from '@/types/course';
import type { AttendanceSession } from '@/types/session';

interface CourseSessionSelectorProps {
  onCourseSelect: (courseId: string, course: Course) => void;
  onSessionSelect: (sessionId: string | null, session: AttendanceSession | null) => void;
  selectedCourseId: string;
  selectedSessionId: string;
}

export default function CourseSessionSelector({
  onCourseSelect,
  onSessionSelect,
  selectedCourseId,
  selectedSessionId,
}: CourseSessionSelectorProps) {
  const { t } = useLocale();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await fetch('/api/courses');
        const data = await response.json();
        
        if (data.success) {
          let filteredCourses = data.data;
          if (user?.role === 'teacher') {
            filteredCourses = data.data.filter((course: Course) => 
              course.teacherId.toString() === user.id
            );
          }
          setCourses(filteredCourses);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        showToast({ type: 'error', message: 'Failed to fetch courses' });
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
  }, [user, showToast]);

  useEffect(() => {
    const loadSessions = async (courseId: string) => {
      setLoadingSessions(true);
      try {
        const response = await fetch(`/api/attendance/sessions?courseId=${courseId}`);
        const data = await response.json();
        
        if (data.success) {
          setSessions(data.data);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
        showToast({ type: 'error', message: 'Failed to fetch sessions' });
      } finally {
        setLoadingSessions(false);
      }
    };

    if (selectedCourseId) {
      loadSessions(selectedCourseId);
    } else {
      setSessions([]);
    }
  }, [selectedCourseId, showToast]);

  const handleCourseChange = (courseId: string) => {
    const course = courses.find(c => c.id === courseId || c._id?.toString() === courseId);
    if (course) {
      onCourseSelect(courseId, course);
      onSessionSelect(null, null);
    }
  };

  const handleSessionChange = (sessionId: string) => {
    if (!sessionId) {
      onSessionSelect(null, null);
      return;
    }
    const session = sessions.find(s => s.id === sessionId || s._id?.toString() === sessionId);
    if (session) {
      onSessionSelect(sessionId, session);
    }
  };

  const getSessionStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success badge-sm">{t.attendanceManagement.statusActive}</span>;
      case 'closed':
        return <span className="badge badge-ghost badge-sm">{t.attendanceManagement.statusClosed}</span>;
      case 'cancelled':
        return <span className="badge badge-error badge-sm">{t.attendanceManagement.statusCancelled}</span>;
      default:
        return null;
    }
  };

  const formatSessionDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('th-TH', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loadingCourses) {
    return (
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <Loading variant="spinner" size="md" text={t.attendanceManagement.loading} />
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <h2 className="card-title mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
          {t.attendanceManagement.selectCourse}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Course Selector */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t.attendanceManagement.selectCourse}</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
            >
              <option value="">{t.attendanceManagement.selectCourse}</option>
              {courses.map((course) => (
                <option key={course.id || course._id?.toString()} value={course.id || course._id?.toString()}>
                  {course.courseCode} - {course.courseName}
                </option>
              ))}
            </select>
          </div>

          {/* Session Selector */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t.attendanceManagement.selectSession}</span>
            </label>
            {loadingSessions ? (
              <div className="flex items-center gap-2 h-12">
                <span className="loading loading-spinner loading-sm"></span>
                <span className="text-sm text-base-content/60">{t.attendanceManagement.loading}</span>
              </div>
            ) : (
              <select
                className="select select-bordered w-full"
                value={selectedSessionId}
                onChange={(e) => handleSessionChange(e.target.value)}
                disabled={!selectedCourseId || sessions.length === 0}
              >
                <option value="">{t.attendanceManagement.selectSession}</option>
                {sessions.map((session) => (
                  <option key={session.id || session._id?.toString()} value={session.id || session._id?.toString()}>
                    {formatSessionDate(session.sessionDate)} ({session.startTime} - {session.endTime})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Selected Session Info */}
        {selectedSessionId && sessions.length > 0 && (
          <div className="mt-4 p-4 bg-base-200 rounded-lg">
            {sessions
              .filter(s => s.id === selectedSessionId || s._id?.toString() === selectedSessionId)
              .map((session) => (
                <div key={session.id || session._id?.toString()} className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold">
                      {t.attendanceManagement.currentSession}
                    </div>
                    <div className="text-sm text-base-content/60">
                      {formatSessionDate(session.sessionDate)} • {session.startTime} - {session.endTime} • {session.room}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSessionStatusBadge(session.status)}
                    <div className="stats stats-horizontal shadow-sm bg-base-100">
                      <div className="stat py-2 px-4">
                        <div className="stat-title text-xs">{t.attendanceManagement.expected}</div>
                        <div className="stat-value text-lg">{session.stats?.expectedCount || 0}</div>
                      </div>
                      <div className="stat py-2 px-4">
                        <div className="stat-title text-xs">{t.attendanceManagement.present}</div>
                        <div className="stat-value text-lg text-success">{session.stats?.presentCount || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {selectedCourseId && !loadingSessions && sessions.length === 0 && (
          <div className="mt-4 text-center py-4 text-base-content/60">
            {t.attendanceManagement.noActiveSession}
          </div>
        )}
      </div>
    </div>
  );
}
