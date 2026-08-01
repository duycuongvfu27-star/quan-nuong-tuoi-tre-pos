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
      { name: "Salad rau tổng hợp", price: 29000 },
      { name: "Salad hoa quả", price: 39000 },
      { name: "Kim chi Hàn Quốc", price: 29000 }
    ]
  },
  {
    cat: "🥩 CÁC MÓN NƯỚNG",
    items: [
      { name: "Ba chỉ", price: 65000 },
      { name: "Sụn non ướp ngũ vị", price: 69000 },
      { name: "Nầm tươi ứa sữa", price: 75000 },
      { name: "Bò cuộn nấm kim", price: 59000 },
      { name: "Thịt dải heo", price: 69000 },
      { name: "Má đào heo", price: 79000 },
      { name: "Nọng má tươi", price: 79000 },
      { name: "Chân gà rút xương", price: 99000 },
      { name: "Chân gà rút xương (đĩa nhỏ)", price: 59000 },
      { name: "Lòng non", price: 59000 },
      { name: "Khâu đuôi giòn sần sật", price: 69000 },
      { name: "Lòng già mũm mĩm", price: 59000 },
      { name: "Dạ dày nướng xa tế", price: 69000 },
      { name: "Tôm tươi", price: 89000 },
      { name: "Mực rụng trứng", price: 89000 },
      { name: "Bạch tuộc nướng xa tế", price: 79000 },
      { name: "Xúc xích ướp ngũ vị", price: 59000 },
      { name: "Dồi sụn ướp ngũ vị", price: 59000 },
      { name: "Lạp xưởng nướng thượng hạng", price: 59000 },
      { name: "Dải thăn bò nướng tảng", price: 79000 },
      { name: "Nạc vai nướng tảng", price: 69000 },
      { name: "Bò ăn dỏi lăn", price: 79000 },
      { name: "U bò nướng", price: 89000 },
      { name: "Rẻ sườn nướng xa tế", price: 69000 },
      { name: "Bắp bò ướp ngũ vị", price: 79000 }
    ]
  },
  {
    cat: "🍺 ĐỒ UỐNG",
    items: [
      { name: "Rượu ngô non, táo mèo", price: 40000 },
      { name: "Bia Sài Gòn, bia 333", price: 15000 },
      { name: "Bia Tiger", price: 22000 },
      { name: "Bò húc", price: 17000 },
      { name: "Nước lọc", price: 7000 },
      { name: "Trà đá, thuốc lá", price: 20000 },
      { name: "Rượu dừa", price: 65000 },
      { name: "Nước ngọt các loại", price: 13000 }
    ]
  }
];

const INITIAL_STAFF = [
  { name: "Quản Lý", pin: "123456", role: "manager" },
  { name: "Thu Ngân 01", pin: "111111", role: "staff" }
];

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const tableParam = urlParams.get('table');
  
  const formattedTableNum = tableParam ? String(tableParam).padStart(2, '0') : '';

  const [pin, setPin] = useState('');
  const [user, setUser] = useState(tableParam ? { name: `Khách (Bàn ${formattedTableNum})`, role: 'customer' } : null);
  const [activeTab, setActiveTab] = useState('pos');
  const [settingsSubTab, setSettingsSubTab] = useState('menu');

  const [locationConfig, setLocationConfig] = useState(() => {
    const saved = localStorage.getItem('POS_LOCATION');
    return saved ? JSON.parse(saved) : { lat: 20.3833, lng: 106.1333, maxDistance: 50, enableProtection: true };
  });

  const [bankConfig, setBankConfig] = useState({ bankId: 'MB', accountNo: '0388888888', accountName: 'QUAN NUONG TUOI TRE' });

  const [staffList, setStaffList] = useState(() => {
    const saved = localStorage.getItem('POS_STAFF');
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  const [menu, setMenu] = useState(() => {
    const saved = localStorage.getItem('POS_MENU_V2');
    return saved ? JSON.parse(saved) : INITIAL_MENU;
  });

  const [serverOrders, setServerOrders] = useState({});
  const [tables, setTables] = useState({});
  const [kitchenOrders, setKitchenOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  const [selectedTable, setSelectedTable] = useState('Bàn 01');
  const [newSelection, setNewSelection] = useState([]);
  const [targetTable, setTargetTable] = useState('');
  const [dismissedKitchenTables, setDismissedKitchenTables] = useState([]);

  const [showCheckout, setShowCheckout] = useState(false);
  const [showCustomerCheckout, setShowCustomerCheckout] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('staff');

  const [newItemCat, setNewItemCat] = useState("🥩 CÁC MÓN NƯỚNG");
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  useEffect(() => { localStorage.setItem('POS_LOCATION', JSON.stringify(locationConfig)); }, [locationConfig]);
  useEffect(() => { localStorage.setItem('POS_STAFF', JSON.stringify(staffList)); }, [staffList]);
  useEffect(() => { localStorage.setItem('POS_MENU_V2', JSON.stringify(menu)); }, [menu]);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_URL}/orders?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.tableStatus) setTables(data.tableStatus);
        if (data.completedOrders && Array.isArray(data.completedOrders)) {
          setCompletedOrders(data.completedOrders);
        }

        // ĐỒNG BỘ THÔNG TIN NGÂN HÀNG TỪ SERVER CHUNG
        if (data.bankConfig) {
          setBankConfig(data.bankConfig);
        }

        const orderMap = {};
        const kOrders = [];

        if (data.activeOrders && Array.isArray(data.activeOrders)) {
          data.activeOrders.forEach(ord => {
            if (ord.tableName && ord.items && ord.items.length > 0) {
              orderMap[ord.tableName] = ord.items;
              
              if (ord.kitchenItems && ord.kitchenItems.length > 0) {
                kOrders.push({
                  tableName: ord.tableName,
                  items: ord.kitchenItems
                });
              }
            }
          });
        }
        const filteredKOrders = kOrders.filter(o => !dismissedKitchenTables.includes(o.tableName));
        setServerOrders(orderMap);
        setKitchenOrders(filteredKOrders);
      }
    } catch (err) {
      console.error("Lỗi sync:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveBankConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/api/bank`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankConfig)
      });
      if (res.ok) {
        alert("✅ Đã lưu và đồng bộ thông tin ngân hàng thành công cho toàn hệ thống!");
      } else {
        alert("❌ Lỗi lưu thông tin ngân hàng!");
      }
    } catch (e) {
      alert("❌ Lỗi kết nối máy chủ!");
    }
  };

  const handleLogin = () => {
    const found = staffList.find(s => s.pin === pin);
    if (found) {
      setUser(found);
      setPin('');
    } else {
      alert('❌ Mã PIN không chính xác!');
      setPin('');
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
        () => alert("Không thể lấy tọa độ GPS!")
      );
    }
  };

  const updateNewSelection = (name, price, delta) => {
    setNewSelection(prev => {
      const list = [...prev];
      const idx = list.findIndex(i => i.name === name);
      if (idx > -1) {
        list[idx].quantity += delta;
        if (list[idx].quantity <= 0) list.splice(idx, 1);
      } else if (delta > 0) {
        list.push({ name, price, quantity: 1 });
      }
      return list;
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
    const targetTable = tableParam ? `Bàn ${formattedTableNum}` : selectedTable;
    const itemsToSend = [...newSelection];

    try {
      await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedTable: targetTable,
          newSelection: itemsToSend,
          status: 'ordering'
        })
      });
      setNewSelection([]);
      alert(`🔔 Đã báo bếp thành công cho ${targetTable}!`);
      fetchData();
    } catch (e) {
      alert('❌ Lỗi kết nối máy chủ!');
    }
  };

  const handleConfirmKitchen = async (tName) => {
    setDismissedKitchenTables(prev => [...prev, tName]);
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
      console.error("Lỗi xác nhận bếp:", e);
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
    const activeItems = serverOrders[selectedTable] || [];
    const total = activeItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    const completedOrderData = {
      id: Date.now(),
      tableName: selectedTable,
      totalAmount: total,
      time: new Date().toLocaleTimeString(),
      staffName: user ? user.name : 'Nhân viên',
      items: [...activeItems]
    };

    try {
      await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName: selectedTable,
          tableStatus: 'empty',
          completedOrder: completedOrderData
        })
      });

      setShowCheckout(false);
      alert(`🟢 ${selectedTable} đã thanh toán thành công & trả bàn trống!`);
      fetchData();
    } catch (e) {
      alert("Lỗi thanh toán!");
    }
  };

  const handleAddStaff = () => {
    if (!newStaffName || !newStaffPin) {
      alert("Vui lòng nhập tên và mã PIN!");
      return;
    }
    setStaffList([...staffList, { name: newStaffName, pin: newStaffPin, role: newStaffRole }]);
    setNewStaffName('');
    setNewStaffPin('');
    alert("✅ Đã thêm nhân sự thành công!");
  };

  const handleDeleteStaff = (pinCode) => {
    if (pinCode === '123456') {
      alert("Không thể xóa tài khoản Quản Lý gốc!");
      return;
    }
    if (window.confirm("Bạn có chắc muốn xóa nhân sự này?")) {
      setStaffList(staffList.filter(s => s.pin !== pinCode));
    }
  };

  const handleAddNewItem = () => {
    if (!newItemName || !newItemPrice) {
      alert("Vui lòng nhập đầy đủ tên món và giá tiền!");
      return;
    }
    const updatedMenu = [...menu];
    const catObj = updatedMenu.find(c => c.cat === newItemCat);
    if (catObj) {
      catObj.items.push({ name: newItemName, price: Number(newItemPrice) });
      setMenu(updatedMenu);
      setNewItemName('');
      setNewItemPrice('');
      alert(`✅ Đã thêm món "${newItemName}" vào thực đơn!`);
    }
  };

  const handleDeleteMenuItem = (catName, itemName) => {
    if (window.confirm(`Xóa món "${itemName}" khỏi thực đơn?`)) {
      setMenu(menu.map(cat => cat.cat === catName ? { ...cat, items: cat.items.filter(i => i.name !== itemName) } : cat));
    }
  };

  const handleItemPriceChange = (catName, itemName, newPrice) => {
    const priceVal = Number(newPrice);
    setMenu(prev => prev.map(c => c.cat === catName ? {
      ...c,
      items: c.items.map(i => i.name === itemName ? { ...i, price: priceVal } : i)
    } : c));
  };

  const activeServerItems = serverOrders[selectedTable] || [];
  const currentTotal = activeServerItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const totalShiftRevenue = completedOrders.reduce((sum, ord) => sum + ord.totalAmount, 0);

  const emptyTablesList = Array.from({ length: 16 })
    .map((_, idx) => `Bàn ${String(idx + 1).padStart(2, '0')}`)
    .filter(tName => (tables[tName] || 'empty') === 'empty' && tName !== selectedTable);

  if (tableParam || (user && user.role === 'customer')) {
    const tName = `Bàn ${formattedTableNum}`;
    const cusItems = serverOrders[tName] || [];
    const cusTotal = cusItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    return (
      <div style={{ maxWidth: '480px', margin: '0 auto', background: '#0f172a', color: '#fff', padding: '16px', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
          <h2 style={{ color: '#f97316', margin: '0 0 4px 0' }}>🔥 QUÁN NƯỚNG TUỔI TRẺ</h2>
          <span style={{ fontSize: '14px', background: '#f97316', padding: '4px 14px', borderRadius: '12px', fontWeight: 'bold', display: 'inline-block', marginTop: '6px' }}>📍 Đang gọi món tại: {tName}</span>
        </div>

        {/* THỰC ĐƠN GỌI MÓN */}
        <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          <div style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>📖 THỰC ĐƠN GỌI MÓN</div>
          {menu.map((cat, idx) => (
            <div key={idx} style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#f97316', fontWeight: 'bold', marginBottom: '6px' }}>{cat.cat}</div>
              {cat.items.map((item, iIdx) => {
                const exist = newSelection.find(i => i.name === item.name);
                const q = exist ? exist.quantity : 0;
                return (
                  <div key={iIdx} onClick={() => updateNewSelection(item.name, item.price, 1)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '10px', borderRadius: '8px', marginBottom: '8px', cursor: 'pointer', border: q > 0 ? '2px solid #f97316' : '1px solid #334155' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{item.name}</div>
                      <div style={{ fontSize: '12px', color: '#f97316', marginTop: '2px' }}>{item.price.toLocaleString()}đ</div>
                    </div>
                    {q > 0 ? <span style={{ background: '#f97316', color: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>x{q}</span> : <span style={{ fontSize: '12px', color: '#38bdf8', padding: '4px 8px', background: '#1e293b', borderRadius: '6px' }}>+ Thêm</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* MÓN ĐANG CHỌN (CHƯA GỬI) */}
        <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          <div style={{ color: '#38bdf8', fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>🛒 MÓN ĐANG CHỌN (CHƯA GỬI):</div>
          {newSelection.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', padding: '8px' }}>Chưa chọn món nào</div>
          ) : (
            newSelection.map(item => (
              <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px solid #334155' }}>
                <span>{item.name} x{item.quantity}</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button onClick={() => updateNewSelection(item.name, item.price, -1)} style={{ background: '#ef4444', color: '#fff', border: 'none', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>-</button>
                  <b style={{ fontSize: '14px', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</b>
                  <button onClick={() => updateNewSelection(item.name, item.price, 1)} style={{ background: '#10b981', color: '#fff', border: 'none', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>+</button>
                </div>
              </div>
            ))
          )}
          <button onClick={sendOrderToKitchen} style={{ width: '100%', background: '#f97316', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', marginTop: '10px', cursor: 'pointer', fontSize: '15px' }}>🚀 GỬI ORDER CHO QUÁN</button>
        </div>

        {/* MÓN ĐÃ BÁO BẾP & THANH TOÁN VIETQR */}
        <div style={{ background: '#1e293b', padding: '12px', borderRadius: '8px' }}>
          <div style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>📋 MÓN ĐÃ BÁO BẾP:</div>
          {cusItems.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', padding: '8px' }}>Chưa có món nào</div>
          ) : (
            cusItems.map((i, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span>• {i.name} x{i.quantity}</span>
                <span style={{ color: '#f97316' }}>{(i.price * i.quantity).toLocaleString()}đ</span>
              </div>
            ))
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', borderTop: '1px solid #334155', paddingTop: '10px', fontWeight: 'bold', fontSize: '14px' }}>
            <span>Tổng cộng:</span>
            <span style={{ color: '#4ade80' }}>{cusTotal.toLocaleString()}đ</span>
          </div>

          {cusTotal > 0 && (
            <button
              onClick={() => setShowCustomerCheckout(true)}
              style={{ width: '100%', marginTop: '12px', padding: '12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
            >
              💳 THANH TOÁN VIETQR TẠI BÀN
            </button>
          )}
        </div>

        {/* MODAL VIETQR CHO KHÁCH HÀNG */}
        {showCustomerCheckout && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '16px' }}>
            <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', textAlign: 'center', width: '100%', maxWidth: '320px', border: '1px solid #334155' }}>
              <h3 style={{ margin: '0 0 6px 0', color: '#f97316', fontSize: '16px' }}>Thanh Toán {tName}</h3>
              <h2 style={{ color: '#4ade80', margin: '0 0 6px 0', fontSize: '22px' }}>{cusTotal.toLocaleString()}đ</h2>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 10px 0' }}>{bankConfig.bankId} - {bankConfig.accountNo}<br/>{bankConfig.accountName}</p>
              
              <div style={{ background: '#fff', padding: '6px', borderRadius: '8px', display: 'inline-block' }}>
                <img
                  src={`https://img.vietqr.io/image/${bankConfig.bankId}-${bankConfig.accountNo}-compact2.png?amount=${cusTotal}&addInfo=Thanh%20toan%20${tName}`}
                  alt="VietQR Khách"
                  style={{ width: '180px', borderRadius: '6px', display: 'block' }}
                />
              </div>

              <p style={{ fontSize: '11px', color: '#38bdf8', margin: '10px 0 6px 0', lineHeight: '1.4' }}>
                💡 <b>Mẹo nhanh:</b> Nhấn giữ vào mã QR trên, sau đó chọn <b>"Mở liên kết"</b> hoặc <b>"Mở trong App Ngân hàng"</b> để thanh toán ngay lập tức!
              </p>

              <button
                onClick={() => setShowCustomerCheckout(false)}
                style={{ width: '100%', padding: '10px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginTop: '6px' }}
              >
                ĐÓNG ✕
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

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
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '12px', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', color: '#f97316' }}>🔥 QUÁN NƯỚNG TUỔI TRẺ POS</h1>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Hotline: 0842.16.3333</span>
          </div>

          <div style={{ display: 'flex', backgroundColor: '#1e293b', borderRadius: '6px', padding: '4px', flexWrap: 'wrap', gap: '4px' }}>
            <button
              onClick={() => setActiveTab('pos')}
              style={{
                backgroundColor: activeTab === 'pos' ? '#ea580c' : 'transparent',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '12px'
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
                padding: '6px 12px',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '12px'
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
                padding: '6px 12px',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ⚙️ CÀI ĐẶT
            </button>
            <button
              onClick={() => setShowReport(true)}
              style={{
                backgroundColor: 'transparent',
                color: '#3b82f6',
                border: '1px solid #3b82f6',
                padding: '6px 10px',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              📊 BÁO CÁO
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px' }}>👤 <b>{user.name}</b></span>
          <button onClick={() => setUser(null)} style={{ backgroundColor: '#334155', color: '#ef4444', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Thoát</button>
        </div>
      </header>

      {activeTab === 'pos' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))', gap: '6px', marginBottom: '16px' }}>
            {Array.from({ length: 16 }).map((_, idx) => {
              const tName = `Bàn ${String(idx + 1).padStart(2, '0')}`;
              const status = tables[tName] || 'empty';
              const isSelected = selectedTable === tName;

              let bg = '#10b981';
              let statusLabel = 'Trống';

              if (status === 'ordering') {
                bg = '#f97316';
                statusLabel = 'Mới';
              } else if (status === 'busy' || status === 'OCCUPIED') {
                bg = '#ef4444';
                statusLabel = 'Ăn';
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
                    border: isSelected ? '2px solid #fff' : 'none',
                    padding: '8px 2px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '12px' }}>{tName}</div>
                  <div style={{ fontSize: '9px', opacity: 0.9, marginTop: '2px' }}>{statusLabel}</div>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px' }}>
              {menu.map((cat, idx) => (
                <div key={idx} style={{ marginBottom: '16px' }}>
                  <h3 style={{ color: '#f97316', borderBottom: '1px solid #334155', paddingBottom: '4px', margin: '0 0 8px 0', fontSize: '13px' }}>{cat.cat}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '6px' }}>
                    {cat.items.map((item, iIdx) => {
                      const existInNew = newSelection.find(i => i.name === item.name);
                      const qty = existInNew ? existInNew.quantity : 0;

                      return (
                        <div
                          key={iIdx}
                          onClick={() => updateNewSelection(item.name, item.price, 1)}
                          style={{
                            backgroundColor: qty > 0 ? '#334155' : '#0f172a',
                            padding: '10px 6px',
                            borderRadius: '6px',
                            border: qty > 0 ? '1px solid #f97316' : '1px solid #1e293b',
                            cursor: 'pointer',
                            textAlign: 'center',
                            position: 'relative'
                          }}
                        >
                          {qty > 0 && (
                            <span style={{ position: 'absolute', top: '4px', right: '4px', backgroundColor: '#ea580c', color: '#fff', borderRadius: '10px', padding: '1px 5px', fontSize: '9px', fontWeight: 'bold' }}>
                              x{qty}
                            </span>
                          )}
                          <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{item.name}</div>
                          <div style={{ color: '#f97316', fontSize: '11px', marginTop: '3px' }}>{item.price.toLocaleString()}đ</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: '#1e293b', padding: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ margin: '0', fontSize: '14px', borderBottom: '1px solid #334155', paddingBottom: '6px' }}>
                📌 Đang chọn: <span style={{ color: '#f97316' }}>{selectedTable}</span>
              </h3>

              {activeServerItems.length > 0 && (
                <div style={{ backgroundColor: '#0f172a', padding: '8px', borderRadius: '6px', border: '1px solid #3b82f6', display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#93c5fd', whiteSpace: 'nowrap', fontWeight: 'bold' }}>Chuyển bàn:</span>
                  <select
                    value={targetTable}
                    onChange={e => setTargetTable(e.target.value)}
                    style={{ flex: 1, padding: '4px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '11px' }}
                  >
                    <option value="">-- Chọn bàn --</option>
                    {emptyTablesList.map(tName => (
                      <option key={tName} value={tName}>{tName}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleQuickMoveTable}
                    style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '5px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    OK
                  </button>
                </div>
              )}

              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: 'bold' }}>📋 MÓN ĐÃ BÁO BẾP:</div>
                <div style={{ maxHeight: '14vh', overflowY: 'auto', backgroundColor: '#0f172a', padding: '6px', borderRadius: '6px' }}>
                  {activeServerItems.length === 0 ? (
                    <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center' }}>Chưa có món</div>
                  ) : (
                    activeServerItems.map(item => (
                      <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '11px' }}>
                        <span>{item.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button onClick={() => handleModifyCurrentOrder(item.name, -1)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '3px', width: '18px', height: '18px', cursor: 'pointer' }}>-</button>
                          <b style={{ color: '#f97316' }}>x{item.quantity}</b>
                          <button onClick={() => handleModifyCurrentOrder(item.name, 1)} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '3px', width: '18px', height: '18px', cursor: 'pointer' }}>+</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#f97316', marginBottom: '4px', fontWeight: 'bold' }}>➕ MÓN MỚI LẦN NÀY:</div>
                <div style={{ maxHeight: '12vh', overflowY: 'auto', backgroundColor: '#0f172a', padding: '6px', borderRadius: '6px' }}>
                  {newSelection.length === 0 ? (
                    <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center' }}>Chọn món ở danh sách trên</div>
                  ) : (
                    newSelection.map(item => (
                      <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '11px' }}>
                        <span>{item.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button onClick={() => updateNewSelection(item.name, item.price, -1)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '3px', width: '18px', height: '18px', cursor: 'pointer' }}>-</button>
                          <b style={{ color: '#38bdf8' }}>x{item.quantity}</b>
                          <button onClick={() => updateNewSelection(item.name, item.price, 1)} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '3px', width: '18px', height: '18px', cursor: 'pointer' }}>+</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', margin: '4px 0', borderTop: '1px solid #334155', paddingTop: '6px' }}>
                <span>TỔNG TIỀN:</span>
                <span style={{ color: '#4ade80' }}>{currentTotal.toLocaleString()}đ</span>
              </div>
              <button onClick={sendOrderToKitchen} style={{ width: '100%', padding: '12px', backgroundColor: '#f97316', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                🟠 GỬI BÁO BẾP MÓN MỚI
              </button>
              <button onClick={() => setShowCheckout(true)} style={{ width: '100%', padding: '12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                💳 THANH TOÁN VIETQR
              </button>
            </div>

          </div>
        </>
      )}

      {activeTab === 'kitchen' && (
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', minHeight: '70vh' }}>
          <h2 style={{ color: '#f97316', margin: '0 0 14px 0', fontSize: '16px' }}>👨‍🍳 MÀN HÌNH BÁO BẾP (KDS)</h2>
          {kitchenOrders.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '80px' }}>
              <h3>🎉 Hiện tại không có món mới nào cần nướng!</h3>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
              {kitchenOrders.map((ord, idx) => (
                <div key={idx} style={{ backgroundColor: '#0f172a', border: '2px solid #f97316', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '6px', marginBottom: '10px' }}>
                      <h3 style={{ margin: 0, color: '#f97316', fontSize: '15px' }}>🔥 {ord.tableName}</h3>
                      <span style={{ fontSize: '10px', backgroundColor: '#ea580c', color: '#fff', padding: '2px 5px', borderRadius: '4px' }}>Món mới</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                      {ord.items && ord.items.map((item, iIdx) => (
                        <div key={iIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold' }}>
                          <span>{item.name}</span>
                          <b style={{ color: '#ea580c', fontSize: '15px' }}>x{item.quantity}</b>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => handleConfirmKitchen(ord.tableName)} style={{ width: '100%', padding: '10px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                    ✅ ĐÃ NƯỚNG XONG
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', minHeight: '70vh' }}>
          <h2 style={{ color: '#f97316', margin: '0 0 14px 0', fontSize: '16px' }}>⚙️ TRUNG TÂM CÀI ĐẶT HỆ THỐNG</h2>

          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button onClick={() => setSettingsSubTab('menu')} style={{ backgroundColor: settingsSubTab === 'menu' ? '#3b82f6' : '#0f172a', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>📖 Menu</button>
            <button onClick={() => setSettingsSubTab('qr')} style={{ backgroundColor: settingsSubTab === 'qr' ? '#3b82f6' : '#0f172a', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>📱 Mã QR</button>
            <button onClick={() => setSettingsSubTab('location')} style={{ backgroundColor: settingsSubTab === 'location' ? '#3b82f6' : '#0f172a', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>📍 GPS</button>
            <button onClick={() => setSettingsSubTab('bank')} style={{ backgroundColor: settingsSubTab === 'bank' ? '#3b82f6' : '#0f172a', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>💳 Ngân Hàng</button>
            <button onClick={() => setSettingsSubTab('staff')} style={{ backgroundColor: settingsSubTab === 'staff' ? '#3b82f6' : '#0f172a', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>👥 Nhân Viên</button>
          </div>

          {settingsSubTab === 'qr' && (
            <div>
              <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #334155' }}>
                <h3 style={{ margin: '0 0 6px 0', color: '#4ade80', fontSize: '14px' }}>📱 Danh Sách Mã QR Order Cho 16 Bàn</h3>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>Quét mã này sẽ tự động nhận diện đúng bàn và hiển thị đầy đủ menu trên điện thoại.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                {Array.from({ length: 16 }).map((_, idx) => {
                  const tableNum = idx + 1;
                  const tName = `Bàn ${String(tableNum).padStart(2, '0')}`;
                  const orderUrl = `${window.location.origin}/?table=${tableNum}`;
                  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(orderUrl)}`;

                  return (
                    <div key={tName} style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155', textAlign: 'center' }}>
                      <h3 style={{ margin: '0 0 6px 0', color: '#f97316', fontSize: '14px' }}>🔥 {tName}</h3>
                      <img src={qrApiUrl} alt={`QR ${tName}`} style={{ width: '120px', height: '120px', borderRadius: '6px', backgroundColor: '#fff', padding: '6px', margin: '6px 0' }} />
                      <div style={{ fontSize: '9px', color: '#64748b', wordBreak: 'break-all' }}>{orderUrl}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {settingsSubTab === 'menu' && (
            <div>
              <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #334155' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#4ade80' }}>➕ Thêm Món Mới Vào Menu</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <select
                    value={newItemCat}
                    onChange={e => setNewItemCat(e.target.value)}
                    style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '12px' }}
                  >
                    {menu.map(c => <option key={c.cat} value={c.cat}>{c.cat}</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="Tên món"
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    style={{ flex: 2, minWidth: '120px', padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '12px' }}
                  />
                  <input
                    type="number"
                    placeholder="Giá (đ)"
                    value={newItemPrice}
                    onChange={e => setNewItemPrice(e.target.value)}
                    style={{ flex: 1, minWidth: '80px', padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '12px' }}
                  />
                  <button onClick={handleAddNewItem} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
                    LƯU
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {menu.map((catObj, idx) => (
                  <div key={idx} style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                    <h3 style={{ color: '#f97316', margin: '0 0 10px 0', borderBottom: '1px solid #334155', paddingBottom: '4px', fontSize: '13px' }}>{catObj.cat}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {catObj.items.map((item, iIdx) => (
                        <div key={iIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #1e293b', paddingBottom: '6px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '12px', flex: 1 }}>{item.name}</span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '10px' }}>
                            <input
                              type="number"
                              value={item.price}
                              onChange={e => handleItemPriceChange(catObj.cat, item.name, e.target.value)}
                              style={{
                                width: '90px',
                                padding: '4px',
                                borderRadius: '4px',
                                backgroundColor: '#1e293b',
                                color: '#4ade80',
                                fontWeight: 'bold',
                                border: '1px solid #3b82f6',
                                textAlign: 'right',
                                fontSize: '12px'
                              }}
                            />
                          </div>

                          <button onClick={() => handleDeleteMenuItem(catObj.cat, item.name)} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
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

          {settingsSubTab === 'location' && (
            <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', maxWidth: '500px', border: '1px solid #334155' }}>
              <h3 style={{ color: '#4ade80', margin: '0 0 14px 0', fontSize: '15px' }}>📍 Cấu Hình Bảo Vệ Chống Order Từ Xa</h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', padding: '8px', backgroundColor: '#1e293b', borderRadius: '6px' }}>
                <input
                  type="checkbox"
                  id="enableProtection"
                  checked={locationConfig.enableProtection}
                  onChange={e => setLocationConfig({ ...locationConfig, enableProtection: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="enableProtection" style={{ fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', color: '#f97316' }}>
                  Kích hoạt chặn khách ở xa order bằng QR
                </label>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8' }}>Kinh Độ / Vĩ Độ GPS Quán:</label>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <input
                      type="number"
                      placeholder="Vĩ độ"
                      value={locationConfig.lat}
                      onChange={e => setLocationConfig({ ...locationConfig, lat: Number(e.target.value) })}
                      style={{ flex: 1, padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '12px' }}
                    />
                    <input
                      type="number"
                      placeholder="Kinh độ"
                      value={locationConfig.lng}
                      onChange={e => setLocationConfig({ ...locationConfig, lng: Number(e.target.value) })}
                      style={{ flex: 1, padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '12px' }}
                    />
                  </div>
                  <button
                    onClick={handleGetCurrentGPS}
                    style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '8px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', marginTop: '6px', fontWeight: 'bold' }}
                  >
                    🎯 Lấy vị trí thiết bị hiện tại
                  </button>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8' }}>Bán kính cho phép (Mét):</label>
                  <input
                    type="number"
                    value={locationConfig.maxDistance}
                    onChange={e => setLocationConfig({ ...locationConfig, maxDistance: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', marginTop: '4px', fontSize: '12px' }}
                  />
                </div>

                <button onClick={() => alert("✅ Đã lưu cấu hình GPS!")} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', marginTop: '6px' }}>
                  LƯU CẤU HÌNH ĐỊNH VỊ
                </button>
              </div>
            </div>
          )}

          {settingsSubTab === 'bank' && (
            <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', maxWidth: '450px', border: '1px solid #334155' }}>
              <h3 style={{ color: '#4ade80', margin: '0 0 14px 0', fontSize: '15px' }}>💳 Cấu Hình Mã QR Ngân Hàng</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8' }}>Mã Ngân Hàng (MB, VCB...):</label>
                  <input
                    type="text"
                    value={bankConfig.bankId}
                    onChange={e => setBankConfig({ ...bankConfig, bankId: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', marginTop: '4px', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8' }}>Số Tài Khoản:</label>
                  <input
                    type="text"
                    value={bankConfig.accountNo}
                    onChange={e => setBankConfig({ ...bankConfig, accountNo: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', marginTop: '4px', fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8' }}>Tên Chủ Tài Khoản:</label>
                  <input
                    type="text"
                    value={bankConfig.accountName}
                    onChange={e => setBankConfig({ ...bankConfig, accountName: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', marginTop: '4px', fontSize: '12px' }}
                  />
                </div>
                <button onClick={handleSaveBankConfig} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', marginTop: '6px' }}>
                  LƯU THÔNG TIN NGÂN HÀNG
                </button>
              </div>
            </div>
          )}

          {settingsSubTab === 'staff' && (
            <div>
              <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #334155' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#4ade80', fontSize: '14px' }}>➕ Thêm Nhân Viên Mới</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Tên nhân viên"
                    value={newStaffName}
                    onChange={e => setNewStaffName(e.target.value)}
                    style={{ flex: 2, minWidth: '120px', padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '12px' }}
                  />
                  <input
                    type="password"
                    placeholder="Mã PIN (6 số)"
                    value={newStaffPin}
                    onChange={e => setNewStaffPin(e.target.value)}
                    style={{ flex: 1, minWidth: '90px', padding: '8px', borderRadius: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '12px' }}
                  />
                  <button onClick={handleAddStaff} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
                    THÊM
                  </button>
                </div>
              </div>

              <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', padding: '12px', border: '1px solid #334155' }}>
                <h3 style={{ color: '#f97316', margin: '0 0 10px 0', fontSize: '14px' }}>📋 Danh Sách Nhân Viên</h3>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1e293b', color: '#94a3b8' }}>
                      <th style={{ padding: '8px' }}>Tên</th>
                      <th style={{ padding: '8px' }}>PIN</th>
                      <th style={{ padding: '8px' }}>Quyền</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((st, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{st.name}</td>
                        <td style={{ padding: '8px', color: '#f97316' }}>{st.pin}</td>
                        <td style={{ padding: '8px' }}>{st.role}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          <button onClick={() => handleDeleteStaff(st.pin)} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Xóa</button>
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

      {showReport && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '10px' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', width: '100%', maxWidth: '550px', border: '1px solid #334155', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, color: '#f97316', fontSize: '15px' }}>📊 BÁO CÁO DOANH THU CA</h3>
              <button onClick={() => setShowReport(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '14px' }}>
              <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>TỔNG DOANH THU</span>
                <h3 style={{ color: '#4ade80', margin: '4px 0 0 0', fontSize: '15px' }}>{totalShiftRevenue.toLocaleString()}đ</h3>
              </div>
              <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>SỐ ĐƠN THÀNH CÔNG</span>
                <h3 style={{ color: '#60a5fa', margin: '4px 0 0 0', fontSize: '15px' }}>{completedOrders.length} đơn</h3>
              </div>
            </div>

            <div style={{ maxHeight: '180px', overflowY: 'auto', backgroundColor: '#0f172a', borderRadius: '6px', marginBottom: '10px' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#334155', color: '#94a3b8' }}>
                    <th style={{ padding: '6px' }}>Giờ</th>
                    <th style={{ padding: '6px' }}>Bàn</th>
                    <th style={{ padding: '6px' }}>Thu ngân</th>
                    <th style={{ padding: '6px', textAlign: 'right' }}>Tiền</th>
                    <th style={{ padding: '6px', textAlign: 'center' }}>Xem</th>
                  </tr>
                </thead>
                <tbody>
                  {completedOrders.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>Chưa có đơn</td>
                    </tr>
                  ) : (
                    completedOrders.map((ord) => (
                      <tr key={ord.id} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '6px' }}>{ord.time}</td>
                        <td style={{ padding: '6px', color: '#f97316', fontWeight: 'bold' }}>{ord.tableName}</td>
                        <td style={{ padding: '6px', color: '#38bdf8' }}>{ord.staffName || 'Hệ thống'}</td>
                        <td style={{ padding: '6px', textAlign: 'right', color: '#4ade80', fontWeight: 'bold' }}>{ord.totalAmount.toLocaleString()}đ</td>
                        <td style={{ padding: '6px', textAlign: 'center' }}>
                          <button onClick={() => setSelectedOrderDetails(ord)} style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}>Chi tiết</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {selectedOrderDetails && (
              <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '6px', border: '1px solid #3b82f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold', color: '#38bdf8' }}>
                  <span>📋 Chi tiết {selectedOrderDetails.tableName} ({selectedOrderDetails.time})</span>
                  <button onClick={() => setSelectedOrderDetails(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Đóng ✕</button>
                </div>
                <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                  {selectedOrderDetails.items && selectedOrderDetails.items.map((i, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px', color: '#cbd5e1' }}>
                      <span>• {i.name} x{i.quantity}</span>
                      <span style={{ color: '#f97316' }}>{(i.price * i.quantity).toLocaleString()}đ</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showCheckout && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '10px' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', textAlign: 'center', width: '100%', maxWidth: '320px', border: '1px solid #334155' }}>
            <h3 style={{ margin: '0 0 6px 0', color: '#f97316', fontSize: '15px' }}>Thanh Toán {selectedTable}</h3>
            <h2 style={{ color: '#4ade80', margin: '0 0 6px 0', fontSize: '20px' }}>{currentTotal.toLocaleString()}đ</h2>
            <p style={{ fontSize: '10px', color: '#94a3b8', margin: '0 0 6px 0' }}>{bankConfig.bankId} - {bankConfig.accountNo} ({bankConfig.accountName})</p>
            <img
              src={`https://img.vietqr.io/image/${bankConfig.bankId}-${bankConfig.accountNo}-compact2.png?amount=${currentTotal}&addInfo=Thanh%20toan%20${selectedTable}`}
              alt="VietQR"
              style={{ width: '180px', borderRadius: '8px', margin: '6px 0', border: '1px solid #fff' }}
            />
            <button onClick={handleCheckout} style={{ width: '100%', padding: '10px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '6px', fontSize: '13px' }}>
              ✅ THANH TOÁN XONG (TRẢ BÀN)
            </button>
            <button onClick={() => setShowCheckout(false)} style={{ width: '100%', padding: '8px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>HỦY</button>
          </div>
        </div>
      )}
    </div>
  );
}