'use client';


import Image from 'next/image';
import { useLocale } from '@/hooks/useLocale';
import { AttendanceRecord } from '@/types/attendance';
import { Student } from '@/types/student';

interface RecentAttendanceProps {
  records: AttendanceRecord[];
  loading?: boolean;
}

const ClockIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
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
      <div className="w-full space-y-4">
        <div className="h-6 w-32 bg-base-300 rounded animate-pulse mb-2"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center p-3 bg-base-100 rounded-xl border border-base-200 shadow-sm animate-pulse h-20"></div>
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
       <div className="flex flex-col items-center justify-center p-8 text-base-content/40 bg-base-100/50 rounded-2xl border border-base-content/5">
          <ClockIcon className="w-10 h-10 mb-2 opacity-50" />
          <p className="text-sm">{t.attendanceManagement.noRecentRecords}</p>
       </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
           <ClockIcon className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-lg text-base-content">{t.attendanceManagement.recentRecords}</h3>
      </div>

      <div className="flex flex-col gap-3">
        {records.map((record) => {
           const student = record.studentId as unknown as Student;
           const imageUrl = (typeof student?.userId === 'object' ? student.userId.imageUrl : undefined) || student?.imageUrl;
           
           return (
          <div
            key={record._id?.toString() || record.id}
            className={`group flex items-center justify-between p-3 bg-base-100 hover:bg-base-50 rounded-2xl border border-base-200 shadow-sm hover:shadow-md transition-all duration-1000`}
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
                  (record.status === 'present' || record.status === 'normal') ? 'bg-success/15 text-success' :
                  'bg-error/15 text-error'
               }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                     (record.status === 'present' || record.status === 'normal') ? 'bg-success' :
                     'bg-error'
                  }`}></span>
                  {(record.status === 'present' || record.status === 'normal') ? t.attendanceManagement.statusNormal :
                   t.attendanceManagement.statusAbsent}
               </div>
               <span className="text-xs font-bold text-base-content/70 font-mono">
                  {formatTime(record.checkInTime)}
               </span>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
