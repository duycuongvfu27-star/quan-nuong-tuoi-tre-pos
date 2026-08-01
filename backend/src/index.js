const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let activeOrders = []; 
let tableStatus = {};  
let completedOrders = []; 

let bankConfig = { 
  bankId: 'MB', 
  accountNo: '0984414434', 
  accountName: 'QUAN NUONG TUOI TRE' 
};

app.post('/api/bank', (req, res) => {
  if (req.body && req.body.bankId && req.body.accountNo) {
    bankConfig = req.body;
    res.json({ success: true, bankConfig });
  } else {
    res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
  }
});

app.get('/orders', (req, res) => {
  res.json({
    activeOrders,
    tableStatus,
    completedOrders,
    bankConfig
  });
});

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

app.post('/checkout', (req, res) => {
  const { tableName, items, tableStatus: newStatus, completedOrder, clearKitchen } = req.body;
  
  let existing = activeOrders.find(o => o.tableName === tableName);

  if (newStatus === 'empty') {
    activeOrders = activeOrders.filter(o => o.tableName !== tableName);
    tableStatus[tableName] = 'empty';
  } else if (items) {
    if (existing) {
      existing.items = items;
    } else {
      activeOrders.push({ tableName, items, kitchenItems: [] });
    }
    if (newStatus) tableStatus[tableName] = newStatus;
  } else if (newStatus) {
    tableStatus[tableName] = newStatus;
  }

  // Tự động xóa danh sách món chờ bếp khi bếp bấm đã nướng xong để khách gọi lượt 2 chỉ hiện món mới
  if (clearKitchen && existing) {
    existing.kitchenItems = [];
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