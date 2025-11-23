export interface AttendanceRecord {
  _id?: string;
  id: string;
  personId: string;
  personName: string;
  timestamp: Date;
  confidence: number;
  imageUrl?: string;
  sessionId?: string;
  metadata?: AttendanceMetadata;
  createdAt: Date;
}

export interface AttendanceMetadata {
  className?: string;
  subject?: string;
  room?: string;
  teacher?: string;
  location?: string;
  method: 'face_recognition' | 'manual';
  [key: string]: unknown;
}

export interface CreateAttendanceRequest {
  personId: string;
  personName: string;
  confidence: number;
  imageUrl?: string;
  sessionId?: string;
  metadata?: AttendanceMetadata;
}

export interface AttendanceQuery {
  personId?: string;
  sessionId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  minConfidence?: number;
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

export interface AttendanceSession {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  expectedCount?: number;
  actualCount: number;
  status: 'active' | 'completed' | 'cancelled';
  metadata?: {
    className?: string;
    subject?: string;
    teacher?: string;
    [key: string]: unknown;
  };
  createdAt: Date;
  updatedAt: Date;
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
