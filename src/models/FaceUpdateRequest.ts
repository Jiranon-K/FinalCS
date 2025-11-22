import mongoose, { Schema, Model } from 'mongoose';

export interface FaceUpdateRequestDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  requestType: 'initial' | 'update';
  status: 'pending' | 'approved' | 'rejected';
  newFaceDescriptor: number[];
  newImageUrl: string;
  newImageKey: string;
  oldImageUrl?: string;
  oldImageKey?: string;
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const faceUpdateRequestSchema = new Schema<FaceUpdateRequestDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    requestType: {
      type: String,
      enum: ['initial', 'update'],
      default: 'update',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    newFaceDescriptor: {
      type: [Number],
      required: true,
      validate: {
        validator: (v: number[]) => v.length === 128,
        message: 'Face descriptor must be exactly 128 numbers',
      },
    },
    newImageUrl: { type: String, required: true },
    newImageKey: { type: String, required: true },
    oldImageUrl: String,
    oldImageKey: String,
    requestedAt: { type: Date, default: Date.now },
    reviewedAt: Date,
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: String,
  },
  {
    timestamps: true,
    collection: 'face_update_requests',
  }
);

faceUpdateRequestSchema.index({ userId: 1, status: 1 });

const FaceUpdateRequest: Model<FaceUpdateRequestDocument> =
  mongoose.models.FaceUpdateRequest ||
  mongoose.model<FaceUpdateRequestDocument>('FaceUpdateRequest', faceUpdateRequestSchema);

export default FaceUpdateRequest;
