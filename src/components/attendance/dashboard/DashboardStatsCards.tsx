import { useLocale } from '@/hooks/useLocale';

interface DashboardStats {
  totalSessions: number;
  totalRecords: number;
  averageRate: number;
  todayStats: {
    sessions: number;
    present: number;
    absent: number;
  };
  weeklyStats: {
    sessions: number;
    presentRate: number;
  };
}

interface DashboardStatsCardsProps {
  stats: DashboardStats | null;
}

export default function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  const { t } = useLocale();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="stat bg-base-100 rounded-xl shadow-sm border border-base-200">
        <div className="stat-figure text-primary">
          <div className="p-2 bg-primary/10 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </div>
        </div>
        <div className="stat-title text-base-content/70">{t.attendanceManagement.totalSessions}</div>
        <div className="stat-value text-primary text-3xl">{stats?.totalSessions || 0}</div>
        <div className="stat-desc">{t.attendanceManagement.thisPeriod || 'In selected period'}</div>
      </div>

      <div className="stat bg-base-100 rounded-xl shadow-sm border border-base-200">
        <div className="stat-figure text-secondary">
          <div className="p-2 bg-secondary/10 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </div>
        </div>
        <div className="stat-title text-base-content/70">{t.attendanceManagement.totalRecords}</div>
        <div className="stat-value text-secondary text-3xl">{stats?.totalRecords || 0}</div>
        <div className="stat-desc">{t.attendanceManagement.studentsChecked || 'Students checked'}</div>
      </div>

      <div className="stat bg-base-100 rounded-xl shadow-sm border border-base-200">
        <div className="stat-figure text-success">
          <div className="p-2 bg-success/10 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
        </div>
        <div className="stat-title text-base-content/70">{t.attendanceManagement.presentRate}</div>
        <div className="stat-value text-success text-3xl">{(stats?.averageRate || 0).toFixed(1)}%</div>
        <div className="stat-desc">{t.attendanceManagement.averageAttendance || 'Average attendance'}</div>
      </div>

      <div className="stat bg-base-100 rounded-xl shadow-sm border border-base-200">
        <div className="stat-figure text-info">
          <div className="p-2 bg-info/10 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
          </div>
        </div>
        <div className="stat-title text-base-content/70">{t.attendanceManagement.todaySessions || 'Today Sessions'}</div>
        <div className="stat-value text-info text-3xl">{stats?.todayStats?.sessions || 0}</div>
        <div className="stat-desc">{new Date().toLocaleDateString()}</div>
      </div>
    </div>
  );
}
