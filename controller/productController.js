//controller/productController.js

const { Product } = require('../models/product_config');
const cloudinary = require('cloudinary').v2;

const uploadProduct = async (req, res) => {
  try {
    const { name, price, description } = req.body;
    if (!name || !price || !description) {
      return res.status(400).json({ status: 'error', message: 'กรุณากรอกชื่อ, ราคา, และรายละเอียดสินค้า' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ status: 'error', message: 'กรุณาอัปโหลดรูปภาพสินค้าอย่างน้อย 1 รูป' });
    }

    const uniqueFiles = [...new Map(req.files.map(file => [`${file.originalname}-${file.size}`, file])).values()];
    const productImageUrls = uniqueFiles
      .map(file => {
        if (!file || (!file.url && !file.path)) {
          return null;
        }
        return file.url || file.path;
      })
      .filter(url => url !== null);

    if (productImageUrls.length === 0) {
      return res.status(400).json({ status: 'error', message: 'ไม่สามารถอัปโหลดรูปภาพได้ กรุณาลองใหม่' });
    }

    const product = new Product({
      name,
      price: parseFloat(price),
      description,
      product_image_urls: productImageUrls,
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
        product_image_urls: savedProduct.product_image_urls
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

    if (product.product_image_urls && product.product_image_urls.length > 0) {
      const publicIds = product.product_image_urls
        .filter(url => url && typeof url === 'string')
        .map(url => {
          const parts = url.split('/');
          const publicId = parts.slice(-2).join('/').split('.')[0];
          return publicId;
        });

      if (publicIds.length > 0) {
        await cloudinary.api.delete_resources(publicIds);
      }
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
    const { name, price, description, deletedImages } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    console.log('Received deletedImages:', deletedImages); // ดีบัก

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

    let updatedImageUrls = [...(product.product_image_urls || [])];

    if (deletedImages) {
      let imagesToDelete;
      try {
        imagesToDelete = JSON.parse(deletedImages);
      } catch (e) {
        return res.status(400).json({ status: 'error', message: 'รูปแบบ deletedImages ไม่ถูกต้อง' });
      }

      if (imagesToDelete.length > 0) {
        const publicIds = imagesToDelete
          .filter(url => url && typeof url === 'string')
          .map(url => {
            const parts = url.split('/');
            const publicId = parts.slice(-2).join('/').split('.')[0];
            return publicId;
          });

        if (publicIds.length > 0) {
          await cloudinary.api.delete_resources(publicIds);
          console.log('Deleted images from Cloudinary:', publicIds); // ดีบัก
        }

        updatedImageUrls = updatedImageUrls.filter(url => !imagesToDelete.includes(url));
      }
    }

    if (req.files && req.files.length > 0) {
      const uniqueFiles = [...new Map(req.files.map(file => [`${file.originalname}-${file.size}`, file])).values()];
      const newImageUrls = uniqueFiles
        .map(file => file.url || file.path)
        .filter(url => url !== null);

      if (newImageUrls.length === 0) {
        return res.status(400).json({ status: 'error', message: 'ไม่สามารถอัปโหลดรูปภาพใหม่ได้' });
      }
      updatedImageUrls = [...updatedImageUrls, ...newImageUrls];
    }

    updateData.product_image_urls = updatedImageUrls;

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
        product_image_urls: updatedProduct.product_image_urls
      }
    });
  } catch (err) {
    console.error('Update Product Error:', err);
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการแก้ไขสินค้า', error: err.message });
  }
};

const getProducts = async (req, res) => {
  try {
    if (!req.user || !req.user.id || !req.user.role) {
      return res.status(401).json({ status: 'error', message: 'ไม่พบข้อมูลผู้ใช้ใน request' });
    }

    const userId = req.user.id;
    const role = req.user.role;

    let products;
    if (role === 'admin') {
      products = await Product.find().populate('createdBy', 'email fname lname');
    } else {
      products = await Product.find({ createdBy: userId }).populate('createdBy', 'email fname lname');
    }

    if (!products || products.length === 0) {
      return res.status(200).json({ status: 'OK', message: 'ไม่พบสินค้า', products: [] });
    }

    const response = {
      status: 'OK',
      message: 'ดึงข้อมูลสินค้าสำเร็จ',
      products: products.map(product => ({
        id: product._id.toString(),
        name: product.name,
        price: product.price,
        description: product.description,
        product_image_urls: product.product_image_urls || [],
        createdBy: product.createdBy && product.createdBy._id ? {
          id: product.createdBy._id.toString(),
          email: product.createdBy.email || 'ไม่ระบุ',
          fname: product.createdBy.fname || 'ไม่ระบุ',
          lname: product.createdBy.lname || ''
        } : { id: null, email: 'ไม่ระบุ', fname: 'ไม่ระบุ', lname: '' },
        createdAt: product.createdAt
      }))
    };
    res.json(response);
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