'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';
import { AttendanceRecord } from '@/types/attendance';
import { Student } from '@/types/student';
import { AttendanceSession } from '@/types/session';

interface RecentAttendanceProps {
  records: AttendanceRecord[];
  loading?: boolean;
  activeSessions?: AttendanceSession[];
}

const ClockIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export default function RecentAttendance({ records, loading, activeSessions = [] }: RecentAttendanceProps) {
  const { t } = useLocale();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const displayRecords = records.filter(r => {
    if (!r.checkInTime) return false;
    const checkInTime = new Date(r.checkInTime).getTime();
    return (now.getTime() - checkInTime) < 30000; // 30 seconds
  });


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
      <div className="w-full space-y-4">
        <div className="h-6 w-32 bg-base-300 rounded animate-pulse mb-2"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center p-3 bg-base-100 rounded-xl border border-base-200 shadow-sm animate-pulse h-20"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4 px-1 shrink-0">
        <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
           <ClockIcon className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-lg text-base-content">{t.attendanceManagement.recentRecords}</h3>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-3 mb-4 max-h-[400px]">
        {displayRecords.length === 0 ? (
           <div className="flex flex-col items-center justify-center p-8 text-base-content/40 bg-base-100/50 rounded-2xl border border-base-content/5 h-full min-h-[150px]">
              <ClockIcon className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">{t.attendanceManagement.noRecentRecords}</p>
           </div>
        ) : (
          displayRecords.map((record) => {
             const student = record.studentId as unknown as Student;
             const imageUrl = (typeof student?.userId === 'object' ? student.userId.imageUrl : undefined) || student?.imageUrl;
             
             return (
            <div
              key={record._id?.toString() || record.id}
              className={`group flex items-center justify-between p-3 bg-base-100 hover:bg-base-50 rounded-2xl border border-base-200 shadow-sm hover:shadow-md transition-all duration-1000 animate-in fade-in slide-in-from-bottom-2`}
            >
              <div className="flex items-center gap-4">
                <div className={`avatar ${!imageUrl ? 'placeholder' : ''}`}>
                  {imageUrl ? (
                    <div className="w-12 h-12 rounded-full shadow-inner relative overflow-hidden">
                      <Image 
                        src={imageUrl} 
                        alt={record.studentName}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="bg-neutral text-neutral-content rounded-full w-12 h-12 shadow-inner">
                      <span className="text-lg font-bold">{getInitials(record.studentName)}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <h4 className="font-bold text-base-content leading-tight group-hover:text-primary transition-colors">
                    {record.studentName}
                  </h4>
                  {record.studentNumber && (
                    <span className="text-xs font-mono text-base-content/50 tracking-wide">
                      {record.studentNumber}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                 <div className={`badge badge-sm gap-1.5 border-0 font-medium ${
                    record.status === 'present' ? 'bg-success/15 text-success' :
                    'bg-error/15 text-error'
                 }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                       record.status === 'present' ? 'bg-success' :
                       'bg-error'
                    }`}></span>
                    {record.status === 'present' ? t.attendanceManagement.statusNormal :
                     t.attendanceManagement.statusAbsent}
                 </div>
                 <span className="text-xs font-bold text-base-content/70 font-mono">
                    {formatTime(record.checkInTime)}
                 </span>
              </div>
            </div>
            );
          })
        )}
      </div>

      <div className="shrink-0 space-y-3 pt-4 border-t border-base-200">
          <Link href="/attendance?tab=dashboard" className="btn btn-block btn-neutral">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
            {t.attendanceManagement?.manageActiveSessions || 'Manage Active Sessions'}
          </Link>

          {activeSessions.length > 0 && (
            <div className="space-y-2">
               <div className="text-xs font-bold text-base-content/50 uppercase tracking-wider px-1">
                  {t.attendanceManagement?.activeCourses || 'Active Courses'}
               </div>
               {activeSessions.map(session => (
                 <Link 
                    key={session.id} 
                    href={`/attendance?tab=manual&courseId=${session.courseId}&sessionId=${session.id}`}
                    className="btn btn-block btn-outline btn-sm justify-between group"
                 >
                    <span className="flex items-center gap-2">
                       <span className="flex-1 truncate text-left">{session.courseCode}</span>
                    </span>
                    <span className="flex items-center gap-1 text-primary group-hover:text-primary-content transition-colors">
                       {t.attendanceManagement?.manualCheck || 'Manual Check'}
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                       </svg>
                    </span>
                 </Link>
               ))}
            </div>
          )}
      </div>
    </div>
  );
}
