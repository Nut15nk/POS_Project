// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const connectDB = require('./config/db');
const authMiddleware = require('./authMiddleware');

const {
  registerUser,
  loginUser,
  authenticate,
  protectedRoute,
  logoutUser,
  uploadProfileImage,
  userprofile,
  updateUserProfile,
  updateUser,
  deleteUser,
  getUsers,
  resetPassword,
  resetPasswordConfirm
} = require('./controller/user_config');

const {
  uploadProduct,
  updateProduct,
  deleteProduct,
  getProducts
} = require('./controller/productController');

const {
  createOrder,
  getOrders,
  updateOrder,
  deleteOrder,
  getOrderReport,
  getSellerOrderReport
} = require('./controller/orderController');

const {
  createReport,
  getReports,
  updateReport,
} = require('./controller/reportController');
const { getCategories, createCategory, deleteCategory, updateCategory } = require('./controller/categoryController');

require('./models/product_config');

const app = express();
const jsonParser = bodyParser.json();

// ตั้งค่า Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer สำหรับโปรไฟล์ผู้ใช้
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile_images',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    public_id: (req, file) => `${req.user.id}-${Date.now()}`,
    transformation: [{ width: 500, height: 500, crop: 'limit' }, { quality: 'auto' }]
  }
});

const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype) {
      cb(null, true);
    } else {
      cb(new Error('เฉพาะไฟล์รูปภาพ JPEG/JPG/PNG เท่านั้น'));
    }
  }
});

// Multer สำหรับสินค้า
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'product_images',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    public_id: (req, file) => `product-${Date.now()}`,
    transformation: [{ width: 800, height: 800, crop: 'limit' }, { quality: 'auto' }]
  }
});

const uploadProductImages = multer({
  storage: productStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype) {
      cb(null, true);
    } else {
      cb(new Error('เฉพาะไฟล์รูปภาพ JPEG/JPG/PNG เท่านั้น'));
    }
  }
}).array('product_images', 10);

// Middleware จัดการ error จาก multer
const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ status: 'error', message: err.message });
  } else if (err) {
    return res.status(400).json({ status: 'error', message: err.message });
  }
  next();
};

app.use(cors());
connectDB();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes - User
app.post('/register', jsonParser, registerUser);
app.post('/login', jsonParser, loginUser);
app.post('/resetpassword', resetPassword);
app.post('/resetpassword/confirm', resetPasswordConfirm);
app.post('/authen', jsonParser, authMiddleware, authenticate);
app.get('/protected', authMiddleware, protectedRoute);
app.post('/logout', jsonParser, logoutUser);
app.get('/user/profile', authMiddleware, userprofile);
app.post('/user/uploadprofile', authMiddleware, uploadProfile.single('profile_image'), multerErrorHandler, uploadProfileImage);
app.put('/user/profile', authMiddleware, uploadProfile.single('profile_image'), multerErrorHandler, updateUserProfile);
app.get('/users', authMiddleware, getUsers);
app.put('/users/:userId', authMiddleware, jsonParser, updateUser);
app.delete('/users/:userId', authMiddleware, deleteUser);

// Product Routes
app.post('/product/upload', authMiddleware, uploadProductImages, multerErrorHandler, uploadProduct);
app.put('/product/:productId', authMiddleware, uploadProductImages, multerErrorHandler, updateProduct);
app.delete('/product/:productId', authMiddleware, deleteProduct);
app.get('/products', authMiddleware, getProducts);

// Order Routes
app.post('/orders', authMiddleware, jsonParser, createOrder);
app.get('/orders', authMiddleware, getOrders);
app.put('/orders/:orderId', authMiddleware, jsonParser, updateOrder);
app.delete('/orders/:orderId', authMiddleware, deleteOrder);
app.get('/orders/report', authMiddleware, getOrderReport);
app.get('/orders/seller', authMiddleware, getSellerOrderReport);

// Report Routes
app.post('/reports', authMiddleware, createReport);
app.get('/reports', authMiddleware, getReports);
app.put('/reports/:reportId', authMiddleware, updateReport);

// Category Routes
app.post('/categories', authMiddleware, createCategory);
app.get('/categories', authMiddleware, getCategories);
app.put('/categories/:categoryId', authMiddleware, updateCategory);
app.delete('/categories/:categoryId', authMiddleware, deleteCategory);

const PORT = 3333;
app.listen(PORT, () => {
  console.log(`CORS-enabled web server listening on port ${PORT}`);
});