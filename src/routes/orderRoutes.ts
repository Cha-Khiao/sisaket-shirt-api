import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order';
import Product from '../models/Product';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 1. สร้างออร์เดอร์ใหม่
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { customerName, phone, address, isShipping, items } = req.body;
    let calculatedTotalPrice = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) throw new Error(`ไม่พบสินค้า ID: ${item.productId}`);
      
      const variant = product.stock.find(s => s.size === item.size);
      if (!variant) throw new Error(`สินค้า ${product.name} ไม่มีไซส์ ${item.size}`);
      if (variant.quantity < item.quantity) throw new Error(`สินค้า ${product.name} ไซส์ ${item.size} เหลือไม่พอ`);
      
      variant.quantity -= item.quantity;
      variant.sold = (variant.sold || 0) + item.quantity;
      await product.save({ session });

      calculatedTotalPrice += product.price * item.quantity;
      orderItems.push({
        productId: product._id,
        productName: product.name,
        size: item.size,
        quantity: item.quantity,
        price: product.price,
        imageUrl: product.imageUrl
      });
    }

    const shippingCost = isShipping ? 50 : 0;
    calculatedTotalPrice += shippingCost;

    const newOrder = new Order({
      userId: req.user.id,
      customerName, phone, address, isShipping,
      status: 'pending_payment',
      items: orderItems,
      totalPrice: calculatedTotalPrice
    });

    const savedOrder = await newOrder.save({ session });
    await session.commitTransaction();
    session.endSession();
    
    console.log("✅ Order Created:", savedOrder._id);
    res.status(201).json(savedOrder);

  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: error.message });
  }
});

// 2. ดึงออร์เดอร์ทั้งหมด
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        let filter = {};
        if (req.user.role !== 'admin') {
            filter = { userId: req.user.id };
        }
        const orders = await Order.find(filter).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// 3. ดึงออร์เดอร์รายตัว
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
    console.log("🔍 Fetching Order ID:", req.params.id); 

    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
             console.log("❌ Invalid ID Format");
             return res.status(404).json({ error: 'Invalid Order ID' });
        }

        const order = await Order.findById(id);

        if (!order) {
            console.log("❌ Order Not Found in DB");
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        console.error("Error fetching order details:", error);
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
});

// 4. อัปเดตสถานะ
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;