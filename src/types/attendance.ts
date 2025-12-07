import { Types } from 'mongoose';

export interface AttendanceRecord {
  _id?: Types.ObjectId;
  id: string;

  sessionId: Types.ObjectId;
  courseId: Types.ObjectId;
  studentId: Types.ObjectId;

  studentName: string;
  studentNumber?: string;

  status: 'present' | 'late' | 'absent' | 'leave';

  checkInTime?: Date;
  checkInMethod: 'face_recognition' | 'manual';
  confidence?: number;

  checkOutTime?: Date;

  adjustedBy?: Types.ObjectId;
  adjustedAt?: Date;
  adjustmentNote?: string;
  originalStatus?: string;

  detectionCount: number;
  lastDetectedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface RecordAttendanceRequest {
  studentId: string;
  sessionId: string;
  timestamp: Date;
  confidence: number;
  method: 'face_recognition' | 'manual';
}

export interface AdjustAttendanceRequest {
  status: 'present' | 'late' | 'absent' | 'leave';
  note?: string;
}

export interface AttendanceQuery {
  sessionId?: string;
  courseId?: string;
  studentId?: string;
  status?: 'present' | 'late' | 'absent' | 'leave';
  startDate?: string;
  endDate?: string;
  limit?: number;
  skip?: number;
}

export interface PersonAttendanceSummary {
  personId: string;
  personName: string;
  totalRecords: number;
  firstSeen?: Date;
  lastSeen?: Date;
  averageConfidence: number;
  attendanceRate?: number;
}

export interface DailyAttendanceStats {
  date: string;
  totalAttendance: number;
  uniquePersons: number;
  averageConfidence: number;
  byMethod: {
    face_recognition: number;
    manual: number;
  };
}


export interface AttendanceReport {
  period: {
    start: Date;
    end: Date;
  };
  totalSessions: number;
  totalAttendance: number;
  uniquePersons: number;
  averageAttendancePerSession: number;
  topAttendees: Array<{
    personId: string;
    personName: string;
    count: number;
    rate: number;
  }>;
  absentees: Array<{
    personId: string;
    personName: string;
    missedSessions: number;
  }>;
}
