'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import Loading from '@/components/ui/Loading';

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
        <div className="btn-group">
          <button
            className={`btn btn-sm ${dateRange === 'today' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setDateRange('today')}
          >
            {t.attendanceManagement.today}
          </button>
          <button
            className={`btn btn-sm ${dateRange === 'week' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setDateRange('week')}
          >
            {t.attendanceManagement.thisWeek}
          </button>
          <button
            className={`btn btn-sm ${dateRange === 'month' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setDateRange('month')}
          >
            {t.attendanceManagement.thisMonth}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat bg-base-100 rounded-lg shadow">
          <div className="stat-figure text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </div>
          <div className="stat-title">{t.attendanceManagement.totalSessions}</div>
          <div className="stat-value text-primary">{stats?.totalSessions || 0}</div>
        </div>

        <div className="stat bg-base-100 rounded-lg shadow">
          <div className="stat-figure text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
          </div>
          <div className="stat-title">{t.attendanceManagement.totalRecords}</div>
          <div className="stat-value text-secondary">{stats?.totalRecords || 0}</div>
        </div>

        <div className="stat bg-base-100 rounded-lg shadow">
          <div className="stat-figure text-success">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div className="stat-title">{t.attendanceManagement.presentRate}</div>
          <div className="stat-value text-success">{stats?.averageRate?.toFixed(1) || 0}%</div>
        </div>

        <div className="stat bg-base-100 rounded-lg shadow">
          <div className="stat-figure text-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
          </div>
          <div className="stat-title">{t.attendanceManagement.averageRate}</div>
          <div className="stat-value text-info">{stats?.weeklyStats?.presentRate?.toFixed(1) || 0}%</div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">{t.attendanceManagement.dailyStats}</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            <div className="text-center p-4 bg-base-200 rounded-lg">
              <div className="text-2xl font-bold">{stats?.todayStats?.sessions || 0}</div>
              <div className="text-sm text-base-content/60">{t.attendanceManagement.totalSessions}</div>
            </div>
            <div className="text-center p-4 bg-success/10 rounded-lg">
              <div className="text-2xl font-bold text-success">{stats?.todayStats?.present || 0}</div>
              <div className="text-sm text-base-content/60">{t.attendanceManagement.statusNormal}</div>
            </div>
            <div className="text-center p-4 bg-warning/10 rounded-lg">
              <div className="text-2xl font-bold text-warning">{stats?.todayStats?.late || 0}</div>
              <div className="text-sm text-base-content/60">{t.attendanceManagement.statusLate}</div>
            </div>
            <div className="text-center p-4 bg-error/10 rounded-lg">
              <div className="text-2xl font-bold text-error">{stats?.todayStats?.absent || 0}</div>
              <div className="text-sm text-base-content/60">{t.attendanceManagement.statusAbsent}</div>
            </div>
            <div className="text-center p-4 bg-info/10 rounded-lg">
              <div className="text-2xl font-bold text-info">{stats?.todayStats?.leave || 0}</div>
              <div className="text-sm text-base-content/60">{t.attendanceManagement.statusLeave}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">{t.attendanceManagement.courseComparison}</h2>
          {courseStats.length > 0 ? (
            <div className="overflow-x-auto mt-4">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>{t.course.courseName}</th>
                    <th>{t.attendanceManagement.totalSessions}</th>
                    <th>{t.attendanceManagement.presentRate}</th>
                    <th>{t.attendanceManagement.attendanceTrend}</th>
                  </tr>
                </thead>
                <tbody>
                  {courseStats.map((course) => (
                    <tr key={course.courseId}>
                      <td>
                        <div>
                          <div className="font-bold">{course.courseName}</div>
                          <div className="text-sm text-base-content/60">{course.courseCode}</div>
                        </div>
                      </td>
                      <td>{course.totalSessions}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <progress 
                            className={`progress w-20 ${
                              course.attendanceRate >= 80 ? 'progress-success' :
                              course.attendanceRate >= 60 ? 'progress-warning' :
                              'progress-error'
                            }`} 
                            value={course.attendanceRate} 
                            max="100"
                          />
                          <span>{course.attendanceRate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td>
                        {course.attendanceRate >= 80 ? (
                          <span className="badge badge-success badge-sm">{t.attendanceManagement.trendGood}</span>
                        ) : course.attendanceRate >= 60 ? (
                          <span className="badge badge-warning badge-sm">{t.attendanceManagement.trendAverage}</span>
                        ) : (
                          <span className="badge badge-error badge-sm">{t.attendanceManagement.trendPoor}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-base-content/60">
              {t.attendanceManagement.noRecords}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
