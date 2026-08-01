const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'SECRET_KEY_123';

// Đăng nhập qua Username/Password hoặc Mã PIN
const login = async (req, res) => {
  try {
    const { username, password, pinCode } = req.body;

    let user;
    if (pinCode) {
      // Đăng nhập bằng PIN
      user = await prisma.user.findFirst({ where: { pinCode } });
    } else if (username && password) {
      // Đăng nhập bằng Username / Password
      user = await prisma.user.findUnique({ where: { username } });
      if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) user = null;
      }
    }

    if (!user) {
      return res.status(400).json({ error: 'Tài khoản, mật khẩu hoặc mã PIN không đúng!' });
    }

    // Tạo Access Token (12 tiếng)
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi đăng nhập: ' + error.message });
  }
};

module.exports = { login };