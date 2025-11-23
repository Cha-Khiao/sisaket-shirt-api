import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username?: string;
  phone?: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
}

const UserSchema: Schema = new Schema({
  username: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  name: { type: String, default: 'Member' },
  role: { type: String, enum: ['admin', 'user'], default: 'user' }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);