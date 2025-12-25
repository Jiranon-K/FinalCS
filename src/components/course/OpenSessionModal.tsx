'use client';

import { useState, useMemo } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { useToast } from '@/hooks/useToast';
import { Course, CourseScheduleSlot } from '@/types/course';
import { OpenSessionRequest, AttendanceSession } from '@/types/session';

interface OpenSessionModalProps {
  isOpen: boolean;
  course: Course;
  onClose: () => void;
  onSuccess: () => void;
  existingSessions?: AttendanceSession[];
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

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
  </svg>
);

export default function OpenSessionModal({
  isOpen,
  course,
  onClose,
  onSuccess,
  existingSessions = [],
}: OpenSessionModalProps) {
  const { t } = useLocale();
  const { showToast } = useToast();

  const [sessionDate, setSessionDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
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

  const sessionsOnSelectedDate = useMemo(() => {
    return existingSessions.filter(s => {
      const sessionDateStr = new Date(s.sessionDate).toDateString();
      const selectedDateStr = new Date(sessionDate).toDateString();
      return sessionDateStr === selectedDateStr;
    });
  }, [existingSessions, sessionDate]);

  const getSessionForSlot = (slot: CourseScheduleSlot) => {
    return sessionsOnSelectedDate.find(s => s.startTime === slot.startTime);
  };



  const isSelectedSlotAvailable = useMemo(() => {
    if (!selectedSlot) return false;
    
    // Check if slot is already occupied by an ACTIVE session
    const session = getSessionForSlot(selectedSlot);
    if (session?.status === 'active') return false;
    
    // If session is closed, we CAN open it again (re-open)
    
    const now = new Date();
    const [startHour, startMinute] = selectedSlot.startTime.split(':').map(Number);
    const [endHour, endMinute] = selectedSlot.endTime.split(':').map(Number);
    
    const slotStart = new Date(sessionDate);
    slotStart.setHours(startHour, startMinute, 0, 0);
    
    const slotEnd = new Date(sessionDate);
    slotEnd.setHours(endHour, endMinute, 0, 0);

    if (now < slotStart) return false;
    if (now > slotEnd) return false;

    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlot, sessionsOnSelectedDate, sessionDate]);

  const resetForm = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSessionDate(`${year}-${month}-${day}`);
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

    const session = getSessionForSlot(selectedSlot);
    if (session?.status === 'active') {
      showToast({ 
        message: t.attendanceManagement.sessionAlreadyExists || 'Session already exists for this time slot', 
        type: 'error' 
      });
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
        credentials: 'include',
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
      <div className="modal-box w-11/12 max-w-md [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl flex items-center gap-2">
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

        <div className="bg-base-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <CalendarIcon />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-base truncate">{course.courseName}</p>
              <p className="text-sm text-base-content/70">{course.courseCode}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-base-content/60">
                <UsersIcon />
                <span>{course.enrolledStudents.length} {t.course.students}</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="form-control">
            <label className="label pb-1">
              <span className="label-text font-medium">
                {t.attendanceManagement.sessionDate}
              </span>
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="input input-bordered w-full"
              required
              disabled={opening}
            />
          </div>

          <div className="form-control">
            <label className="label pb-1">
              <span className="label-text font-medium">
                {t.course.scheduleSlots}
              </span>
            </label>
            <div className="space-y-2">
              {course.schedule.map((slot, idx) => {
                const session = getSessionForSlot(slot);
                const isActive = session?.status === 'active';
                const isClosed = session?.status === 'closed';
                const isSelected = selectedSlot === slot;
                
                const now = new Date();
                const [startHour, startMinute] = slot.startTime.split(':').map(Number);
                const [endHour, endMinute] = slot.endTime.split(':').map(Number);
                
                const slotStart = new Date(sessionDate);
                slotStart.setHours(startHour, startMinute, 0, 0);
                
                const slotEnd = new Date(sessionDate);
                slotEnd.setHours(endHour, endMinute, 0, 0);

                let timeStatus: 'available' | 'early' | 'expired' = 'available';
                
                if (now < slotStart) {
                   timeStatus = 'early';
                } else if (now > slotEnd) {
                   timeStatus = 'expired';
                }

                // Disabled if active session exists OR time is invalid.
                // Closed sessions are NOT disabled.
                const isDisabled = opening || isActive || timeStatus !== 'available';

                return (
                  <label
                    key={idx}
                    className={`flex items-start sm:items-center gap-3 p-3 border-2 rounded-xl transition-all cursor-pointer
                      ${isDisabled 
                        ? 'border-base-300 bg-base-200/50 opacity-60 cursor-not-allowed' 
                        : isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-base-300 hover:border-primary/50 hover:bg-base-100'
                      }`}
                  >
                    <input
                      type="radio"
                      name="schedule-slot"
                      className="radio radio-primary radio-sm mt-1 sm:mt-0"
                      checked={isSelected}
                      onChange={() => !isDisabled && setSelectedSlot(slot)}
                      disabled={isDisabled}
                    />
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{getDayName(slot.dayOfWeek)}</span>
                        <div className="flex items-center gap-1 text-sm text-base-content/70">
                          <ClockIcon />
                          <span>{slot.startTime} - {slot.endTime}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {isActive && (
                            <span className="badge badge-success badge-sm gap-1">
                            <CheckCircleIcon />
                            {t.attendanceManagement.statusActive || 'Active'}
                            </span>
                        )}
                        {isClosed && (
                            <span className="badge badge-neutral badge-sm gap-1">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {(t.attendanceManagement as any).statusClosed || 'Closed'}
                            </span>
                        )}
                        {!isActive && !isClosed && timeStatus === 'early' && (
                            <span className="badge badge-warning badge-sm badge-outline text-[10px]">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {(t.attendanceManagement as any).tooEarly || 'Too Early'}
                            </span>
                        )}
                        {!isActive && !isClosed && timeStatus === 'expired' && (
                            <span className="badge badge-error badge-sm badge-outline text-[10px]">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {(t.attendanceManagement as any).expired || 'Expired'}
                            </span>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            
            {course.schedule.every(slot => {
                const session = getSessionForSlot(slot);
                return session?.status === 'active';
            }) && (
              <div className="alert alert-warning mt-3 py-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-sm">{t.attendanceManagement.allSlotsUsed || 'All time slots are already in use for this date'}</span>
              </div>
            )}
          </div>

          <details className="collapse collapse-arrow border border-base-300 rounded-xl">
            <summary className="collapse-title py-3 min-h-0 text-sm font-medium">
              {t.course.room} ({t.attendanceManagement.defaultRoom}: {course.room})
            </summary>
            <div className="collapse-content pt-0">
              <input
                type="text"
                value={customRoom}
                onChange={(e) => setCustomRoom(e.target.value)}
                className="input input-bordered input-sm w-full"
                placeholder={course.room}
                disabled={opening}
              />
            </div>
          </details>

          {(!isSelectedSlotAvailable && !opening && selectedSlot) && (
             <div className="alert alert-warning alert-soft shadow-sm mt-4 text-sm py-2">
               <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
               <span>{(t.attendanceManagement as any).sessionTimeTip || 'Sessions can only be opened during the scheduled time'}</span>
             </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-ghost flex-1"
              disabled={opening}
            >
              {t.common.cancel}
            </button>
            
            <button 
              type="submit" 
              className="btn btn-primary flex-1" 
              disabled={opening || !isSelectedSlotAvailable}
            >
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
      <div className="modal-backdrop bg-black/50" onClick={handleClose}></div>
    </div>
  );
}
