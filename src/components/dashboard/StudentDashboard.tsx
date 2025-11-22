/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/i18n/useLocale';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBook, 
  faCalendarCheck, 
  faPercentage, 
  faClock 
} from '@fortawesome/free-solid-svg-icons';

interface Course {
  id: string;
  courseCode: string;
  name: string;
  teacher: {
    name: string;
  };
  schedule: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room: string;
  }[];
}

interface AttendanceStats {
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number;
}

export default function StudentDashboard() {
  const { t } = useLocale();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesRes = await fetch('/api/courses');
        if (coursesRes.ok) {
          const data = await coursesRes.json();
          const coursesList = Array.isArray(data.data) ? data.data : [];
          const myCourses = coursesList.filter((c: any) => 
            c.enrolledStudents?.some((s: any) => s.studentId === user?.profileId || s.studentId === user?.id)
          );
          setCourses(myCourses);
        }

        setStats({
          totalSessions: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          attendanceRate: 0
        });

      } catch (error) {
        console.error('Failed to fetch student data', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const getUpcomingClasses = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const upcoming: any[] = [];
    
    courses.forEach(course => {
      course.schedule.forEach(slot => {
        if (slot.dayOfWeek === today) {
          upcoming.push({
            ...slot,
            courseName: course.name,
            courseCode: course.courseCode,
            teacherName: course.teacher?.name
          });
        }
      });
    });

    return upcoming.sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const upcomingClasses = getUpcomingClasses();

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t.dashboard?.welcome} {user?.name || 'Student'}</h1>
          <p className="text-base-content/70 mt-1">{t.dashboard?.overview}</p>
        </div>
        <div className="text-sm breadcrumbs">
          <ul>
            <li><Link href="/">{t.nav.home}</Link></li>
            <li>{t.nav.dashboard}</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stats shadow bg-base-100 border border-base-200">
          <div className="stat">
            <div className="stat-figure text-primary">
              <FontAwesomeIcon icon={faBook} className="w-8 h-8" />
            </div>
            <div className="stat-title">{t.course?.title}</div>
            <div className="stat-value text-primary">{courses.length}</div>
            <div className="stat-desc">{t.dashboard?.enrolledStudents}</div>
          </div>
        </div>

        <div className="stats shadow bg-base-100 border border-base-200">
          <div className="stat">
            <div className="stat-figure text-success">
              <FontAwesomeIcon icon={faCalendarCheck} className="w-8 h-8" />
            </div>
            <div className="stat-title">{t.attendance?.present}</div>
            <div className="stat-value text-success">{stats?.presentCount || 0}</div>
            <div className="stat-desc">{t.dashboard?.thisMonth}</div>
          </div>
        </div>

        <div className="stats shadow bg-base-100 border border-base-200">
          <div className="stat">
            <div className="stat-figure text-info">
              <FontAwesomeIcon icon={faPercentage} className="w-8 h-8" />
            </div>
            <div className="stat-title">{t.attendance?.attendanceRate}</div>
            <div className="stat-value text-info">{stats?.attendanceRate || 0}%</div>
            <div className="stat-desc">{t.attendance?.totalSessions}: {stats?.totalSessions || 0}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body">
            <h2 className="card-title flex justify-between">
              {t.dashboard?.todaySessions}
              <div className="badge badge-primary">{upcomingClasses.length}</div>
            </h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>{t.schedule?.time}</th>
                    <th>{t.schedule?.subject}</th>
                    <th>{t.schedule?.room}</th>
                    <th>{t.course?.teacher}</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingClasses.length > 0 ? (
                    upcomingClasses.map((slot, index) => (
                      <tr key={index}>
                        <td className="font-mono">
                          <div className="flex items-center gap-2">
                            <FontAwesomeIcon icon={faClock} className="w-4 h-4 opacity-70" />
                            {slot.startTime} - {slot.endTime}
                          </div>
                        </td>
                        <td>
                          <div className="font-bold">{slot.courseName}</div>
                          <div className="text-xs opacity-50">{slot.courseCode}</div>
                        </td>
                        <td>{slot.room}</td>
                        <td>{slot.teacherName}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-base-content/50">
                        {t.schedule?.noSchedule}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl border border-base-200 h-fit">
          <div className="card-body">
            <h2 className="card-title">{t.course?.title}</h2>
            <div className="flex flex-col gap-3 mt-4">
              {courses.slice(0, 5).map((course) => (
                <div key={course.id} className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                  <div>
                    <div className="font-semibold">{course.name}</div>
                    <div className="text-xs opacity-70">{course.courseCode}</div>
                  </div>
                </div>
              ))}
              {courses.length === 0 && (
                <div className="text-center py-4 opacity-50">{t.course?.noCourses}</div>
              )}
              <Link href="/schedule" className="btn btn-outline btn-sm mt-2">
                {t.common?.view} {t.course?.title}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
