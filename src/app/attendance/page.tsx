'use client';

import { useState, useEffect } from 'react';
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

  const [activeTab, setActiveTab] = useState<'manual' | 'dashboard' | 'history'>('manual');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'teacher') {
      showToast({ type: 'error', message: 'Access denied. Teachers and admins only.' });
      router.push('/');
    }
  }, [user, router, showToast]);

  const handleCourseSelect = (courseId: string, course: Course) => {
    setSelectedCourseId(courseId);
    setSelectedCourse(course);
    setSelectedSessionId(null);
    setSelectedSession(null);
    setAttendanceRecords([]);
  };

  const handleSessionSelect = (sessionId: string | null, session: AttendanceSession | null) => {
    setSelectedSessionId(sessionId);
    setSelectedSession(session);
    if (sessionId) {
      fetchAttendanceRecords(sessionId);
    } else {
      setAttendanceRecords([]);
    }
  };

  const fetchAttendanceRecords = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/attendance/records?sessionId=${sessionId}&limit=1000`);
      const data = await response.json();
      if (data.success) {
        setAttendanceRecords(data.data);
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      showToast({ type: 'error', message: t.attendanceManagement.recordError });
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
        <button
          className={`tab ${activeTab === 'manual' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('manual')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
          {t.attendanceManagement.manual}
        </button>
        <button
          className={`tab ${activeTab === 'dashboard' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
          {t.attendanceManagement.dashboard}
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          {t.attendanceManagement.history}
        </button>
      </div>

      {activeTab === 'manual' && (
        <div className="space-y-6">
          <CourseSessionSelector
            onCourseSelect={handleCourseSelect}
            onSessionSelect={handleSessionSelect}
            selectedCourseId={selectedCourseId}
            selectedSessionId={selectedSessionId || ''}
          />

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
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-24 h-24 mx-auto text-base-content/20 mb-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                  </svg>
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

      {activeTab === 'history' && selectedSessionId && user && (
        <AttendanceTable
          records={attendanceRecords}
          user={user}
          onRefresh={refreshRecords}
        />
      )}

      {activeTab === 'history' && !selectedSessionId && (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-24 h-24 mx-auto text-base-content/20 mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <p className="text-base-content/60 text-lg">
                {t.attendanceManagement.pleaseSelectSession}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
