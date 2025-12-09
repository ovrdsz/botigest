import { SettingsRepository } from '../repositories/settingsRepository';

class TelegramNotificationService {
    constructor() {
        // Default to Env Vars
        this.token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
        this.chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID || '';
        this.listeners = [];

        // REMOVED: this.loadConfig() to prevent early DB access

        // Listen for internal settings changes
        if (typeof window !== 'undefined') {
            window.addEventListener('app-settings-changed', () => this.loadConfig());
        }
    }

    async loadConfig() {
        try {
            const settings = await SettingsRepository.getAll();
            if (settings.telegramBotToken) this.token = settings.telegramBotToken;
            if (settings.telegramChatId) this.chatId = settings.telegramChatId;

            if (this.token && this.chatId) {
                console.log('TelegramService: Config loaded from DB/Env');
                // If we were supposed to be polling and have new creds, maybe restart? 
                // Simple approach: just update state.
            }
        } catch (error) {
            console.warn('TelegramService: Could not load dynamic config', error);
        }
    }

    // --- Subscription Pattern ---
    subscribe(callback) {
        this.listeners.push(callback);
        return () => this.unsubscribe(callback);
    }

    unsubscribe(callback) {
        this.listeners = this.listeners.filter(cb => cb !== callback);
    }

    notifyListeners(event) {
        this.listeners.forEach(cb => cb(event));
    }

    /**
     * Configure the service manually if env vars are not used
     * @param {string} token - Telegram Bot Token
     * @param {string} chatId - Target Chat ID
     */
    configure(token, chatId) {
        this.token = token;
        this.chatId = chatId;
    }

    /**
     * Send a message to Telegram
     * @param {string} text - Message text
     * @param {object} options - Additional options (like inline_keyboard)
     */
    async _send(text, options = {}) {
        if (!this.token || !this.chatId) {
            console.warn('TelegramNotificationService: Missing configuration (token or chatId)');
            return;
        }

        const url = `https://api.telegram.org/bot${this.token}/sendMessage`;
        const payload = {
            chat_id: this.chatId,
            text: text,
            parse_mode: 'Markdown',
            ...options,
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('TelegramNotificationService: Failed to send message', errorData);
            }
        } catch (error) {
            console.error('TelegramNotificationService: Network error', error);
        }
    }

    /**
     * Notify when product stock is low (<= 10)
     * @param {string} productName 
     * @param {number} currentStock 
     */
    async notifyLowStock(productName, currentStock) {
        if (currentStock > 10) return;

        const message = `⚠️ **Stock Crítico**: Quedan solo ${currentStock} unidades de ${productName}.`;
        await this._send(message);
    }

    /**
     * Notify when a new sale is completed
     * @param {object} saleDetails 
     * @param {Array} saleDetails.items - Array of items { name, quantity }
     * @param {number} saleDetails.total - Total amount
     */
    async notifyNewSale({ items, total }) {
        let itemList = '';

        if (Array.isArray(items)) {
            itemList = items.map(item => `- ${item.name} (x${item.quantity})`).join('\n');
        }

        const message = `💰 **Nueva Venta**:\n${itemList}\nTotal: $${total}`;
        await this._send(message);
    }

    /**
     * Notify when a new ticket is created
     * @param {object} ticket
     * @param {number|string} ticket.id
     * @param {string} ticket.type
     * @param {string} ticket.observacion
     * @param {boolean} ticket.requiereAprobacion
     */
    async notifyTicketCreated(ticket) {
        // Now destructuring more fields
        const { id, type, title, observacion, requiereAprobacion, payload } = ticket;

        const safeType = type.replace(/[_*`\[\]]/g, '\\$&');
        const safeTitle = title ? title.replace(/[_*`\[\]]/g, '\\$&') : 'Sin Título';
        const safeObs = observacion ? observacion.replace(/[_*`\[\]]/g, '\\$&') : '';

        let typeLabel = safeType;
        let detailsText = '';

        // Extract details based on Type and Payload
        // Payload comes as an object (already parsed if using getById logic, or raw)
        // Note: The ticket object passed here usually comes from the UI context or Repository. 
        // If it comes from Repo getAll/getById, payload is object. If direct creation, it might be object.
        const data = (typeof payload === 'string') ? JSON.parse(payload) : (payload || {});

        if (type === 'stock_arrival') {
            typeLabel = '📦 Llegada de Stock';
            detailsText = `🔹 **Producto**: ${data.productName}\n🔹 **Cantidad**: ${data.quantity}`;
        } else if (type === 'stock_request') {
            typeLabel = '📉 Ajuste de Stock';
            detailsText = `🔹 **Producto**: ${data.productName}\n🔹 **Nuevo Stock**: ${data.newStock}`;
        } else if (type === 'shrinkage') {
            typeLabel = '🗑 Merma';
            detailsText = `🔹 **Producto**: ${data.productName}\n🔹 **Cantidad**: ${data.quantity}\n🔹 **Motivo**: ${data.reason}`;
        } else if (type === 'product_update') {
            typeLabel = '✏️ Actualización Producto';
            detailsText = `🔹 **Producto**: ${data.productName}\n🔹 **Campo**: ${data.field}\n🔹 **Valor**: ${data.value}`;
        }

        // Construct Message
        // 📝 Ticket #123: [Tipo]
        // 📌 Título
        // [Detalles]
        // [Observación]
        const message = `📝 *Ticket #${id}*: ${typeLabel}\n` +
            `📌 *${safeTitle}*\n\n` +
            `${detailsText}\n\n` +
            `📝 *Nota*: ${safeObs}`;

        let options = {};

        if (requiereAprobacion) {
            const approveText = type === 'observation' ? '✅ Resuelto' : '✅ Aceptar';
            const rejectText = type === 'observation' ? '❌ Rechazado' : '❌ Rechazar';

            options = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: approveText, callback_data: `approve_ticket_${id}` },
                            { text: rejectText, callback_data: `reject_ticket_${id}` }
                        ]
                    ]
                }
            };
        }

        await this._send(message, options);
    }


    // --- Polling Logic ---

    startPolling() {
        if (this.isPolling) return;
        if (!this.token) {
            console.warn('TelegramNotificationService: Cannot start polling, missing token');
            return;
        }

        this.isPolling = true;
        this.offset = 0;
        console.log('TelegramNotificationService: Started Polling');
        this.pollLoop();
    }

    stopPolling() {
        this.isPolling = false;
        console.log('TelegramNotificationService: Stopped Polling');
    }

    async pollLoop() {
        while (this.isPolling) {
            try {
                const updates = await this.getUpdates(this.offset);
                if (updates && updates.length > 0) {
                    for (const update of updates) {
                        await this.handleUpdate(update);
                        this.offset = update.update_id + 1;
                    }
                }
            } catch (error) {
                console.error('Telegram Polling Error:', error);
                // Wait a bit before retrying on error
                await new Promise(resolve => setTimeout(resolve, 5000));
            }

            // Wait 2 seconds between polls to be nice to the API
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    async getUpdates(offset) {
        const url = `https://api.telegram.org/bot${this.token}/getUpdates?offset=${offset}&timeout=10`;
        const response = await fetch(url);
        const data = await response.json();
        return data.ok ? data.result : [];
    }

    async handleUpdate(update) {
        if (update.callback_query) {
            await this.handleCallbackQuery(update.callback_query);
        } else if (update.message) {
            await this.handleMessage(update.message);
        }
    }

    async handleMessage(message) {
        const { chat, text } = message;
        if (!text) return;

        // Check for specific commands
        if (text.startsWith('/stock')) {
            await this.handleStockCommand(chat.id);
        } else if (text.startsWith('/resumen')) {
            await this.handleResumenCommand(chat.id);
        } else if (text.startsWith('/alertas')) {
            await this.handleAlertasCommand(chat.id);
        } else if (text.startsWith('/ayuda') || text.startsWith('/start')) {
            await this.handleAyudaCommand(chat.id);
        }
    }

    async handleAyudaCommand(chatId) {
        const message = `🤖 *Comandos Disponibles:*\n\n` +
            `📦 **/stock**: Ver lista de productos y stock actual.\n` +
            `📊 **/resumen**: Ver reporte de ventas del día.\n` +
            `⚠️ **/alertas**: Ver productos con stock crítico.\n` +
            `ℹ️ **/ayuda**: Ver este mensaje.`;
        await this._send(message, { chat_id: chatId });
    }

    async handleAlertasCommand(chatId) {
        try {
            const { ProductRepository } = await import('../repositories/productRepository.js');
            const lowStockItems = await ProductRepository.getLowStockItems(10);

            if (lowStockItems.length === 0) {
                await this._send('✅ Todo en orden. No hay productos con stock crítico.', { chat_id: chatId });
                return;
            }

            let message = '⚠️ *ALERTAS DE STOCK(<= 10)*\n\n';
            lowStockItems.forEach(p => {
                message += `❗ *${p.name}*\n   Quedan: *${p.stock}*\n`;
            });

            await this._send(message, { chat_id: chatId });

        } catch (error) {
            console.error('Error handling /alertas command:', error);
            await this._send('❌ Error al consultar alertas.', { chat_id: chatId });
        }
    }

    async handleResumenCommand(chatId) {
        try {
            await this._send('📊 Generando resumen del día...', { chat_id: chatId });

            // Dynamic import
            const { SaleRepository } = await import('../repositories/saleRepository.js');
            const stats = await SaleRepository.getDailyStats();

            // stats structure: { total, count, average, trend, countTrend }
            const totalFormatted = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(stats.total);
            const avgFormatted = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(stats.average);

            // Trend icons
            const getTrendIcon = (val) => val > 0 ? '📈' : (val < 0 ? 'dt' : '➖'); // dt = down trend placeholder
            const trendIcon = stats.trend > 0 ? '📈' : (stats.trend < 0 ? '📉' : '➖');

            const message = `📊 *RESUMEN DE VENTAS DE HOY*\n\n` +
                `💰 *Total Vendido*: ${totalFormatted}\n` +
                `🧾 *Transacciones*: ${stats.count}\n` +
                `🏷 *Ticket Promedio*: ${avgFormatted}\n\n` +
                `*Comparación ayer:*\n` +
                `${trendIcon} La venta es un ${Math.abs(stats.trend).toFixed(1)}% ${stats.trend >= 0 ? 'mayor' : 'menor'} que ayer.`;

            await this._send(message, { chat_id: chatId });

        } catch (error) {
            console.error('Error handling /resumen command:', error);
            await this._send('❌ Error al generar el resumen.', { chat_id: chatId });
        }
    }

    async handleStockCommand(chatId) {
        try {
            await this._send('🔍 Consultando inventario...', { chat_id: chatId });

            // Dynamic import to avoid cycles or load only when needed
            const { ProductRepository } = await import('../repositories/productRepository.js');
            const products = await ProductRepository.getAll();

            if (products.length === 0) {
                await this._send('📦 No hay productos registrados.', { chat_id: chatId });
                return;
            }

            let response = '📦 *REPORTE DE STOCK ACTUAL*\n\n';

            // Format: Name (Code) - Stock: X
            products.forEach(p => {
                const line = `🔹 *${p.name}*\n   Stock: *${p.stock}* | Precio: $${p.price}\n`;

                // Split if message gets too long (Telegram limit ~4096)
                if ((response.length + line.length) > 4000) {
                    this._send(response, { chat_id: chatId });
                    response = '';
                }
                response += line;
            });

            if (response) {
                await this._send(response, { chat_id: chatId });
            }

        } catch (error) {
            console.error('Error handling /stock command:', error);
            await this._send('❌ Error al consultar el stock.', { chat_id: chatId });
        }
    }

    async handleCallbackQuery(callbackQuery) {
        const { id, data, from } = callbackQuery;
        const [action, type, ticketId] = data.split('_'); // e.g., approve_ticket_123

        try {
            // Import Repository Dynamically
            const { TicketRepository } = await import('../repositories/ticketRepository.js');
            const { UserRepository } = await import('../repositories/userRepository.js');

            // Find valid user ID
            let resolverId = 1; // Default
            try {
                const users = await UserRepository.getAll();
                const admin = users.find(u => u.role === 'admin');
                if (admin) resolverId = admin.id;
            } catch (e) { console.warn('Could not fetch admin user for telegram action', e); }

            if (data.startsWith('approve_ticket_')) {
                const tId = parseInt(data.replace('approve_ticket_', ''));

                // Obtener ticket para personalizar mensaje
                const ticket = await TicketRepository.getById(tId);
                const isObservation = ticket && ticket.type === 'observation';
                const actionText = isObservation ? 'Resuelto' : 'Aprobado';
                const actionVerb = isObservation ? 'resuelto' : 'aprobado';

                await TicketRepository.approve(tId, resolverId);

                // Notificar a la UI inmediatamente
                this.notifyListeners({ type: 'TICKET_UPDATED', id: tId, status: 'approved' });

                await this.answerCallbackQuery(id, `✅ Ticket ${actionText}`);
                await this._send(`✅ Ticket #${tId} ${actionVerb} por ${from.first_name} desde Telegram.`);
            }
            else if (data.startsWith('reject_ticket_')) {
                const tId = parseInt(data.replace('reject_ticket_', ''));
                await TicketRepository.reject(tId, resolverId);
                // Notificar a la UI inmediatamente despues de la actualizacion en BD
                this.notifyListeners({ type: 'TICKET_UPDATED', id: tId, status: 'rejected' });

                await this.answerCallbackQuery(id, '❌ Ticket Rechazado');
                await this._send(`❌ Ticket #${tId} rechazado por ${from.first_name} desde Telegram.`);
            }
        } catch (error) {
            console.error('Error handling callback:', error);
            const errorMsg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
            await this.answerCallbackQuery(id, `Error: ${errorMsg}`, true);
        }
    }

    async answerCallbackQuery(callbackQueryId, text, showAlert = false) {
        const url = `https://api.telegram.org/bot${this.token}/answerCallbackQuery`;
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                callback_query_id: callbackQueryId,
                text: text,
                show_alert: showAlert
            })
        });
    }
}

export const telegramService = new TelegramNotificationService();
