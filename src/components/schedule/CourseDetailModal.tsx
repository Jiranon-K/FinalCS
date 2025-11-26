'use client';

import { Course, CourseScheduleSlot } from '@/types/course';
import { useLocale } from '@/hooks/useLocale';
import { UserProfile } from '@/contexts/AuthContext';

interface CourseDetailModalProps {
  isOpen: boolean;
  course: Course | null;
  slot: CourseScheduleSlot | null;
  onClose: () => void;
  user?: UserProfile | null;
  onEditSchedule?: (course: Course) => void;
}

export default function CourseDetailModal({ isOpen, course, slot, onClose, user, onEditSchedule }: CourseDetailModalProps) {
  const { t } = useLocale();
  const isTeacherOwner = user?.role === 'teacher' && String(course?.teacherId) === String(user.id);
  const canEditSchedule = user?.role === 'admin' || isTeacherOwner;

  if (!isOpen || !course) return null;

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
    <dialog className="modal modal-open">
      <div className="modal-box max-w-lg">
        <button 
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="badge badge-primary badge-lg font-mono font-semibold px-4 py-3">
            {course.courseCode}
          </div>
          <div className={`badge ${getStatusBadgeClass(course.status)} py-3`}>
            {getStatusText(course.status)}
          </div>
        </div>

        <h3 className="font-bold text-xl mb-4">{course.courseName}</h3>

        <div className="divider my-2"></div>

        {slot && (
          <div className="bg-primary/5 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span className="font-semibold">{t.schedule.time}</span>
            </div>
            <div className="ml-7 space-y-1">
              <p className="text-base-content/80">
                <span className="font-medium">{getDayName(slot.dayOfWeek)}</span>
                <span className="mx-2">•</span>
                <span>{slot.startTime} - {slot.endTime}</span>
              </p>
              {(slot.room || course.room) && (
                <p className="text-sm text-base-content/60">
                  {t.schedule.room}: {slot.room || course.room}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-base-200/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-secondary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
              </svg>
              <span className="text-xs text-base-content/60">{t.course.teacher}</span>
            </div>
            <p className="text-sm font-medium ml-6">{course.teacherName}</p>
          </div>

          <div className="bg-base-200/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-accent">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <span className="text-xs text-base-content/60">{t.course.semester}</span>
            </div>
            <p className="text-sm font-medium ml-6">{course.semester} / {course.academicYear}</p>
          </div>
        </div>

        <div className="bg-info/5 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-info">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
              <span className="font-semibold">{t.course.enrolledStudents}</span>
            </div>
            <div className="badge badge-info badge-lg font-bold">
              {course.enrolledStudents.length}
            </div>
          </div>
          
          {course.enrolledStudents.length > 0 && (
            <div className="mt-3 ml-7">
              <div className="text-xs text-base-content/60 mb-2">
                {t.schedule.studentsEnrolled || 'Students enrolled in this course'}
              </div>
              <div className="flex -space-x-2">
                {course.enrolledStudents.slice(0, 5).map((_, index) => (
                  <div 
                    key={index}
                    className="w-8 h-8 rounded-full bg-base-300 border-2 border-base-100 flex items-center justify-center text-xs font-medium"
                  >
                    {index + 1}
                  </div>
                ))}
                {course.enrolledStudents.length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-content border-2 border-base-100 flex items-center justify-center text-xs font-bold">
                    +{course.enrolledStudents.length - 5}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {course.schedule && course.schedule.length > 1 && (
          <div className="mt-4">
            <div className="text-sm font-medium text-base-content/70 mb-2">
              {t.schedule.allSchedules || 'All Schedules'}
            </div>
            <div className="flex flex-wrap gap-2">
              {course.schedule.map((s, idx) => (
                <div 
                  key={idx} 
                  className={`badge badge-lg gap-2 py-3 px-4 ${slot && s.dayOfWeek === slot.dayOfWeek && s.startTime === slot.startTime ? 'badge-primary' : 'badge-ghost'}`}
                >
                  <span className="font-medium">{getDayName(s.dayOfWeek)}</span>
                  <span className="opacity-70">{s.startTime} - {s.endTime}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {canEditSchedule && onEditSchedule && course && (
          <div className="mt-4 p-4 bg-warning/10 border border-warning/30 rounded-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-warning">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-warning-content">{t.schedule.editSchedule}</p>
                  <p className="text-xs text-base-content/60">{isTeacherOwner ? 'คุณสามารถแก้ไขวัน-เวลาเรียนได้' : 'แก้ไขตารางสอนรายวิชานี้'}</p>
                </div>
              </div>
              <button 
                className="btn btn-warning gap-2 shadow-md" 
                onClick={() => {
                  onEditSchedule(course);
                  onClose();
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                </svg>
                แก้ไข
              </button>
            </div>
          </div>
        )}

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>
            {t.common.close}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
