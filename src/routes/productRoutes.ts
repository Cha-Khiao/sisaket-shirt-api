// src/routes/productRoutes.ts
import express, { Request, Response } from 'express';
import Product from '../models/Product'; // ✅ ใช้ Model ใหม่

const router = express.Router();

// 1. ดึงสินค้าทั้งหมด (GET /api/products)
// Frontend จะได้ทั้ง ชื่อ, ราคา, รูป และ Stock ของทุกไซส์ไปพร้อมกัน
router.get('/', async (req: Request, res: Response) => {
  try {
    // ดึงเฉพาะสินค้าที่เปิดขาย (isActive: true)
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// 2. สร้างสินค้าใหม่ + สต็อกเริ่มต้น (POST /api/products)
// ใช้สำหรับ Admin สร้างสินค้าครั้งแรก (Seed Data)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, type, description, price, imageUrl, stock } = req.body;

    // สร้างสินค้าใหม่
    const newProduct = new Product({
      name,
      type,
      description,
      price,
      imageUrl,
      stock, // รับ Array ของ { size, quantity } เข้ามาเลย
      isActive: true
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error: any) {
    console.error('Create Product Error:', error);
    res.status(400).json({ error: error.message || 'Failed to create product' });
  }
});

// 3. เติมสต็อกสินค้า (PATCH /api/products/:id/stock)
// ใช้เวลาโรงงานส่งของมาเพิ่ม แล้ว Admin มากรอกเติม
router.patch('/:id/stock', async (req: Request, res: Response) => {
  try {
    const { size, quantity } = req.body; // รับไซส์ และจำนวนที่จะ "เพิ่ม"
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // หาไซส์ที่จะเติม
    const variant = product.stock.find(s => s.size === size);
    
    if (variant) {
      // ถ้ามีไซส์นี้อยู่แล้ว ให้บวกเพิ่ม
      variant.quantity += quantity;
    } else {
      // ถ้าเป็นไซส์ใหม่ที่ไม่เคยมี ให้เพิ่มเข้าไปใน Array
      product.stock.push({ size, quantity, sold: 0 });
    }

    await product.save();
    res.json({ message: `Stock updated for ${product.name} (Size: ${size})`, product });

  } catch (error) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

export default router;