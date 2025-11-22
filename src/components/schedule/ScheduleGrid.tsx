'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Course, CourseScheduleSlot } from '@/types/course';
import { useLocale } from '@/hooks/useLocale';
import { useAuth } from '@/contexts/AuthContext';
import CourseDetailModal from './CourseDetailModal';

interface ScheduleGridProps {
  courses: Course[];
  onCourseClick?: (course: Course) => void;
}

interface ScheduleBlock {
  course: Course;
  slot: CourseScheduleSlot;
  color: string;
}

const COURSE_COLORS = [
  'bg-primary border-primary text-primary-content',
  'bg-secondary border-secondary text-secondary-content',
  'bg-accent border-accent text-accent-content',
  'bg-info border-info text-info-content',
  'bg-success border-success text-success-content',
  'bg-warning border-warning text-warning-content',
  'bg-error border-error text-error-content',
  'bg-purple-500 border-purple-600 text-white',
  'bg-pink-500 border-pink-600 text-white',
  'bg-indigo-500 border-indigo-600 text-white',
  'bg-teal-500 border-teal-600 text-white',
  'bg-orange-500 border-orange-600 text-white',
  'bg-cyan-500 border-cyan-600 text-white',
  'bg-rose-500 border-rose-600 text-white',
  'bg-emerald-500 border-emerald-600 text-white',
  'bg-violet-500 border-violet-600 text-white',
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function getCourseColor(courseCode: string): string {
  const index = hashCode(courseCode) % COURSE_COLORS.length;
  return COURSE_COLORS[index];
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTimeSlot(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export default function ScheduleGrid({ courses }: ScheduleGridProps) {
  const { t } = useLocale();
  const { user } = useAuth();
  const router = useRouter();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<CourseScheduleSlot | null>(null);

  const handleEditSchedule = (course: Course) => {
    router.push(`/schedule/${course.id}/edit`);
  };

  const dayNames = useMemo(() => [
    { short: t.schedule.monday?.slice(0, 3) || 'Mon', full: t.schedule.monday },
    { short: t.schedule.tuesday?.slice(0, 3) || 'Tue', full: t.schedule.tuesday },
    { short: t.schedule.wednesday?.slice(0, 3) || 'Wed', full: t.schedule.wednesday },
    { short: t.schedule.thursday?.slice(0, 3) || 'Thu', full: t.schedule.thursday },
    { short: t.schedule.friday?.slice(0, 3) || 'Fri', full: t.schedule.friday },
    { short: t.schedule.saturday?.slice(0, 3) || 'Sat', full: t.schedule.saturday },
    { short: t.schedule.sunday?.slice(0, 3) || 'Sun', full: t.schedule.sunday },
  ], [t]);

  const { timeSlots, scheduleMap, minTime, maxTime } = useMemo(() => {
    let min = 8 * 60;
    let max = 18 * 60;
    const map: Record<string, ScheduleBlock[]> = {};

    courses.forEach(course => {
      course.schedule?.forEach(slot => {
        const startMinutes = parseTime(slot.startTime);
        const endMinutes = parseTime(slot.endTime);
        
        min = Math.min(min, Math.floor(startMinutes / 60) * 60);
        max = Math.max(max, Math.ceil(endMinutes / 60) * 60);

        const dayIndex = slot.dayOfWeek === 0 ? 6 : slot.dayOfWeek - 1;
        const key = `${dayIndex}`;
        
        if (!map[key]) {
          map[key] = [];
        }
        
        map[key].push({
          course,
          slot,
          color: getCourseColor(course.courseCode),
        });
      });
    });

    const slots: string[] = [];
    for (let time = min; time < max; time += 60) {
      slots.push(formatTimeSlot(time));
    }

    return { timeSlots: slots, scheduleMap: map, minTime: min, maxTime: max };
  }, [courses]);

  const handleBlockClick = (course: Course, slot: CourseScheduleSlot) => {
    setSelectedCourse(course);
    setSelectedSlot(slot);
  };

  const getBlocksForDay = (dayIndex: number) => {
    return scheduleMap[`${dayIndex}`] || [];
  };

  const calculateBlockStyle = (slot: CourseScheduleSlot) => {
    const startMinutes = parseTime(slot.startTime);
    const endMinutes = parseTime(slot.endTime);
    const totalMinutes = maxTime - minTime;
    
    const top = ((startMinutes - minTime) / totalMinutes) * 100;
    const height = ((endMinutes - startMinutes) / totalMinutes) * 100;
    
    return {
      top: `${top}%`,
      height: `${height}%`,
    };
  };

  if (courses.length === 0) {
    return (
      <div className="w-full bg-base-200/30 rounded-2xl p-4 lg:p-6">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-2">
          <div></div>
          {dayNames.map((day, index) => (
            <div key={index} className="text-center py-3 bg-base-100 rounded-xl font-medium text-sm shadow-sm">
              <span className="hidden md:inline">{day.full}</span>
              <span className="md:hidden">{day.short}</span>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-2 mt-2" style={{ minHeight: '500px' }}>
          <div className="flex flex-col">
            {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map((time, index) => (
              <div key={index} className="flex-1 flex items-start justify-end pr-3 text-xs text-base-content/50 pt-1">
                {time}
              </div>
            ))}
          </div>
          
          {dayNames.map((_, dayIndex) => (
            <div key={dayIndex} className="bg-base-100/50 rounded-xl border border-dashed border-base-300 relative min-h-[500px]">
              {dayIndex === 3 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mx-auto text-base-content/20 mb-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                    <p className="text-base-content/40 text-sm font-medium">{t.schedule.noSchedule}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full bg-base-200/30 rounded-2xl p-4 lg:p-6">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-2">
          <div className="text-center py-3 text-xs font-medium text-base-content/60">
            {t.schedule.time}
          </div>
          {dayNames.map((day, index) => (
            <div key={index} className="text-center py-3 bg-base-100 rounded-xl font-semibold text-sm shadow-sm">
              <span className="hidden md:inline">{day.full}</span>
              <span className="md:hidden">{day.short}</span>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-2 mt-2 relative" style={{ height: `${Math.max(timeSlots.length * 70, 500)}px` }}>
          <div className="relative">
            {timeSlots.map((time, index) => (
              <div 
                key={index} 
                className="absolute w-full text-right pr-3 text-xs text-base-content/50 -translate-y-1/2 font-medium"
                style={{ top: `${(index / timeSlots.length) * 100}%` }}
              >
                {time}
              </div>
            ))}
          </div>
          
          {dayNames.map((_, dayIndex) => (
            <div key={dayIndex} className="bg-base-100/50 rounded-xl border border-base-200 relative">
              {timeSlots.map((_, slotIndex) => (
                <div 
                  key={slotIndex}
                  className="absolute w-full border-t border-base-200/50"
                  style={{ top: `${(slotIndex / timeSlots.length) * 100}%` }}
                />
              ))}
              
              {getBlocksForDay(dayIndex).map((block, blockIndex) => {
                const style = calculateBlockStyle(block.slot);
                return (
                  <button
                    key={blockIndex}
                    className={`absolute left-1 right-1 rounded-xl border-l-4 p-2 lg:p-3 cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:brightness-110 transition-all overflow-hidden shadow-md ${block.color}`}
                    style={style}
                    onClick={() => handleBlockClick(block.course, block.slot)}
                  >
                    <div className="text-sm font-bold truncate drop-shadow-sm">{block.course.courseCode}</div>
                    <div className="text-xs truncate opacity-90 mt-0.5 font-medium">{block.course.courseName}</div>
                    <div className="text-xs opacity-80 mt-1 font-semibold">
                      {block.slot.startTime} - {block.slot.endTime}
                    </div>
                    {(block.slot.room || block.course.room) && (
                      <div className="text-xs opacity-80 flex items-center gap-1 mt-0.5 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                        {block.slot.room || block.course.room}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <CourseDetailModal
        isOpen={!!selectedCourse}
        course={selectedCourse}
        slot={selectedSlot}
        onClose={() => {
          setSelectedCourse(null);
          setSelectedSlot(null);
        }}
        user={user}
        onEditSchedule={handleEditSchedule}
      />
    </>
  );
}
