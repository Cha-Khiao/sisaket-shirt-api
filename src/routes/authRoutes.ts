import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import User from '../models/User';
import Order from '../models/Order';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

router.post('/login', async (req: any, res: any) => {
  try {
    const { identifier, password } = req.body;

    let user;

    const admin = await User.findOne({ username: identifier, role: 'admin' });

    if (admin) {
      const isMatch = await bcrypt.compare(password, admin.password!);
      if (!isMatch) {
        return res.status(400).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
      }
      user = admin;
    } else {
      if (!/^\d{10}$/.test(identifier)) {
        return res.status(400).json({ error: 'กรุณากรอกเบอร์โทรศัพท์ 10 หลัก' });
      }

      user = await User.findOne({ phone: identifier, role: 'user' });

      if (!user) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({
          phone: identifier,
          password: hashedPassword,
          name: identifier,
          role: 'user'
        });
        await user.save();
        console.log(`🆕 New User Created: ${identifier}`);
      } else {
        const isMatch = await bcrypt.compare(password, user.password!);
        if (!isMatch) {
          return res.status(400).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
        }
      }
    }

    const token = jwt.sign(
        { id: user._id, role: user.role, name: user.name },
        process.env.JWT_SECRET as string,
        { expiresIn: '1d' }
    );

    res.json({
      id: user._id,
      name: user.name,
      role: user.role,
      phone: user.phone,
      token: token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login Error' });
  }
});

router.post('/google-login', async (req: any, res: any) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ email, name: name || email, role: 'user' });
      await user.save();
      console.log(`🆕 Google User Created: ${email}`);
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    res.json({
      id: user._id,
      name: user.name,
      role: user.role,
      phone: user.phone || '',
      email: user.email,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Google Login Error' });
  }
});

router.get('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, address, addressData } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (addressData !== undefined) updateData.addressData = addressData;

    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'เบอร์โทรนี้มีผู้ใช้งานแล้ว' });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/profile/upload-image', authenticateToken, upload.single('image'), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'กรุณาเลือกรูปภาพ' });

    const result: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'sisaket-shirt/profiles', public_id: `user_${req.user.id}`, overwrite: true, resource_type: 'image', transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }] },
        (error, result) => error ? reject(error) : resolve(result)
      );
      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });

    const user = await User.findByIdAndUpdate(req.user.id, { profileImage: result.secure_url }, { new: true }).select('-password');
    res.json({ profileImage: result.secure_url, user });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({ error: 'อัปโหลดรูปไม่สำเร็จ' });
  }
});

router.delete('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'ไม่พบบัญชีผู้ใช้' });
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'ไม่สามารถลบบัญชีแอดมินได้' });
    }

    const pendingOrders = await Order.find({
      userId: req.user.id,
      status: 'pending_payment',
      isShipping: true
    });

    if (pendingOrders.length > 0) {
      return res.status(400).json({
        error: `คุณมีคำสั่งซื้อแบบจัดส่งที่ยังไม่ได้ชำระเงิน ${pendingOrders.length} รายการ กรุณาชำระเงินหรือติดต่อแอดมินก่อนลบบัญชี`
      });
    }

    await User.findByIdAndDelete(req.user.id);
    console.log(`🗑️ User Deleted: ${req.user.id}`);
    res.json({ message: 'ลบบัญชีสำเร็จ' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'ลบบัญชีไม่สำเร็จ' });
  }
});

router.post('/seed-admin', async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = new User({
            username, password: hashedPassword, name: 'Administrator', role: 'admin'
        });
        await admin.save();
        res.json({ message: 'Admin Created!', admin });
    } catch (error: any) { res.status(400).json({ error: error.message }); }
});

export default router;
