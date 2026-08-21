# Sisaket Shirt API

API สำหรับระบบจัดการคำสั่งซื้อเสื้อการกุศลศรีสะเกษ รองรับการจัดการสินค้า คำสั่งซื้อ การชำระเงิน และระบบ Authentication

## 🛠 Technology Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (JSON Web Token)
- **File Upload**: Multer + Cloudinary
- **Password Hashing**: bcryptjs

## 📋 Features

### Authentication & Authorization
- ระบบ Login สำหรับ Admin และ User
- Auto-register สำหรับ User ใหม่ (ใช้เบอร์โทรศัพท์ 10 หลักเท่านั้น)
- Google OAuth Login
- JWT Token-based authentication
- Role-based access control (Admin/User)
- ระบบจัดการโปรไฟล์ (ชื่อ, เบอร์โทร, ที่อยู่, รูปโปรไฟล์)
- ระบบลบบัญชี (มีการตรวจสอบคำสั่งซื้อค้างชำระ และป้องกัน Admin ลบตัวเอง)

### Product Management
- สร้าง แก้ไข ลบสินค้า (Admin only)
- รองรับสินค้าหลายประเภท (normal/mourning)
- จัดการ Stock แบบ Multi-variant (Size + Quantity)
- อัปโหลดรูปภาพสินค้าผ่าน Cloudinary
- เปิด/ปิดการแสดงสินค้า

### Order Management
- สร้างคำสั่งซื้อพร้อม Transaction (ตัดสต็อกอัตโนมัติ)
- รองรับการจัดส่ง (มีค่าจัดส่ง 50 บาท)
- ตรวจสอบสต็อกก่อนสร้างออร์เดอร์
- ระบบสถานะ Order: `pending_payment` → `verification` → `shipping` → `completed` / `cancelled`
- ดึงข้อมูล Order ตาม Role (User เห็นแค่ของตัวเอง)

### Payment
- อัปโหลดสลิปโอนเงินผ่าน Cloudinary
- อัปเดตสถานะเป็น `verification` อัตโนมัติ

## 🚀 Installation

```bash
# Clone repository
git clone <repository-url>
cd sisaket-shirt-api

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# แก้ไขค่าใน .env ตามด้านล่าง
```

## 🔧 Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ root:

```env
# Server
PORT=8000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<database>

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Admin (Optional - for seed)
ADMIN_SECRET_KEY=your-admin-secret-key
```

## 🏃 Running the Application

```bash
# Development mode with auto-reload
npm run dev

# Server will start at http://localhost:8000
```

## 📡 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/login` | Login (Admin/User) | ❌ |
| POST | `/google-login` | Login ด้วย Google | ❌ |
| GET | `/profile` | ดูข้อมูลโปรไฟล์ | ✅ |
| PUT | `/profile` | แก้ไขโปรไฟล์ | ✅ |
| DELETE | `/profile` | ลบบัญชี (ไม่ได้สำหรับ Admin) | ✅ |
| POST | `/profile/upload-image` | อัปโหลดรูปโปรไฟล์ | ✅ |
| POST | `/seed-admin` | สร้าง Admin ใหม่ | ❌ |

**Login Request:**
```json
{
  "identifier": "username หรือ phone",
  "password": "password",
  "isUserLogin": true
}
```

**Login Response:**
```json
{
  "id": "676...",
  "name": "ชื่อผู้ใช้",
  "role": "admin",
  "phone": "0812345678",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Seed Admin Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

### Products (`/api/products`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | ดึงสินค้าทั้งหมด | ❌ |
| GET | `/?admin=true` | ดึงสินค้าทั้งหมด (รวมไม่ active) | ❌ |
| POST | `/` | สร้างสินค้าใหม่ | ✅ Admin |
| PUT | `/:id` | แก้ไขสินค้า | ✅ Admin |
| PATCH | `/:id/stock` | จัดการ Stock | ✅ Admin |
| DELETE | `/:id` | ลบสินค้า | ✅ Admin |

**Create Product (multipart/form-data):**
```
name: เสื้อการกุศล
type: normal
description: รายละเอียดสินค้า
price: 200
stock: [{"size":"M","quantity":10,"sold":0},{"size":"L","quantity":15,"sold":0}]
image: <file>
```

**Update Stock Request:**
```json
{
  "size": "L",
  "quantity": 5,
  "mode": "set"
}
```

**Update Stock Response:**
```json
{
  "_id": "676...",
  "name": "เสื้อการกุศล",
  "stock": [
    {
      "size": "L",
      "quantity": 5,
      "sold": 3
    }
  ]
}
```

### Orders (`/api/orders`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | สร้างคำสั่งซื้อ | ✅ |
| GET | `/` | ดึงคำสั่งซื้อทั้งหมด | ✅ |
| GET | `/:id` | ดึงรายละเอียด Order | ✅ |
| PATCH | `/:id/status` | อัปเดตสถานะ | ✅ Admin |

**Create Order Request:**
```json
{
  "customerName": "สมชาย ใจดี",
  "phone": "0812345678",
  "address": "123 ถ.มิตรภาพ ต.ในเมือง อ.เมือง จ.ศรีสะเกษ 33000",
  "isShipping": true,
  "items": [
    {
      "productId": "676abc123...",
      "size": "L",
      "quantity": 2
    },
    {
      "productId": "676def456...",
      "size": "M",
      "quantity": 1
    }
  ]
}
```

**Create Order Response:**
```json
{
  "_id": "676xyz...",
  "customerName": "สมชาย ใจดี",
  "phone": "0812345678",
  "address": "123 ถ.มิตรภาพ...",
  "isShipping": true,
  "totalPrice": 450,
  "status": "pending_payment",
  "items": [
    {
      "productId": "676abc123...",
      "productName": "เสื้อการกุศล",
      "size": "L",
      "quantity": 2,
      "price": 200,
      "imageUrl": "https://..."
    }
  ],
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

**Update Status Request:**
```json
{
  "status": "shipping"
}
```

### Payment (`/api/payment`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/upload-slip` | อัปโหลดสลิปชำระเงิน | ❌ |

**Upload Slip (multipart/form-data):**
```
orderId: 676xyz...
slip: <file>
```

**Upload Slip Response:**
```json
{
  "message": "แจ้งชำระเงินสำเร็จ",
  "imageUrl": "https://res.cloudinary.com/...",
  "order": {
    "_id": "676xyz...",
    "status": "verification",
    "paymentProofUrl": "https://res.cloudinary.com/..."
  }
}
```

## 🗄 Database Models

### User Schema
```typescript
{
  username?: string,        // ใช้สำหรับ Admin (unique)
  phone?: string,           // ใช้สำหรับ User (unique)
  email?: string,           // สำหรับ Google Login (unique)
  password?: string,        // Hashed password
  name: string,             // ชื่อแสดงผล (default: 'Member')
  role: 'admin' | 'user',   // บทบาท (default: 'user')
  address?: string,         // ที่อยู่ (formatted)
  addressData?: object,     // ข้อมูลที่อยู่แบบแยกฟิลด์
  profileImage?: string,    // URL รูปโปรไฟล์ (Cloudinary)
  createdAt: Date,
  updatedAt: Date
}
```

### Product Schema
```typescript
{
  name: string,                    // ชื่อสินค้า
  type: 'normal' | 'mourning',     // ประเภทสินค้า
  description?: string,            // รายละเอียด
  price: number,                   // ราคา
  imageUrl: string,                // URL รูปภาพ
  isActive: boolean,               // เปิด/ปิดการแสดง (default: true)
  stock: [{
    size: string,                  // ไซส์ (เช่น S, M, L, XL)
    quantity: number,              // จำนวนคงเหลือ
    sold: number                   // จำนวนที่ขายไปแล้ว
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Order Schema
```typescript
{
  userId?: ObjectId,               // อ้างอิง User (เจ้าของ Order)
  customerName: string,            // ชื่อลูกค้า
  phone: string,                   // เบอร์โทร
  address?: string,                // ที่อยู่จัดส่ง
  isShipping: boolean,             // มีการจัดส่งหรือไม่
  totalPrice: number,              // ราคารวม (รวมค่าจัดส่ง)
  paymentProofUrl?: string,        // URL สลิปโอนเงิน
  status: string,                  // สถานะคำสั่งซื้อ
  items: [{
    productId: ObjectId,           // อ้างอิง Product
    productName: string,           // ชื่อสินค้า (snapshot)
    size: string,                  // ไซส์ที่สั่ง
    quantity: number,              // จำนวนที่สั่ง
    price: number,                 // ราคาต่อชิ้น (snapshot)
    imageUrl?: string              // รูปภาพ (snapshot)
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Authentication Flow

### Admin Login
1. ส่ง `POST /api/auth/login` พร้อม:
   ```json
   {
     "identifier": "admin",
     "password": "admin123",
     "isUserLogin": false
   }
   ```
2. ได้ Token กลับมา
3. ใช้ Token ใน Header: `Authorization: Bearer <token>`

### User Login / Auto-Register
1. ส่ง `POST /api/auth/login` พร้อม:
   ```json
   {
     "identifier": "0812345678",
     "password": "1234",
     "isUserLogin": true
   }
   ```
2. ถ้าเบอร์นี้ไม่มีในระบบ → สร้าง User ใหม่อัตโนมัติ
3. ถ้ามีแล้ว → ตรวจสอบรหัสผ่าน
4. ได้ Token กลับมา

## 📝 Order Flow & Status

```
pending_payment  →  verification  →  shipping  →  completed
                                                      ↓
                                                  cancelled
```

### Status Description
- **pending_payment**: รอลูกค้าชำระเงิน
- **verification**: อัปโหลดสลิปแล้ว รอ Admin ตรวจสอบ
- **shipping**: Admin อนุมัติแล้ว กำลังจัดส่ง
- **completed**: จัดส่งสำเร็จ
- **cancelled**: ยกเลิกคำสั่งซื้อ

### Flow Steps
1. **สร้าง Order** → สถานะ `pending_payment` + ตัดสต็อกทันที
2. **อัปโหลดสลิป** → เปลี่ยนเป็น `verification` อัตโนมัติ
3. **Admin ตรวจสอบ** → เปลี่ยนเป็น `shipping` ด้วยตนเอง
4. **จัดส่งสำเร็จ** → เปลี่ยนเป็น `completed` ด้วยตนเอง

## 🛡 Security Features

- **Password Hashing**: bcryptjs with salt rounds 10
- **JWT Authentication**: Token expiration 1 day
- **Role-based Access**: Admin/User middleware
- **MongoDB Transaction**: สำหรับสร้าง Order (ป้องกัน race condition)
- **File Size Limit**: 5MB per upload
- **Input Validation**: Type checking และ error handling

## 📦 Project Structure

```
sisaket-shirt-api/
├── src/
│   ├── index.ts                 # Entry point & server config
│   ├── models/
│   │   ├── User.ts              # User schema
│   │   ├── Product.ts           # Product schema
│   │   └── Order.ts             # Order schema
│   ├── routes/
│   │   ├── authRoutes.ts        # Authentication endpoints
│   │   ├── productRoutes.ts     # Product CRUD endpoints
│   │   ├── orderRoutes.ts       # Order management endpoints
│   │   └── paymentRoutes.ts     # Payment slip upload
│   └── middleware/
│       ├── auth.ts              # JWT + Role checking
│       └── adminAuth.ts         # Admin key verification
├── package.json
├── tsconfig.json
├── .env                         # Environment variables
└── README.md
```

## ⚠️ Important Notes

### Transaction Requirements
- MongoDB Transaction ใช้งานได้เฉพาะ:
  - MongoDB Atlas (Cluster)
  - MongoDB Replica Set (Self-hosted)
- ไม่สามารถใช้กับ Standalone MongoDB

### Stock Management
- สต็อกจะถูกตัดทันทีเมื่อสร้าง Order
- ไม่มีระบบ Reserve สต็อก
- ถ้า Transaction ล้มเหลว สต็อกจะถูก Rollback

### Cloudinary Folders
- `sisaket-charity/products/` - รูปภาพสินค้า
- `sisaket-charity/slips/` - สลิปโอนเงิน

### User Auto-registration
- User ใหม่จะใช้เบอร์โทรเป็นชื่อเริ่มต้น
- สามารถแก้ไขชื่อได้ในภายหลัง

### Shipping Cost
- ค่าจัดส่ง: 50 บาท (ถ้า `isShipping: true`)
- คำนวณอัตโนมัติใน `totalPrice`

## 🧪 Testing Guide

### 1. Setup Admin
```bash
POST http://localhost:8000/api/auth/seed-admin
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### 2. Login
```bash
POST http://localhost:8000/api/auth/login
Content-Type: application/json

{
  "identifier": "admin",
  "password": "admin123",
  "isUserLogin": false
}

# Response: { "token": "eyJhbG..." }
```

### 3. Create Product (ต้องมี Token)
```bash
POST http://localhost:8000/api/products
Authorization: Bearer <token>
Content-Type: multipart/form-data

name: เสื้อการกุศล
type: normal
price: 200
stock: [{"size":"M","quantity":10,"sold":0}]
image: <file>
```

### 4. Create Order (ต้องมี Token)
```bash
POST http://localhost:8000/api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerName": "ทดสอบ",
  "phone": "0812345678",
  "isShipping": true,
  "items": [
    {
      "productId": "<product_id>",
      "size": "M",
      "quantity": 1
    }
  ]
}
```

### 5. Upload Payment Slip
```bash
POST http://localhost:8000/api/payment/upload-slip
Content-Type: multipart/form-data

orderId: <order_id>
slip: <file>
```

## 🐛 Common Issues & Solutions

### Issue: Transaction Error
```
MongoServerError: Transaction numbers are only allowed on a replica set member
```
**Solution**: ใช้ MongoDB Atlas หรือติดตั้ง Replica Set

### Issue: JWT Token Invalid
```
{ "error": "Invalid Token: หมดอายุหรือบัตรไม่ถูกต้อง" }
```
**Solution**: 
- ตรวจสอบว่า Token ยังไม่หมดอายุ (1 วัน)
- Login ใหม่เพื่อรับ Token ใหม่

### Issue: Cloudinary Upload Failed
```
{ "error": "กรุณาแนบรูปสลิปและระบุเลขคำสั่งซื้อ" }
```
**Solution**:
- ตรวจสอบ Cloudinary config ใน `.env`
- ตรวจสอบขนาดไฟล์ไม่เกิน 5MB

### Issue: Stock Not Enough
```
{ "error": "สินค้า เสื้อการกุศล ไซส์ L เหลือไม่พอ" }
```
**Solution**:
- เพิ่มสต็อกด้วย `PATCH /api/products/:id/stock`
- หรือลดจำนวนที่สั่งซื้อ

## 📞 Support

หากพบปัญหาหรือต้องการสอบถาม:
- สร้าง Issue ใน Repository
- ติดต่อทีมพัฒนา

## 📄 License

ISC

---

**Made with ❤️ for Sisaket Shirt Project**