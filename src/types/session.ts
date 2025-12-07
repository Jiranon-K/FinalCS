import { Types } from 'mongoose';

export interface SessionStats {
  expectedCount: number;
  presentCount: number;

  lateCount: number;
  absentCount: number;
  leaveCount: number;
}

export interface AttendanceSession {
  _id?: Types.ObjectId;
  id: string;

  courseId: Types.ObjectId;
  courseName: string;
  courseCode: string;

  sessionDate: Date;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  graceMinutes: number;

  status: 'active' | 'closed' | 'cancelled';
  openedAt?: Date;
  closedAt?: Date;
  openedBy: Types.ObjectId;

  room: string;

  stats: SessionStats;

  createdAt: Date;
  updatedAt: Date;
}

export interface OpenSessionRequest {
  courseId: string;
  sessionDate: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
}

export interface SessionQuery {
  courseId?: string;
  status?: 'active' | 'closed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  limit?: number;
  skip?: number;
}
