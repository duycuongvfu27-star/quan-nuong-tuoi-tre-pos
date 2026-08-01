const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Mở CORS cho tất cả các domain (Vercel, Mobile, Local)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Trang chủ backend test
app.get('/', (req, res) => {
  res.send('Backend POS Quán Nướng Tuổi Trẻ đang chạy ngon lành!');
});

// Route checkout chính
app.post('/api/checkout', (req, res) => {
  try {
    const { selectedTable, newSelection } = req.body;
    console.log(`[ORDER MỚI] Bàn: ${selectedTable}`, newSelection);

    return res.status(200).json({
      success: true,
      message: 'Gửi báo bếp thành công!',
      table: selectedTable,
      items: newSelection
    });
  } catch (error) {
    console.error('Lỗi Backend:', error);
    return res.status(500).json({ error: 'Lỗi Backend!' });
  }
});

// Route checkout phụ (Tránh trường hợp frontend gọi không có /api)
app.post('/checkout', (req, res) => {
  try {
    const { selectedTable, newSelection } = req.body;
    console.log(`[ORDER MỚI] Bàn: ${selectedTable}`, newSelection);

    return res.status(200).json({
      success: true,
      message: 'Gửi báo bếp thành công!',
      table: selectedTable,
      items: newSelection
    });
  } catch (error) {
    console.error('Lỗi Backend:', error);
    return res.status(500).json({ error: 'Lỗi Backend!' });
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại port ${PORT}`);
});