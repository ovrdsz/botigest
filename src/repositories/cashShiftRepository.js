import { executeQuery, selectQuery } from '../services/db';

export const CashShiftRepository = {
    create: async (userId, startAmount) => {
        const query = `
            INSERT INTO cash_shifts (user_id, start_amount, status)
            VALUES (?, ?, 'open')
        `;
        const result = await executeQuery(query, [userId, startAmount]);
        return result.lastInsertId;
    },

    getCurrentOpenShift: async () => {
        // Global Shift Mode: Check for ANY open shift regardless of user
        const query = `SELECT * FROM cash_shifts WHERE status = 'open' ORDER BY start_time DESC LIMIT 1`;
        const result = await selectQuery(query, []);
        return result[0];
    },

    close: async (id, endAmount, expectedAmount, notes, closedUserId) => {
        const query = `
            UPDATE cash_shifts 
            SET end_amount = ?, expected_amount = ?, status = 'closed', end_time = CURRENT_TIMESTAMP, notes = ?, closed_by_user_id = ?
            WHERE id = ?
        `;
        return await executeQuery(query, [endAmount, expectedAmount, notes, closedUserId, id]);
    },

    getShiftSalesTotal: async (shiftId) => {
        const query = `
            SELECT 
                SUM(total) as total_sales,
                SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END) as cash_sales,
                SUM(CASE WHEN payment_method = 'card' THEN total ELSE 0 END) as card_sales
            FROM sales 
            WHERE shift_id = ?
        `;
        const result = await selectQuery(query, [shiftId]);
        return result[0];
    },

    getAll: async (startDate, endDate) => {
        const start = startDate || new Date().toISOString().split('T')[0];
        const end = endDate || start;

        const query = `
            SELECT 
                cs.*,
                u_open.username as opened_by_username,
                u_close.username as closed_by_username
            FROM cash_shifts cs
            LEFT JOIN users u_open ON cs.user_id = u_open.id
            LEFT JOIN users u_close ON cs.closed_by_user_id = u_close.id
            WHERE date(cs.start_time) BETWEEN ? AND ?
            ORDER BY cs.start_time DESC
        `;
        return await selectQuery(query, [start, end]);
    }
};
