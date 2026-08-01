let dbOrders = {}; 

// CẤU HÌNH TỌA ĐỘ VÀ IP WIFI QUÁN NƯỚNG TUỔI TRẺ
const RESTAURANT_CONFIG = {
  lat: 20.3833, 
  lng: 106.1333,
  maxDistanceMeters: 50,
  allowedWifiIPs: ['::1', '127.0.0.1']
};

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const getOrders = async (req, res) => {
  try {
    const activeOrders = [];
    const tableStatusMap = {};

    Object.keys(dbOrders).forEach(tableName => {
      const orderData = dbOrders[tableName];
      if (orderData && orderData.status !== 'empty') {
        tableStatusMap[tableName] = orderData.status;
        activeOrders.push({
          id: tableName,
          tableName: tableName,
          items: orderData.totalItems || [],
          kitchenItems: orderData.pendingKitchenItems || [],
          totalAmount: orderData.totalAmount || 0,
          status: orderData.status
        });
      } else {
        tableStatusMap[tableName] = 'empty';
      }
    });

    return res.status(200).json({
      activeOrders: activeOrders,
      tableStatus: tableStatusMap
    });
  } catch (error) {
    return res.status(200).json({ activeOrders: [], tableStatus: {} });
  }
};

const handleCheckout = async (req, res) => {
  try {
    const { tableName, items, totalAmount, tableStatus, userLocation, isStaff } = req.body;

    if (!tableName) return res.status(400).json({ message: 'Thiếu tên bàn!' });

    // 1. NẾU LÀ XÓA BÀN (Trống) HOẶC BẾP BẤM XÁC NHẬN XONG MÓN ('busy')
    if (tableStatus === 'empty') {
      delete dbOrders[tableName];
      if (req.io) req.io.emit('order_updated', { type: 'status_change', tableName });
      return res.status(200).json({ message: 'Thao tác thành công!' });
    }

    if (tableStatus === 'busy' && dbOrders[tableName]) {
      dbOrders[tableName].status = 'busy';
      dbOrders[tableName].pendingKitchenItems = []; // Xóa món chờ sau khi bếp đã làm xong
      if (req.io) req.io.emit('order_updated', { type: 'status_change', tableName });
      return res.status(200).json({ message: 'Thao tác thành công!' });
    }

    // 2. NẾU KHÁCH TỰ ORDER QR -> KIỂM TRA ĐỊNH VỊ (GPS & WIFI)
    if (!isStaff) {
      const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const isWifiMatch = RESTAURANT_CONFIG.allowedWifiIPs.includes(clientIP);

      let isLocationValid = false;
      let distance = 0;

      if (isWifiMatch) {
        isLocationValid = true;
      } else if (userLocation && userLocation.lat && userLocation.lng) {
        distance = calculateDistanceMeters(
          userLocation.lat,
          userLocation.lng,
          RESTAURANT_CONFIG.lat,
          RESTAURANT_CONFIG.lng
        );

        if (distance <= RESTAURANT_CONFIG.maxDistanceMeters) {
          isLocationValid = true;
        }
      }

      if (!isLocationValid) {
        return res.status(403).json({
          message: `⛔ BẠN ĐANG Ở NGOÀI PHẠM VI QUÁN! (Khoảng cách: ${Math.round(distance)}m). Vui lòng di chuyển lại gần bàn hoặc bắt Wifi của quán để Order!`
        });
      }
    }

    // 3. TẠO ĐƠN & GỬI BẾP (Dù nhân viên hay khách gửi món mới đều lưu và báo bếp)
    const existing = dbOrders[tableName] || { totalItems: [], pendingKitchenItems: [], totalAmount: 0 };
    const mergedTotalItems = [...existing.totalItems];

    if (items && Array.isArray(items) && items.length > 0) {
      items.forEach(newItem => {
        const foundIndex = mergedTotalItems.findIndex(i => i.name === newItem.name);
        if (foundIndex > -1) {
          mergedTotalItems[foundIndex].quantity += newItem.quantity;
        } else {
          mergedTotalItems.push({ ...newItem });
        }
      });
    }

    const newTotal = mergedTotalItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    dbOrders[tableName] = {
      totalItems: mergedTotalItems,
      pendingKitchenItems: items || [], // Lưu lại các món mới gọi để màn hình bếp hiển thị
      totalAmount: newTotal,
      status: 'ordering'
    };

    if (req.io) req.io.emit('order_updated', { type: 'new_item', tableName });

    return res.status(200).json({ message: 'Báo bếp thành công!', order: dbOrders[tableName] });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

module.exports = { getOrders, handleCheckout };