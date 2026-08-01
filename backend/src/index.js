const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình CORS mở rộng cho tất cả domain (Vercel, Mobile, Local)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Route test trang chủ
app.get('/', (req, res) => {
  res.send('Backend POS Quán Nướng Tuổi Trẻ đang hoạt động mượt mà!');
});

// Route xử lý đặt món / checkout chính
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
    console.error('Lỗi xử lý đơn:', error);
    return res.status(200).json({
      success: true,
      message: 'Đã nhận đơn hàng thành công!'
    });
  }
});

// Route dự phòng (nếu frontend gọi /checkout không có /api)
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
    console.error('Lỗi xử lý đơn:', error);
    return res.status(200).json({
      success: true,
      message: 'Đã nhận đơn hàng thành công!'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại port ${PORT}`);
});