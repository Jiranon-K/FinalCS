'use client';

import { AttendanceSession } from '@/types/session';
import { useLocale } from '@/hooks/useLocale';
import { useRouter } from 'next/navigation';

interface SessionHistoryProps {
  sessions: AttendanceSession[];
  courseId: string;
}

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
);

const ViewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

export default function SessionHistory({ sessions, courseId }: SessionHistoryProps) {
  const { t } = useLocale();
  const router = useRouter();

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'closed':
        return 'badge-neutral';
      case 'cancelled':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return t.attendanceManagement.statusActive;
      case 'closed':
        return t.attendanceManagement.statusClosed;
      case 'cancelled':
        return t.attendanceManagement.statusCancelled;
      default:
        return status;
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

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewSession = (sessionId: string) => {
    router.push(`/schedule/${courseId}/session/${sessionId}`);
  };

  const calculateAttendanceRate = (stats: any) => {
    if (stats.expectedCount === 0) return 0;
    return Math.round((stats.presentCount / stats.expectedCount) * 100);
  };

  if (sessions.length === 0) {
    return (
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <p className="text-center text-base-content/50 py-8">
            {t.course.noActiveSessions}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <div
          key={session._id?.toString() || session.id}
          className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="card-body">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="card-title">
                    {getDayName(session.dayOfWeek)} - {formatDate(session.sessionDate)}
                  </h3>
                  <span className={`badge ${getStatusBadgeClass(session.status)}`}>
                    {getStatusText(session.status)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-base-content/70">
                  <div className="flex items-center gap-1">
                    <ClockIcon />
                    <span>{session.startTime} - {session.endTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <LocationIcon />
                    <span>{session.room}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleViewSession(session.id)}
                className="btn btn-ghost btn-sm gap-2"
              >
                <ViewIcon />
                {t.attendanceManagement.viewDetails}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="stat p-3 bg-base-200 rounded-lg">
                <div className="stat-title text-xs">{t.attendanceManagement.expected}</div>
                <div className="stat-value text-xl">{session.stats.expectedCount}</div>
              </div>

              <div className="stat p-3 bg-success/10 rounded-lg">
                <div className="stat-title text-xs text-success">{t.attendanceManagement.present}</div>
                <div className="stat-value text-xl text-success">{session.stats.presentCount}</div>
                <div className="stat-desc text-success">
                  {calculateAttendanceRate(session.stats)}%
                </div>
              </div>

              <div className="stat p-3 bg-base-200 rounded-lg">
                <div className="stat-title text-xs">{t.attendanceManagement.statusNormal}</div>
                <div className="stat-value text-xl">{session.stats.normalCount}</div>
              </div>

              <div className="stat p-3 bg-warning/10 rounded-lg">
                <div className="stat-title text-xs text-warning">{t.attendanceManagement.statusLate}</div>
                <div className="stat-value text-xl text-warning">{session.stats.lateCount}</div>
              </div>

              <div className="stat p-3 bg-error/10 rounded-lg">
                <div className="stat-title text-xs text-error">{t.attendanceManagement.statusAbsent}</div>
                <div className="stat-value text-xl text-error">{session.stats.absentCount}</div>
              </div>
            </div>

            {session.openedAt && (
              <div className="text-xs text-base-content/50 mt-2">
                {t.attendanceManagement.openedAt}: {formatDate(session.openedAt)} {new Date(session.openedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                {session.closedAt && (
                  <> • {t.attendanceManagement.closedAt}: {formatDate(session.closedAt)} {new Date(session.closedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
