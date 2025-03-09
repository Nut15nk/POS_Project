//controller/user_config.js

require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { Product, Order } = require('../models/product_config');
const { User} = require('../models/product_config');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const salt = bcrypt.genSaltSync(10);
const secret = process.env.JWT_SECRET || 'Nut150945';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ตั้งค่า Multer และ Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile_images',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    public_id: (req, file) => {
      // ใช้ timestamp หรือ random string ถ้า req.user.id ยังไม่มี
      return req.user ? `${req.user.id}-${Date.now()}` : `anonymous-${Date.now()}`;
    },
    transformation: [
      { width: 500, height: 500, crop: 'limit' },
      { quality: 'auto' }
    ]
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype) {
      return cb(null, true);
    }
    return cb(new Error('เฉพาะไฟล์รูปภาพ JPEG/JPG/PNG เท่านั้น'));
  }
}).single('profile_image');

const resetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // ค้นหาผู้ใช้
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบผู้ใช้' });
    }

    // สร้าง token
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '10m' });

    // บันทึก token และวันหมดอายุ
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 นาที
    await user.save();

    // ตั้งค่า Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'รีเซ็ตรหัสผ่าน',
      text: `คลิกลิงก์นี้เพื่อรีเซ็ตรหัสผ่านของคุณ: http://localhost:3000/resetpassword/${token}`,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ status: 'error', message: 'ไม่สามารถส่งอีเมลได้' });
      }
      res.json({ status: 'OK', message: 'ลิงก์รีเซ็ตรหัสผ่านถูกส่งไปยังอีเมลของคุณแล้ว' });
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในระบบ', error: err.message });
  }
};

const resetPasswordConfirm = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // ค้นหาผู้ใช้ด้วย token และตรวจสอบวันหมดอายุ
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ status: 'error', message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }

    // อัปเดตรหัสผ่าน
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ status: 'OK', message: 'รีเซ็ตรหัสผ่านสำเร็จ' });
  } catch (err) {
    console.error('Reset password confirm error:', err);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในระบบ', error: err.message });
  }
};

// Register User
const registerUser = async (req, res) => {
  try {
    const { email, password, fname, lname } = req.body;
    if (!email || !password || !fname || !lname) {
      return res.status(400).json({ status: 'error', message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'อีเมลนี้ถูกใช้แล้ว' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hash, fname, lname });
    const savedUser = await user.save();
    const token = jwt.sign({ id: savedUser._id, email, role: savedUser.role }, secret, { expiresIn: '1h' });
    res.status(201).json({ status: 'OK', message: 'สมัครสมาชิกสำเร็จ', token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', error: err.message });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'ไม่พบผู้ใช้' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'รหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ status: 'OK', message: 'ล็อกอินสำเร็จ', token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', error: err.message });
  }
};

// Get User Profile
const userprofile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ status: 'error', message: 'ไม่ได้รับการยืนยันตัวตน' });
    }

    const user = await User.findById(req.user.id).select('-password -__v');
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบผู้ใช้' });
    }

    res.json({
      status: 'OK',
      user: {
        id: user._id,
        email: user.email,
        fname: user.fname,
        lname: user.lname,
        role: user.role,
        profile_image_url: user.profile_image_url || null
      }
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', error: err.message });
  }
};

// Update User Profile
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'ไม่ได้รับการยืนยันตัวตน' });
    }

    const { fname, lname } = req.body;
    if (!fname || !lname) {
      return res.status(400).json({ status: 'error', message: 'กรุณากรอกชื่อและนามสกุล' });
    }

    const updateData = { fname, lname };
    if (req.file) {
      updateData.profile_image_url = req.file.path;
    }

    const result = await User.updateOne({ _id: userId }, { $set: updateData });
    if (result.nModified === 0) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบผู้ใช้' });
    }

    const updatedUser = await User.findById(userId).select('-password -__v');
    res.json({ status: 'OK', message: 'อัปเดตโปรไฟล์สำเร็จ', user: updatedUser });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', error: err.message });
  }
};

// Upload Profile Image
const uploadProfileImage = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
    try {
      if (!req.file) {
        return res.status(400).json({ status: 'error', message: 'กรุณาอัปโหลดไฟล์รูปภาพ' });
      }

      const imageUrl = req.file.path;
      const result = await User.updateOne(
        { _id: req.user.id },
        { $set: { profile_image_url: imageUrl } }
      );
      if (result.modifiedCount === 0) {
        return res.status(404).json({ status: 'error', message: 'ไม่พบผู้ใช้' });
      }

      res.json({
        status: 'OK',
        message: 'อัปโหลดรูปภาพสำเร็จ',
        profile_image_url: imageUrl
      });
    } catch (err) {
      console.error('Upload image error:', err);
      res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', error: err.message });
    }
  });
};

// Get Users (สำหรับ admin)
const getUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'เฉพาะแอดมินเท่านั้น' });
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;
    const totalUsers = await User.countDocuments({ role: 'seller' });
    const users = await User.find({ role: 'seller' })
      .select('-password -__v -profile_image_url')
      .skip(skip)
      .limit(limit);

    res.json({
      status: 'OK',
      message: 'ดึงข้อมูลสำเร็จ',
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        limit
      },
      users: users.map(user => ({
        id: user._id,
        email: user.email,
        fname: user.fname,
        lname: user.lname,
        role: user.role
      }))
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', error: err.message });
  }
};

// Update User (สำหรับ admin)
const updateUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'เฉพาะแอดมินเท่านั้น' });
    }

    const { userId } = req.params;
    const { email, fname, lname, role } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { email, fname, lname, role },
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!updatedUser) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบผู้ใช้' });
    }

    res.json({ status: 'OK', message: 'อัปเดตสำเร็จ', user: updatedUser });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', error: err.message });
  }
};

// Delete User (สำหรับ admin)
const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'เฉพาะแอดมินเท่านั้น' });
    }

    const { userId } = req.params;

    if (!userId || userId === ':userId' || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ status: 'error', message: 'userId ไม่ถูกต้อง' });
    }


    // ตรวจสอบว่าพบผู้ใช้หรือไม่ก่อนลบ
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบผู้ใช้' });
    }

    // ลบผู้ใช้
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบผู้ใช้' });
    }

    // ลบสินค้าที่ผู้ใช้สร้าง
    const deletedProducts = await Product.deleteMany({ createdBy: userId });

    // ลบคำสั่งซื้อที่เกี่ยวข้องกับผู้ใช้ (ทั้งในฐานะผู้ซื้อ)
    const deletedOrders = await Order.deleteMany({ userId: userId });

    res.json({ 
      status: 'OK', 
      message: 'ลบผู้ใช้และข้อมูลที่เกี่ยวข้องสำเร็จ',
      deleted: {
        user: deletedUser._id,
        products: deletedProducts.deletedCount,
        orders: deletedOrders.deletedCount
      }
    });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด', error: err.message });
  }
};

// Logout User
const logoutUser = (req, res) => {
  // เนื่องจาก frontend ใช้ localStorage แทน cookie ให้ลบ token ทางฝั่ง client
  res.json({ status: 'OK', message: 'ออกจากระบบสำเร็จ' });
};

// Authenticate (สำหรับทดสอบ)
const authenticate = (req, res) => {
  res.json({ status: 'OK', decoded: req.user });
};

// Protected Route (สำหรับทดสอบ)
const protectedRoute = (req, res) => {
  res.json({ status: 'OK', message: 'ได้รับอนุมัติ', user: req.user });
};

module.exports = {
  User,
  registerUser,
  loginUser,
  authenticate,
  protectedRoute,
  logoutUser,
  uploadProfileImage,
  userprofile,
  updateUserProfile,
  getUsers,
  updateUser,
  deleteUser,
  resetPassword,
  resetPasswordConfirm
};