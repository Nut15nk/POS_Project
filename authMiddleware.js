// authMiddleware.js
const jwt = require('jsonwebtoken');
const secret = 'Nut150945';

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // จะมี id, email, และ role
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};