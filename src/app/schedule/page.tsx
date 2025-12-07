'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { Course } from '@/types/course';
import CourseCard from '@/components/course/CourseCard';
import CreateCourseModal from '@/components/course/CreateCourseModal';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import Loading from '@/components/ui/Loading';
import ScheduleGrid from '@/components/schedule/ScheduleGrid';

type ViewMode = 'card' | 'grid';

export default function SchedulePage() {
  const { t } = useLocale();
  const { showToast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isMobile, setIsMobile] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (semesterFilter) params.append('semester', semesterFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/courses?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setCourses(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      showToast({
        message: error instanceof Error ? error.message : t.course.createError,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [search, semesterFilter, statusFilter, showToast, t]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchCourses();
    }
  }, [search, semesterFilter, statusFilter, authLoading, user, fetchCourses]);

  const handleEdit = (course: Course) => {
    router.push(`/schedule/${course.id}/edit`);
  };

  const handleDelete = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (course) {
      setCourseToDelete(course);
      setDeleteModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/courses/${courseToDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        showToast({ message: t.course.deleteSuccess, type: 'success' });
        fetchCourses();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      showToast({
        message: error instanceof Error ? error.message : t.course.deleteError,
        type: 'error',
      });
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setCourseToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setCourseToDelete(null);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSemesterFilter('');
    setStatusFilter('');
  };

  const hasFilters = search || semesterFilter || statusFilter;

  const stats = useMemo(() => {
    const activeCourses = courses.filter((c) => c.status === 'active').length;
    const totalStudents = courses.reduce(
      (sum, c) => sum + c.enrolledStudents.length,
      0
    );
    return {
      total: courses.length,
      active: activeCourses,
      students: totalStudents,
    };
  }, [courses]);

  const today = new Date().getDay();

  const dayNames = useMemo(() => [
    t.schedule.sunday,
    t.schedule.monday,
    t.schedule.tuesday,
    t.schedule.wednesday,
    t.schedule.thursday,
    t.schedule.friday,
    t.schedule.saturday,
  ], [t]);

  const todaysCourses = useMemo(() => {
    return courses
      .filter((course) => course.schedule.some((slot) => slot.dayOfWeek === today))
      .map((course) => ({
        ...course,
        todaySlots: course.schedule.filter((slot) => slot.dayOfWeek === today),
      }))
      .sort((a, b) => {
        const aTime = a.todaySlots[0]?.startTime || '00:00';
        const bTime = b.todaySlots[0]?.startTime || '00:00';
        return aTime.localeCompare(bTime);
      });
  }, [courses, today]);

  const filteredCourses = useMemo(() => {
    if (selectedDay === null) return courses;
    return courses.filter((course) =>
      course.schedule.some((slot) => slot.dayOfWeek === selectedDay)
    );
  }, [courses, selectedDay]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loading variant="spinner" size="lg" />
      </div>
    );
  }

  const handleView = (course: Course) => {
    router.push(`/schedule/${course.id}/sessions`);
  };

  return (
    <div className="min-h-screen bg-base-100 p-6">
      {/* Header with Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-2xl font-semibold">{t.course.title}</h1>
            <p className="text-base-content/60 text-sm mt-1">{t.schedule.subtitle}</p>
          </div>
          
          {/* Stats - Inline with header */}
          <div className="hidden md:flex items-center gap-6 ml-6 pl-6 border-l border-base-300">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{stats.total}</p>
                <p className="text-xs text-base-content/60">{t.course.title}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-success">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{stats.active}</p>
                <p className="text-xs text-base-content/60">{t.course.statusActive}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-secondary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-bold leading-none">{stats.students}</p>
                <p className="text-xs text-base-content/60">{t.course.enrolledStudents}</p>
              </div>
            </div>
          </div>
        </div>

        {user?.role === 'admin' && (
          <button
            className="btn btn-primary btn-sm gap-2"
            onClick={() => setCreateModalOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t.course.createCourse}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* <div className="relative flex-1 max-w-xs">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-base-content/40 absolute left-3 top-1/2 -translate-y-1/2">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.course.searchPlaceholder}
            className="input input-bordered input-sm w-full pl-9"
          />
        </div>

        <select
          value={semesterFilter}
          onChange={(e) => setSemesterFilter(e.target.value)}
          className="select select-bordered select-sm"
        >
          <option value="">{t.course.semester}</option>
          <option value="1">{t.course.semester} 1</option>
          <option value="2">{t.course.semester} 2</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select select-bordered select-sm"
        >
          <option value="">{t.course.statusActive}</option>
          <option value="active">{t.course.statusActive}</option>
          <option value="archived">{t.course.statusArchived}</option>
          <option value="draft">{t.course.statusDraft}</option>
        </select> */}

        {hasFilters && (
          <button
            className="btn btn-ghost btn-sm gap-1"
            onClick={handleClearFilters}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            {t.users.clearFilters}
          </button>
        )}

        <div className="hidden md:flex items-center gap-1 ml-auto bg-base-200 rounded-lg p-1">
          <button
            className={`btn btn-sm gap-2 ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('grid')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            {t.schedule.gridView}
          </button>
          <button
            className={`btn btn-sm gap-2 ${viewMode === 'card' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('card')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
            {t.schedule.cardView}
          </button>
        </div>
      </div>

      {!loading && todaysCourses.length > 0 && (
        <div className="card bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 mb-6">
          <div className="card-body p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-lg">{t.schedule.today} ({dayNames[today]})</h2>
                <p className="text-sm text-base-content/60">{todaysCourses.length} {t.course.title}</p>
              </div>
            </div>
            <div className="space-y-2">
              {todaysCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center gap-3 p-3 bg-base-100 rounded-lg cursor-pointer hover:shadow-md transition-all"
                  onClick={() => router.push(`/schedule/${course.id}/sessions`)}
                >
                  <div className="text-center min-w-[80px]">
                    {course.todaySlots.map((slot, idx) => (
                      <div key={idx} className="text-sm font-mono font-semibold text-primary">
                        {slot.startTime}
                      </div>
                    ))}
                  </div>
                  <div className="w-1 h-10 bg-primary rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-primary badge-sm">{course.courseCode}</span>
                      <span className="font-medium truncate">{course.courseName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-base-content/60 mt-1">
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                        {course.room}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        {course.todaySlots.map((s) => `${s.startTime}-${s.endTime}`).join(', ')}
                      </span>
                    </div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-base-content/40">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && courses.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm font-medium text-base-content/70 mr-2">{t.schedule.filterByDay}:</span>
          <button
            className={`btn btn-sm ${selectedDay === null ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSelectedDay(null)}
          >
            {t.schedule.allDays}
          </button>
          {[1, 2, 3, 4, 5, 6, 0].map((day) => (
            <button
              key={day}
              className={`btn btn-sm ${selectedDay === day ? 'btn-primary' : 'btn-ghost'} ${day === today ? 'ring-2 ring-primary ring-offset-1' : ''}`}
              onClick={() => setSelectedDay(day)}
            >
              {dayNames[day]}
              {day === today && <span className="badge badge-xs badge-secondary ml-1">{t.schedule.today}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loading variant="spinner" size="lg" />
        </div>
      ) : (
        <>
          {(viewMode === 'grid' && !isMobile) ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                <h2 className="text-lg font-semibold">{t.schedule.weeklySchedule}</h2>
                {filteredCourses.length > 0 && (
                  <span className="text-sm text-base-content/60 ml-2">
                    ({t.schedule.clickToViewDetails})
                  </span>
                )}
              </div>
              <div className="w-full mb-8">
                <ScheduleGrid courses={filteredCourses} />
              </div>
            </>
          ) : (
            <>
              {filteredCourses.length === 0 ? (
                <div className="bg-base-200/30 rounded-2xl p-8 mb-8">
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-base-300 flex items-center justify-center mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 text-base-content/30">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{t.schedule.noCoursesYet}</h3>
                    <p className="text-base-content/50 mb-6 max-w-sm">{t.schedule.addFirstCourse}</p>
                    {hasFilters || selectedDay !== null ? (
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => { handleClearFilters(); setSelectedDay(null); }}
                      >
                        {t.users.clearFilters}
                      </button>
                    ) : user?.role === 'admin' && (
                      <button
                        className="btn btn-primary gap-2"
                        onClick={() => setCreateModalOpen(true)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        {t.course.createCourse}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                  {filteredCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      user={user!}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onView={handleView}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {filteredCourses.length > 0 && (
        <div className="card bg-base-100 shadow-lg border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              {t.attendanceManagement.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCourses.map((course) => (
                <button
                  key={course.id}
                  className="btn btn-outline btn-primary w-full justify-start gap-3 h-auto py-3"
                  onClick={() => router.push(`/schedule/${course.id}/sessions`)}
                >
                  <div className="badge badge-primary">{course.courseCode}</div>
                  <span className="text-left truncate flex-1">{course.courseName}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <CreateCourseModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchCourses}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title={t.course.deleteCourse}
        message={`${t.course.confirmDelete} "${courseToDelete?.courseName}"?`}
        confirmLabel={t.users.delete}
        cancelLabel={t.users.cancel}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={deleting}
      />
    </div>
  );
}
