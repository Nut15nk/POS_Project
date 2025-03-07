require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const salt = bcrypt.genSaltSync(10);
const secret = process.env.JWT_SECRET || 'Nut150945';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile_images',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    public_id: (req, file) => `${req.user.id}-${Date.now()}`, // ชื่อไฟล์ไม่ซ้ำ
    transformation: [
      { width: 500, height: 500, crop: 'limit' }, // จำกัดขนาดรูป
      { quality: 'auto' } // ปรับคุณภาพอัตโนมัติ
    ]
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // จำกัดขนาดไฟล์ 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype) {
      cb(null, true);
    } else {
      cb(new Error('เฉพาะไฟล์รูปภาพ JPEG/JPG/PNG เท่านั้น'));
    }
  }
}).single('profile_image');

// กำหนด Schema และ Model
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fname: { type: String, required: true },
  lname: { type: String, required: true },
  role: { type: String, default: 'seller', enum: ['seller', 'admin'] },
  profile_image_url: { type: String }
});

const User = mongoose.model('User', userSchema);

const registerUser = async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'มีอีเมลล์นี้อยู่ในระบบแล้ว' });
    }

    const hash = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      email: req.body.email,
      password: hash,
      fname: req.body.fname,
      lname: req.body.lname
    });

    const savedUser = await user.save();
    const token = jwt.sign({ id: savedUser._id, email: savedUser.email , role: savedUser.role}, secret, { expiresIn: '1h' });
    res.status(201).json({ status: 'OK', message: 'ทำการสมัครสมาชิกเสร็จสิ้น', token });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'ไม่พบผู้ใช้' });
    }
    const isLogin = await bcrypt.compare(req.body.password, user.password);
    if (isLogin) {
      const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, secret, { expiresIn: '1h' });
      res.json({ status: 'OK', message: 'ล็อกอินเสร็จสิ้น', token });
    } else {
      res.status(401).json({ status: 'error', message: 'รหัสผ่านไม่ถูกต้อง' });
    }
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const userprofile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('id fname lname profile_image_url');
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบผู้ใช้' });
    }

    res.json({ 
      status: 'OK',
      user: {
        id: user._id,
        fname: user.fname,
        lname: user.lname,
        profile_image_url: user.profile_image_url || null
      }
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      message: 'ข้อผิดพลาดฐานข้อมูล', 
      error: err.message 
    });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // ดึงข้อมูลจาก req.body และ req.file
    const fname = req.body.fname ? req.body.fname.trim() : null;
    const lname = req.body.lname ? req.body.lname.trim() : null;

    // ตรวจสอบว่า fname และ lname ต้องไม่ว่าง
    if (!fname || !lname) {
      return res.status(400).json({ message: 'ต้องการชื่อและนามสกุล' });
    }

    const updateData = { fname, lname };

    if (req.file) {
      const imageUrl = req.file.path; // ได้จาก Cloudinary
      updateData.profile_image_url = imageUrl;
    }

    const result = await User.updateOne(
      { _id: userId },
      { $set: updateData }
    );

    if (result.nModified === 0) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }

    const updatedUser = await User.findById(userId).select('id fname lname profile_image_url');
    res.json({ message: 'โปรไฟล์อัปเดตเสร็จสิ้น', user: updatedUser });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'ฐานข้อมูลผิดพลาด', error: err.message });
  }
};

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
      res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการอัปโหลด', error: err.message });
    }
  });
};

const getUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'เฉพาะแอดมินเท่านั้นที่สามารถดึงข้อมูลผู้ใช้ได้' });
    }
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;
    const totalUsers = await User.countDocuments({ role: 'seller' });
    const users = await User.find({ role: 'seller' })
      .select('-password -profile_image_url')
      .skip(skip)
      .limit(limit);
    res.json({
      status: 'OK',
      message: 'ดึงข้อมูลผู้ใช้สำเร็จ',
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers: totalUsers,
        limit: limit
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
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้', error: err.message });
  }
};

const updateUser = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'คุณไม่มีสิทธิ์แก้ไขเฉพาะแอดมินเท่านั้น.' });
  }
  const { userId } = req.params;
  const { email, fname, lname, role } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { email, fname, lname, role },
      { new: true, runValidators: true }
    ).select('-password');
    if (!updatedUser) {
      return res.status(404).json({ message: ' ไม่พบผู้ใช้' });
    }
    res.json({ message: 'ผู้ใช้อัปเดตเสร็จสิ้น', user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล', error: err.message });
  }
};

const deleteUser = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'คุณไม่มีสิทธิ์แก้ไขเฉพาะแอดมินเท่านั้น.' });
  }
  const { userId } = req.params;

  try {
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }
    res.json({ message: 'ลบผู้ใช้เสร็จสิ้น' });
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบข้อมูล', error: err.message });
  }
};


const logoutUser = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'ออกจากระบบเสร็จสิ้น' });
};

const authenticate = (req, res) => {
  res.json({ status: 'ok', decoded: req.user });
};

const protectedRoute = (req, res) => {
  res.json({ status: 'OK', message: 'ได้รับอนุมัติแล้ว', user: req.user });
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
};