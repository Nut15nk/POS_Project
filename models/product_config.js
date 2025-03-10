const mongoose = require('mongoose');
const Schema = mongoose.Schema; // เพิ่มบรรทัดนี้เพื่อ import Schema

// Schema อื่น ๆ ที่มีอยู่ (เช่น Product, Order, User)
const ProductSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  product_image_urls: [{ type: String }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  stock: { type: Number, required: true, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const OrderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1 },
    price: { type: Number, required: true }
  }],
  total: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fname: { type: String, required: true },
  lname: { type: String, required: true },
  role: { type: String, enum: ['admin', 'seller'], default: 'seller' },
  profile_image_url: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  address: {
    street: { type: String },
    city: { type: String },
    province: { type: String },
    postalCode: { type: String },
    country: { type: String }
  }
});

// Schema สำหรับ Report
const ReportSchema = new Schema({
  message: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // ผู้รายงาน (Seller)
  status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// models/product_config.js (เพิ่ม CategorySchema)
const CategorySchema = new Schema({
  name: { type: String, required: true, unique: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const Category = mongoose.model('Category', CategorySchema);
const Product = mongoose.model('Product', ProductSchema);
const Order = mongoose.model('Order', OrderSchema);
const User = mongoose.model('User', UserSchema);
const Report = mongoose.model('Report', ReportSchema);

module.exports = { Product, Order, User, Report, Category };