import mongoose, { Schema, Model } from 'mongoose';
import type { Teacher as ITeacher } from '@/types/teacher';

export interface TeacherDocument extends Omit<ITeacher, '_id'>, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

const teacherSchema = new Schema<TeacherDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      index: true,
    },
    teacherId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    email: {
      type: String,
      sparse: true,
      index: true,
    },
    phone: {
      type: String,
    },
    department: {
      type: String,
      index: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    imageKey: {
      type: String,
      required: true,
    },
    faceDescriptor: {
      type: [Number],
      validate: {
        validator: function (v: number[] | undefined) {
          return v === undefined || v === null || v.length === 128;
        },
        message: 'Face descriptor must be exactly 128 numbers',
      },
    },
  },
  {
    timestamps: true,
    collection: 'teachers',
  }
);

const Teacher: Model<TeacherDocument> =
  mongoose.models.Teacher || mongoose.model<TeacherDocument>('Teacher', teacherSchema);

export default Teacher;
