// controller/productController.js
const { Product } = require('./product_config');

const uploadProduct = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'กรุณาอัปโหลดรูปภาพสินค้า' });
    }

    const { name, price, description } = req.body;
    if (!name || !price || !description) {
      return res.status(400).json({ status: 'error', message: 'กรุณากรอกชื่อ, ราคา, และรายละเอียดสินค้า' });
    }

    const product = new Product({
      name,
      price: parseFloat(price),
      description,
      product_image_url: req.file.path,
      createdBy: req.user.id
    });

    const savedProduct = await product.save();

    res.status(201).json({
      status: 'OK',
      message: 'อัปโหลดสินค้าสำเร็จ',
      product: {
        id: savedProduct._id,
        name: savedProduct.name,
        price: savedProduct.price,
        description: savedProduct.description,
        product_image_url: savedProduct.product_image_url
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการอัปโหลดสินค้า', error: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบสินค้า' });
    }

    if (role !== 'admin' && product.createdBy.toString() !== userId) {
      return res.status(403).json({ status: 'error', message: 'คุณไม่มีสิทธิ์ลบสินค้านี้' });
    }

    await Product.findByIdAndDelete(productId);

    res.json({ status: 'OK', message: 'ลบสินค้าสำเร็จ' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการลบสินค้า', error: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, price, description } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบสินค้า' });
    }

    if (role !== 'admin' && product.createdBy.toString() !== userId) {
      return res.status(403).json({ status: 'error', message: 'คุณไม่มีสิทธิ์แก้ไขสินค้านี้' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (price) updateData.price = parseFloat(price);
    if (description) updateData.description = description;
    if (req.file) updateData.product_image_url = req.file.path;

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      status: 'OK',
      message: 'แก้ไขสินค้าสำเร็จ',
      product: {
        id: updatedProduct._id,
        name: updatedProduct.name,
        price: updatedProduct.price,
        description: updatedProduct.description,
        product_image_url: updatedProduct.product_image_url
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการแก้ไขสินค้า', error: err.message });
  }
};

const getProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let products;
    if (role === 'admin') {
      products = await Product.find().populate('createdBy', 'email fname lname');
    } else {
      products = await Product.find({ createdBy: userId }).populate('createdBy', 'email fname lname');
    }

    res.json({
      status: 'OK',
      message: 'ดึงข้อมูลสินค้าสำเร็จ',
      products: products.map(product => ({
        id: product._id,
        name: product.name,
        price: product.price,
        description: product.description,
        product_image_url: product.product_image_url,
        createdBy: {
          id: product.createdBy._id,
          email: product.createdBy.email,
          fname: product.createdBy.fname,
          lname: product.createdBy.lname
        },
        createdAt: product.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า', error: err.message });
  }
};

module.exports = {
  uploadProduct,
  updateProduct,
  deleteProduct,
  getProducts
};