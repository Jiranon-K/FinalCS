'use client';

import { useState, useMemo } from 'react';
import { useLocale } from '@/hooks/useLocale';

interface CourseStats {
  courseId: string;
  courseName: string;
  courseCode: string;
  totalSessions: number;
  attendanceRate: number;
}

interface AttendanceTableProps {
  courseStats: CourseStats[];
  loading?: boolean;
}

type SortKey = 'courseName' | 'totalSessions' | 'attendanceRate';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export default function AttendanceTable({ courseStats, loading }: AttendanceTableProps) {
  const { t } = useLocale();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'attendanceRate', direction: 'desc' });

  const sortedStats = useMemo(() => {
    if (!courseStats) return [];
    
    const sorted = [...courseStats];
    sorted.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  }, [courseStats, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <div className="w-4 h-4 opacity-0 group-hover:opacity-30 transition-opacity">↕</div>;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 gap-4">
        <span className="loading loading-dots loading-lg text-primary"></span>
        <span className="text-base-content/50 text-sm animate-pulse">{t.attendanceManagement.loading}</span>
      </div>
    );
  }

  if (!courseStats || courseStats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-base-100 rounded-2xl border border-base-200 border-dashed">
        <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mb-4 text-base-content/30">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-base-content/70">{t.attendanceManagement.noRecords}</h3>
        <p className="text-sm text-base-content/50 mt-1">No attendance data available for the selected period.</p>
      </div>
    );
  }

  return (
    <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr className="bg-base-200/50 text-base-content/70 text-xs uppercase font-bold tracking-wider border-b border-base-200">
              <th 
                className="py-4 pl-6 cursor-pointer hover:bg-base-200 transition-colors group"
                onClick={() => requestSort('courseName')}
              >
                <div className="flex items-center gap-2">
                  {t.course.courseName}
                  <span className="font-sans text-base">{getSortIcon('courseName')}</span>
                </div>
              </th>
              <th 
                className="py-4 text-center cursor-pointer hover:bg-base-200 transition-colors group"
                onClick={() => requestSort('totalSessions')}
              >
                <div className="flex items-center justify-center gap-2">
                  {t.attendanceManagement.totalSessions}
                  <span className="font-sans text-base">{getSortIcon('totalSessions')}</span>
                </div>
              </th>
              <th 
                className="py-4 cursor-pointer hover:bg-base-200 transition-colors group"
                onClick={() => requestSort('attendanceRate')}
              >
                <div className="flex items-center gap-2">
                  {t.attendanceManagement.presentRate}
                  <span className="font-sans text-base">{getSortIcon('attendanceRate')}</span>
                </div>
              </th>
              <th className="py-4 text-right pr-6">{t.attendanceManagement.attendanceTrend}</th>
            </tr>
          </thead>
          <tbody>
            {sortedStats.map((course) => {
              const rate = course.attendanceRate || 0;
              let progressClass = 'text-error';
              let badgeClass = 'badge-error bg-error/10 text-error border-error/20';
              let trendText = t.attendanceManagement.trendPoor;

              if (rate >= 80) {
                progressClass = 'text-success';
                badgeClass = 'badge-success bg-success/10 text-success border-success/20';
                trendText = t.attendanceManagement.trendGood;
              } else if (rate >= 60) {
                progressClass = 'text-warning';
                badgeClass = 'badge-warning bg-warning/10 text-warning border-warning/20';
                trendText = t.attendanceManagement.trendAverage;
              }

              return (
                <tr key={course.courseId} className="hover:bg-base-100 transition-colors group border-b border-base-100 last:border-0">
                  <td className="pl-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-base group-hover:text-primary transition-colors">{course.courseName}</span>
                      <span className="text-xs text-base-content/50 font-mono bg-base-200/50 px-1.5 py-0.5 rounded w-fit mt-1">
                        {course.courseCode}
                      </span>
                    </div>
                  </td>
                  <td className="text-center font-mono text-lg">
                    {course.totalSessions}
                  </td>
                  <td className="w-1/3 min-w-[200px]">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col w-full gap-1">
                        <div className="flex justify-between items-end">
                          <span className={`font-bold text-lg ${progressClass}`}>{rate.toFixed(1)}%</span>
                        </div>
                        <progress 
                          className={`progress w-full h-2.5 ${rate >= 80 ? 'progress-success' : rate >= 60 ? 'progress-warning' : 'progress-error'}`} 
                          value={rate} 
                          max="100"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="text-right pr-6">
                    <div className={`badge ${badgeClass} gap-1.5 font-medium h-8 px-3`}>
                      {rate >= 80 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                        </svg>
                      ) : rate >= 60 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                        </svg>
                      )}
                      {trendText}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
