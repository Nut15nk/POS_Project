// controller/orderController.js
const { Order, Product } = require('./product_config');

const createOrder = async (req, res) => {
  try {
    const { products } = req.body;
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ status: 'error', message: 'กรุณาระบุสินค้าที่สั่งซื้อ' });
    }

    let total = 0;
    const orderProducts = [];
    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ status: 'error', message: `ไม่พบสินค้า ID: ${item.productId}` });
      }
      const quantity = item.quantity || 1;
      const itemTotal = product.price * quantity;
      total += itemTotal;
      orderProducts.push({
        productId: product._id,
        quantity,
        price: product.price
      });
    }

    const order = new Order({
      userId: req.user.id,
      products: orderProducts,
      total
    });

    const savedOrder = await order.save();
    res.status(201).json({
      status: 'OK',
      message: 'สร้างคำสั่งซื้อสำเร็จ',
      order: {
        id: savedOrder._id,
        userId: savedOrder.userId,
        products: savedOrder.products,
        total: savedOrder.total,
        status: savedOrder.status,
        createdAt: savedOrder.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ', error: err.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    let orders;
    let totalOrders;
    if (req.user.role === 'admin') {
      totalOrders = await Order.countDocuments();
      orders = await Order.find()
        .populate('userId', 'email fname lname')
        .populate('products.productId', 'name price')
        .skip(skip)
        .limit(limit);
    } else {
      totalOrders = await Order.countDocuments({ userId: req.user.id });
      orders = await Order.find({ userId: req.user.id })
        .populate('userId', 'email fname lname')
        .populate('products.productId', 'name price')
        .skip(skip)
        .limit(limit);
    }

    res.json({
      status: 'OK',
      message: 'ดึงข้อมูลคำสั่งซื้อสำเร็จ',
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders: totalOrders,
        limit: limit
      },
      orders: orders.map(order => ({
        id: order._id,
        user: {
          id: order.userId._id,
          email: order.userId.email,
          fname: order.userId.fname,
          lname: order.userId.lname
        },
        products: order.products.map(p => ({
          productId: p.productId._id,
          name: p.productId.name,
          quantity: p.quantity,
          price: p.price
        })),
        total: order.total,
        status: order.status,
        createdAt: order.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ', error: err.message });
  }
};

const updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบคำสั่งซื้อ' });
    }

    if (req.user.role !== 'admin' && order.userId.toString() !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'คุณไม่มีสิทธิ์แก้ไขคำสั่งซื้อนี้' });
    }

    if (status) order.status = status;
    const updatedOrder = await order.save();

    res.json({
      status: 'OK',
      message: 'อัปเดตคำสั่งซื้อสำเร็จ',
      order: {
        id: updatedOrder._id,
        status: updatedOrder.status,
        total: updatedOrder.total,
        createdAt: updatedOrder.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการแก้ไขคำสั่งซื้อ', error: err.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบคำสั่งซื้อ' });
    }

    if (req.user.role !== 'admin' && order.userId.toString() !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'คุณไม่มีสิทธิ์ลบคำสั่งซื้อนี้' });
    }

    await Order.findByIdAndDelete(orderId);
    res.json({ status: 'OK', message: 'ลบคำสั่งซื้อสำเร็จ' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการลบคำสั่งซื้อ', error: err.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  updateOrder,
  deleteOrder
};