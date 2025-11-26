import mongoose, { Schema, Model } from 'mongoose';
import { Course as CourseInterface, CourseScheduleSlot, EnrolledStudent } from '@/types/course';

export interface CourseDocument extends mongoose.Document, Omit<CourseInterface, '_id'> {}

const courseScheduleSlotSchema = new Schema<CourseScheduleSlot>({
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
  room: {
    type: String,
    required: false,
  },
  graceMinutes: {
    type: Number,
    required: true,
    default: 30,
    min: 0,
  },
}, { _id: false });

const enrolledStudentSchema = new Schema<EnrolledStudent>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  enrolledAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, { _id: false });

const courseSchema = new Schema<CourseDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    courseCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    courseName: {
      type: String,
      required: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    teacherName: {
      type: String,
      required: true,
    },
    semester: {
      type: String,
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    room: {
      type: String,
      required: true,
    },
    schedule: {
      type: [courseScheduleSlotSchema],
      required: true,
      validate: {
        validator: function(v: CourseScheduleSlot[]) {
          return v.length > 0;
        },
        message: 'Course must have at least one schedule slot',
      },
    },
    enrolledStudents: {
      type: [enrolledStudentSchema],
      required: true,
      default: [],
    },
    description: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'draft'],
      required: true,
      default: 'active',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'courses',
  }
);

courseSchema.index({ semester: 1, academicYear: 1 });

const Course: Model<CourseDocument> =
  mongoose.models.Course || mongoose.model<CourseDocument>('Course', courseSchema);

export default Course;
