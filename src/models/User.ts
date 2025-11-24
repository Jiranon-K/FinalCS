import mongoose, { Schema, Model } from 'mongoose';

export interface UserDocument extends mongoose.Document {
  username: string;
  password?: string;
  role: 'student' | 'teacher' | 'admin';
  profileId?: mongoose.Types.ObjectId;
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
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      required: true,
    },
    profileId: {
      type: Schema.Types.ObjectId,
      refPath: 'role',
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
