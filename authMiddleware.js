// backend/authMiddleware.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // ดึง token จาก "Bearer <token>"

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'ไม่พบ token กรุณาเข้าสู่ระบบ' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'Nut150945'; // ใช้ secret เดียวกับ login
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // เก็บข้อมูลผู้ใช้ (id, email, role) ใน req.user
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    return res.status(403).json({ status: 'error', message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
};

module.exports = authMiddleware;