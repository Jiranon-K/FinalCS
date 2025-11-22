"use client";

import { Course } from "@/types/course";
import { useLocale } from "@/hooks/useLocale";
import { UserProfile } from "@/contexts/AuthContext";

import {
  CalendarIcon,
  ClockIcon,
  LocationIcon,
  UsersIcon,
  TeacherIcon,
  EditIcon,
  DeleteIcon,
} from "@/components/common/Icons";

interface CourseCardProps {
  course: Course;
  user: UserProfile;
  onEdit: (course: Course) => void;
  onDelete: (courseId: string) => void;
  onView?: (course: Course) => void;
}

export default function CourseCard({
  course,
  user,
  onEdit,
  onDelete,
  onView,
}: CourseCardProps) {
  const { t } = useLocale();

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
    return days[dayOfWeek] || "";
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "badge-success";
      case "archived":
        return "badge-neutral";
      case "draft":
        return "badge-warning";
      default:
        return "badge-ghost";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return t.course.statusActive;
      case "archived":
        return t.course.statusArchived;
      case "draft":
        return t.course.statusDraft;
      default:
        return status;
    }
  };

  return (
    <div className="card bg-base-100 shadow-md hover:shadow-2xl transition-all duration-300 border border-base-200 hover:border-primary/30">
      <div className="card-body p-6 gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="badge badge-primary badge-lg font-mono font-semibold px-4 py-3">
              {course.courseCode}
            </div>
            <div className={`badge ${getStatusBadgeClass(course.status)} py-3`}>
              {getStatusText(course.status)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user?.role === "teacher" &&
              String(course.teacherId) === String(user.id) && (
                <button
                  className="btn btn-warning btn-sm gap-1.5 shadow-sm"
                  onClick={() => onEdit(course)}
                >
                  <EditIcon />
                  <span className="hidden sm:inline">
                    {t.schedule.editSchedule}
                  </span>
                </button>
              )}
            {user?.role === "admin" && (
              <>
                <div
                  className="tooltip tooltip-bottom"
                  data-tip={t.course.edit}
                >
                  <button
                    className="btn btn-ghost btn-sm btn-circle hover:bg-warning/10"
                    onClick={() => onEdit(course)}
                  >
                    <EditIcon />
                  </button>
                </div>
                <div
                  className="tooltip tooltip-bottom"
                  data-tip={t.course.delete}
                >
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

        <h3
          className={`card-title text-xl font-bold text-base-content leading-tight ${onView ? "cursor-pointer hover:text-primary transition-colors" : ""}`}
          onClick={() => onView?.(course)}
        >
          {course.courseName}
        </h3>

        <div className="divider my-0"></div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-base-200/50">
            <div className="text-primary">
              <TeacherIcon />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-base-content/50 font-medium">
                ผู้สอน
              </span>
              <span className="text-sm font-medium text-base-content">
                {course.teacherName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-base-200/50">
            <div className="text-secondary">
              <CalendarIcon />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-base-content/50 font-medium">
                ภาคเรียน
              </span>
              <span className="text-sm font-medium text-base-content">
                {course.semester} / {course.academicYear}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-base-200/50">
            <div className="text-accent">
              <LocationIcon />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-base-content/50 font-medium">
                ห้องเรียน
              </span>
              <span className="text-sm font-medium text-base-content">
                {course.room}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-base-200/50">
            <div className="text-info">
              <UsersIcon />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-base-content/50 font-medium">
                {t.course.students}
              </span>
              <span className="text-sm font-medium text-base-content">
                {course.enrolledStudents.length} คน
              </span>
            </div>
          </div>
        </div>

        {course.schedule && course.schedule.length > 0 && (
          <div className="bg-linear-to-r from-primary/5 to-secondary/5 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-primary">
                <ClockIcon />
              </div>
              <span className="text-sm font-semibold text-base-content">
                ตารางเรียน
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {course.schedule.map((slot, idx) => (
                <div key={idx} className="badge badge-lg gap-2 py-3 px-4">
                  <span className="font-medium">
                    {getDayName(slot.dayOfWeek)}
                  </span>
                  <span className="text-base-content/60">
                    {slot.startTime} - {slot.endTime}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
