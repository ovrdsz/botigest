import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TicketRepository } from '../../repositories/ticketRepository';
import { ProductRepository } from '../../repositories/productRepository';
import { convertFileSrc } from '@tauri-apps/api/core';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Plus, Check, X, FileText, Package, AlertCircle } from 'lucide-react';
import './Tickets.css';
import { telegramService } from '../../services/telegramService';

const Tickets = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);

    // Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);

    // Form State
    const [ticketForm, setTicketForm] = useState({
        type: null,
        title: '',
        description: '',
        payload: {}
    });

    useEffect(() => {
        loadData();

        const unsubscribe = telegramService.subscribe((event) => {
            if (event.type === 'TICKET_UPDATED') {
                loadData();
            }
        });

        return () => unsubscribe();
    }, []);

    const loadData = async () => {
        try {
            const [ticketsData, productsData] = await Promise.all([
                TicketRepository.getAll(),
                ProductRepository.getAll()
            ]);
            setTickets(ticketsData);
            setProducts(productsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };



    const handleCreateSubmit = async (e) => {
        e.preventDefault();

        // Validations
        if (ticketForm.title.trim().length > 100) {
            alert('El título es demasiado largo.');
            return;
        }

        if (ticketForm.description.trim().length > 1000) {
            alert('La descripción es demasiado larga.');
            return;
        }

        if (ticketForm.type === 'stock_request') {
            const newStock = parseInt(ticketForm.payload.newStock);
            if (isNaN(newStock) || newStock < 0 || newStock > 1000000) {
                alert('El stock debe ser un número válido entre 0 y 1,000,000.');
                return;
            }
        }

        if (ticketForm.type === 'shrinkage') {
            const quantity = parseInt(ticketForm.payload.quantity);
            if (isNaN(quantity) || quantity <= 0 || quantity > 10000) {
                alert('La cantidad de merma debe ser mayor a 0 y menor a 10,000.');
                return;
            }
        }

        if (ticketForm.type === 'stock_arrival') {
            const quantity = parseInt(ticketForm.payload.quantity);
            if (isNaN(quantity) || quantity <= 0 || quantity > 100000) {
                alert('La cantidad recibida debe ser mayor a 0 y menor a 100,000.');
                return;
            }
        }

        try {
            const ticketId = await TicketRepository.create({
                ...ticketForm,
                created_by: user.id
            });

            // Enriquecer payload para Telegram (resolver nombres)
            let notificationPayload = { ...ticketForm.payload };
            if (notificationPayload.productId) {
                const product = products.find(p => p.id == notificationPayload.productId);
                if (product) notificationPayload.productName = product.name;
            }

            await telegramService.notifyTicketCreated({
                id: ticketId,
                type: ticketForm.type,
                title: ticketForm.title,
                observacion: ticketForm.description,
                requiereAprobacion: true,
                payload: notificationPayload
            });
            setShowCreateModal(false);
            setTicketForm({
                type: null,
                title: '',
                description: '',
                payload: {}
            });
            loadData();
            alert('Ticket creado correctamente');
        } catch (error) {
            console.error('Error creating ticket:', error);
            alert('Error al crear ticket');
        }
    };

    const handleApprove = async () => {
        if (!selectedTicket) return;
        try {
            await TicketRepository.approve(selectedTicket.id, user.id);
            setShowDetailModal(false);
            loadData();
            alert('Ticket aprobado y cambios aplicados');
        } catch (error) {
            console.error('Error approving ticket:', error);
            alert('Error al aprobar ticket: ' + error.message);
        }
    };

    const handleReject = async () => {
        if (!selectedTicket) return;
        try {
            await TicketRepository.reject(selectedTicket.id, user.id);
            setShowDetailModal(false);
            loadData();
            alert('Ticket rechazado');
        } catch (error) {
            console.error('Error rejecting ticket:', error);
            alert('Error al rechazar ticket');
        }
    };

    const getStatusBadge = (status) => {
        const labels = { pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado' };
        return labels[status] || status;
    };

    const getTypeLabel = (type) => {
        const labels = {
            observation: 'Crear Nota / Observación',
            stock_request: 'Ajustar Stock Real',
            product_update: 'Modificar Producto',
            shrinkage: 'Reportar Merma',
            stock_arrival: 'Llegada de Stock'
        };
        return labels[type] || type;
    };

    // Filtered lists
    const pendingTickets = tickets.filter(t => t.status === 'pending');
    const historyTickets = tickets.filter(t => t.status !== 'pending');

    return (
        <div className="tickets-page">
            <div className="page-header">
                <div>
                    <h1>Soporte y Tickets</h1>
                    <p>Comunicación interna y gestión de cambios</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                    <Plus size={18} className="mr-2" />
                    Nuevo Ticket
                </Button>
            </div>

            <div className="tickets-container">
                {/* Column: Pending */}
                <div className="tickets-column">
                    <h2>Pendientes <span className="text-muted text-sm">({pendingTickets.length})</span></h2>
                    <div className="tickets-table-container">
                        <table className="tickets-table">
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Título / Detalle</th>
                                    <th>Usuario</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingTickets.map(ticket => (
                                    <tr key={ticket.id} onClick={() => { setSelectedTicket(ticket); setShowDetailModal(true); }}>
                                        <td>
                                            <span className={`ticket-type-badge ${ticket.type} mini`}>{getTypeLabel(ticket.type)}</span>
                                        </td>
                                        <td className="ticket-title-cell">{ticket.title}</td>
                                        <td className="text-muted">{ticket.created_by_username}</td>
                                        <td className="text-muted">{new Date(ticket.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Column: History */}
                <div className="tickets-column">
                    <h2>Historial Reciente</h2>
                    <div className="tickets-table-container">
                        <table className="tickets-table">
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Título / Detalle</th>
                                    <th>Estado</th>
                                    <th>Usuario</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyTickets.map(ticket => (
                                    <tr key={ticket.id} onClick={() => { setSelectedTicket(ticket); setShowDetailModal(true); }}>
                                        <td>
                                            <span className={`ticket-type-badge ${ticket.type} mini`}>{getTypeLabel(ticket.type)}</span>
                                        </td>
                                        <td className="ticket-title-cell">{ticket.title}</td>
                                        <td>
                                            <span className={`ticket-status-badge ${ticket.status}`}>{getStatusBadge(ticket.status)}</span>
                                        </td>
                                        <td className="text-muted">{ticket.created_by_username}</td>
                                        <td className="text-muted">{new Date(ticket.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            {ticketForm.type ? (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="p-1 hover:bg-white/10 rounded mr-2"
                                        onClick={() => setTicketForm({ ...ticketForm, type: null, payload: {} })}
                                    >
                                        ←
                                    </button>
                                    <h2>{getTypeLabel(ticketForm.type)}</h2>
                                </div>
                            ) : (
                                <h2>Nuevo Ticket</h2>
                            )}
                            <button onClick={() => setShowCreateModal(false)}><X size={24} /></button>
                        </div>

                        {!ticketForm.type ? (
                            <div className="ticket-type-grid">
                                <button
                                    className="ticket-type-card option-arrival"
                                    onClick={() => setTicketForm({ ...ticketForm, type: 'stock_arrival' })}
                                >
                                    <div className="icon">📦</div>
                                    <span>Llegada de Stock</span>
                                </button>
                                <button
                                    className="ticket-type-card option-stock"
                                    onClick={() => setTicketForm({ ...ticketForm, type: 'stock_request' })}
                                >
                                    <div className="icon">📉</div>
                                    <span>Ajustar Stock Real</span>
                                </button>
                                <button
                                    className="ticket-type-card option-product"
                                    onClick={() => setTicketForm({ ...ticketForm, type: 'product_update' })}
                                >
                                    <div className="icon">✏️</div>
                                    <span>Modificar Producto</span>
                                </button>
                                <button
                                    className="ticket-type-card option-shrinkage"
                                    onClick={() => setTicketForm({ ...ticketForm, type: 'shrinkage' })}
                                >
                                    <div className="icon">🗑</div>
                                    <span>Reportar Merma</span>
                                </button>
                                <button
                                    className="ticket-type-card option-observation"
                                    onClick={() => setTicketForm({ ...ticketForm, type: 'observation' })}
                                >
                                    <div className="icon">📝</div>
                                    <span>Crear Nota / Observación</span>
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateSubmit}>
                                {/* Type is now pre-selected, no dropdown needed */}

                                <div className="ticket-form-group">
                                    <label className="ticket-form-label">Título / Asunto</label>
                                    <input
                                        className="ticket-input"
                                        value={ticketForm.title}
                                        onChange={e => setTicketForm({ ...ticketForm, title: e.target.value })}
                                        required
                                        maxLength={100}
                                        placeholder="Ej: Recepción Lote #402"
                                    />
                                </div>

                                {ticketForm.type === 'stock_request' && (
                                    <div className="section-panel">
                                        <h4 className="section-title stock text-sm font-bold mb-3">Detalles de Stock</h4>
                                        <div className="ticket-form-group">
                                            <label className="ticket-form-label">Producto</label>
                                            <select
                                                className="ticket-select"
                                                onChange={e => setTicketForm({
                                                    ...ticketForm,
                                                    payload: { ...ticketForm.payload, productId: e.target.value }
                                                })}
                                                required
                                            >
                                                <option value="">Seleccionar Producto...</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} (Actual: {p.stock})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="ticket-form-group">
                                            <label className="ticket-form-label">Nuevo Stock Total</label>
                                            <input
                                                className="ticket-input"
                                                type="number"
                                                onChange={e => setTicketForm({
                                                    ...ticketForm,
                                                    payload: { ...ticketForm.payload, newStock: e.target.value }
                                                })}
                                                required
                                                min="0"
                                                max="1000000"
                                            />
                                        </div>
                                    </div>
                                )}

                                {ticketForm.type === 'product_update' && (
                                    <div className="section-panel">
                                        <h4 className="section-title update text-sm font-bold mb-3">Datos a Actualizar</h4>
                                        <div className="ticket-form-group">
                                            <label className="ticket-form-label">Producto</label>
                                            <select
                                                className="ticket-select"
                                                onChange={e => setTicketForm({
                                                    ...ticketForm,
                                                    payload: { ...ticketForm.payload, productId: e.target.value }
                                                })}
                                                required
                                            >
                                                <option value="">Seleccionar Producto...</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-row">
                                            <div className="ticket-form-group flex-1">
                                                <label className="ticket-form-label">Campo</label>
                                                <select
                                                    className="ticket-select"
                                                    onChange={e => setTicketForm({
                                                        ...ticketForm,
                                                        payload: { ...ticketForm.payload, field: e.target.value }
                                                    })}
                                                    required
                                                >
                                                    <option value="">Seleccionar...</option>
                                                    <option value="name">Nombre</option>
                                                    <option value="price">Precio</option>
                                                    <option value="description">Descripción</option>
                                                </select>
                                            </div>
                                            <div className="ticket-form-group flex-1">
                                                <label className="ticket-form-label">Nuevo Valor</label>
                                                <input
                                                    className="ticket-input"
                                                    onChange={e => setTicketForm({
                                                        ...ticketForm,
                                                        payload: { ...ticketForm.payload, value: e.target.value }
                                                    })}
                                                    required
                                                    maxLength={250}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {ticketForm.type === 'shrinkage' && (
                                    <div className="section-panel">
                                        <h4 className="section-title text-red-400 text-sm font-bold mb-3">Detalles de la Merma</h4>
                                        <div className="ticket-form-group">
                                            <label className="ticket-form-label">Producto Afectado</label>
                                            <select
                                                className="ticket-select"
                                                onChange={e => setTicketForm({
                                                    ...ticketForm,
                                                    payload: { ...ticketForm.payload, productId: e.target.value }
                                                })}
                                                required
                                            >
                                                <option value="">Seleccionar Producto...</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="ticket-form-group">
                                            <label className="ticket-form-label">Cantidad Perdida</label>
                                            <input
                                                className="ticket-input"
                                                type="number"
                                                onChange={e => setTicketForm({
                                                    ...ticketForm,
                                                    payload: { ...ticketForm.payload, quantity: e.target.value }
                                                })}
                                                required
                                                min="1"
                                                max={products.find(p => p.id == ticketForm.payload.productId)?.stock || 10000}
                                            />
                                        </div>
                                        <div className="ticket-form-group mt-3">
                                            <label className="ticket-form-label">Motivo (Ej: Vencido, Roto)</label>
                                            <select
                                                className="ticket-select"
                                                onChange={e => setTicketForm({
                                                    ...ticketForm,
                                                    payload: { ...ticketForm.payload, reason: e.target.value }
                                                })}
                                                required
                                            >
                                                <option value="">Seleccionar Motivo...</option>
                                                <option value="expired">Vencimiento</option>
                                                <option value="damaged">Dañado / Roto</option>
                                                <option value="lost">Pérdida / Robo</option>
                                                <option value="consumed">Consumo Interno</option>
                                                <option value="other">Otro</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {ticketForm.type === 'stock_arrival' && (
                                    <div className="section-panel">
                                        <h4 className="section-title text-green-600 text-sm font-bold mb-3">Recepción de Mercadería</h4>
                                        <div className="form-row">
                                            <div className="ticket-form-group flex-1">
                                                <label className="ticket-form-label">Producto Recibido</label>
                                                <select
                                                    className="ticket-select"
                                                    onChange={e => setTicketForm({
                                                        ...ticketForm,
                                                        payload: { ...ticketForm.payload, productId: e.target.value }
                                                    })}
                                                    required
                                                >
                                                    <option value="">Seleccionar Producto...</option>
                                                    {products.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} (Actual: {p.stock})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="ticket-form-group flex-1">
                                                <label className="ticket-form-label">Cantidad Recibida</label>
                                                <input
                                                    className="ticket-input"
                                                    type="number"
                                                    onChange={e => setTicketForm({
                                                        ...ticketForm,
                                                        payload: { ...ticketForm.payload, quantity: e.target.value }
                                                    })}
                                                    required
                                                    min="1"
                                                    max="100000"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="ticket-form-group">
                                    <label className="ticket-form-label">Descripción / Notas Adicionales</label>
                                    <textarea
                                        className="ticket-textarea"
                                        value={ticketForm.description}
                                        onChange={e => setTicketForm({ ...ticketForm, description: e.target.value })}
                                        required
                                        maxLength={250}
                                    />
                                </div>



                                <div className="modal-actions">
                                    <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
                                    <Button type="submit">Crear Ticket</Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedTicket && showDetailModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <div>
                                <h2 className="text-xl">{selectedTicket.title}</h2>
                                <span className={`ticket-type-badge ${selectedTicket.type} mt-1 inline-block`}>{getTypeLabel(selectedTicket.type)}</span>
                            </div>
                            <button onClick={() => setShowDetailModal(false)}><X size={24} /></button>
                        </div>

                        <div className="mb-6">
                            <div className="ticket-details-grid">
                                <div className="detail-section">
                                    <h4>Descripción</h4>
                                    <div className="detail-value">{selectedTicket.description}</div>
                                </div>
                                <div className="detail-section">
                                    <h4>Información</h4>
                                    <div className="space-y-2 text-sm text-muted">
                                        <p>Creado por: <span className="text-white">{selectedTicket.created_by_username}</span></p>
                                        <p>Fecha: <span className="text-white">{new Date(selectedTicket.created_at).toLocaleString()}</span></p>
                                        <p>Estado: <span className={`ticket-status-badge ${selectedTicket.status}`}>{getStatusBadge(selectedTicket.status)}</span></p>
                                    </div>
                                </div>
                            </div>

                            {selectedTicket.type !== 'observation' && selectedTicket.payload && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-bold mb-2 text-muted uppercase">Cambios Propuestos</h4>
                                    <div className="changes-preview">
                                        {Object.entries(selectedTicket.payload).map(([key, value]) => {
                                            let label = key;
                                            let displayValue = value;

                                            // Formateo de etiquetas
                                            const labels = {
                                                productId: 'Producto',
                                                newStock: 'Nuevo Stock',
                                                quantity: 'Cantidad',
                                                reason: 'Motivo',
                                                field: 'Campo',
                                                value: 'Valor',
                                                description: 'Descripción'
                                            };
                                            if (labels[key]) label = labels[key];

                                            // Formateo de valores
                                            if (key === 'productId') {
                                                const product = products.find(p => p.id === parseInt(value));
                                                displayValue = product ? product.name : `ID: ${value}`;
                                            }
                                            if (key === 'reason') {
                                                const reasons = {
                                                    expired: 'Vencimiento',
                                                    damaged: 'Dañado / Roto',
                                                    lost: 'Pérdida / Robo',
                                                    consumed: 'Consumo Interno',
                                                    other: 'Otro'
                                                };
                                                displayValue = reasons[value] || value;
                                            }
                                            if (key === 'field') {
                                                const fields = { name: 'Nombre', price: 'Precio', description: 'Descripción' };
                                                displayValue = fields[value] || value;
                                            }

                                            return (
                                                <div key={key} className="change-item text-sm">
                                                    <span className="text-muted capitalize">{label}:</span>
                                                    <span className="font-mono font-bold ml-2">{displayValue}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {selectedTicket.attachment_path && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-bold mb-2 text-muted uppercase">Adjunto</h4>
                                    <img
                                        src={convertFileSrc(selectedTicket.attachment_path)}
                                        alt="Evidencia"
                                        className="evidence-image"
                                    />
                                </div>
                            )}
                        </div>

                        {selectedTicket.status === 'pending' && user.role === 'admin' && selectedTicket.type !== 'observation' && (
                            <div className="p-4 bg-blue-900/20 rounded border border-blue-500/30 mb-4 flex gap-4 items-center">
                                <AlertCircle className="text-blue-400" />
                                <div className="flex-1 text-sm">
                                    <p className="font-bold text-blue-100">Acción de Administrador</p>
                                    <p className="text-blue-200">Aprobar aplicará los cambios automáticamente al inventario.</p>
                                </div>
                            </div>
                        )}

                        <div className="modal-actions">
                            <Button type="button" variant="secondary" onClick={() => setShowDetailModal(false)}>Cerrar</Button>

                            {selectedTicket.status === 'pending' && user.role === 'admin' && (
                                <>
                                    <Button type="button" variant="danger" onClick={handleReject}>Rechazar</Button>
                                    {selectedTicket.type !== 'observation' ? (
                                        <Button type="button" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleApprove}>
                                            <Check size={18} className="mr-2" />
                                            Aprobar y Aplicar
                                        </Button>
                                    ) : (
                                        <Button type="button" onClick={() => handleApprove()}>
                                            <Check size={18} className="mr-2" />
                                            Marcar Resuelto
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tickets;
