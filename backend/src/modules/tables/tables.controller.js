const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getTables = async (req, res) => {
  try {
    const tables = await prisma.table.findMany({
      orderBy: { tableNumber: 'asc' },
    });
    return res.json(tables);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi lấy bàn: ' + error.message });
  }
};

module.exports = { getTables };