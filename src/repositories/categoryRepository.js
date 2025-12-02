import { executeQuery, selectQuery } from '../services/db';

export const CategoryRepository = {
    create: async (category) => {
        const query = `
      INSERT INTO categories (name, description)
      VALUES (?, ?)
    `;
        const params = [
            category.name,
            category.description || ''
        ];
        return await executeQuery(query, params);
    },

    getAll: async () => {
        const query = `
      SELECT * FROM categories ORDER BY name
    `;
        return await selectQuery(query);
    },

    getById: async (id) => {
        const query = `SELECT * FROM categories WHERE id = ?`;
        const result = await selectQuery(query, [id]);
        return result[0];
    },

    update: async (id, category) => {
        const query = `
      UPDATE categories 
      SET name = ?, description = ?
      WHERE id = ?
    `;
        const params = [
            category.name,
            category.description,
            id
        ];
        return await executeQuery(query, params);
    },

    delete: async (id) => {
        // Check if category is used by products
        const checkQuery = `SELECT COUNT(*) as count FROM products WHERE category_id = ?`;
        const checkResult = await selectQuery(checkQuery, [id]);

        if (checkResult[0].count > 0) {
            throw new Error('Cannot delete category: It is used by existing products.');
        }

        const query = `DELETE FROM categories WHERE id = ?`;
        return await executeQuery(query, [id]);
    }
};
