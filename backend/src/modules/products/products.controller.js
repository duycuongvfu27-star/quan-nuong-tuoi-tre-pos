const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getProducts = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { products: true },
      orderBy: { sortOrder: 'asc' },
    });
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ error: 'Lỗi lấy thực đơn: ' + error.message });
  }
};

module.exports = { getProducts };