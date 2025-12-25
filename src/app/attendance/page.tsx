'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/useLocale';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import Loading from '@/components/ui/Loading';
import CourseSessionSelector from '../../components/attendance/CourseSessionSelector';
import StudentListManager from '../../components/attendance/StudentListManager';
import AttendanceDashboard from '@/components/attendance/AttendanceDashboard';
import AttendanceTable from '@/components/course/AttendanceTable';
import type { Course } from '@/types/course';
import type { AttendanceSession } from '@/types/session';
import type { AttendanceRecord } from '@/types/attendance';

export default function AttendancePage() {
  const { t } = useLocale();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [internalTab, setInternalTab] = useState<'manual' | 'dashboard' | 'history'>('manual');
  const activeTab = user?.role === 'student' ? 'history' : internalTab;
  const setActiveTab = setInternalTab;
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'teacher' && user.role !== 'student') {
      showToast({ type: 'error', message: t.common?.accessDenied || 'Access denied' });
      router.push('/');
    }
  }, [user, router, showToast, t]);

  const handleCourseSelect = (courseId: string, course: Course) => {
    setSelectedCourseId(courseId);
    setSelectedCourse(course);
    setSelectedSessionId(null);
    setSelectedSession(null);
    setAttendanceRecords([]);
  };

  const fetchAttendanceRecords = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/attendance/records?sessionId=${sessionId}&limit=1000`, {
        cache: 'no-store'
      });
      const data = await response.json();
      if (data.success) {
        setAttendanceRecords(data.data);
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      showToast({ type: 'error', message: t.attendanceManagement.recordError });
    }
  }, [t.attendanceManagement.recordError, showToast]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (selectedSessionId) {
      const loadData = async () => {
        await fetchAttendanceRecords(selectedSessionId);
      };
      loadData();
      interval = setInterval(() => {
        fetchAttendanceRecords(selectedSessionId);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [selectedSessionId, fetchAttendanceRecords]);

  const handleSessionSelect = (sessionId: string | null, session: AttendanceSession | null) => {
    setSelectedSessionId(sessionId);
    setSelectedSession(session);
    if (!sessionId) {
      setAttendanceRecords([]);
    }
  };

  const refreshRecords = () => {
    if (selectedSessionId) {
      fetchAttendanceRecords(selectedSessionId);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto p-6">
        <Loading variant="spinner" size="lg" text={t.attendanceManagement.loading} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-base-content mb-2">
          {t.attendanceManagement.title}
        </h1>
        <p className="text-base-content/60">
          {t.attendanceManagement.recordAttendance}
        </p>
      </div>

      <div className="tabs tabs-boxed bg-base-200 mb-6 p-1">
        {user?.role !== 'student' && (
            <button
            className={`tab ${activeTab === 'manual' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('manual')}
            >
            {t.attendanceManagement.manual}
            </button>
        )}
        <button
          className={`tab ${activeTab === 'history' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          {t.attendanceManagement.history}
        </button>
        {user?.role !== 'student' && (
            <button
            className={`tab ${activeTab === 'dashboard' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            >
            {t.attendanceManagement.dashboard}
            </button>
        )}
      </div>

      {activeTab !== 'dashboard' && (
        <CourseSessionSelector
          onCourseSelect={handleCourseSelect}
          onSessionSelect={handleSessionSelect}
          selectedCourseId={selectedCourseId}
          selectedSessionId={selectedSessionId || ''}
        />
      )}

      {activeTab === 'manual' && (
        <div className="space-y-6 mt-6">
          {selectedSessionId && selectedCourse && selectedSession && (
            <StudentListManager
              course={selectedCourse}
              session={selectedSession}
              records={attendanceRecords}
              onRecordUpdated={refreshRecords}
            />
          )}

          {!selectedCourseId && (
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <div className="text-center py-12">
                  <p className="text-base-content/60 text-lg">
                    {t.attendanceManagement.pleaseSelectCourse}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'dashboard' && (
        <AttendanceDashboard />
      )}

      {activeTab === 'history' && (
        <div className="mt-6">
          {selectedSessionId && user ? (
            <AttendanceTable
              records={attendanceRecords}
              user={user}
              onRefresh={refreshRecords}
            />
          ) : (
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <div className="text-center py-12">
                  <p className="text-base-content/60 text-lg">
                    {t.attendanceManagement.pleaseSelectSession}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
