import { executeQuery, selectQuery } from '../services/db';

export const CustomerRepository = {
    create: async (customer) => {
        const query = `
      INSERT INTO customers (name, email, phone, points)
      VALUES (?, ?, ?, ?)
    `;
        const params = [
            customer.name,
            customer.email,
            customer.phone,
            customer.points || 0
        ];
        return await executeQuery(query, params);
    },

    getAll: async () => {
        const query = `
      SELECT c.*, 
             (SELECT MAX(created_at) FROM sales WHERE customer_id = c.id) as last_visit,
             (SELECT SUM(total) FROM sales WHERE customer_id = c.id) as total_spent
      FROM customers c
      ORDER BY c.name
    `;
        return await selectQuery(query);
    },

    getById: async (id) => {
        const query = `SELECT * FROM customers WHERE id = ?`;
        const result = await selectQuery(query, [id]);
        return result[0];
    },

    update: async (id, customer) => {
        const query = `
      UPDATE customers 
      SET name = ?, email = ?, phone = ?, points = ?
      WHERE id = ?
    `;
        const params = [
            customer.name,
            customer.email,
            customer.phone,
            customer.points,
            id
        ];
        return await executeQuery(query, params);
    },

    delete: async (id) => {
        const query = `DELETE FROM customers WHERE id = ?`;
        return await executeQuery(query, [id]);
    }
};
