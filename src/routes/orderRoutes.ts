// src/routes/orderRoutes.ts
import express, { Request, Response } from 'express';
import Order from '../models/Order';

const router = express.Router();

// 1. สร้างออร์เดอร์ใหม่ (POST /api/orders)
router.post('/', async (req: Request, res: Response) => {
  try {
    const newOrder = new Order(req.body);
    const savedOrder = await newOrder.save();
    console.log('✅ New Order Created:', savedOrder._id);
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// 2. ดึงออร์เดอร์ทั้งหมด (GET /api/orders) - สำหรับ Admin
router.get('/', async (req: Request, res: Response) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// 3. ดึงออร์เดอร์ตามเบอร์โทร (GET /api/orders/my-orders?phone=xxx) - สำหรับ User
router.get('/my-orders', async (req: Request, res: Response) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    const orders = await Order.find({ phone: phone }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user orders' });
  }
});

export default router;