const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Route test server
app.get('/', (req, res) => {
  res.send('Backend POS Quán Nướng Tuổi Trẻ đang chạy!');
});

// Route đặt món / checkout
app.post('/api/checkout', async (req, res) => {
  try {
    const { selectedTable, newSelection, status } = req.body;

    // Lưu hoặc xử lý đơn hàng
    console.log("Đơn hàng mới từ bàn:", selectedTable, newSelection);

    return res.status(200).json({
      success: true,
      message: 'Gửi báo bếp thành công!',
      table: selectedTable,
      items: newSelection
    });
  } catch (error) {
    console.error('Lỗi lưu order:', error);
    return res.status(500).json({ error: 'Lỗi Backend khi xử lý đơn hàng!' });
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại port ${PORT}`);
});