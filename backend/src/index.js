const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Route test
app.get('/', (req, res) => {
  res.send('Backend POS đang chạy ngon lành!');
});

// Hàm xử lý chung cho đơn hàng
const handleOrderRequest = (req, res) => {
  console.log('[ORDER MỚI RECEIVED]:', req.body);
  return res.status(200).json({
    success: true,
    message: 'Gửi báo bếp thành công!',
    data: req.body
  });
};

// Khai báo TẤT CẢ các đường dẫn mà Frontend có thể gọi
app.post('/api/orders', handleOrderRequest);
app.post('/orders', handleOrderRequest);
app.get('/api/orders', (req, res) => res.json([]));
app.get('/orders', (req, res) => res.json([]));

app.post('/api/checkout', handleOrderRequest);
app.post('/checkout', handleOrderRequest);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});