import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username?: string;
  phone?: string;
  email?: string;
  password?: string;
  name: string;
  address?: string;
  addressData?: {
    houseNo?: string;
    province?: string;
    district?: string;
    subdistrict?: string;
    zipcode?: string;
  };
  profileImage?: string;
  role: 'admin' | 'user';
}

const UserSchema: Schema = new Schema({
  username: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  name: { type: String, default: 'Member' },
  address: { type: String, default: '' },
  addressData: {
    houseNo: { type: String, default: '' },
    province: { type: String, default: '' },
    district: { type: String, default: '' },
    subdistrict: { type: String, default: '' },
    zipcode: { type: String, default: '' },
  },
  profileImage: { type: String, default: '' },
  role: { type: String, enum: ['admin', 'user'], default: 'user' }
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
