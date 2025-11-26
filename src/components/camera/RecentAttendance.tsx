'use client';

import { useLocale } from '@/hooks/useLocale';
import { AttendanceRecord } from '@/types/attendance';

interface RecentAttendanceProps {
  records: AttendanceRecord[];
  loading?: boolean;
}

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export default function RecentAttendance({ records, loading }: RecentAttendanceProps) {
  const { t } = useLocale();

  const formatTime = (date?: Date | string) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    const nameParts = name.trim().split(' ');
    if (nameParts.length >= 2) {
      return nameParts[0][0] + nameParts[nameParts.length - 1][0];
    }
    return nameParts[0]?.substring(0, 2).toUpperCase() || '??';
  };

  if (loading) {
    return (
      <div className="bg-base-200/20 rounded-2xl shadow-lg border border-base-content/10 p-6">
        <h3 className="text-lg font-bold mb-4 text-base-content">
          {t.attendanceManagement.recentRecords}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-base-300 rounded-xl h-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="bg-base-200/20 rounded-2xl shadow-lg border border-base-content/10 p-6">
        <h3 className="text-lg font-bold mb-4 text-base-content">
          {t.attendanceManagement.recentRecords}
        </h3>
        <div className="text-center py-8">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mx-auto text-base-content/20 mb-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
          </svg>
          <p className="text-base-content/50 text-sm">
            {t.attendanceManagement.noRecentRecords}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-base-200/20 rounded-2xl shadow-lg border border-base-content/10 p-6">
      <h3 className="text-lg font-bold mb-4 text-base-content flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-primary">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        {t.attendanceManagement.recentRecords}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {records.map((record, index) => (
          <div
            key={record._id?.toString() || record.id || index}
            className="bg-base-100 rounded-xl p-4 shadow-md border border-base-content/10 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content w-12 h-12 rounded-full">
                  <span className="text-sm font-semibold">
                    {getInitials(record.studentName)}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-base-content truncate">
                  {record.studentName}
                </h4>
                {record.studentNumber && (
                  <p className="text-xs text-base-content/60 font-mono">
                    {record.studentNumber}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div
                className={`badge gap-1 ${
                  record.status === 'normal'
                    ? 'badge-success'
                    : record.status === 'late'
                    ? 'badge-warning'
                    : record.status === 'absent'
                    ? 'badge-error'
                    : 'badge-info'
                }`}
              >
                {record.status === 'normal' ? (
                  <>
                    <CheckCircleIcon />
                    {t.attendanceManagement.onTime}
                  </>
                ) : record.status === 'late' ? (
                  <>
                    <ClockIcon />
                    {t.attendanceManagement.statusLate}
                  </>
                ) : record.status === 'absent' ? (
                  <>{t.attendanceManagement.statusAbsent}</>
                ) : (
                  <>{t.attendanceManagement.statusLeave}</>
                )}
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-base-content">
                  {formatTime(record.checkInTime)}
                </p>
              </div>
            </div>

            {record.checkInMethod && (
              <div className="mt-2 pt-2 border-t border-base-content/10">
                <span className="badge badge-sm badge-outline">
                  {record.checkInMethod === 'face_recognition'
                    ? t.attendanceManagement.faceRecognition
                    : t.attendanceManagement.manual}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
