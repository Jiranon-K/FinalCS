import mongoose, { Schema, Model } from 'mongoose';

export interface UserDocument extends mongoose.Document {
  username: string;
  password?: string;
  fullName?: string;
  role: 'student' | 'teacher' | 'admin';
  studentId?: string;
  profileId?: mongoose.Types.ObjectId;
  imageUrl?: string;
  imageKey?: string;
}

const userSchema = new Schema<UserDocument>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      required: true,
    },
    studentId: {
      type: String,
      required: function(this: UserDocument) { return this.role === 'student'; },
      unique: true,
      sparse: true,
      index: true,
    },
    profileId: {
      type: Schema.Types.ObjectId,
      refPath: 'role',
    },
    imageUrl: {
      type: String,
      required: false,
    },
    imageKey: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

const User: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>('User', userSchema);

export default User;
