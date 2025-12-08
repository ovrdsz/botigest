import { executeQuery, selectQuery } from '../services/db';

export const ProductRepository = {
    create: async (product) => {
        const query = `
      INSERT INTO products (code, name, description, price, cost, stock, category_id, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
        const params = [
            product.code,
            product.name,
            product.description,
            product.price,
            product.cost,
            product.stock,
            product.category_id,
            product.image_url
        ];
        return await executeQuery(query, params);
    },

    getAll: async () => {
        const query = `
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.name
    `;
        return await selectQuery(query);
    },

    getById: async (id) => {
        const query = `SELECT * FROM products WHERE id = ?`;
        const result = await selectQuery(query, [id]);
        return result[0];
    },

    getByCode: async (code) => {
        const query = `SELECT * FROM products WHERE code = ?`;
        const result = await selectQuery(query, [code]);
        return result[0];
    },

    update: async (id, product) => {
        const query = `
      UPDATE products 
      SET code = ?, name = ?, description = ?, price = ?, cost = ?, stock = ?, category_id = ?, image_url = ?
      WHERE id = ?
    `;
        const params = [
            product.code,
            product.name,
            product.description,
            product.price,
            product.cost,
            product.stock,
            product.category_id,
            product.image_url,
            id
        ];
        return await executeQuery(query, params);
    },

    updateStock: async (id, newStock) => {
        const query = `UPDATE products SET stock = ? WHERE id = ?`;
        return await executeQuery(query, [newStock, id]);
    },

    delete: async (id) => {
        const query = `DELETE FROM products WHERE id = ?`;
        return await executeQuery(query, [id]);
    },

    deleteOrphans: async () => {
        // 1. Obtener IDs de productos sin categoría
        const findQuery = `SELECT id FROM products WHERE category_id IS NULL`;
        const orphans = await selectQuery(findQuery);

        if (orphans.length === 0) return 0;

        const ids = orphans.map(o => o.id).join(',');

        // 2. Eliminar items de venta asociados a estos productos
        await executeQuery(`DELETE FROM sale_items WHERE product_id IN (${ids})`);

        // 3. Eliminar los productos
        const deleteQuery = `DELETE FROM products WHERE id IN (${ids})`;
        await executeQuery(deleteQuery);

        return orphans.length;
    },

    getLowStock: async (threshold = 10) => {
        const query = `SELECT COUNT(*) as count FROM products WHERE stock <= ?`;
        const result = await selectQuery(query, [threshold]);
        return result[0].count;
    }
};
