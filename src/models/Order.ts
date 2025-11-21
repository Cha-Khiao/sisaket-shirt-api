// src/models/Order.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  customerName: string;
  phone: string;
  address?: string;
  isShipping: boolean;
  totalPrice: number;
  status: string;
  items: Array<{
    type: string;
    size: string;
    quantity: number;
    price: number;
  }>;
  createdAt: Date;
}

const OrderSchema: Schema = new Schema({
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, default: '' },
  isShipping: { type: Boolean, default: false },
  totalPrice: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending_payment', 'verification', 'shipping', 'completed', 'cancelled'], 
    default: 'pending_payment' 
  },
  items: [{
    type: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }]
}, { timestamps: true });

export default mongoose.model<IOrder>('Order', OrderSchema);