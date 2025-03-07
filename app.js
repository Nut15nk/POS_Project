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
  getUsers
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

const app = express();
const jsonParser = bodyParser.json();

// ตั้งค่า Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ตั้งค่า Multer กับ Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile_images',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    public_id: (req, file) => `${req.user.id}-${Date.now()}`,
    transformation: [{ width: 500, height: 500, crop: 'limit' }, { quality: 'auto' }]
  }
});

const upload = multer({
  storage: storage,
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

app.use(cors());
connectDB();

// Routes
app.post('/register', jsonParser, registerUser);
app.post('/login', jsonParser, loginUser);
app.post('/authen', jsonParser, authMiddleware, authenticate);
app.get('/protected', authMiddleware, protectedRoute);
app.post('/logout', jsonParser, logoutUser);
app.get('/user/profile', authMiddleware, userprofile);
app.post('/user/uploadprofile', authMiddleware, upload.single('profile_image'), uploadProfileImage);
app.put('/user/profile', authMiddleware, upload.single('profile_image'), updateUserProfile);
app.get('/users', authMiddleware, getUsers);
app.put('/users/:userId', authMiddleware, jsonParser, updateUser);
app.delete('/users/:userId', authMiddleware, deleteUser);

// Product
app.post('/product/upload', authMiddleware, upload.single('product_image'), uploadProduct);
app.put('/product/:productId', authMiddleware, upload.single('product_image'), updateProduct);
app.delete('/product/:productId', authMiddleware, deleteProduct);
app.get('/products', authMiddleware, getProducts);

// Order Routes
app.post('/orders', authMiddleware, jsonParser, createOrder);
app.get('/orders', authMiddleware, getOrders);
app.put('/orders/:orderId', authMiddleware, jsonParser, updateOrder);
app.delete('/orders/:orderId', authMiddleware, deleteOrder);
app.get('/orders/report', authMiddleware, getOrderReport); 
app.get('/orders/seller/report', authMiddleware, getSellerOrderReport); 

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const PORT = 3333;
app.listen(PORT, () => {
  console.log(`CORS-enabled web server listening on port ${PORT}`);
});