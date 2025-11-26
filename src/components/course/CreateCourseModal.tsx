'use client';

import { useState, useEffect } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import { CreateCourseRequest, CourseScheduleSlot } from '@/types/course';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

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

export default function CreateCourseModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCourseModalProps) {
  const { t } = useLocale();
  const { showToast } = useToast();

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
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (isOpen) {
      fetchTeachers();
      fetchStudents();
    }
  }, [isOpen]);

  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const response = await fetch('/api/users?role=teacher');
      const result = await response.json();
      if (result.success) {
        setTeachers(result.data);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoadingTeachers(false);
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

  const resetForm = () => {
    setCourseCode('');
    setCourseName('');
    setTeacherId('');
    setSemester('');
    setAcademicYear('');
    setRoom('');
    setDescription('');
    setSchedule([{ dayOfWeek: 1, startTime: '09:00', endTime: '12:00', room: '' }]);
    setSelectedStudents([]);
    setErrors({});
    setStep(1);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!courseCode.trim()) newErrors.courseCode = t.course.courseCodeRequired;
    if (!courseName.trim()) newErrors.courseName = t.course.courseNameRequired;
    if (!teacherId) newErrors.teacherId = t.course.teacherRequired;
    if (!semester.trim()) newErrors.semester = t.course.semesterRequired;
    if (!academicYear.trim()) newErrors.academicYear = t.course.academicYearRequired;
    if (!room.trim()) newErrors.room = t.course.roomRequired;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (schedule.length === 0) newErrors.schedule = t.course.scheduleRequired;
    schedule.forEach((slot, idx) => {
      if (slot.startTime >= slot.endTime) {
        newErrors[`schedule_${idx}`] = t.course.invalidTimeRange;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
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

  const handleSubmit = async () => {
    try {
      setSaving(true);

      const requestData: CreateCourseRequest = {
        courseCode,
        courseName,
        teacherId,
        semester,
        academicYear,
        room,
        description,
        schedule,
        enrolledStudentIds: selectedStudents.length > 0 ? selectedStudents : undefined,
      };

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.success) {
        showToast({ message: t.course.createSuccess, type: 'success' });
        resetForm();
        onSuccess();
        onClose();
      } else {
        throw new Error(result.error || t.course.createError);
      }
    } catch (error) {
      console.error('Error creating course:', error);
      showToast({
        message: error instanceof Error ? error.message : t.course.createError,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

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

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-primary-content px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">{t.course.createCourse}</h3>
            <button
              onClick={handleClose}
              className="btn btn-ghost btn-sm btn-circle text-primary-content"
              disabled={saving}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Steps */}
          <ul className="steps steps-horizontal w-full mt-4 text-xs">
            <li className={`step ${step >= 1 ? 'step-primary' : ''}`} data-content={step > 1 ? '✓' : '1'}>
              ข้อมูลพื้นฐาน
            </li>
            <li className={`step ${step >= 2 ? 'step-primary' : ''}`} data-content={step > 2 ? '✓' : '2'}>
              {t.course.schedule}
            </li>
            <li className={`step ${step >= 3 ? 'step-primary' : ''}`} data-content="3">
              {t.course.enrolledStudents}
            </li>
          </ul>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-sm">{t.course.courseCode} <span className="text-error">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className={`input input-bordered input-sm ${errors.courseCode ? 'input-error' : ''}`}
                    placeholder="CS101"
                    disabled={saving}
                  />
                  {errors.courseCode && <span className="text-error text-xs mt-1">{errors.courseCode}</span>}
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-sm">{t.course.courseName} <span className="text-error">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className={`input input-bordered input-sm ${errors.courseName ? 'input-error' : ''}`}
                    placeholder={t.course.courseNamePlaceholder}
                    disabled={saving}
                  />
                  {errors.courseName && <span className="text-error text-xs mt-1">{errors.courseName}</span>}
                </div>
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text text-sm mr-2">{t.course.teacher} <span className="text-error">*</span></span>
                </label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className={`select select-bordered select-sm ${errors.teacherId ? 'select-error' : ''}`}
                  disabled={saving || loadingTeachers}
                >
                  <option value="">{loadingTeachers ? 'Loading...' : t.course.selectTeacher}</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.fullName || teacher.username}
                    </option>
                  ))}
                </select>
                {errors.teacherId && <span className="text-error text-xs mt-1 ml-2">{errors.teacherId}</span>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-sm">{t.course.semester} <span className="text-error">*</span></span>
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className={`select select-bordered select-sm ${errors.semester ? 'select-error' : ''}`}
                    disabled={saving}
                  >
                    <option value="">{t.course.selectSemester}</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </select>
                  {errors.semester && <span className="text-error text-xs mt-1">{errors.semester}</span>}
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-sm">{t.course.academicYear} <span className="text-error">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className={`input input-bordered input-sm ${errors.academicYear ? 'input-error' : ''}`}
                    placeholder="2567"
                    disabled={saving}
                  />
                  {errors.academicYear && <span className="text-error text-xs mt-1">{errors.academicYear}</span>}
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-sm">{t.course.room} <span className="text-error">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className={`input input-bordered input-sm ${errors.room ? 'input-error' : ''}`}
                    placeholder="B101"
                    disabled={saving}
                  />
                  {errors.room && <span className="text-error text-xs mt-1">{errors.room}</span>}
                </div>
              </div>

              <div className="form-control">
                <label className="label py-1 mr-2">
                  <span className="label-text text-sm">{t.course.description}</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="textarea textarea-bordered textarea-sm h-20"
                  placeholder={t.course.descriptionPlaceholder}
                  disabled={saving}
                />
              </div>
            </div>
          )}

          {/* Step 2: Schedule */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-base-content/70">{t.course.scheduleRequired}</p>
                <button
                  type="button"
                  onClick={handleAddScheduleSlot}
                  className="btn btn-primary btn-sm gap-1"
                  disabled={saving}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  {t.course.addScheduleSlot}
                </button>
              </div>

              <div className="space-y-3">
                {schedule.map((slot, idx) => (
                  <div key={idx} className="card bg-base-200 shadow-sm">
                    <div className="card-body p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="badge badge-primary badge-sm">#{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveScheduleSlot(idx)}
                          className="btn btn-ghost btn-xs text-error"
                          disabled={saving || schedule.length === 1}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="form-control">
                          <label className="label py-0">
                            <span className="label-text text-xs">{t.course.dayOfWeek}</span>
                          </label>
                          <select
                            value={slot.dayOfWeek}
                            onChange={(e) => handleScheduleChange(idx, 'dayOfWeek', parseInt(e.target.value))}
                            className="select select-bordered select-sm"
                            disabled={saving}
                          >
                            {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                              <option key={day} value={day}>{getDayName(day)}</option>
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
          )}

          {/* Step 3: Students */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-base-content/70">{t.course.selectStudents}</p>
                <span className="badge badge-primary">
                  {selectedStudents.length} {t.course.selected}
                </span>
              </div>

              <div className="form-control">
                <div className="border border-base-300 rounded-lg overflow-hidden">
                  {loadingStudents ? (
                    <div className="flex justify-center py-8">
                      <span className="loading loading-spinner loading-md"></span>
                    </div>
                  ) : students.length === 0 ? (
                    <div className="text-center py-8 text-base-content/50">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12 mx-auto mb-2 opacity-50">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                      </svg>
                      <p>{t.course.noStudents}</p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto divide-y divide-base-200">
                      {students.map((student) => (
                        <label
                          key={student._id}
                          className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-base-200 transition-colors ${
                            selectedStudents.includes(student._id) ? 'bg-primary/5' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student._id)}
                            onChange={() => handleStudentToggle(student._id)}
                            className="checkbox checkbox-sm checkbox-primary"
                            disabled={saving}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{student.name}</p>
                            {student.studentId && (
                              <p className="text-xs text-base-content/60">{student.studentId}</p>
                            )}
                          </div>
                          {selectedStudents.includes(student._id) && (
                            <span className="badge badge-primary badge-xs">✓</span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-base-300 px-6 py-4 bg-base-200/50 flex justify-between">
          <button
            type="button"
            onClick={step === 1 ? handleClose : handleBack}
            className="btn btn-ghost btn-sm"
            disabled={saving}
          >
            {step === 1 ? t.common.cancel : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
                ย้อนกลับ
              </>
            )}
          </button>
          
          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn btn-primary btn-sm"
              disabled={saving}
            >
              ถัดไป
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="btn btn-primary btn-sm"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  {t.common.saving}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  {t.course.create}
                </>
              )}
            </button>
          )}
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  );
}
