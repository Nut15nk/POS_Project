// controller/orderController.js
const { Order, Product } = require('../models/product_config');

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

    // คำนวณข้อมูลสรุป
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const summary = orders.reduce(
      (acc, order) => {
        const orderTotal = order.total || 0;
        acc.totalSales += orderTotal;

        if (new Date(order.createdAt).setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0)) {
          acc.dailySales += orderTotal;
        }

        const month = new Date(order.createdAt).getMonth();
        if (month === today.getMonth()) {
          acc.monthlySales += orderTotal;
        }

        acc.statusSummary[order.status || 'pending'] = (acc.statusSummary[order.status || 'pending'] || 0) + 1;
        return acc;
      },
      {
        totalSales: 0,
        dailySales: 0,
        monthlySales: 0,
        completedOrders: 0,
        pendingOrders: 0,
        statusSummary: {}
      }
    );

    // นับคำสั่งซื้อตามสถานะ
    summary.completedOrders = summary.statusSummary['completed'] || 0;
    summary.pendingOrders = summary.statusSummary['pending'] || 0;

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
        user: order.userId ? {
          id: order.userId._id,
          email: order.userId.email || '',
          fname: order.userId.fname || '',
          lname: order.userId.lname || ''
        } : { id: '', email: '', fname: '', lname: '' },
        products: order.products.map(p => ({
          productId: p.productId?._id || '',
          name: p.productId?.name || 'ไม่ระบุชื่อ',
          quantity: p.quantity || 0,
          price: p.productId?.price || 0 // ใช้ price จาก productId ถ้ามี
        })),
        total: order.total || 0,
        status: order.status || 'pending',
        createdAt: order.createdAt || null
      })),
      summary: {
        totalSales: summary.totalSales,
        dailySales: summary.dailySales,
        monthlySales: summary.monthlySales,
        completedOrders: summary.completedOrders,
        pendingOrders: summary.pendingOrders,
        statusSummary: summary.statusSummary
      }
    });
  } catch (err) {
    console.error('Get orders error:', err);
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

const getOrderReport = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'เฉพาะแอดมินเท่านั้นที่สามารถดูรายงานได้' });
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments();
    const orders = await Order.find()
      .populate('userId', 'email fname lname')
      .populate('products.productId', 'name price')
      .skip(skip)
      .limit(limit);

    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    // ใช้ UTC เพื่อให้ตรงกับ createdAt ในฐานข้อมูล
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())); // 2025-03-07 00:00:00 UTC
    const tomorrowUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1)); // 2025-03-08 00:00:00 UTC

    const dailyOrders = await Order.find({ createdAt: { $gte: todayUTC, $lt: tomorrowUTC } });

    const dailyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: todayUTC, $lt: tomorrowUTC } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    const monthStartUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)); // 2025-03-01 00:00:00 UTC
    const nextMonthUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1)); // 2025-04-01 00:00:00 UTC

    const monthlyOrders = await Order.find({ createdAt: { $gte: monthStartUTC, $lt: nextMonthUTC } });

    const monthlyRevenue = await Order.aggregate([
      { $match: { createdAt: { $gte: monthStartUTC, $lt: nextMonthUTC } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    const statusSummary = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      status: 'OK',
      message: 'ดึงรายงานคำสั่งซื้อสำเร็จ',
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders: totalOrders,
        limit: limit
      },
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      dailyRevenue: dailyRevenue.length > 0 ? dailyRevenue[0].total : 0,
      monthlyRevenue: monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0,
      statusSummary: statusSummary.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      completedOrders: statusSummary.find(s => s._id === 'completed')?.count || 0,
      pendingOrders: statusSummary.find(s => s._id === 'pending')?.count || 0,
      orders: orders.map(order => ({
        id: order._id,
        user: order.userId ? {
          id: order.userId._id || '',
          email: order.userId.email || '',
          fname: order.userId.fname || '',
          lname: order.userId.lname || ''
        } : { id: '', email: '', fname: '', lname: '' },
        products: order.products.map(p => ({
          productId: p.productId?._id || '',
          name: p.productId?.name || 'ไม่ระบุชื่อ',
          quantity: p.quantity || 0,
          price: p.price || 0
        })),
        total: order.total || 0,
        status: order.status || 'pending',
        createdAt: order.createdAt || null
      }))
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการดึงรายงาน', error: err.message });
  }
};

const getSellerOrderReport = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const sellerProducts = await Product.find({ createdBy: sellerId }).select('_id');
    const productIds = sellerProducts.map(p => p._id); // ใช้ ObjectId

    const totalOrders = await Order.countDocuments({ 'products.productId': { $in: productIds } });

    const orders = await Order.find({ 'products.productId': { $in: productIds } })
      .populate('userId', 'email fname lname')
      .populate('products.productId', 'name price')
      .skip(skip)
      .limit(limit);

    const totalRevenueAgg = await Order.aggregate([
      { $match: { 'products.productId': { $in: productIds } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const tomorrowUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1));

    const dailyRevenueAgg = await Order.aggregate([
      { $match: { 'products.productId': { $in: productIds }, createdAt: { $gte: todayUTC, $lt: tomorrowUTC } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    const monthStartUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const nextMonthUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1));

    const monthlyRevenueAgg = await Order.aggregate([
      { $match: { 'products.productId': { $in: productIds }, createdAt: { $gte: monthStartUTC, $lt: nextMonthUTC } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    const statusSummaryAgg = await Order.aggregate([
      { $match: { 'products.productId': { $in: productIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusSummary = statusSummaryAgg.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.json({
      status: 'OK',
      message: 'ดึงรายงานการขายของผู้ขายสำเร็จ',
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        limit
      },
      totalRevenue: totalRevenueAgg.length > 0 ? totalRevenueAgg[0].total : 0,
      dailyRevenue: dailyRevenueAgg.length > 0 ? dailyRevenueAgg[0].total : 0,
      monthlyRevenue: monthlyRevenueAgg.length > 0 ? monthlyRevenueAgg[0].total : 0,
      statusSummary,
      completedOrders: statusSummary.completed || 0,
      pendingOrders: statusSummary.pending || 0,
      orders: orders.map(order => ({
        id: order._id,
        buyer: order.userId ? {
          id: order.userId._id || '',
          email: order.userId.email || '',
          fname: order.userId.fname || '',
          lname: order.userId.lname || ''
        } : { id: '', email: '', fname: '', lname: '' },
        products: order.products
          .filter(p => p.productId)
          .map(p => ({
            productId: p.productId?._id?.toString() || p.productId.toString(),
            name: p.productId?.name || p.name || 'ไม่ระบุชื่อ',
            quantity: p.quantity || 0,
            price: p.productId?.price || p.price || 0
          })),
        total: order.total || 0,
        status: order.status || 'pending',
        createdAt: order.createdAt || null
      }))
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการดึงรายงาน', error: err.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  updateOrder,
  deleteOrder,
  getOrderReport,
  getSellerOrderReport
};