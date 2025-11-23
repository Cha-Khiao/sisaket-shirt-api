import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = express.Router();

router.post('/login', async (req: any, res: any) => {
  try {
    const { identifier, password, isUserLogin } = req.body;

    let user;

    if (isUserLogin === "true" || isUserLogin === true) {
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
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ error: 'รหัสผ่านไม่ถูกต้อง' }); 
        }
      }
    } 
    
    else {
      user = await User.findOne({ username: identifier, role: 'admin' });
      if (!user) {
        return res.status(404).json({ error: 'ไม่พบชื่อผู้ใช้งาน (Admin)' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
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