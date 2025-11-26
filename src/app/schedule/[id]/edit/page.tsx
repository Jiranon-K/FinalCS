'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { CourseScheduleSlot, UpdateCourseRequest } from '@/types/course';
import Loading from '@/components/ui/Loading';

interface Teacher {
  _id: string;
  username: string;
  fullName?: string;
}

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLocale();
  const { showToast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const courseId = params.id as string;

  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [semester, setSemester] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [room, setRoom] = useState('');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState<Omit<CourseScheduleSlot, 'graceMinutes'>[]>([
    { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', room: '' },
  ]);
  const [status, setStatus] = useState('active');

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchCourse = useCallback(async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      const result = await response.json();

      if (result.success) {
        const course = result.data;
        setCourseCode(course.courseCode);
        setCourseName(course.courseName);
        setTeacherId(course.teacherId);
        setSemester(course.semester);
        setAcademicYear(course.academicYear);
        setRoom(course.room);
        setDescription(course.description || '');
        setSchedule(course.schedule);
        setStatus(course.status);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      showToast({
        message: error instanceof Error ? error.message : t.course.createError,
        type: 'error',
      });
      router.push('/schedule');
    }
  }, [courseId, router, showToast, t]);

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/users?role=teacher');
      const result = await response.json();
      if (result.success) {
        setTeachers(result.data);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'admin') {
        router.push('/schedule');
        return;
      }
      Promise.all([fetchCourse(), fetchTeachers()]).finally(() => setLoading(false));
    }
  }, [authLoading, user, router, fetchCourse]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!courseCode.trim()) newErrors.courseCode = t.course.courseCodeRequired;
    if (!courseName.trim()) newErrors.courseName = t.course.courseNameRequired;
    if (!teacherId) newErrors.teacherId = t.course.teacherRequired;
    if (!semester.trim()) newErrors.semester = t.course.semesterRequired;
    if (!academicYear.trim()) newErrors.academicYear = t.course.academicYearRequired;
    if (!room.trim()) newErrors.room = t.course.roomRequired;
    if (schedule.length === 0) newErrors.schedule = t.course.scheduleRequired;

    schedule.forEach((slot, idx) => {
      if (slot.startTime >= slot.endTime) {
        newErrors[`schedule_${idx}`] = t.course.invalidTimeRange;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddScheduleSlot = () => {
    setSchedule([
      ...schedule,
      { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', room: '' },
    ]);
  };

  const handleRemoveScheduleSlot = (index: number) => {
    if (schedule.length > 1) {
      setSchedule(schedule.filter((_, idx) => idx !== index));
    }
  };

  const handleScheduleChange = (
    index: number,
    field: keyof Omit<CourseScheduleSlot, 'graceMinutes'>,
    value: string | number
  ) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setSchedule(newSchedule);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      const requestData: UpdateCourseRequest = {
        courseCode,
        courseName,
        teacherId,
        semester,
        academicYear,
        room,
        description,
        schedule,
        status: status as 'active' | 'archived' | 'draft',
      };

      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.success) {
        showToast({ message: t.course.updateSuccess || 'Course updated successfully', type: 'success' });
        router.push(`/schedule/${courseId}`);
      } else {
        throw new Error(result.error || t.course.createError);
      }
    } catch (error) {
      console.error('Error updating course:', error);
      showToast({
        message: error instanceof Error ? error.message : t.course.createError,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const days = [
      t.schedule.sunday,
      t.schedule.monday,
      t.schedule.tuesday,
      t.schedule.wednesday,
      t.schedule.thursday,
      t.schedule.friday,
      t.schedule.saturday,
    ];
    return days[dayOfWeek] || '';
  };

  if (loading || authLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl flex justify-center items-center min-h-[50vh]">
        <Loading variant="spinner" size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <button
          onClick={() => router.push(`/schedule/${courseId}`)}
          className="btn btn-ghost btn-sm gap-2 mb-4"
        >
          <BackIcon />
          {t.attendanceManagement.back}
        </button>
        <h1 className="text-3xl font-bold">{t.users.edit} {t.course.title}</h1>
      </div>

      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    {t.course.courseCode} <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className={`input input-bordered ${errors.courseCode ? 'input-error' : ''}`}
                  placeholder="CS101"
                  disabled={saving}
                />
                {errors.courseCode && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.courseCode}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    {t.course.courseName} <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className={`input input-bordered ${errors.courseName ? 'input-error' : ''}`}
                  placeholder={t.course.courseNamePlaceholder}
                  disabled={saving}
                />
                {errors.courseName && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.courseName}</span>
                  </label>
                )}
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  {t.course.teacher} <span className="text-error">*</span>
                </span>
              </label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className={`select select-bordered ${errors.teacherId ? 'select-error' : ''}`}
                disabled={saving}
              >
                <option value="">{t.course.selectTeacher}</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacher.fullName || teacher.username}
                  </option>
                ))}
              </select>
              {errors.teacherId && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.teacherId}</span>
                </label>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    {t.course.semester} <span className="text-error">*</span>
                  </span>
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className={`select select-bordered ${errors.semester ? 'select-error' : ''}`}
                  disabled={saving}
                >
                  <option value="">{t.course.selectSemester}</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
                {errors.semester && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.semester}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    {t.course.academicYear} <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className={`input input-bordered ${errors.academicYear ? 'input-error' : ''}`}
                  placeholder="2567"
                  disabled={saving}
                />
                {errors.academicYear && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.academicYear}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    {t.course.room} <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className={`input input-bordered ${errors.room ? 'input-error' : ''}`}
                  placeholder="B101"
                  disabled={saving}
                />
                {errors.room && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.room}</span>
                  </label>
                )}
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">{t.course.statusActive}</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="select select-bordered"
                disabled={saving}
              >
                <option value="active">{t.course.statusActive}</option>
                <option value="archived">{t.course.statusArchived}</option>
                <option value="draft">{t.course.statusDraft}</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">{t.course.description}</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="textarea textarea-bordered h-20"
                placeholder={t.course.descriptionPlaceholder}
                disabled={saving}
              />
            </div>

            <div className="divider">{t.course.schedule}</div>

            <div className="space-y-3">
              {schedule.map((slot, idx) => (
                <div key={idx} className="card bg-base-200 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">{t.course.dayOfWeek}</span>
                      </label>
                      <select
                        value={slot.dayOfWeek}
                        onChange={(e) =>
                          handleScheduleChange(idx, 'dayOfWeek', parseInt(e.target.value))
                        }
                        className="select select-bordered select-sm"
                        disabled={saving}
                      >
                        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                          <option key={day} value={day}>
                            {getDayName(day)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">{t.course.startTime}</span>
                      </label>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => handleScheduleChange(idx, 'startTime', e.target.value)}
                        className="input input-bordered input-sm"
                        disabled={saving}
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">{t.course.endTime}</span>
                      </label>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => handleScheduleChange(idx, 'endTime', e.target.value)}
                        className="input input-bordered input-sm"
                        disabled={saving}
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveScheduleSlot(idx)}
                        className="btn btn-error btn-sm btn-square"
                        disabled={saving || schedule.length === 1}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                  {errors[`schedule_${idx}`] && (
                    <p className="text-error text-sm mt-2">{errors[`schedule_${idx}`]}</p>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddScheduleSlot}
                className="btn btn-outline btn-sm gap-2"
                disabled={saving}
              >
                <PlusIcon />
                {t.course.addScheduleSlot}
              </button>
            </div>

            <div className="modal-action pt-4 mt-6">
              <button
                type="button"
                onClick={() => router.push(`/schedule/${courseId}`)}
                className="btn btn-ghost"
                disabled={saving}
              >
                {t.common.cancel}
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    {t.common.saving}
                  </>
                ) : (
                  t.users.save
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
