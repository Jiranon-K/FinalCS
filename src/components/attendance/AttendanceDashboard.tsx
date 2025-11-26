'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import Loading from '@/components/ui/Loading';
import AttendanceTable from './AttendanceTable';

interface DashboardStats {
  totalSessions: number;
  totalRecords: number;
  averageRate: number;
  todayStats: {
    sessions: number;
    present: number;
    late: number;
    absent: number;
    leave: number;
  };
  weeklyStats: {
    sessions: number;
    presentRate: number;
  };
}

interface CourseStats {
  courseId: string;
  courseName: string;
  courseCode: string;
  totalSessions: number;
  attendanceRate: number;
}

export default function AttendanceDashboard() {
  const { t } = useLocale();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/attendance/stats?range=${dateRange}`);
        const data = await response.json();
        
        if (data.success) {
          setStats(data.stats);
          setCourseStats(data.courseStats || []);
        } else {
          setStats({
            totalSessions: 0,
            totalRecords: 0,
            averageRate: 0,
            todayStats: {
              sessions: 0,
              present: 0,
              late: 0,
              absent: 0,
              leave: 0
            },
            weeklyStats: {
              sessions: 0,
              presentRate: 0
            }
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        showToast({ type: 'error', message: t.attendanceManagement.recordError });
        setStats({
          totalSessions: 0,
          totalRecords: 0,
          averageRate: 0,
          todayStats: {
            sessions: 0,
            present: 0,
            late: 0,
            absent: 0,
            leave: 0
          },
          weeklyStats: {
            sessions: 0,
            presentRate: 0
          }
        });
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [dateRange, showToast, t.attendanceManagement.recordError]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loading variant="spinner" size="lg" text={t.attendanceManagement.loading} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="join shadow-sm">
          <button
            className={`join-item btn btn-sm ${dateRange === 'today' ? 'btn-primary' : 'btn-ghost bg-base-100'}`}
            onClick={() => setDateRange('today')}
          >
            {t.attendanceManagement.today}
          </button>
          <button
            className={`join-item btn btn-sm ${dateRange === 'week' ? 'btn-primary' : 'btn-ghost bg-base-100'}`}
            onClick={() => setDateRange('week')}
          >
            {t.attendanceManagement.thisWeek}
          </button>
          <button
            className={`join-item btn btn-sm ${dateRange === 'month' ? 'btn-primary' : 'btn-ghost bg-base-100'}`}
            onClick={() => setDateRange('month')}
          >
            {t.attendanceManagement.thisMonth}
          </button>
        </div>
      </div>

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
        </div>

        <div className="stat bg-base-100 rounded-xl shadow-sm border border-base-200">
          <div className="stat-figure text-info">
            <div className="p-2 bg-info/10 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            </div>
          </div>
          <div className="stat-title text-base-content/70">{t.attendanceManagement.averageRate}</div>
          <div className="stat-value text-info text-3xl">{(stats?.weeklyStats?.presentRate || 0).toFixed(1)}%</div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4">{t.attendanceManagement.dailyStats}</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex flex-col items-center justify-center p-4 bg-base-200/50 rounded-xl border border-base-200">
              <div className="text-3xl font-bold mb-1">{stats?.todayStats?.sessions || 0}</div>
              <div className="text-xs uppercase tracking-wide text-base-content/60">{t.attendanceManagement.totalSessions}</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-success/5 rounded-xl border border-success/20">
              <div className="text-3xl font-bold text-success mb-1">{stats?.todayStats?.present || 0}</div>
              <div className="text-xs uppercase tracking-wide text-base-content/60">{t.attendanceManagement.statusNormal}</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-warning/5 rounded-xl border border-warning/20">
              <div className="text-3xl font-bold text-warning mb-1">{stats?.todayStats?.late || 0}</div>
              <div className="text-xs uppercase tracking-wide text-base-content/60">{t.attendanceManagement.statusLate}</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-error/5 rounded-xl border border-error/20">
              <div className="text-3xl font-bold text-error mb-1">{stats?.todayStats?.absent || 0}</div>
              <div className="text-xs uppercase tracking-wide text-base-content/60">{t.attendanceManagement.statusAbsent}</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-info/5 rounded-xl border border-info/20">
              <div className="text-3xl font-bold text-info mb-1">{stats?.todayStats?.leave || 0}</div>
              <div className="text-xs uppercase tracking-wide text-base-content/60">{t.attendanceManagement.statusLeave}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-0 sm:p-6">
          <h2 className="card-title text-lg px-6 pt-6 sm:px-0 sm:pt-0 mb-4">{t.attendanceManagement.courseComparison}</h2>
          <AttendanceTable courseStats={courseStats} />
        </div>
      </div>
    </div>
  );
}

