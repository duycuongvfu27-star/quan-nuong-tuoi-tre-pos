import React, { useState, useEffect } from 'react';

const API_URL = 'https://quan-nuong-tuoi-tre-pos.onrender.com';

const INITIAL_MENU = [
  {
    cat: "🔥 CÁC COMBO NƯỚNG",
    items: [
      { name: "Combo 1 (Dành cho 2-3 người)", price: 319000 },
      { name: "Combo 2 (Dành cho 3-4 người)", price: 459000 },
      { name: "Combo 3 (Dành cho 4-6 người)", price: 619000 },
      { name: "Combo 4 (Dành cho nhiều người)", price: 1199000 }
    ]
  },
  {
    cat: "🥗 ĐỒ ĂN NHẸ",
    items: [
      { name: "Hoa quả thập cẩm", price: 29000 },
      { name: "Ngô chiên", price: 35000 },
      { name: "Bánh mỳ nướng bơ", price: 19000 },
      { name: "Khoai tây chiên", price: 35000 },
      { name: "Salad rau tổng hợp (mới)", price: 29000 },
      { name: "Kim chi Hàn Quốc", price: 29000 }
    ]
  },
  {
    cat: "🥩 CÁC MÓN NƯỚNG",
    items: [
      { name: "Ba chỉ", price: 65000 },
      { name: "Sụn non ướp ngũ vị", price: 69000 },
      { name: "Nầm tươi ứa sữa (Hót)", price: 75000 },
      { name: "Bò cuộn nấm kim", price: 59000 },
      { name: "Má đào heo (Đỉnh)", price: 79000 },
      { name: "Chân gà rút xương (Best Seller)", price: 99000 },
      { name: "Dạ dày nướng xa tế", price: 69000 },
      { name: "Tôm tươi", price: 89000 },
      { name: "Mực trứng", price: 89000 }
    ]
  },
  {
    cat: "🍺 ĐỒ UỐNG",
    items: [
      { name: "Bia Sài Gòn, bia 333", price: 15000 },
      { name: "Bia Tiger", price: 22000 },
      { name: "Bò húc", price: 17000 },
      { name: "Trà đá (ca)", price: 20000 },
      { name: "Nước ngọt các loại", price: 13000 }
    ]
  }
];

const INITIAL_STAFF = [
  { name: "Quản Lý", pin: "123456", role: "Manager" },
  { name: "Thu Ngân 01", pin: "111111", role: "Staff" }
];

export default function App() {
  const [pin, setPin] = useState('');
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pos');
  const [settingsSubTab, setSettingsSubTab] = useState('menu');
  
  const [locationConfig, setLocationConfig] = useState(() => {
    const saved = localStorage.getItem('POS_LOCATION');
    return saved ? JSON.parse(saved) : { lat: 20.3833, lng: 106.1333, maxDistance: 50, enableProtection: true };
  });

  const [bankConfig, setBankConfig] = useState(() => {
    const saved = localStorage.getItem('POS_BANK');
    return saved ? JSON.parse(saved) : { bankId: 'MB', accountNo: '0388888888', accountName: 'QUAN NUONG TUOI TRE' };
  });

  const [staffList, setStaffList] = useState(() => {
    const saved = localStorage.getItem('POS_STAFF');
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  const [menu, setMenu] = useState(() => {
    const saved = localStorage.getItem('POS_MENU');
    return saved ? JSON.parse(saved) : INITIAL_MENU;
  });

  const [serverOrders, setServerOrders] = useState({});
  const [tables, setTables] = useState({});
  const [kitchenOrders, setKitchenOrders] = useState([]);

  const [selectedTable, setSelectedTable] = useState('Bàn 01');
  const [newSelection, setNewSelection] = useState([]);
  const [targetTable, setTargetTable] = useState('');

  const [showCheckout, setShowCheckout] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [completedOrders, setCompletedOrders] = useState([]);

  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPin, setNewStaffPin] = useState('');

  const [newItemCat, setNewItemCat] = useState("🥩 CÁC MÓN NƯỚNG");
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  useEffect(() => { localStorage.setItem('POS_LOCATION', JSON.stringify(locationConfig)); }, [locationConfig]);
  useEffect(() => { localStorage.setItem('POS_BANK', JSON.stringify(bankConfig)); }, [bankConfig]);
  useEffect(() => { localStorage.setItem('POS_STAFF', JSON.stringify(staffList)); }, [staffList]);
  useEffect(() => { localStorage.setItem('POS_MENU', JSON.stringify(menu)); }, [menu]);

  // HÀM ĐỒNG BỘ THỜI GIAN THỰC GIỮA CÁC THIẾT BỊ (GỌI MỖI 2 GIÂY)
  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/orders?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.tableStatus) setTables(data.tableStatus);

        const orderMap = {};
        const kOrders = [];

        if (data.activeOrders && Array.isArray(data.activeOrders)) {
          data.activeOrders.forEach(ord => {
            if (ord.tableName && ord.items && ord.items.length > 0) {
              orderMap[ord.tableName] = ord.items;
              if (ord.tableStatus === 'ordering' || ord.status === 'ordering') {
                kOrders.push({
                  tableName: ord.tableName,
                  items: ord.items
                });
              }
            }
          });
        }
        setServerOrders(orderMap);
        if (kOrders.length > 0) setKitchenOrders(kOrders);
      }
    } catch (err) {
      console.error("Lỗi sync:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000); // 2 giây sync một lần giữa các thiết bị
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async () => {
    const foundStaff = staffList.find(s => s.pin === pin);
    if (foundStaff) {
      setUser(foundStaff);
      setPin('');
    } else {
      alert('Mã PIN không đúng! Nhập: 123456 hoặc 111111');
    }
  };

  const handleGetCurrentGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationConfig({
            ...locationConfig,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          alert(`✅ Đã lấy tọa độ GPS hiện tại!\nVĩ độ: ${pos.coords.latitude}\nKinh độ: ${pos.coords.longitude}`);
        },
        (err) => alert("Không thể lấy tọa độ GPS! Hãy bật định vị thiết bị.")
      );
    } else {
      alert("Trình duyệt không hỗ trợ Geolocation!");
    }
  };

  const updateNewSelection = (name, price, delta) => {
    setNewSelection(prev => {
      const currentList = [...prev];
      const index = currentList.findIndex(i => i.name === name);

      if (index > -1) {
        const newQty = currentList[index].quantity + delta;
        if (newQty <= 0) {
          currentList.splice(index, 1);
        } else {
          currentList[index] = { ...currentList[index], quantity: newQty };
        }
      } else if (delta > 0) {
        currentList.push({ name, price, quantity: 1 });
      }

      return currentList;
    });
  };

  const handleModifyCurrentOrder = async (itemName, delta) => {
    const currentItems = [...(serverOrders[selectedTable] || [])];
    const index = currentItems.findIndex(i => i.name === itemName);

    if (index > -1) {
      const newQty = currentItems[index].quantity + delta;
      if (newQty <= 0) {
        currentItems.splice(index, 1);
      } else {
        currentItems[index].quantity = newQty;
      }
    }

    const total = currentItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    setServerOrders(prev => ({ ...prev, [selectedTable]: currentItems }));

    try {
      await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName: selectedTable,
          items: currentItems,
          totalAmount: total,
          tableStatus: currentItems.length > 0 ? (tables[selectedTable] || 'busy') : 'empty'
        })
      });
      fetchData();
    } catch (e) {
      alert("Lỗi cập nhật!");
    }
  };

  const sendOrderToKitchen = async () => {
    if (newSelection.length === 0) {
      alert("⚠️ Vui lòng chọn món mới trước khi gửi!");
      return;
    }

    const itemsToSend = [...newSelection];

    const currentTableItems = serverOrders[selectedTable] || [];
    const merged = [...currentTableItems];
    
    itemsToSend.forEach(newItem => {
      const found = merged.find(i => i.name === newItem.name);
      if (found) {
        found.quantity += newItem.quantity;
      } else {
        merged.push({ ...newItem });
      }
    });

    setServerOrders(prev => ({ ...prev, [selectedTable]: merged }));

    setKitchenOrders(prev => {
      const existingK = prev.find(o => o.tableName === selectedTable);
      if (existingK) {
        return prev.map(o => o.tableName === selectedTable ? { ...o, items: [...o.items, ...itemsToSend] } : o);
      } else {
        return [...prev, { tableName: selectedTable, items: itemsToSend }];
      }
    });

    setTables(prev => ({ ...prev, [selectedTable]: 'ordering' }));
    setNewSelection([]);
    alert(`🟠 Đã báo bếp món mới cho ${selectedTable}!`);

    try {
      await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedTable,
          newSelection: itemsToSend,
          status: 'ordering'
        })
      });
      fetchData();
    } catch (e) {
      console.error("Lỗi ngầm gửi API:", e);
    }
  };

  const handleConfirmKitchen = async (tName) => {
    setKitchenOrders(prev => prev.filter(o => o.tableName !== tName));
    setTables(prev => ({ ...prev, [tName]: 'busy' }));

    try {
      await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName: tName,
          tableStatus: 'busy'
        })
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickMoveTable = async () => {
    if (!targetTable) {
      alert("Vui lòng chọn bàn trống muốn chuyển tới!");
      return;
    }

    const currentItems = serverOrders[selectedTable] || [];
    if (currentItems.length === 0) {
      alert("Bàn hiện tại không có đơn để chuyển!");
      return;
    }

    try {
      await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName: targetTable,
          items: currentItems,
          tableStatus: tables[selectedTable] || 'busy'
        })
      });

      await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName: selectedTable,
          tableStatus: 'empty'
        })
      });

      alert(`🚀 Đã chuyển toàn bộ đơn từ ${selectedTable} sang ${targetTable}!`);
      setSelectedTable(targetTable);
      setTargetTable('');
      fetchData();
    } catch (e) {
      alert("Lỗi khi chuyển bàn!");
    }
  };

  const handleCheckout = async () => {
    try {
      await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName: selectedTable,
          tableStatus: 'empty'
        })
      });

      setCompletedOrders(prev => [
        ...prev,
        {
          id: Date.now(),
          tableName: selectedTable,
          totalAmount: currentTotal,
          time: new Date().toLocaleTimeString(),
          itemsCount: activeServerItems.reduce((sum, i) => sum + i.quantity, 0)
        }
      ]);

      setServerOrders(prev => ({ ...prev, [selectedTable]: [] }));
      setTables(prev => ({ ...prev, [selectedTable]: 'empty' }));
      setKitchenOrders(prev => prev.filter(o => o.tableName !== selectedTable));
      setShowCheckout(false);
      setNewSelection([]);
      alert(`🟢 ${selectedTable} đã thanh toán & trả bàn trống!`);
      fetchData();
    } catch (e) {
      alert("Lỗi thanh toán!");
    }
  };

  const handleAddStaff = () => {
    if (!newStaffName || !newStaffPin) {
      alert("Vui lòng nhập tên nhân viên và mã PIN!");
      return;
    }
    setStaffList([...staffList, { name: newStaffName, pin: newStaffPin, role: "Staff" }]);
    setNewStaffName('');
    setNewStaffPin('');
    alert("✅ Đã thêm nhân viên mới!");
  };

  const handleDeleteStaff = (pinCode) => {
    if (pinCode === '123456') {
      alert("Không thể xóa tài khoản Quản Lý!");
      return;
    }
    if (window.confirm("Bạn muốn xóa nhân viên này?")) {
      setStaffList(staffList.filter(s => s.pin !== pinCode));
    }
  };

  const handleAddNewItem = () => {
    if (!newItemName || !newItemPrice) {
      alert("Vui lòng nhập tên món và giá!");
      return;
    }
    const newMenu = [...menu];
    const catObj = newMenu.find(c => c.cat === newItemCat);
    if (catObj) {
      catObj.items.push({ name: newItemName, price: Number(newItemPrice) });
      setMenu(newMenu);
      setNewItemName('');
      setNewItemPrice('');
      alert(`✅ Đã thêm món "${newItemName}"!`);
    }
  };

  const handleDeleteMenuItem = (catName, itemName) => {
    if (window.confirm(`Xóa món "${itemName}" khỏi Menu?`)) {
      setMenu(menu.map(cat => cat.cat === catName ? { ...cat, items: cat.items.filter(i => i.name !== itemName) } : cat));
    }
  };

  const handleItemPriceChange = (catName, itemName, newPriceVal) => {
    const val = Number(newPriceVal);
    setMenu(prev => prev.map(c => c.cat === catName ? {
      ...c,
      items: c.items.map(i => i.name === itemName ? { ...i, price: val } : i)
    } : c));
  };

  const activeServerItems = serverOrders[selectedTable] || [];
  const currentTotal = activeServerItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const totalShiftRevenue = completedOrders.reduce((sum, ord) => sum + ord.totalAmount, 0);

  const emptyTablesList = Array.from({ length: 16 })
    .map((_, idx) => `Bàn ${String(idx + 1).padStart(2, '0')}`)
    .filter(tName => (tables[tName] || 'empty') === 'empty' && tName !== selectedTable);

  if (!user) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '32px', borderRadius: '12px', textAlign: 'center', width: '320px', border: '1px solid #334155' }}>
          <h2 style={{ color: '#f97316', margin: '0 0 8px 0' }}>🔥 QUÁN NƯỚNG TUỔI TRẺ</h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>Hotline: 0842.16.3333</p>
          <input
            type="password"
            placeholder="Mã PIN (123456)"
            value={pin}
            onChange={e => setPin(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', textAlign: 'center', fontSize: '18px', marginBottom: '16px' }}
          />
          <button onClick={handleLogin} style={{ width: '100%', padding: '12px', backgroundColor: '#ea580c', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>🚀 ĐĂNG NHẬP POS</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', padding: '16px', fontFamily: 'sans-serif' }}>
      {/* Header Navigation */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', color: '#f97316' }}>🔥 QUÁN NƯỚNG TUỔI TRẺ POS</h1>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Hotline: 0842.16.3333</span>
          </div>

          <div style={{ display: 'flex', backgroundColor: '#1e293b', borderRadius: '6px', padding: '4px' }}>
            <button
              onClick={() => setActiveTab('pos')}
              style={{
                backgroundColor: activeTab === 'pos' ? '#ea580c' : 'transparent',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🛒 BÁN HÀNG
            </button>
            <button
              onClick={() => setActiveTab('kitchen')}
              style={{
                backgroundColor: activeTab === 'kitchen' ? '#ea580c' : 'transparent',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              👨‍🍳 BÁO BẾP ({kitchenOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              style={{
                backgroundColor: activeTab === 'settings' ? '#ea580c' : 'transparent',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ⚙️ CÀI ĐẶT HỆ THỐNG
            </button>
            <button
              onClick={() => setShowReport(true)}
              style={{
                backgroundColor: 'transparent',
                color: '#3b82f6',
                border: '1px solid #3b82f6',
                padding: '8px 12px',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginLeft: '8px'
              }}
            >
              📊 BÁO CÁO CA
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px' }}>👤 Nhân viên: <b>{user.name}</b></span>
          <button onClick={() => setUser(null)} style={{ backgroundColor: '#334155', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Thoát</button>
        </div>
      </header>

      {/* 1. GIAO DIỆN BÁN HÀNG POS */}
      {activeTab === 'pos' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {Array.from({ length: 16 }).map((_, idx) => {
              const tName = `Bàn ${String(idx + 1).padStart(2, '0')}`;
              const status = tables[tName] || 'empty';
              const isSelected = selectedTable === tName;

              let bg = '#10b981';
              let statusLabel = 'Trống';

              if (status === 'ordering') {
                bg = '#f97316';
                statusLabel = 'Có món mới';
              } else if (status === 'busy' || status === 'OCCUPIED') {
                bg = '#ef4444';
                statusLabel = 'Đang ăn';
              }

              return (
                <button
                  key={tName}
                  onClick={() => {
                    setSelectedTable(tName);
                    setNewSelection([]);
                    setTargetTable('');
                  }}
                  style={{
                    backgroundColor: bg,
                    color: '#fff',
                    border: isSelected ? '3px solid #fff' : 'none',
                    padding: '10px 4px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <div>{tName}</div>
                  <div style={{ fontSize: '10px', opacity: 0.9, marginTop: '2px' }}>{statusLabel}</div>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 2, backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', height: '62vh', overflowY: 'auto' }}>
              {menu.map((cat, idx) => (
                <div key={idx} style={{ marginBottom: '16px' }}>
                  <h3 style={{ color: '#f97316', borderBottom: '1px solid #334155', paddingBottom: '4px', margin: '0 0 8px 0', fontSize: '14px' }}>{cat.cat}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {cat.items.map((item, iIdx) => {
                      const existInNew = newSelection.find(i => i.name === item.name);
                      const qty = existInNew ? existInNew.quantity : 0;

                      return (
                        <div
                          key={iIdx}
                          onClick={() => updateNewSelection(item.name, item.price, 1)}
                          style={{
                            backgroundColor: qty > 0 ? '#334155' : '#0f172a',
                            padding: '12px 8px',
                            borderRadius: '6px',
                            border: qty > 0 ? '1px solid #f97316' : '1px solid #1e293b',
                            cursor: 'pointer',
                            textAlign: 'center',
                            position: 'relative'
                          }}
                        >
                          {qty > 0 && (
                            <span style={{ position: 'absolute', top: '4px', right: '4px', backgroundColor: '#ea580c', color: '#fff', borderRadius: '10px', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>
                              x{qty}
                            </span>
                          )}
                          <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{item.name}</div>
                          <div style={{ color: '#f97316', fontSize: '12px', marginTop: '4px' }}>{item.price.toLocaleString()}đ</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ flex: 1, backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
                  📌 Đang chọn: <span style={{ color: '#f97316' }}>{selectedTable}</span>
                </h3>

                {activeServerItems.length > 0 && (
                  <div style={{ backgroundColor: '#0f172a', padding: '8px', borderRadius: '6px', marginBottom: '12px', border: '1px solid #3b82f6', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#93c5fd', whiteSpace: 'nowrap', fontWeight: 'bold' }}>🔄 Chuyển sang:</span>
                    <select
                      value={targetTable}
                      onChange={e => setTargetTable(e.target.value)}
                      style={{ flex: 1, padding: '4px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '12px' }}
                    >
                      <option value="">-- Chọn bàn trống --</option>
                      {emptyTablesList.map(tName => (
                        <option key={tName} value={tName}>{tName}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleQuickMoveTable}
                      style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      CHUYỂN
                    </button>
                  </div>
                )}

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold' }}>📋 MÓN ĐÃ BÁO BẾP:</div>
                  <div style={{ maxHeight: '18vh', overflowY: 'auto', backgroundColor: '#0f172a', padding: '8px', borderRadius: '6px' }}>
                    {activeServerItems.length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>Chưa có món</div>
                    ) : (
                      activeServerItems.map(item => (
                        <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
                          <span style={{ width: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button onClick={() => handleModifyCurrentOrder(item.name, -1)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '3px', width: '20px', height: '20px', cursor: 'pointer' }}>-</button>
                            <b style={{ color: '#f97316' }}>x{item.quantity}</b>
                            <button onClick={() => handleModifyCurrentOrder(item.name, 1)} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '3px', width: '20px', height: '20px', cursor: 'pointer' }}>+</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#f97316', marginBottom: '6px', fontWeight: 'bold' }}>➕ MÓN MỚI LẦN NÀY (CÓ CỘNG TRỪ):</div>
                  <div style={{ maxHeight: '12vh', overflowY: 'auto', backgroundColor: '#0f172a', padding: '8px', borderRadius: '6px' }}>
                    {newSelection.length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center' }}>Bấm món bên trái để chọn</div>
                    ) : (
                      newSelection.map(item => (
                        <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px' }}>
                          <span style={{ width: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button onClick={() => updateNewSelection(item.name, item.price, -1)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '3px', width: '20px', height: '20px', cursor: 'pointer' }}>-</button>
                            <b style={{ color: '#38bdf8' }}>x{item.quantity}</b>
                            <button onClick={() => updateNewSelection(item.name, item.price, 1)} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '3px', width: '20px', height: '20px', cursor: 'pointer' }}>+</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 'bold', margin: '8px 0', borderTop: '1px solid #334155', paddingTop: '8px' }}>
                  <span>TỔNG TIỀN BÀN:</span>
                  <span style={{ color: '#4ade80' }}>{currentTotal.toLocaleString()}đ</span>
                </div>
                <button onClick={sendOrderToKitchen} style={{ width: '100%', padding: '10px', backgroundColor: '#f97316', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '8px' }}>
                  🟠 GỬI BÁO BẾP MÓN MỚI
                </button>
                <button onClick={() => setShowCheckout(true)} style={{ width: '100%', padding: '10px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  💳 THANH TOÁN VIETQR
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 2. MÀN HÌNH BÁO BẾP KDS */}
      {activeTab === 'kitchen' && (
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', minHeight: '75vh' }}>
          <h2 style={{ color: '#f97316', margin: '0 0 16px 0' }}>👨‍🍳 MÀN HÌNH BÁO BẾP (KDS)</h2>
          {kitchenOrders.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '100px' }}>
              <h3>🎉 Hiện tại không có món mới nào cần nướng!</h3>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {kitchenOrders.map((ord, idx) => (
                <div key={idx} style={{ backgroundColor: '#0f172a', border: '2px solid #f97316', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '8px', marginBottom: '12px' }}>
                      <h3 style={{ margin: 0, color: '#f97316' }}>🔥 {ord.tableName}</h3>
                      <span style={{ fontSize: '11px', backgroundColor: '#ea580c', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>Món mới</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                      {ord.items && ord.items.map((item, iIdx) => (
                        <div key={iIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 'bold' }}>
                          <span>{item.name}</span>
                          <b style={{ color: '#ea580c', fontSize: '18px' }}>x{item.quantity}</b>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => handleConfirmKitchen(ord.tableName)} style={{ width: '100%', padding: '10px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    ✅ ĐÃ NƯỚNG XONG
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. TRUNG TÂM CÀI ĐẶT HỆ THỐNG */}
      {activeTab === 'settings' && (
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', minHeight: '75vh' }}>
          <h2 style={{ color: '#f97316', margin: '0 0 16px 0' }}>⚙️ TRUNG TÂM CÀI ĐẶT HỆ THỐNG</h2>

          {/* Sub-menu Cài đặt */}
          <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #334155', paddingBottom: '12px', marginBottom: '20px' }}>
            <button
              onClick={() => setSettingsSubTab('menu')}
              style={{ backgroundColor: settingsSubTab === 'menu' ? '#3b82f6' : '#0f172a', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              📖 Quản Lý Menu & Nhập Giá Mới
            </button>
            <button
              onClick={() => setSettingsSubTab('qr')}
              style={{ backgroundColor: settingsSubTab === 'qr' ? '#3b82f6' : '#0f172a', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              📱 Mã QR Order Cho 16 Bàn
            </button>
            <button
              onClick={() => setSettingsSubTab('location')}
              style={{ backgroundColor: settingsSubTab === 'location' ? '#3b82f6' : '#0f172a', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              📍 Định Vị GPS & Chống Order Từ Xa
            </button>
            <button
              onClick={() => setSettingsSubTab('bank')}
              style={{ backgroundColor: settingsSubTab === 'bank' ? '#3b82f6' : '#0f172a', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              💳 Tài Khoản VietQR
            </button>
            <button
              onClick={() => setSettingsSubTab('staff')}
              style={{ backgroundColor: settingsSubTab === 'staff' ? '#3b82f6' : '#0f172a', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              👥 Nhân Viên & Mã PIN
            </button>
          </div>

          {/* SUBTAB: TẠO MÃ QR ORDER CHO 16 BÀN */}
          {settingsSubTab === 'qr' && (
            <div>
              <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #334155' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#4ade80' }}>📱 Danh Sách Mã QR Order Đã Tạo Cho 16 Bàn</h3>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Anh có thể lưu hình ảnh này để in ấn và dán trực tiếp lên từng bàn ăn của quán.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {Array.from({ length: 16 }).map((_, idx) => {
                  const tName = `Bàn ${String(idx + 1).padStart(2, '0')}`;
                  const orderUrl = `http://localhost:5173/?table=${encodeURIComponent(tName)}`;
                  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(orderUrl)}`;

                  return (
                    <div key={tName} style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #334155', textAlign: 'center' }}>
                      <h3 style={{ margin: '0 0 8px 0', color: '#f97316' }}>🔥 {tName}</h3>
                      <img src={qrApiUrl} alt={`QR ${tName}`} style={{ width: '140px', height: '180px', borderRadius: '6px', backgroundColor: '#fff', padding: '8px', margin: '8px 0' }} />
                      <div style={{ fontSize: '10px', color: '#64748b', wordBreak: 'break-all' }}>{orderUrl}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUBTAB: QUẢN LÝ MENU VỚI Ô NHẬP GIÁ TRỰC TIẾP */}
          {settingsSubTab === 'menu' && (
            <div>
              <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #334155' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#4ade80' }}>➕ Thêm Món Mới Vào Menu</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <select
                    value={newItemCat}
                    onChange={e => setNewItemCat(e.target.value)}
                    style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                  >
                    {menu.map(c => <option key={c.cat} value={c.cat}>{c.cat}</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="Tên món mới"
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    style={{ flex: 2, padding: '10px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                  />
                  <input
                    type="number"
                    placeholder="Giá bán (VNĐ)"
                    value={newItemPrice}
                    onChange={e => setNewItemPrice(e.target.value)}
                    style={{ flex: 1, padding: '10px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                  />
                  <button onClick={handleAddNewItem} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    LƯU MÓN MỚI
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {menu.map((catObj, idx) => (
                  <div key={idx} style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <h3 style={{ color: '#f97316', margin: '0 0 12px 0', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>{catObj.cat}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {catObj.items.map((item, iIdx) => (
                        <div key={iIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #1e293b', paddingBottom: '8px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '13px', flex: 1 }}>{item.name}</span>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Giá (đ):</span>
                            <input
                              type="number"
                              value={item.price}
                              onChange={e => handleItemPriceChange(catObj.cat, item.name, e.target.value)}
                              style={{
                                width: '110px',
                                padding: '6px',
                                borderRadius: '4px',
                                backgroundColor: '#1e293b',
                                color: '#4ade80',
                                fontWeight: 'bold',
                                border: '1px solid #3b82f6',
                                textAlign: 'right',
                                fontSize: '14px'
                              }}
                            />
                          </div>

                          <button onClick={() => handleDeleteMenuItem(catObj.cat, item.name)} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                            Xóa
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUBTAB: ĐỊNH VỊ GPS VÀ CHỐNG ORDER TỪ XA */}
          {settingsSubTab === 'location' && (
            <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '8px', maxWidth: '550px', border: '1px solid #334155' }}>
              <h3 style={{ color: '#4ade80', margin: '0 0 16px 0' }}>📍 Cấu Hình Bảo Vệ Chống Order Từ Xa</h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', padding: '10px', backgroundColor: '#1e293b', borderRadius: '6px' }}>
                <input
                  type="checkbox"
                  id="enableProtection"
                  checked={locationConfig.enableProtection}
                  onChange={e => setLocationConfig({ ...locationConfig, enableProtection: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="enableProtection" style={{ fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', color: '#f97316' }}>
                  Kích hoạt chặn khách ở xa order bằng QR
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>Kinh Độ / Vĩ Độ GPS Quán:</label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <input
                      type="number"
                      placeholder="Vĩ độ (Lat)"
                      value={locationConfig.lat}
                      onChange={e => setLocationConfig({ ...locationConfig, lat: Number(e.target.value) })}
                      style={{ flex: 1, padding: '10px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                    />
                    <input
                      type="number"
                      placeholder="Kinh độ (Lng)"
                      value={locationConfig.lng}
                      onChange={e => setLocationConfig({ ...locationConfig, lng: Number(e.target.value) })}
                      style={{ flex: 1, padding: '10px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                    />
                  </div>
                  <button
                    onClick={handleGetCurrentGPS}
                    style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', marginTop: '8px', fontWeight: 'bold' }}
                  >
                    🎯 Tự động lấy vị trí hiện tại của thiết bị này
                  </button>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>Bán kính cho phép Order (Mét):</label>
                  <input
                    type="number"
                    value={locationConfig.maxDistance}
                    onChange={e => setLocationConfig({ ...locationConfig, maxDistance: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', marginTop: '4px' }}
                  />
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0' }}>Khách cách quán xa hơn số mét này sẽ bị chặn order.</p>
                </div>

                <button onClick={() => alert("✅ Đã lưu cấu hình GPS!")} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}>
                  LƯU CẤU HÌNH ĐỊNH VỊ
                </button>
              </div>
            </div>
          )}

          {/* SUBTAB: TÀI KHOẢN NGÂN HÀNG VIETQR */}
          {settingsSubTab === 'bank' && (
            <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '8px', maxWidth: '500px', border: '1px solid #334155' }}>
              <h3 style={{ color: '#4ade80', margin: '0 0 16px 0' }}>💳 Cấu Hình Mã QR Ngân Hàng</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>Mã Ngân Hàng (MB, VCB, TCB, ACB...):</label>
                  <input
                    type="text"
                    value={bankConfig.bankId}
                    onChange={e => setBankConfig({ ...bankConfig, bankId: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>Số Tài Khoản:</label>
                  <input
                    type="text"
                    value={bankConfig.accountNo}
                    onChange={e => setBankConfig({ ...bankConfig, accountNo: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#94a3b8' }}>Tên Chủ Tài Khoản:</label>
                  <input
                    type="text"
                    value={bankConfig.accountName}
                    onChange={e => setBankConfig({ ...bankConfig, accountName: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', marginTop: '4px' }}
                  />
                </div>
                <button onClick={() => alert("✅ Đã lưu cấu hình tài khoản VietQR!")} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}>
                  LƯU THÔNG TIN NGÂN HÀNG
                </button>
              </div>
            </div>
          )}

          {/* SUBTAB: NHÂN VIÊN & MÃ PIN */}
          {settingsSubTab === 'staff' && (
            <div>
              <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #334155' }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#4ade80', fontSize: '15px' }}>➕ Thêm Nhân Viên Mới</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Tên nhân viên (Ví dụ: Thu Ngân 02)"
                    value={newStaffName}
                    onChange={e => setNewStaffName(e.target.value)}
                    style={{ flex: 2, padding: '10px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                  />
                  <input
                    type="password"
                    placeholder="Mã PIN đăng nhập (6 số)"
                    value={newStaffPin}
                    onChange={e => setNewStaffPin(e.target.value)}
                    style={{ flex: 1, padding: '10px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155' }}
                  />
                  <button onClick={handleAddStaff} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    THÊM NHÂN VIÊN
                  </button>
                </div>
              </div>

              <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '16px', border: '1px solid #334155' }}>
                <h3 style={{ color: '#f97316', margin: '0 0 12px 0' }}>📋 Danh Sách Nhân Viên Hệ Thống</h3>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1e293b', color: '#94a3b8' }}>
                      <th style={{ padding: '10px' }}>Tên Nhân Viên</th>
                      <th style={{ padding: '10px' }}>Mã PIN</th>
                      <th style={{ padding: '10px' }}>Chức Vụ</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((st, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{st.name}</td>
                        <td style={{ padding: '10px', color: '#f97316' }}>{st.pin}</td>
                        <td style={{ padding: '10px' }}>{st.role}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          <button onClick={() => handleDeleteStaff(st.pin)} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Xóa</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL BÁO CÁO DOANH THU */}
      {showReport && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', width: '500px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#f97316' }}>📊 BÁO CÁO DOANH THU CA</h3>
              <button onClick={() => setShowReport(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '6px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>TỔNG DOANH THU</span>
                <h3 style={{ color: '#4ade80', margin: '4px 0 0 0' }}>{totalShiftRevenue.toLocaleString()}đ</h3>
              </div>
              <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '6px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>SỐ ĐƠN THÀNH CÔNG</span>
                <h3 style={{ color: '#60a5fa', margin: '4px 0 0 0' }}>{completedOrders.length} đơn</h3>
              </div>
            </div>

            <div style={{ maxHeight: '200px', overflowY: 'auto', backgroundColor: '#0f172a', borderRadius: '6px' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#334155', color: '#94a3b8' }}>
                    <th style={{ padding: '8px' }}>Giờ</th>
                    <th style={{ padding: '8px' }}>Bàn</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Tổng tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {completedOrders.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>Chưa có đơn thanh toán nào</td>
                    </tr>
                  ) : (
                    completedOrders.map((ord, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '8px' }}>{ord.time}</td>
                        <td style={{ padding: '8px', color: '#f97316', fontWeight: 'bold' }}>{ord.tableName}</td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#4ade80', fontWeight: 'bold' }}>{ord.totalAmount.toLocaleString()}đ</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THANH TOÁN VIETQR */}
      {showCheckout && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', textAlign: 'center', width: '360px', border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#f97316' }}>Thanh Toán {selectedTable}</h3>
            <h2 style={{ color: '#4ade80', margin: '0 0 8px 0' }}>{currentTotal.toLocaleString()}đ</h2>
            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 8px 0' }}>{bankConfig.bankId} - {bankConfig.accountNo} ({bankConfig.accountName})</p>
            <img
              src={`https://img.vietqr.io/image/${bankConfig.bankId}-${bankConfig.accountNo}-compact2.png?amount=${currentTotal}&addInfo=Thanh%20toan%20${selectedTable}`}
              alt="VietQR"
              style={{ width: '200px', borderRadius: '8px', margin: '8px 0', border: '1px solid #fff' }}
            />
            <button onClick={handleCheckout} style={{ width: '100%', padding: '12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '8px' }}>
              ✅ THANH TOÁN XONG (TRẢ BÀN XANH)
            </button>
            <button onClick={() => setShowCheckout(false)} style={{ width: '100%', padding: '8px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>HỦY</button>
          </div>
        </div>
      )}
    </div>
  );
}