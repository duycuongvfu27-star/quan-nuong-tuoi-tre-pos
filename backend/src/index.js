const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let activeOrders = []; 
let tableStatus = {};  
let completedOrders = []; 

// Thông tin ngân hàng mặc định của quán
let bankConfig = { 
  bankId: 'MB', 
  accountNo: '0388888888', 
  accountName: 'QUAN NUONG TUOI TRE' 
};

// API nhận và lưu thông tin ngân hàng từ màn hình Quản lý / Cài đặt
app.post('/api/bank', (req, res) => {
  if (req.body && req.body.bankId && req.body.accountNo) {
    bankConfig = req.body;
    res.json({ success: true, bankConfig });
  } else {
    res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
  }
});

// API trả về toàn bộ dữ liệu trạng thái bàn, đơn hàng và cấu hình ngân hàng mới nhất
app.get('/orders', (req, res) => {
  res.json({
    activeOrders,
    tableStatus,
    completedOrders,
    bankConfig
  });
});

// API xử lý gửi order vào bếp
app.post('/api/orders', (req, res) => {
  const { selectedTable, newSelection, status } = req.body;
  if (!selectedTable || !newSelection) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin bàn hoặc món' });
  }

  let existing = activeOrders.find(o => o.tableName === selectedTable);
  if (existing) {
    newSelection.forEach(newItem => {
      let foundItem = existing.items.find(i => i.name === newItem.name);
      if (foundItem) {
        foundItem.quantity += newItem.quantity;
      } else {
        existing.items.push({ ...newItem });
      }
    });
    if (!existing.kitchenItems) existing.kitchenItems = [];
    newSelection.forEach(newItem => {
      let kItem = existing.kitchenItems.find(i => i.name === newItem.name);
      if (kItem) {
        kItem.quantity += newItem.quantity;
      } else {
        existing.kitchenItems.push({ ...newItem });
      }
    });
  } else {
    activeOrders.push({
      tableName: selectedTable,
      items: newSelection.map(i => ({ ...i })),
      kitchenItems: newSelection.map(i => ({ ...i }))
    });
  }

  tableStatus[selectedTable] = status || 'ordering';
  res.json({ success: true, activeOrders });
});

// API xử lý cập nhật trạng thái bàn và thanh toán
app.post('/checkout', (req, res) => {
  const { tableName, items, tableStatus: newStatus, completedOrder } = req.body;
  
  if (newStatus === 'empty') {
    activeOrders = activeOrders.filter(o => o.tableName !== tableName);
    tableStatus[tableName] = 'empty';
  } else if (items) {
    let existing = activeOrders.find(o => o.tableName === tableName);
    if (existing) {
      existing.items = items;
    } else {
      activeOrders.push({ tableName, items, kitchenItems: [] });
    }
    if (newStatus) tableStatus[tableName] = newStatus;
  } else if (newStatus) {
    tableStatus[tableName] = newStatus;
  }

  if (completedOrder) {
    completedOrders.unshift(completedOrder);
  }

  res.json({ success: true });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});