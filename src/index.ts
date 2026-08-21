import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { v2 as cloudinary } from 'cloudinary';

import orderRoutes from './routes/orderRoutes';
import productRoutes from './routes/productRoutes';
import paymentRoutes from './routes/paymentRoutes';
import authRoutes from './routes/authRoutes';

const app = express();
const PORT = process.env.PORT || 8000;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI as string)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

app.get('/', (req, res) => {
  res.send('Sisaket Charity API is Running!');
});

app.get('/health', (req, res) => {
  res.send('ok');
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/payment', paymentRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

export default app;