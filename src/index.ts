// src/index.ts
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import orderRoutes from './routes/orderRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors()); // อนุญาตให้ Frontend เรียกใช้ได้
app.use(express.json()); // อ่าน JSON Body ได้

// Database Connection
mongoose.connect(process.env.MONGO_URI as string)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.get('/', (req, res) => {
  res.send('Sisaket Charity API is Running!');
});

// Mount Routes
app.use('/api/orders', orderRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});