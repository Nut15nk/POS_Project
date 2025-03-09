// controller/categoryController.js
const { Category, Product } = require('../models/product_config');

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ status: 'error', message: 'กรุณากรอกชื่อหมวดหมู่' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'เฉพาะแอดมินเท่านั้นที่สามารถสร้างหมวดหมู่ได้' });
    }

    const category = new Category({
      name,
      createdBy: req.user.id
    });

    const savedCategory = await category.save();
    res.status(201).json({
      status: 'OK',
      message: 'สร้างหมวดหมู่สำเร็จ',
      category: {
        id: savedCategory._id,
        name: savedCategory.name,
        createdAt: savedCategory.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการสร้างหมวดหมู่', error: err.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate('createdBy', 'email fname lname');
    res.json({
      status: 'OK',
      message: 'ดึงข้อมูลหมวดหมู่สำเร็จ',
      categories: categories.map(cat => ({
        id: cat._id,
        name: cat.name,
        createdBy: cat.createdBy ? {
          id: cat.createdBy._id,
          email: cat.createdBy.email,
          fname: cat.createdBy.fname,
          lname: cat.createdBy.lname
        } : null,
        createdAt: cat.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่', error: err.message });
  }
};

const updateCategory = async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { name } = req.body;
  
      if (!name) {
        return res.status(400).json({ status: 'error', message: 'กรุณากรอกชื่อหมวดหมู่' });
      }
  
      if (req.user.role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'เฉพาะแอดมินเท่านั้นที่สามารถแก้ไขหมวดหมู่ได้' });
      }
  
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ status: 'error', message: 'ไม่พบหมวดหมู่ที่ระบุ' });
      }
  
      category.name = name;
      const updatedCategory = await category.save();
  
      res.json({
        status: 'OK',
        message: 'แก้ไขหมวดหมู่สำเร็จ',
        category: {
          id: updatedCategory._id,
          name: updatedCategory.name,
          createdAt: updatedCategory.createdAt
        }
      });
    } catch (err) {
      res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่', error: err.message });
    }
  };

  const deleteCategory = async (req, res) => {
    try {
      const { categoryId } = req.params;
  
      // ตรวจสอบสิทธิ์แอดมิน
      if (req.user.role !== 'admin') {
        return res.status(403).json({ status: 'error', message: 'เฉพาะแอดมินเท่านั้นที่สามารถลบหมวดหมู่ได้' });
      }
  
      // อัปเดตสินค้าที่เชื่อมโยงให้ category เป็น null
      const products = await Product.find({ category: categoryId });
      if (products.length > 0) {
        await Product.updateMany(
          { category: categoryId },
          { $set: { category: null } }
        );
      }
  
      // ลบหมวดหมู่
      const category = await Category.findByIdAndDelete(categoryId);
      if (!category) {
        return res.status(404).json({ status: 'error', message: 'ไม่พบหมวดหมู่ที่ระบุ' });
      }
  
      res.json({
        status: 'OK',
        message: 'ลบหมวดหมู่สำเร็จ สินค้าที่เกี่ยวข้องถูกตั้งค่าให้ไม่มีหมวดหมู่'
      });
    } catch (err) {
      res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการลบหมวดหมู่', error: err.message });
    }
  };

module.exports = { 
    createCategory, 
    getCategories, 
    deleteCategory,
    updateCategory
 };