const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let activeOrders = {}; // Lưu danh sách món theo bàn: { "Bàn 01": [{name, price, quantity}] }
let tableStatus = {};  // Lưu trạng thái bàn: { "Bàn 01": "ordering" / "busy" / "empty" }

// API lấy toàn bộ trạng thái và đơn hàng cho tất cả các thiết bị đồng bộ
app.get('/orders', (req, res) => {
  const formattedOrders = Object.keys(activeOrders).map(tableName => ({
    tableName,
    items: activeOrders[tableName],
    tableStatus: tableStatus[tableName] || 'empty'
  }));

  res.json({
    tableStatus,
    activeOrders: formattedOrders
  });
});

// API nhận order từ khách quét QR hoặc nhân viên quản lý
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

// API thanh toán, chuyển bàn, cập nhật món
app.post('/checkout', (req, res) => {
  const { tableName, items, tableStatus: newStatus } = req.body;
  if (!tableName) return res.status(400).json({ error: "Missing table name" });

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

  res.json({ success: true, activeOrders, tableStatus });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));