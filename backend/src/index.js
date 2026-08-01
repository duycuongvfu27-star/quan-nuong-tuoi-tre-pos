const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const ordersController = require('./modules/orders/orders.controller');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Gắn io vào req để phát tin hiệu realtime
app.use((req, res, next) => {
  req.io = io;
  next();
});

// APIs
app.get('/api/orders', ordersController.getOrders);
app.post('/api/checkout', ordersController.handleCheckout);

app.get('/api/staff', (req, res) => {
  res.json([
    { name: 'Quản Lý', pin: '123456', role: 'manager' },
    { name: 'Thu Ngân', pin: '111111', role: 'staff' }
  ]);
});

io.on('connection', (socket) => {
  console.log('⚡ Máy POS/Bếp đã kết nối:', socket.id);
});

const PORT = 5002;
server.listen(PORT, () => {
  console.log(`🔥 POS Backend Realtime đang chạy tại http://localhost:${PORT}`);
});