'use client';

import { Course } from '@/types/course';
import { useLocale } from '@/hooks/useLocale';
import { UserProfile } from '@/contexts/AuthContext';

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
);

const TeacherIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
  </svg>
);

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const ViewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

interface CourseCardProps {
  course: Course;
  user: UserProfile;
  onView: (course: Course) => void;
  onEdit: (course: Course) => void;
  onDelete: (courseId: string) => void;
}

export default function CourseCard({ course, user, onView, onEdit, onDelete }: CourseCardProps) {
  const { t, locale } = useLocale();

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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'archived':
        return 'badge-neutral';
      case 'draft':
        return 'badge-warning';
      default:
        return 'badge-ghost';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return t.course.statusActive;
      case 'archived':
        return t.course.statusArchived;
      case 'draft':
        return t.course.statusDraft;
      default:
        return status;
    }
  };

  return (
    <div className="card bg-base-100 shadow-md hover:shadow-2xl transition-all duration-300 border border-base-200 hover:border-primary/30">
      {/* Header Section */}
      <div className="card-body p-6 gap-4">
        {/* Top: Course Code & Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="badge badge-primary badge-lg font-mono font-semibold px-4 py-3">
              {course.courseCode}
            </div>
            <div className={`badge ${getStatusBadgeClass(course.status)} py-3`}>
              {getStatusText(course.status)}
            </div>
          </div>
          
          {/* Action Buttons - Top Right */}
          <div className="flex items-center gap-1">
            <div className="tooltip tooltip-bottom" data-tip={t.course.viewDetails}>
              <button
                className="btn btn-ghost btn-sm btn-circle hover:bg-primary/10"
                onClick={() => onView(course)}
              >
                <ViewIcon />
              </button>
            </div>
            {user?.role === 'admin' && (
              <>
                <div className="tooltip tooltip-bottom" data-tip={t.course.edit}>
                  <button
                    className="btn btn-ghost btn-sm btn-circle hover:bg-warning/10"
                    onClick={() => onEdit(course)}
                  >
                    <EditIcon />
                  </button>
                </div>
                <div className="tooltip tooltip-bottom" data-tip={t.course.delete}>
                  <button
                    className="btn btn-ghost btn-sm btn-circle hover:bg-error/10"
                    onClick={() => onDelete(course.id)}
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Course Title */}
        <h3 className="card-title text-xl font-bold text-base-content leading-tight">
          {course.courseName}
        </h3>

        {/* Divider */}
        <div className="divider my-0"></div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Teacher */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-base-200/50">
            <div className="text-primary">
              <TeacherIcon />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-base-content/50 font-medium">ผู้สอน</span>
              <span className="text-sm font-medium text-base-content">{course.teacherName}</span>
            </div>
          </div>

          {/* Semester */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-base-200/50">
            <div className="text-secondary">
              <CalendarIcon />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-base-content/50 font-medium">ภาคเรียน</span>
              <span className="text-sm font-medium text-base-content">
                {course.semester} / {course.academicYear}
              </span>
            </div>
          </div>

          {/* Room */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-base-200/50">
            <div className="text-accent">
              <LocationIcon />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-base-content/50 font-medium">ห้องเรียน</span>
              <span className="text-sm font-medium text-base-content">{course.room}</span>
            </div>
          </div>

          {/* Students Count */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-base-200/50">
            <div className="text-info">
              <UsersIcon />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-base-content/50 font-medium">{t.course.students}</span>
              <span className="text-sm font-medium text-base-content">
                {course.enrolledStudents.length} คน
              </span>
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        {course.schedule && course.schedule.length > 0 && (
          <div className="bg-linear-to-r from-primary/5 to-secondary/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-primary">
                <ClockIcon />
              </div>
              <span className="text-sm font-semibold text-base-content">ตารางเรียน</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {course.schedule.map((slot, idx) => (
                <div 
                  key={idx} 
                  className="badge badge-outline badge-lg gap-2 py-3 px-4"
                >
                  <span className="font-medium">{getDayName(slot.dayOfWeek)}</span>
                  <span className="text-base-content/60">{slot.startTime} - {slot.endTime}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {course.description && (
          <div className="bg-base-200/30 rounded-xl p-4">
            <p className="text-sm text-base-content/70 leading-relaxed line-clamp-2">
              {course.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
