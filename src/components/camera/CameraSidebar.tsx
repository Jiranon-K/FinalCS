'use client';

import { useLocale } from '@/i18n/LocaleContext';
import RecentAttendance from './RecentAttendance';
import type { AttendanceSession } from '@/types/session';
import type { AttendanceRecord } from '@/types/attendance';

interface CameraSidebarProps {
  activeSessions: AttendanceSession[];
  recentRecords: AttendanceRecord[];
  loadingRecords: boolean;
  enableLiveness: boolean;
  onLivenessToggle: (enabled: boolean) => void;
}

function RadialProgress({ value, size = 56, strokeWidth = 5 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  const getColor = () => {
    if (value >= 80) return { stroke: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    if (value >= 50) return { stroke: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
    return { stroke: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
  };

  const colors = getColor();

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-base-content/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold" style={{ color: colors.stroke }}>
          {Math.round(value)}%
        </span>
      </div>
    </div>
  );
}

export default function CameraSidebar({ 
  activeSessions, 
  recentRecords, 
  loadingRecords,
  enableLiveness,
  onLivenessToggle
}: CameraSidebarProps) {
  const { t } = useLocale();

  const calculateAttendanceRate = (session: AttendanceSession) => {
    const present = session.stats?.presentCount || 0;
    const expected = session.stats?.expectedCount || 1;
    return Math.round((present / expected) * 100);
  };

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1">
      <div className="card bg-gradient-to-br from-base-100 to-base-200/50 shadow-lg border border-base-content/5 rounded-2xl">
        <div className="card-body p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm">Control Panel</h3>
                <p className="text-[10px] text-base-content/50">Camera Settings</p>
              </div>
            </div>
          </div>

          <div className="divider my-2 opacity-30"></div>

          <div className="flex items-center justify-between p-3 bg-base-100/50 rounded-xl border border-base-content/5">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${enableLiveness ? 'bg-success/15' : 'bg-base-content/5'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${enableLiveness ? 'text-success' : 'text-base-content/40'}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm">Liveness Detection</p>
                <p className="text-[10px] text-base-content/50">Anti-spoofing verification</p>
              </div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-success toggle-sm"
              checked={enableLiveness}
              onChange={(e) => onLivenessToggle(e.target.checked)}
            />
          </div>
        </div>
      </div>

      <div className="card bg-gradient-to-br from-base-100 to-base-200/50 shadow-lg border border-base-content/5 rounded-2xl">
        <div className="card-body p-4">
          <h3 className="card-title text-sm opacity-70 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            {t.camera.activeSessions}
          </h3>
          
          {activeSessions.length > 0 ? (
            <div className="flex flex-col gap-3 mt-2">
              {activeSessions.map(session => {
                const attendanceRate = calculateAttendanceRate(session);
                return (
                  <div key={session.id} className="relative overflow-hidden bg-base-100/80 p-4 rounded-xl border border-base-content/5 hover:shadow-md transition-all duration-300 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="relative flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-xl text-primary tracking-tight">
                            {session.courseCode}
                          </span>
                          <div className="badge badge-success badge-xs gap-1 shrink-0">
                            <span className="animate-pulse w-1 h-1 rounded-full bg-white"></span>
                            {t.course.statusActive || 'Active'}
                          </div>
                        </div>
                        
                        <h3 className="text-xs font-medium text-base-content/70 truncate mb-3" title={session.courseName}>
                          {session.courseName}
                        </h3>
                        
                        <div className="flex items-center gap-2 text-[10px] bg-base-200/50 rounded-lg px-2.5 py-1.5 w-fit">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 opacity-60">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          <span className="font-mono opacity-70">{session.startTime} - {session.endTime}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center gap-1">
                        <RadialProgress value={attendanceRate} />
                        <div className="text-[9px] font-bold text-base-content/50 text-center">
                          <span className="text-success">{session.stats?.presentCount || 0}</span>
                          <span className="opacity-40"> / </span>
                          <span className="opacity-60">{session.stats?.expectedCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 opacity-50 text-sm bg-base-200/30 rounded-xl border-dashed border-2 border-base-200">
              {t.camera.noActiveSessions}
            </div>
          )}
        </div>
      </div>

      {activeSessions.length > 0 && (
        <div className="card bg-gradient-to-br from-base-100 to-base-200/50 shadow-lg border border-base-content/5 rounded-2xl flex-1">
          <div className="card-body p-4">
            <RecentAttendance 
              records={recentRecords} 
              loading={loadingRecords} 
              activeSessions={activeSessions}
            />
          </div>
        </div>
      )}
    </div>
  );
}
