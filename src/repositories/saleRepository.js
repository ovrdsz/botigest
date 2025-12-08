import { executeQuery, selectQuery, getDb } from '../services/db';

export const SaleRepository = {
  create: async (saleData) => {
    const db = await getDb();

    const items = saleData.items || [];
    const shiftId = saleData.shift_id || 'NULL';
    const userId = saleData.user_id || 'NULL';
    const customerId = saleData.customer_id || 'NULL';

    // Manejar paymentMethod (camelCase) o payment_method (snake_case)
    const rawPaymentMethod = saleData.paymentMethod || saleData.payment_method || 'cash';
    const paymentMethod = `'${rawPaymentMethod.replace(/'/g, "''")}'`;

    const status = "'completed'";

    let script = `
      BEGIN IMMEDIATE TRANSACTION;
      INSERT INTO sales (user_id, customer_id, shift_id, total, payment_method, status)
      VALUES (${userId}, ${customerId}, ${shiftId}, ${saleData.total}, ${paymentMethod}, ${status});
    `;

    for (const item of items) {
      script += `
        INSERT INTO sale_items (sale_id, product_id, quantity, price, subtotal)
        VALUES ((SELECT MAX(id) FROM sales), ${item.id}, ${item.quantity}, ${item.price}, ${item.price * item.quantity});

        UPDATE products 
        SET stock = stock - ${item.quantity} 
        WHERE id = ${item.id};
      `;
    }

    script += 'COMMIT;';

    try {
      await db.execute(script);
      const result = await selectQuery('SELECT MAX(id) as id FROM sales');
      return result[0]?.id;
    } catch (error) {
      console.error('Transaction failed:', error);
      try { await db.execute('ROLLBACK'); } catch (e) { /* ignore */ }
      throw error;
    }
  },

  getAll: async () => {
    const query = `
      SELECT s.*, u.username, c.name as customer_name,
             (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as item_count
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN customers c ON s.customer_id = c.id
      ORDER BY s.created_at DESC
    `;
    return await selectQuery(query);
  },

  getById: async (id) => {
    const saleQuery = `
      SELECT s.*, u.username, c.name as customer_name
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.id = ?
    `;
    const itemsQuery = `
      SELECT si.*, p.name as product_name, p.code as product_code
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `;

    const sale = (await selectQuery(saleQuery, [id]))[0];
    if (sale) {
      sale.items = await selectQuery(itemsQuery, [id]);
    }
    return sale;
  },

  getDailyStats: async () => {
    const today = new Date().toISOString().split('T')[0];
    const query = `
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as total
      FROM sales 
      WHERE date(created_at) = date('now', 'localtime')
    `;
    const result = await selectQuery(query);
    const { count, total } = result[0];

    // Obtener estadísticas de ayer para comparación
    const yesterdayQuery = `
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as total
      FROM sales 
      WHERE date(created_at) = date('now', '-1 day', 'localtime')
    `;
    const yesterdayResult = await selectQuery(yesterdayQuery);
    const yesterdayTotal = yesterdayResult[0].total;
    const yesterdayCount = yesterdayResult[0].count;
    const yesterdayAverage = yesterdayCount > 0 ? Math.round(yesterdayTotal / yesterdayCount) : 0;

    const currentAverage = count > 0 ? Math.round(total / count) : 0;

    return {
      total,
      count,
      average: currentAverage,
      trend: yesterdayTotal > 0 ? ((total - yesterdayTotal) / yesterdayTotal) * 100 : 0,
      countTrend: yesterdayCount > 0 ? ((count - yesterdayCount) / yesterdayCount) * 100 : 0,
      averageTrend: yesterdayAverage > 0 ? ((currentAverage - yesterdayAverage) / yesterdayAverage) * 100 : 0
    };
  },

  getRecentSales: async (limit = 5) => {
    const query = `
      SELECT s.id, s.created_at as time, s.total, s.payment_method,
             (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items
      FROM sales s
      ORDER BY s.created_at DESC
      LIMIT ?
    `;
    return await selectQuery(query, [limit]);
  },

  getHourlySales: async (date = 'now') => {
    const dateFilter = date === 'now' ? "date('now', 'localtime')" : `'${date}'`;
    const query = `
      SELECT strftime('%H', created_at, 'localtime') as hour, SUM(total) as total
      FROM sales
      WHERE date(created_at, 'localtime') = ${dateFilter}
      GROUP BY hour
      ORDER BY hour
    `;
    return await selectQuery(query);
  },

  getSalesByCategory: async (startDate, endDate) => {
    // Por defecto usar hoy si no se proveen fechas
    const start = startDate || new Date().toISOString().split('T')[0];
    const end = endDate || start;

    const query = `
      SELECT c.name as category, COUNT(si.id) as count, SUM(si.subtotal) as total
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      JOIN sales s ON si.sale_id = s.id
      WHERE date(s.created_at) BETWEEN ? AND ?
      GROUP BY c.name
      ORDER BY total DESC
    `;
    return await selectQuery(query, [start, end]);
  },

  getSalesBySeller: async (startDate, endDate) => {
    const start = startDate || new Date().toISOString().split('T')[0];
    const end = endDate || start;

    const query = `
      SELECT u.username, COUNT(s.id) as count, SUM(s.total) as total
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE date(s.created_at) BETWEEN ? AND ?
      GROUP BY u.username
      ORDER BY total DESC
    `;
    return await selectQuery(query, [start, end]);
  },

  getSalesByDateRange: async (startDate, endDate) => {
    const start = startDate || new Date().toISOString().split('T')[0];
    const end = endDate || start;

    const query = `
      SELECT s.id, s.created_at, s.total, s.payment_method, s.status,
             u.username as seller, c.name as customer
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN customers c ON s.customer_id = c.id
      WHERE date(s.created_at) BETWEEN ? AND ?
      ORDER BY s.created_at DESC
    `;
    return await selectQuery(query, [start, end]);
  },

  getSalesByPaymentMethod: async () => {
    const query = `
      SELECT payment_method, COUNT(*) as count, SUM(total) as total
      FROM sales
      GROUP BY payment_method
    `;
    return await selectQuery(query);
  },

  getTopSellingProducts: async (startDate, endDate) => {
    const start = startDate || new Date().toISOString().split('T')[0];
    const end = endDate || start;
    const query = `
      SELECT p.name, SUM(si.quantity) as count, SUM(si.subtotal) as total
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE date(s.created_at) BETWEEN ? AND ?
      GROUP BY p.name
      ORDER BY count DESC
      LIMIT 5
    `;
    return await selectQuery(query, [start, end]);
  },

  getProfitStats: async (startDate, endDate) => {
    const start = startDate || new Date().toISOString().split('T')[0];
    const end = endDate || start;
    const query = `
      SELECT 
        SUM(si.subtotal) as revenue,
        SUM(si.quantity * COALESCE(p.cost, 0)) as cost
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE date(s.created_at) BETWEEN ? AND ?
    `;
    const result = await selectQuery(query, [start, end]);
    const { revenue, cost } = result[0] || { revenue: 0, cost: 0 };
    return {
      revenue: revenue || 0,
      cost: cost || 0,
      profit: (revenue || 0) - (cost || 0)
    };
  }
};
