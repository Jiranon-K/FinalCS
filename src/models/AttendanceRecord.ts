import mongoose, { Schema, Model } from 'mongoose';
import { AttendanceRecord as AttendanceRecordInterface } from '@/types/attendance';

export interface AttendanceRecordDocument extends mongoose.Document, Omit<AttendanceRecordInterface, '_id'> {}

const attendanceRecordSchema = new Schema<AttendanceRecordDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: true,
      index: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    studentNumber: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ['present', 'absent'],
      required: true,
      default: 'absent',
      index: true,
    },
    checkInTime: {
      type: Date,
      required: false,
    },
    checkInMethod: {
      type: String,
      enum: ['face_recognition', 'manual'],
      required: true,
      default: 'face_recognition',
    },
    confidence: {
      type: Number,
      required: false,
      min: 0,
      max: 1,
    },
    checkOutTime: {
      type: Date,
      required: false,
    },
    adjustedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    adjustedAt: {
      type: Date,
      required: false,
    },
    adjustmentNote: {
      type: String,
      required: false,
    },
    originalStatus: {
      type: String,
      required: false,
    },
    detectionCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lastDetectedAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
    collection: 'attendance_records',
  }
);

attendanceRecordSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

const AttendanceRecord: Model<AttendanceRecordDocument> =
  mongoose.models.AttendanceRecord ||
  mongoose.model<AttendanceRecordDocument>('AttendanceRecord', attendanceRecordSchema);

export default AttendanceRecord;
