import { executeQuery, selectQuery } from '../services/db';

export const TicketRepository = {
    create: async ({ type, title, description, payload, attachment_path, created_by }) => {
        const query = `
            INSERT INTO tickets (type, title, description, payload, attachment_path, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const result = await executeQuery(query, [
            type,
            title,
            description,
            payload ? JSON.stringify(payload) : null,
            attachment_path,
            created_by
        ]);
        return result.lastInsertId;
    },

    getAll: async () => {
        const query = `
            SELECT t.*, 
                   u_created.username as created_by_username, 
                   u_resolved.username as resolved_by_username
            FROM tickets t
            LEFT JOIN users u_created ON t.created_by = u_created.id
            LEFT JOIN users u_resolved ON t.resolved_by = u_resolved.id
            ORDER BY t.created_at DESC
        `;
        const tickets = await selectQuery(query);
        return tickets.map(ticket => ({
            ...ticket,
            payload: ticket.payload ? JSON.parse(ticket.payload) : null
        }));
    },

    getById: async (id) => {
        const query = `
            SELECT t.*, 
                   u_created.username as created_by_username, 
                   u_resolved.username as resolved_by_username
            FROM tickets t
            LEFT JOIN users u_created ON t.created_by = u_created.id
            LEFT JOIN users u_resolved ON t.resolved_by = u_resolved.id
            WHERE t.id = ?
        `;
        const result = await selectQuery(query, [id]);
        if (result.length === 0) return null;

        const ticket = result[0];
        return {
            ...ticket,
            payload: ticket.payload ? JSON.parse(ticket.payload) : null
        };
    },

    updateStatus: async (id, status, resolvedBy) => {
        const query = `
            UPDATE tickets 
            SET status = ?, resolved_by = ?, resolved_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        return await executeQuery(query, [status, resolvedBy, id]);
    },

    approve: async (ticketId, userId) => {
        // 1. Get Ticket
        const ticket = await TicketRepository.getById(ticketId);
        if (!ticket) throw new Error('Ticket not found');
        if (ticket.status !== 'pending') throw new Error('Ticket is not pending');

        // 2. Logic based on type
        // Asegurar extensión del archivo para evitar problemas de resolución
        const { ProductRepository } = await import('./productRepository.js');

        if (ticket.type === 'stock_request') {
            const { productId, newStock } = ticket.payload;
            await ProductRepository.updateStock(productId, parseInt(newStock));
        } else if (ticket.type === 'product_update') {
            const { productId, field, value } = ticket.payload;
            const product = await ProductRepository.getById(parseInt(productId));
            if (product) {
                await ProductRepository.update(productId, {
                    ...product,
                    [field]: field === 'price' ? parseFloat(value) : value
                });
            }
        } else if (ticket.type === 'shrinkage') {
            const { productId, quantity } = ticket.payload;
            const product = await ProductRepository.getById(parseInt(productId));
            if (product) {
                const newStock = product.stock - parseInt(quantity);
                if (newStock < 0) {
                    throw new Error(`Operación inválida: El stock no puede quedar negativo (Stock actual: ${product.stock}, Merma: ${quantity})`);
                }
                await ProductRepository.updateStock(productId, newStock);
            }
        } else if (ticket.type === 'stock_arrival') {
            const { productId, quantity } = ticket.payload;
            const product = await ProductRepository.getById(parseInt(productId));
            if (product) {
                const newStock = product.stock + parseInt(quantity);
                await ProductRepository.updateStock(productId, newStock);
            }
        }

        // 3. Update Status
        return await TicketRepository.updateStatus(ticketId, 'approved', userId);
    },

    reject: async (ticketId, userId) => {
        const ticket = await TicketRepository.getById(ticketId);
        if (!ticket) throw new Error('Ticket not found');
        if (ticket.status !== 'pending') throw new Error('Ticket is not pending');

        return await TicketRepository.updateStatus(ticketId, 'rejected', userId);
    }
};
