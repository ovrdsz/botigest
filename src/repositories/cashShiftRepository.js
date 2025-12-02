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

    getCurrentOpenShift: async (userId) => {
        // Si se proporciona userId, verificar el turno abierto de ese usuario (modo estricto opcional)
        // O verificar cualquier turno abierto si queremos lógica de terminal única
        // Por ahora, ¿asumimos un turno abierto por usuario o para todo el sistema? 
        // Vamos con todo el sistema para un POS simple, o por usuario. 
        // Dados los requisitos, verifiquemos si *este* usuario tiene un turno abierto.
        const query = `SELECT * FROM cash_shifts WHERE user_id = ? AND status = 'open' ORDER BY start_time DESC LIMIT 1`;
        const result = await selectQuery(query, [userId]);
        return result[0];
    },

    close: async (id, endAmount, expectedAmount, notes) => {
        const query = `
            UPDATE cash_shifts 
            SET end_amount = ?, expected_amount = ?, status = 'closed', end_time = CURRENT_TIMESTAMP, notes = ?
            WHERE id = ?
        `;
        return await executeQuery(query, [endAmount, expectedAmount, notes, id]);
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
    }
};
