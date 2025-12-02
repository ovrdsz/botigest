import React, { useState, useEffect } from 'react';
import { Search, Plus, User, Phone, Mail, Star, MoreVertical, Trash2, Edit } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import CustomerForm from '../../components/customers/CustomerForm';
import { CustomerRepository } from '../../repositories/customerRepository';
import './Customers.css';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        try {
            const data = await CustomerRepository.getAll();
            setCustomers(data);
        } catch (error) {
            console.error('Error loading customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCustomer = async (customerData) => {
        try {
            if (editingCustomer) {
                await CustomerRepository.update(editingCustomer.id, customerData);
            } else {
                await CustomerRepository.create(customerData);
            }
            setIsModalOpen(false);
            setEditingCustomer(null);
            loadCustomers();
        } catch (error) {
            console.error('Error saving customer:', error);
            alert('Error al guardar el cliente');
        }
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
            try {
                await CustomerRepository.delete(id);
                loadCustomers();
            } catch (error) {
                console.error('Error deleting customer:', error);
                alert('Error al eliminar el cliente');
            }
        }
    };

    const handleEditClick = (customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone && c.phone.includes(searchQuery)) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="customers-page">
            <div className="page-header">
                <div>
                    <h1>Clientes</h1>
                    <p>Gestión de base de datos de clientes</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} style={{ marginRight: '8px' }} />
                    Nuevo Cliente
                </Button>
            </div>

            <Card className="customers-card">
                <div className="table-actions">
                    <div className="search-wrapper">
                        <Search className="search-icon" size={18} />
                        <Input
                            type="text"
                            placeholder="Buscar por nombre, teléfono o email..."
                            className="table-search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Contacto</th>
                                <th>Puntos</th>
                                <th>Última Visita</th>
                                <th>Total Gastado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id}>
                                    <td>
                                        <div className="customer-info">
                                            <div className="customer-avatar">
                                                <User size={16} />
                                            </div>
                                            <div>
                                                <div className="font-medium">{customer.name}</div>
                                                <div className="text-sm text-muted">ID: {customer.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="contact-info">
                                            {customer.email && (
                                                <div className="contact-item">
                                                    <Mail size={14} />
                                                    <span>{customer.email}</span>
                                                </div>
                                            )}
                                            {customer.phone && (
                                                <div className="contact-item">
                                                    <Phone size={14} />
                                                    <span>{customer.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="points-badge">
                                            <Star size={14} className="star-icon" />
                                            <span>{customer.points || 0} pts</span>
                                        </div>
                                    </td>
                                    <td>
                                        {customer.last_visit
                                            ? new Date(customer.last_visit).toLocaleDateString('es-ES')
                                            : '-'}
                                    </td>
                                    <td className="font-medium">
                                        ${(customer.total_spent || 0).toLocaleString()}
                                    </td>
                                    <td className="text-right">
                                        <div className="action-buttons">
                                            <button
                                                className="action-btn"
                                                onClick={() => handleEditClick(customer)}
                                                title="Editar"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => handleDeleteClick(customer.id)}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredCustomers.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-muted">
                                        No se encontraron clientes
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}
            >
                <CustomerForm
                    onSubmit={handleCreateCustomer}
                    onCancel={handleCloseModal}
                    initialData={editingCustomer}
                />
            </Modal>
        </div>
    );
};

export default Customers;
