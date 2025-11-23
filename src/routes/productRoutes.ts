import express, { Request, Response } from 'express';
import Product from '../models/Product';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const uploadToCloudinary = (buffer: Buffer) => {
  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'sisaket-charity/products' },
      (error, result) => {
        if (error) {
            console.error("Cloudinary Upload Error:", error);
            return reject(error);
        }
        resolve(result!.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// 1. ดึงสินค้าทั้งหมด
router.get('/', async (req, res) => {
  try {
    const isAdmin = req.query.admin === 'true';
    const filter = isAdmin ? {} : { isActive: true };
    
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// 2. สร้างสินค้าใหม่
router.post('/', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    console.log("📥 [POST Product] Body:", req.body); 

    const { name, type, description, price, stock } = req.body;
    let imageUrl = '';

    if (req.file) {
      console.log("🚀 Uploading image...");
      imageUrl = await uploadToCloudinary(req.file.buffer);
      console.log("✅ Image Uploaded:", imageUrl);
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    }

    let parsedStock = [];
    try {
      parsedStock = typeof stock === 'string' ? JSON.parse(stock) : stock;
    } catch (e) {
      console.error("❌ Stock Parse Error:", e);
      parsedStock = Array.isArray(stock) ? stock : [];
    }

    const newProduct = new Product({
      name,
      type,
      description,
      price: Number(price),
      imageUrl,
      stock: parsedStock,
      isActive: true
    });

    const savedProduct = await newProduct.save();
    console.log("🎉 Product Created:", savedProduct._id);
    
    res.status(201).json(savedProduct);

  } catch (error: any) {
    console.error("🔥 Create Product Error:", error);
    res.status(400).json({ error: error.message || 'Failed to create product' });
  }
});

// 3. แก้ไขสินค้า
router.put('/:id', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, isActive } = req.body;
    
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = Number(price);
    if (isActive !== undefined) {
        product.isActive = String(isActive) === 'true';
    }

    if (req.file) {
      const newImageUrl = await uploadToCloudinary(req.file.buffer);
      product.imageUrl = newImageUrl;
    }

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// 4. จัดการสต็อก
router.patch('/:id/stock', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { size, quantity, mode } = req.body;
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const variant = product.stock.find(s => s.size === size);
    const qty = Number(quantity);

    if (variant) {
      if (mode === 'set') {
        variant.quantity = qty;
      } else {
        variant.quantity += qty;
      }
    } else {
      product.stock.push({ size, quantity: qty, sold: 0 });
    }

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// 5. ลบสินค้า
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete' });
    }
});

export default router;