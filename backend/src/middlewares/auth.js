const jwt = require('jsonwebtoken');

// Middleware xác thực JWT Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Rất tiếc! Bạn chưa đăng nhập.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'SECRET_KEY_123', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
    req.user = user;
    next();
  });
};

// Middleware phân quyền theo Role
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền thực hiện chức năng này!' });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };