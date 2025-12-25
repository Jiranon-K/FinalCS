import mongoose, { Schema, Model } from 'mongoose';
import { AttendanceSession as AttendanceSessionInterface, SessionStats } from '@/types/session';

export interface AttendanceSessionDocument extends mongoose.Document, Omit<AttendanceSessionInterface, '_id'> {}

const sessionStatsSchema = new Schema<SessionStats>({
  expectedCount: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  presentCount: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  absentCount: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
}, { _id: false });

const attendanceSessionSchema = new Schema<AttendanceSessionDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    courseName: {
      type: String,
      required: true,
    },
    courseCode: {
      type: String,
      required: true,
    },
    sessionDate: {
      type: Date,
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    graceMinutes: {
      type: Number,
      required: true,
      default: 30,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'cancelled'],
      required: true,
      default: 'active',
      index: true,
    },
    openedAt: {
      type: Date,
      required: false,
    },
    closedAt: {
      type: Date,
      required: false,
    },
    openedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    room: {
      type: String,
      required: true,
    },
    stats: {
      type: sessionStatsSchema,
      required: true,
      default: () => ({
        expectedCount: 0,
        presentCount: 0,
        normalCount: 0,
        lateCount: 0,
        absentCount: 0,
        leaveCount: 0,
      }),
    },
  },
  {
    timestamps: true,
    collection: 'attendance_sessions',
  }
);

attendanceSessionSchema.index({ courseId: 1, sessionDate: 1, startTime: 1 }, { unique: true });

const AttendanceSession: Model<AttendanceSessionDocument> =
  mongoose.models.AttendanceSession ||
  mongoose.model<AttendanceSessionDocument>('AttendanceSession', attendanceSessionSchema);

export default AttendanceSession;
