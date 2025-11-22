import { AttendanceSession } from '@/types/session';


export function findMatchingActiveSession(
  activeSessions: AttendanceSession[],
  now: Date,
  studentEnrolledCourseIds: string[]
): AttendanceSession | null {
  const dayOfWeek = now.getDay();
  const currentTime = now.toTimeString().slice(0, 5);

  return (
    activeSessions.find((session) => {
      if (!studentEnrolledCourseIds.includes(session.courseId.toString())) {
        return false;
      }

      if (session.dayOfWeek !== dayOfWeek) {
        return false;
      }

      return currentTime >= session.startTime && currentTime <= session.endTime;
    }) || null
  );
}

export function canRecordAttendance(
  studentId: string,
  sessionId: string,
  lastDetectionMap: Map<string, { time: Date; sessionId: string }>,
  now: Date
): boolean {
  const lastDetection = lastDetectionMap.get(studentId);

  if (!lastDetection) {
    return true;
  }

  const minutesSinceLastDetection =
    (now.getTime() - lastDetection.time.getTime()) / 60000;

  return (
    minutesSinceLastDetection >= 5 ||
    lastDetection.sessionId !== sessionId
  );
}

export function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function parseTime(timeString: string): { hour: number; minute: number } {
  const [hour, minute] = timeString.split(':').map(Number);
  return { hour, minute };
}

export function isWithinTimeRange(
  currentTime: string,
  startTime: string,
  endTime: string
): boolean {
  return currentTime >= startTime && currentTime <= endTime;
}

export function isSessionExpired(session: AttendanceSession): boolean {
  const now = new Date();
  const sessionDate = new Date(session.sessionDate);

  const [endHour, endMinute] = session.endTime.split(':').map(Number);

  const expiration = new Date(
    sessionDate.getFullYear(),
    sessionDate.getMonth(),
    sessionDate.getDate(),
    endHour,
    endMinute,
    0,
    0
  );

  return now > expiration;
}
