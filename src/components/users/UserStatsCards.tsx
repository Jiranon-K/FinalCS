'use client';

import { useLocale } from '@/hooks/useLocale';

// Icons
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
);

const AcademicCapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

interface UserStats {
  total: number;
  adminCount: number;
  teacherCount: number;
  studentCount: number;
}

interface UserStatsCardsProps {
  stats: UserStats;
}

export default function UserStatsCards({ stats }: UserStatsCardsProps) {
  const { t } = useLocale();

  return (
    <div className="stats stats-vertical lg:stats-horizontal shadow-lg w-full mb-8 bg-base-100 text-base-content">
      {/* Total Users */}
      <div className="stat">
        <div className="stat-figure text-primary">
          <UsersIcon />
        </div>
        <div className="stat-title">{t.users.totalUsers}</div>
        <div className="stat-value text-primary">{stats.total}</div>
        <div className="stat-desc">{t.users.allRegisteredUsers}</div>
      </div>

      {/* Admin Count */}
      <div className="stat">
        <div className="stat-figure text-error">
          <ShieldIcon />
        </div>
        <div className="stat-title">{t.users.roleAdmin}</div>
        <div className="stat-value text-error">{stats.adminCount}</div>
        <div className="stat-desc">{t.users.systemAdministrators}</div>
      </div>

      {/* Teacher Count */}
      <div className="stat">
        <div className="stat-figure text-info">
          <AcademicCapIcon />
        </div>
        <div className="stat-title">{t.users.roleTeacher}</div>
        <div className="stat-value text-info">{stats.teacherCount}</div>
        <div className="stat-desc">{t.users.teachingStaff}</div>
      </div>

      {/* Student Count */}
      <div className="stat">
        <div className="stat-figure text-success">
          <UserIcon />
        </div>
        <div className="stat-title">{t.users.roleStudent}</div>
        <div className="stat-value text-success">{stats.studentCount}</div>
        <div className="stat-desc">{t.users.enrolledStudents}</div>
      </div>
    </div>
  );
}
