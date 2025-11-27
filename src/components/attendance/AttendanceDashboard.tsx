'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import Loading from '@/components/ui/Loading';
import AttendanceTable from './AttendanceTable';
import DashboardStatsCards from './dashboard/DashboardStatsCards';
import AttendanceTrendChart from './dashboard/AttendanceTrendChart';
import StatusDistributionChart from './dashboard/StatusDistributionChart';
import RecentActivityList from './dashboard/RecentActivityList';
import AtRiskStudentsList from './dashboard/AtRiskStudentsList';

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

interface TrendData {
  date: string;
  present: number;
  late: number;
  absent: number;
  leave: number;
}

interface RecentSession {
  id: string;
  courseName: string;
  date: string;
  presentCount: number;
  totalCount: number;
  status: string;
}

interface AtRiskStudent {
  id: string;
  name: string;
  studentId: string;
  rate: number;
  totalClasses: number;
  missed: number;
}

export default function AttendanceDashboard() {
  const { t } = useLocale();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [courseStats, setCourseStats] = useState<CourseStats[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week'); 

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/attendance/stats?range=${dateRange}`);
        const data = await response.json();
        
        if (data.success) {
          setStats(data.stats);
          setCourseStats(data.courseStats || []);
          setTrendData(data.trend || []);
          setRecentSessions(data.recentSessions || []);
          setAtRiskStudents(data.atRiskStudents || []);
        } else {
            setStats(null);
            setCourseStats([]);
            setTrendData([]);
            setRecentSessions([]);
            setAtRiskStudents([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        showToast({ type: 'error', message: t.attendanceManagement.recordError });
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t.attendanceManagement.dashboard}</h2>
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

      <DashboardStatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96">
          <AttendanceTrendChart data={trendData} />
        </div>
        <div className="h-96">
          <StatusDistributionChart stats={stats?.todayStats} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-full">
            <RecentActivityList sessions={recentSessions} />
        </div>
        <div className="h-full">
            <AtRiskStudentsList students={atRiskStudents} />
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

