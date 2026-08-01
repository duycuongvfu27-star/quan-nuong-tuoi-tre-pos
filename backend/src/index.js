const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let activeOrders = {};         // Lưu danh sách món theo bàn đang hoạt động
let tableStatus = {};          // Lưu trạng thái bàn
let completedOrdersServer = []; // Lưu lịch sử các đơn đã thanh toán để đồng bộ báo cáo giữa các máy

// API lấy toàn bộ trạng thái bàn, đơn đang chạy và lịch sử báo cáo doanh thu
app.get('/orders', (req, res) => {
  const formattedOrders = Object.keys(activeOrders).map(tableName => ({
    tableName,
    items: activeOrders[tableName],
    tableStatus: tableStatus[tableName] || 'empty'
  }));

  res.json({
    tableStatus,
    activeOrders: formattedOrders,
    completedOrders: completedOrdersServer
  });
});

// API nhận order từ khách quét QR hoặc nhân viên POS
app.post('/api/orders', (req, res) => {
  const { selectedTable, newSelection, status } = req.body;
  if (!selectedTable) return res.status(400).json({ error: "Missing table name" });

  if (!activeOrders[selectedTable]) {
    activeOrders[selectedTable] = [];
  }

  if (newSelection && Array.isArray(newSelection)) {
    newSelection.forEach(newItem => {
      const existing = activeOrders[selectedTable].find(i => i.name === newItem.name);
      if (existing) {
        existing.quantity += newItem.quantity;
      } else {
        activeOrders[selectedTable].push({ ...newItem });
      }
    });
  }

  tableStatus[selectedTable] = status || 'ordering';
  res.json({ success: true, activeOrders, tableStatus });
});

// API thanh toán, chuyển bàn, cập nhật món và lưu lịch sử báo cáo ca
app.post('/checkout', (req, res) => {
  const { tableName, items, tableStatus: newStatus, completedOrder } = req.body;
  if (!tableName) return res.status(400).json({ error: "Missing table name" });

  // Nếu có gửi kèm thông tin hoàn tất đơn hàng (Thanh toán) thì lưu vào lịch sử chung
  if (completedOrder) {
    completedOrdersServer.push(completedOrder);
  }

  if (newStatus === 'empty') {
    delete activeOrders[tableName];
    tableStatus[tableName] = 'empty';
  } else {
    if (items) {
      activeOrders[tableName] = items;
    }
    if (newStatus) {
      tableStatus[tableName] = newStatus;
    }
  }

  res.json({ success: true, activeOrders, tableStatus, completedOrders: completedOrdersServer });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));