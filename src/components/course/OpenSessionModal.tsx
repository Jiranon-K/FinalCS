'use client';

import { useState } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import { Course, CourseScheduleSlot } from '@/types/course';
import { OpenSessionRequest } from '@/types/session';

interface OpenSessionModalProps {
  isOpen: boolean;
  course: Course;
  onClose: () => void;
  onSuccess: () => void;
}

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);

export default function OpenSessionModal({
  isOpen,
  course,
  onClose,
  onSuccess,
}: OpenSessionModalProps) {
  const { t } = useLocale();
  const { showToast } = useToast();

  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedSlot, setSelectedSlot] = useState<CourseScheduleSlot | null>(
    course.schedule[0] || null
  );
  const [customRoom, setCustomRoom] = useState('');
  const [opening, setOpening] = useState(false);

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

  const resetForm = () => {
    setSessionDate(new Date().toISOString().split('T')[0]);
    setSelectedSlot(course.schedule[0] || null);
    setCustomRoom('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSlot) {
      showToast({ message: t.course.scheduleRequired, type: 'error' });
      return;
    }

    try {
      setOpening(true);

      const requestData: OpenSessionRequest = {
        courseId: course._id?.toString() || course.id,
        sessionDate,
        dayOfWeek: selectedSlot.dayOfWeek,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        room: customRoom || course.room,
      };

      const response = await fetch('/api/attendance/sessions/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.success) {
        showToast({ message: t.attendanceManagement.openSessionSuccess, type: 'success' });
        resetForm();
        onSuccess();
        onClose();
      } else {
        throw new Error(result.error || t.attendanceManagement.openSessionError);
      }
    } catch (error) {
      console.error('Error opening session:', error);
      showToast({
        message: error instanceof Error ? error.message : t.attendanceManagement.openSessionError,
        type: 'error',
      });
    } finally {
      setOpening(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-2xl flex items-center gap-2">
            <CalendarIcon />
            {t.course.openSession}
          </h3>
          <button
            onClick={handleClose}
            className="btn btn-ghost btn-sm btn-circle"
            disabled={opening}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="alert alert-info mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <div className="text-sm">
            <p className="font-bold">{course.courseCode} - {course.courseName}</p>
            <p>{course.enrolledStudents.length} {t.course.students}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">
                {t.attendanceManagement.sessionDate} <span className="text-error">*</span>
              </span>
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="input input-bordered"
              required
              disabled={opening}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">
                {t.course.scheduleSlots} <span className="text-error">*</span>
              </span>
            </label>
            <div className="space-y-2">
              {course.schedule.map((slot, idx) => (
                <label
                  key={idx}
                  className="flex items-center gap-3 p-3 border border-base-300 rounded-lg hover:bg-base-200 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="schedule-slot"
                    className="radio radio-primary"
                    checked={selectedSlot === slot}
                    onChange={() => setSelectedSlot(slot)}
                    disabled={opening}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{getDayName(slot.dayOfWeek)}</span>
                      <span className="badge badge-sm">{slot.startTime} - {slot.endTime}</span>
                    </div>
                    <p className="text-sm text-base-content/60">
                      {t.course.graceMinutes}: {slot.graceMinutes} {t.attendanceManagement.minutes}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">{t.course.room}</span>
              <span className="label-text-alt text-base-content/60">
                {t.attendanceManagement.defaultRoom}: {course.room}
              </span>
            </label>
            <input
              type="text"
              value={customRoom}
              onChange={(e) => setCustomRoom(e.target.value)}
              className="input input-bordered"
              placeholder={course.room}
              disabled={opening}
            />
          </div>

          <div className="modal-action">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-ghost"
              disabled={opening}
            >
              {t.common.cancel}
            </button>
            <button type="submit" className="btn btn-primary" disabled={opening}>
              {opening ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  {t.attendanceManagement.opening}
                </>
              ) : (
                t.course.openSession
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  );
}
