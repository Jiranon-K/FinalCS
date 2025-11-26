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

interface Student {
  _id: string;
  name: string;
  studentId?: string;
}

interface EnrolledStudent {
  studentId: string;
  enrolledAt: string;
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

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const DocumentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
);

const InformationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
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
  const [schedule, setSchedule] = useState<Omit<CourseScheduleSlot, 'graceMinutes'>[]>([
    { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', room: '' },
  ]);
  const [status, setStatus] = useState('active');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isTeacherOwner, setIsTeacherOwner] = useState(false);

  const isAdmin = user?.role === 'admin';

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
        setSchedule(course.schedule);
        setStatus(course.status);
        
        if (course.enrolledStudents) {
          setSelectedStudents(course.enrolledStudents.map((s: EnrolledStudent) => s.studentId));
        }

        if (user?.role === 'teacher' && String(course.teacherId) === String(user.id)) {
          setIsTeacherOwner(true);
        }
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
  }, [courseId, router, showToast, t, user]);

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

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);
      const response = await fetch('/api/students');
      const result = await response.json();
      if (result.success) {
        setStudents(result.data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'admin' && user.role !== 'teacher') {
        router.push('/schedule');
        return;
      }
      Promise.all([fetchCourse(), fetchTeachers(), fetchStudents()]).finally(() => setLoading(false));
    }
  }, [authLoading, user, router, fetchCourse]);

  useEffect(() => {
    if (!loading && user?.role === 'teacher' && !isTeacherOwner) {
      router.push('/schedule');
    }
  }, [loading, user, isTeacherOwner, router]);

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

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    const filtered = filteredStudents;
    const allSelected = filtered.every((s) => selectedStudents.includes(s._id));
    if (allSelected) {
      setSelectedStudents((prev) => prev.filter((id) => !filtered.find((s) => s._id === id)));
    } else {
      const newIds = filtered.map((s) => s._id).filter((id) => !selectedStudents.includes(id));
      setSelectedStudents((prev) => [...prev, ...newIds]);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.studentId && s.studentId.toLowerCase().includes(studentSearch.toLowerCase()))
  );

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
        schedule,
        status: status as 'active' | 'archived' | 'draft',
        enrolledStudentIds: isAdmin ? selectedStudents : undefined,
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
    <div className="container mx-auto p-6 max-w-5xl">
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {!isAdmin && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex items-center gap-4">
                <div className="badge badge-primary badge-lg font-mono font-bold px-4 py-3">
                  {courseCode}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{courseName}</h2>
                  <p className="text-sm text-base-content/60">ภาคเรียน {semester} / ปีการศึกษา {academicYear} • ห้อง {room}</p>
                </div>
              </div>
              <div className="divider my-2"></div>
              <div className="flex items-center gap-2 text-warning">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                </svg>
                <span className="text-sm">คุณสามารถแก้ไขได้เฉพาะ <strong>ตารางเรียน</strong> และ <strong>รายชื่อนักศึกษา</strong> เท่านั้น</span>
              </div>
            </div>
          </div>
        )}

        {isAdmin && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-lg">
                <DocumentIcon />
              </div>
              <div>
                <h2 className="card-title text-xl">ข้อมูลพื้นฐาน</h2>
                <p className="text-sm text-base-content/60">กรอกข้อมูลรายวิชาที่ต้องการแก้ไข</p>
              </div>
            </div>

            <div className="divider my-0"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text font-medium">
                    {t.course.courseCode} <span className="text-error">*</span>
                  </span>
                </div>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className={`input input-bordered w-full ${errors.courseCode ? 'input-error' : ''}`}
                  placeholder="เช่น CS101"
                  disabled={saving}
                />
                {errors.courseCode && (
                  <div className="label">
                    <span className="label-text-alt text-error">{errors.courseCode}</span>
                  </div>
                )}
              </label>

              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text font-medium">
                    {t.course.courseName} <span className="text-error">*</span>
                  </span>
                </div>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className={`input input-bordered w-full ${errors.courseName ? 'input-error' : ''}`}
                  placeholder={t.course.courseNamePlaceholder}
                  disabled={saving}
                />
                {errors.courseName && (
                  <div className="label">
                    <span className="label-text-alt text-error">{errors.courseName}</span>
                  </div>
                )}
              </label>

              <label className="form-control w-full md:col-span-2">
                <div className="label">
                  <span className="label-text font-medium">
                    {t.course.teacher} <span className="text-error">*</span>
                  </span>
                  {!isAdmin && (
                    <span className="label-text-alt text-warning">
                      {t.course.teacherChangeAdminOnly || 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเปลี่ยนได้'}
                    </span>
                  )}
                </div>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className={`select select-bordered w-full ${errors.teacherId ? 'select-error' : ''}`}
                  disabled={saving || !isAdmin}
                >
                  <option value="">{t.course.selectTeacher}</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.fullName || teacher.username}
                    </option>
                  ))}
                </select>
                {errors.teacherId && (
                  <div className="label">
                    <span className="label-text-alt text-error">{errors.teacherId}</span>
                  </div>
                )}
              </label>
            </div>

            <div className="divider my-0"></div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text font-medium">
                    {t.course.semester} <span className="text-error">*</span>
                  </span>
                </div>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className={`select select-bordered w-full ${errors.semester ? 'select-error' : ''}`}
                  disabled={saving}
                >
                  <option value="">{t.course.selectSemester}</option>
                  <option value="1">ภาคเรียนที่ 1</option>
                  <option value="2">ภาคเรียนที่ 2</option>
                </select>
                {errors.semester && (
                  <div className="label">
                    <span className="label-text-alt text-error">{errors.semester}</span>
                  </div>
                )}
              </label>

              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text font-medium">
                    {t.course.academicYear} <span className="text-error">*</span>
                  </span>
                </div>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className={`input input-bordered w-full ${errors.academicYear ? 'input-error' : ''}`}
                  placeholder="เช่น 2567"
                  disabled={saving}
                />
                {errors.academicYear && (
                  <div className="label">
                    <span className="label-text-alt text-error">{errors.academicYear}</span>
                  </div>
                )}
              </label>

              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text font-medium">
                    {t.course.room} <span className="text-error">*</span>
                  </span>
                </div>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className={`input input-bordered w-full ${errors.room ? 'input-error' : ''}`}
                  placeholder="เช่น B101"
                  disabled={saving}
                />
                {errors.room && (
                  <div className="label">
                    <span className="label-text-alt text-error">{errors.room}</span>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>
        )}

        <div className="card bg-base-100 shadow-md border border-base-200 hover:shadow-lg transition-shadow duration-200">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-secondary">
                  <ClockIcon />
                </div>
                <h2 className="card-title text-lg">{t.course.schedule}</h2>
              </div>
              <button
                type="button"
                onClick={handleAddScheduleSlot}
                className="btn btn-primary btn-sm gap-2"
                disabled={saving}
              >
                <PlusIcon />
                {t.course.addScheduleSlot}
              </button>
            </div>

            <div className="space-y-3">
              {schedule.map((slot, idx) => (
                <div key={idx} className="card bg-base-200/50 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="card-body p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="badge badge-primary badge-sm">#{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveScheduleSlot(idx)}
                        className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                        disabled={saving || schedule.length === 1}
                      >
                        <TrashIcon />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="form-control">
                        <label className="label py-0">
                          <span className="label-text text-xs">{t.course.dayOfWeek}</span>
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
                        <label className="label py-0">
                          <span className="label-text text-xs">{t.course.startTime}</span>
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
                        <label className="label py-0">
                          <span className="label-text text-xs">{t.course.endTime}</span>
                        </label>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => handleScheduleChange(idx, 'endTime', e.target.value)}
                          className="input input-bordered input-sm"
                          disabled={saving}
                        />
                      </div>
                    </div>

                    {errors[`schedule_${idx}`] && (
                      <p className="text-error text-xs mt-2">{errors[`schedule_${idx}`]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md border border-base-200 hover:shadow-lg transition-shadow duration-200">
          <div className="card-body p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-info">
                <UsersIcon />
              </div>
              <h2 className="card-title text-lg">
                {t.course.enrolledStudents}
                <span className="badge badge-primary badge-sm ml-2">
                  {selectedStudents.length}
                </span>
              </h2>
            </div>

              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder={t.course.searchStudents || 'Search students...'}
                    className="input input-bordered input-sm w-full pl-10"
                    disabled={saving}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50">
                    <SearchIcon />
                  </div>
                </div>

                {loadingStudents ? (
                  <div className="flex justify-center py-6">
                    <Loading variant="spinner" size="sm" />
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-base-content/60">
                        {filteredStudents.length} {t.course.studentsFound || 'students found'}
                      </span>
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="btn btn-ghost btn-xs"
                        disabled={saving}
                      >
                        {filteredStudents.every((s) => selectedStudents.includes(s._id))
                          ? (t.course.deselectAll || 'Deselect All')
                          : (t.course.selectAll || 'Select All')}
                      </button>
                    </div>

                    <div className="border border-base-300 rounded-lg max-h-64 overflow-y-auto">
                      {filteredStudents.length === 0 ? (
                        <div className="p-6 text-center text-base-content/50 text-sm">
                          {t.course.noStudentsFound || 'No students found'}
                        </div>
                      ) : (
                        filteredStudents.map((student) => (
                          <label
                            key={student._id}
                            className={`flex items-center gap-3 p-3 hover:bg-base-200 cursor-pointer border-b border-base-200 last:border-b-0 transition-colors ${
                              selectedStudents.includes(student._id) ? 'bg-primary/5' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student._id)}
                              onChange={() => handleStudentToggle(student._id)}
                              className="checkbox checkbox-primary checkbox-sm"
                              disabled={saving}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{student.name}</p>
                              {student.studentId && (
                                <p className="text-xs text-base-content/60">{student.studentId}</p>
                              )}
                            </div>
                            {selectedStudents.includes(student._id) && (
                              <span className="badge badge-primary badge-xs">✓</span>
                            )}
                          </label>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
          </div>
        </div>

        {isAdmin && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 p-2.5 rounded-lg">
                <InformationIcon />
              </div>
              <div>
                <h2 className="card-title text-xl">รายละเอียดเพิ่มเติม</h2>
                <p className="text-sm text-base-content/60">ข้อมูลเสริมและสถานะของรายวิชา</p>
              </div>
            </div>

            <div className="divider my-0"></div>

            <div className="grid grid-cols-1 gap-5">
              {isAdmin && (
                <label className="form-control w-full max-w-md">
                  <div className="label">
                    <span className="label-text font-medium">{t.course.status || 'สถานะรายวิชา'}</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <label className="label cursor-pointer gap-2 p-3 rounded-lg border border-base-300 hover:bg-base-200 transition-colors">
                      <input
                        type="radio"
                        name="status"
                        className="radio radio-success radio-sm"
                        checked={status === 'active'}
                        onChange={() => setStatus('active')}
                        disabled={saving}
                      />
                      <span className="label-text flex items-center gap-2">
                        <span className="badge badge-success badge-xs"></span>
                        {t.course.statusActive}
                      </span>
                    </label>
                    <label className="label cursor-pointer gap-2 p-3 rounded-lg border border-base-300 hover:bg-base-200 transition-colors">
                      <input
                        type="radio"
                        name="status"
                        className="radio radio-warning radio-sm"
                        checked={status === 'draft'}
                        onChange={() => setStatus('draft')}
                        disabled={saving}
                      />
                      <span className="label-text flex items-center gap-2">
                        <span className="badge badge-warning badge-xs"></span>
                        {t.course.statusDraft}
                      </span>
                    </label>
                    <label className="label cursor-pointer gap-2 p-3 rounded-lg border border-base-300 hover:bg-base-200 transition-colors">
                      <input
                        type="radio"
                        name="status"
                        className="radio radio-ghost radio-sm"
                        checked={status === 'archived'}
                        onChange={() => setStatus('archived')}
                        disabled={saving}
                      />
                      <span className="label-text flex items-center gap-2">
                        <span className="badge badge-ghost badge-xs"></span>
                        {t.course.statusArchived}
                      </span>
                    </label>
                  </div>
                </label>
              )}
            </div>
          </div>
        </div>
        )}

        <div className="card bg-base-200/50 shadow">
          <div className="card-body p-4 flex-row justify-between items-center">
            <p className="text-sm text-base-content/60 hidden sm:block">
              กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนบันทึก
            </p>
            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={() => router.push(`/schedule/${courseId}`)}
                className="btn btn-ghost"
                disabled={saving}
              >
                {t.common.cancel}
              </button>
              <button type="submit" className="btn btn-primary gap-2" disabled={saving}>
                {saving ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    {t.common.saving}
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    {t.users.save}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
