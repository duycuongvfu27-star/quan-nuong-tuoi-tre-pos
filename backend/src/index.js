const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Lưu cấu trúc chi tiết: { totalItems: tổng món tính tiền, pendingKitchenItems: món chờ bếp }
let activeOrders = {}; 
let tableStatus = {}; 
let completedOrdersServer = []; 

// API lấy toàn bộ trạng thái bàn, món ăn và lịch sử
app.get('/orders', (req, res) => {
  const formattedOrders = Object.keys(activeOrders).map(tableName => {
    const orderData = activeOrders[tableName];
    return {
      tableName,
      items: orderData.totalItems || [],
      kitchenItems: orderData.pendingKitchenItems || [],
      tableStatus: tableStatus[tableName] || 'empty'
    };
  });

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
    activeOrders[selectedTable] = { totalItems: [], pendingKitchenItems: [], status: 'ordering' };
  }

  if (newSelection && Array.isArray(newSelection)) {
    newSelection.forEach(newItem => {
      // 1. Thêm vào tổng món của bàn (để tính tiền lúc thanh toán)
      const existingTotal = activeOrders[selectedTable].totalItems.find(i => i.name === newItem.name);
      if (existingTotal) {
        existingTotal.quantity += newItem.quantity;
      } else {
        activeOrders[selectedTable].totalItems.push({ ...newItem });
      }

      // 2. Thêm vào món chờ bếp (để hiển thị lên màn hình KDS)
      const existingKitchen = activeOrders[selectedTable].pendingKitchenItems.find(i => i.name === newItem.name);
      if (existingKitchen) {
        existingKitchen.quantity += newItem.quantity;
      } else {
        activeOrders[selectedTable].pendingKitchenItems.push({ ...newItem });
      }
    });
  }

  tableStatus[selectedTable] = status || 'ordering';
  activeOrders[selectedTable].status = tableStatus[selectedTable];
  
  res.json({ success: true, activeOrders, tableStatus });
});

// API checkout, thanh toán, chuyển bàn hoặc bếp xác nhận xong ('busy')
app.post('/checkout', (req, res) => {
  const { tableName, items, tableStatus: newStatus, completedOrder } = req.body;
  if (!tableName) return res.status(400).json({ error: "Missing table name" });

  if (completedOrder) {
    completedOrdersServer.push(completedOrder);
  }

  if (newStatus === 'empty') {
    delete activeOrders[tableName];
    tableStatus[tableName] = 'empty';
  } else if (newStatus === 'busy') {
    // KHI BẾP BẤM "ĐÃ NƯỚNG XONG": Giữ bàn 'busy' nhưng XÓA SẠCH danh sách chờ của bếp để màn hình bếp mất đi
    tableStatus[tableName] = 'busy';
    if (activeOrders[tableName]) {
      activeOrders[tableName].status = 'busy';
      activeOrders[tableName].pendingKitchenItems = []; 
    }
  } else {
    if (items) {
      if (activeOrders[tableName]) {
        activeOrders[tableName].totalItems = items;
      } else {
        activeOrders[tableName] = { totalItems: items, pendingKitchenItems: [], status: newStatus || 'ordering' };
      }
    }
    if (newStatus) {
      tableStatus[tableName] = newStatus;
      if (activeOrders[tableName]) activeOrders[tableName].status = newStatus;
    }
  }

  res.json({ success: true, activeOrders, tableStatus, completedOrders: completedOrdersServer });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));