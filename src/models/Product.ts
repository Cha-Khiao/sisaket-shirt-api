import mongoose, { Schema, Document } from 'mongoose';

interface IProductVariant {
  size: string;     
  quantity: number; 
  sold: number;      
}

export interface IProduct extends Document {
  name: string;        
  type: 'normal' | 'mourning'; 
  description?: string;  
  price: number; 
  imageUrl: string;  
  stock: IProductVariant[]; 
  isActive: boolean;     
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  imageUrl: { type: String, required: true }, 
  isActive: { type: Boolean, default: true },
  
  stock: [{
    size: { type: String, required: true },
    quantity: { type: Number, required: true, default: 0 },
    sold: { type: Number, default: 0 }
  }]
}, { timestamps: true });

export default mongoose.model<IProduct>('Product', ProductSchema);