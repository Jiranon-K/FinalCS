import mongoose, { Schema, Model } from 'mongoose';
import type { Student as IStudent } from '@/types/student';

export interface StudentDocument extends Omit<IStudent, '_id' | 'userId'>, mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
}

const studentSchema = new Schema<StudentDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    name: {
      type: String,
      required: true,
      index: true,
    },
    studentId: {
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
    grade: {
      type: String,
    },
    class: {
      type: String,
    },
    imageUrl: {
      type: String,
      required: false,
    },
    imageKey: {
      type: String,
      required: false,
    },

    faceDescriptor: {
      type: [Number],
      required: false,
      default: undefined,
      validate: {
        validator: function (v: number[] | undefined | null) {
          if (v === undefined || v === null || (Array.isArray(v) && v.length === 0)) {
            return true;
          }
          return Array.isArray(v) && v.length === 128;
        },
        message: 'Face descriptor must be exactly 128 numbers',
      },
    },

    faceDescriptors: {
      type: [[Number]],
      required: false,
      default: undefined,
      validate: {
        validator: function (v: number[][] | undefined | null) {
          if (!v) return true;
          return Array.isArray(v) && v.every(arr => Array.isArray(arr) && arr.length === 128);
        },
        message: 'Each face descriptor must be exactly 128 numbers',
      },
    },
  },
  {
    timestamps: true,
    collection: 'students',
  }
);

const Student: Model<StudentDocument> =
  mongoose.models.Student || mongoose.model<StudentDocument>('Student', studentSchema);

export default Student;
