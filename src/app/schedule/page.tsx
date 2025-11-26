'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { Course } from '@/types/course';
import Image from 'next/image';
import CourseCard from '@/components/course/CourseCard';
import CreateCourseModal from '@/components/course/CreateCourseModal';
import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import Loading from '@/components/ui/Loading';

const BookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
  </svg>
);

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

  const handleView = (course: Course) => {
    router.push(`/schedule/${course.id}`);
  };

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

  if (authLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl flex justify-center items-center min-h-[50vh]">
        <Loading variant="spinner" size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Image
              src="/menu-icon/book.png"
              alt="Schedule Icon"
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
            />
            {t.course.title}
          </h1>
          {user?.role === 'admin' && (
            <button
              className="btn btn-primary gap-2"
              onClick={() => setCreateModalOpen(true)}
            >
              <PlusIcon />
              {t.course.createCourse}
            </button>
          )}
        </div>
        <p className="text-base-content/70">{t.schedule.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-primary">
              <BookIcon />
            </div>
            <div className="stat-title">{t.course.title}</div>
            <div className="stat-value text-primary">{stats.total}</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-success">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <div className="stat-title">{t.course.statusActive}</div>
            <div className="stat-value text-success">{stats.active}</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-secondary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                />
              </svg>
            </div>
            <div className="stat-title">{t.course.enrolledStudents}</div>
            <div className="stat-value text-secondary">{stats.students}</div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-lg mb-6">
        <div className="card-body">
          <h2 className="card-title text-lg mb-4 flex items-center gap-2">
            <FilterIcon />
            {t.course.filterBySemester}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t.course.searchPlaceholder}</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.course.searchPlaceholder}
                  className="input input-bordered w-full pl-10"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50">
                  <SearchIcon />
                </div>
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{t.course.semester}</span>
              </label>
              <select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="">{t.course.filterBySemester}</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{t.course.statusActive}</span>
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="">{t.course.statusActive}</option>
                <option value="active">{t.course.statusActive}</option>
                <option value="archived">{t.course.statusArchived}</option>
                <option value="draft">{t.course.statusDraft}</option>
              </select>
            </div>
          </div>

          {hasFilters && (
            <div className="flex justify-end mt-4">
              <button
                className="btn btn-outline btn-sm"
                onClick={handleClearFilters}
              >
                {t.users.clearFilters}
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[30vh]">
          <Loading variant="spinner" size="lg" />
        </div>
      ) : courses.length === 0 ? (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="avatar placeholder">
                <div className="bg-base-300 text-base-content/40 rounded-full w-24 h-24 flex items-center justify-center">
                  <BookIcon />
                </div>
              </div>
              <p className="text-base-content/50 text-lg">{t.course.noCourses}</p>
              {hasFilters && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleClearFilters}
                >
                  {t.users.clearFilters}
                </button>
              )}
              {user?.role === 'admin' && !hasFilters && (
                <button
                  className="btn btn-primary gap-2"
                  onClick={() => setCreateModalOpen(true)}
                >
                  <PlusIcon />
                  {t.course.createCourse}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              user={user!}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
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
