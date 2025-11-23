import express, { Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import Order from '../models/Order';

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } 
});

router.post('/upload-slip', upload.single('slip'), async (req: any, res: any) => {
  try {
    const { orderId } = req.body;
    
    if (!req.file || !orderId) {
      return res.status(400).json({ error: 'กรุณาแนบรูปสลิปและระบุเลขคำสั่งซื้อ' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
    }

    const uploadToCloudinary = () => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'sisaket-charity/slips',
            public_id: `slip_${orderId}_${Date.now()}`,
            resource_type: 'image',
          },
          (error, result) => {
            if (error) {
              console.error("🔥 Cloudinary Upload Error:", error); 
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });
    };

    const result: any = await uploadToCloudinary();

    order.status = 'verification';
    order.paymentProofUrl = result.secure_url; 
    
    await order.save();

    console.log(`✅ Slip uploaded for Order ${orderId}`);
    
    res.json({ 
      message: 'แจ้งชำระเงินสำเร็จ', 
      imageUrl: result.secure_url,
      order: order
    });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปโหลดสลิป' });
  }
});

export default router;