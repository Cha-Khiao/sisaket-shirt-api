import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  customerName: string;
  phone: string;
  address?: string;
  isShipping: boolean;
  totalPrice: number;
  paymentProofUrl?: string; 
  status: 'pending_payment' | 'verification' | 'shipping' | 'completed' | 'cancelled';
  items: Array<{
    productId: mongoose.Types.ObjectId; 
    productName: string;
    size: string;
    quantity: number;
    price: number;
    imageUrl?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema({
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, default: '' },
  isShipping: { type: Boolean, default: false },
  totalPrice: { type: Number, required: true },
  
  paymentProofUrl: { type: String, default: null },

  status: { 
    type: String, 
    enum: ['pending_payment', 'verification', 'shipping', 'completed', 'cancelled'], 
    default: 'pending_payment' 
  },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true }, 
    productName: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String }
  }]
}, { timestamps: true });

export default mongoose.model<IOrder>('Order', OrderSchema);