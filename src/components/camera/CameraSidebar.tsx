'use client';

import { useLocale } from '@/i18n/LocaleContext';
import RecentAttendance from './RecentAttendance';
import type { AttendanceSession } from '@/types/session';
import type { AttendanceRecord } from '@/types/attendance';

interface CameraSidebarProps {
  activeSessions: AttendanceSession[];
  recentRecords: AttendanceRecord[];
  loadingRecords: boolean;
}

export default function CameraSidebar({ 
  activeSessions, 
  recentRecords, 
  loadingRecords 
}: CameraSidebarProps) {
  const { t } = useLocale();

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1">
      {/* Active Sessions Card */}
      <div className="card bg-base-100 shadow-xl border border-base-200">
        <div className="card-body p-4">
          <h3 className="card-title text-sm opacity-70 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            {t.dashboard?.activeSessions || 'Active Sessions'}
          </h3>
          
          {activeSessions.length > 0 ? (
            <div className="flex flex-col gap-3 mt-2">
              {activeSessions.map(session => (
                <div key={session.id} className="relative overflow-hidden bg-base-200/50 p-3 rounded-xl border border-base-content/5 hover:bg-base-200 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-lg text-primary tracking-tight">
                      {session.courseCode}
                    </span>
                    <div className="badge badge-success badge-xs gap-1">
                       <span className="animate-pulse w-1 h-1 rounded-full bg-white"></span>
                       Active
                    </div>
                  </div>
                  
                  <h3 className="text-xs font-medium text-base-content/70 truncate mb-2" title={session.courseName}>
                    {session.courseName}
                  </h3>
                  
                  <div className="flex items-center justify-between text-[10px] bg-base-100 rounded-lg p-2">
                     <span className="font-mono opacity-70">{session.startTime} - {session.endTime}</span>
                     <div className="flex items-center gap-1 font-bold">
                        <span className="text-success">{session.stats?.presentCount || 0}</span>
                        <span className="opacity-40">/</span>
                        <span className="opacity-40">{session.stats?.expectedCount || '-'}</span>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 opacity-50 text-sm bg-base-200/30 rounded-xl border-dashed border-2 border-base-200">
              No active sessions
            </div>
          )}
        </div>
      </div>

      {/* Recent Attendance Card */}
      <div className="card bg-base-100 shadow-xl border border-base-200 flex-1">
        <div className="card-body p-4">
          <RecentAttendance records={recentRecords} loading={loadingRecords} />
        </div>
      </div>
    </div>
  );
}
