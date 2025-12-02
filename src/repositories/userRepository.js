import { selectQuery, executeQuery } from '../services/db';
import { hashPassword } from '../utils/auth';

export const UserRepository = {
    findByUsername: async (username) => {
        const result = await selectQuery('SELECT * FROM users WHERE username = ?', [username]);
        return result[0];
    },

    create: async (user) => {
        const hashedPassword = await hashPassword(user.password);
        const result = await executeQuery(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            [user.username, hashedPassword, user.role || 'user']
        );
        return result.lastInsertId;
    },

    getAll: async () => {
        return await selectQuery('SELECT id, username, role, created_at FROM users');
    },

    delete: async (id) => {
        return await executeQuery('DELETE FROM users WHERE id = ?', [id]);
    },

    update: async (id, user) => {
        let query = 'UPDATE users SET username = ?, role = ?';
        let params = [user.username, user.role];

        if (user.password) {
            const hashedPassword = await hashPassword(user.password);
            query += ', password_hash = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(id);

        return await executeQuery(query, params);
    }
};
