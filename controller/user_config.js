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
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  profile_image_url: { type: String }
});

const User = mongoose.model('User', userSchema);

const registerUser = async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'Email already exists' });
    }

    const hash = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      email: req.body.email,
      password: hash,
      fname: req.body.fname,
      lname: req.body.lname
    });

    const savedUser = await user.save();
    const token = jwt.sign({ id: savedUser._id, email: savedUser.email }, secret, { expiresIn: '1h' });
    res.status(201).json({ status: 'OK', message: 'Registration successful', token });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'No user found' });
    }
    const isLogin = await bcrypt.compare(req.body.password, user.password);
    if (isLogin) {
      const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, secret, { expiresIn: '1h' });
      res.json({ status: 'OK', message: 'Login successful', token });
    } else {
      res.status(401).json({ status: 'error', message: 'Login failed' });
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
  const { fname, lname } = req.body;

  if (!fname || !lname) {
    return res.status(400).json({ message: 'First name and last name are required' });
  }

  try {
    const result = await User.updateOne(
      { _id: req.user.id },
      { $set: { fname, lname } }
    );

    if (result.nModified === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Database error', error: err.message });
  }
};

const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'กรุณาอัปโหลดไฟล์รูปภาพ' });
    }
    const imageUrl = req.file.path; // URL จาก Cloudinary
    const result = await User.updateOne(
      { _id: req.user.id },
      { $set: { profile_image_url: imageUrl } }
    );
    if (result.nModified === 0) {
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
};

const getUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'เฉพาะแอดมินเท่านั้นที่สามารถดึงข้อมูลผู้ใช้ได้' });
    }
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;
    const totalUsers = await User.countDocuments({ role: 'user' });
    const users = await User.find({ role: 'user' })
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
    return res.status(403).json({ message: 'Access denied. Admin only.' });
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
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: 'Error updating user', error: err.message });
  }
};

const deleteUser = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  const { userId } = req.params;

  try {
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
};


const logoutUser = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logout successful' });
};

const authenticate = (req, res) => {
  res.json({ status: 'ok', decoded: req.user });
};

const protectedRoute = (req, res) => {
  res.json({ status: 'OK', message: 'Access granted', user: req.user });
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