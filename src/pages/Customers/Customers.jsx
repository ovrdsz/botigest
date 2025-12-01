import React, { useState } from 'react';
import { Search, Plus, User, Phone, Mail, Star, MoreVertical } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import './Customers.css';

const Customers = () => {
    const [searchQuery, setSearchQuery] = useState('');

    // Datos de prueba
    const [customers] = useState([
        {
            id: 1,
            name: 'Juan Pérez',
            email: 'juan.perez@email.com',
            phone: '+56 9 1234 5678',
            points: 1250,
            lastVisit: '2023-11-28',
            totalSpent: '$45.000'
        },
        {
            id: 2,
            name: 'María García',
            email: 'maria.g@email.com',
            phone: '+56 9 8765 4321',
            points: 450,
            lastVisit: '2023-11-25',
            totalSpent: '$12.500'
        },
        {
            id: 3,
            name: 'Carlos López',
            email: 'carlos.lopez@email.com',
            phone: '+56 9 1122 3344',
            points: 890,
            lastVisit: '2023-11-15',
            totalSpent: '$32.000'
        },
        {
            id: 4,
            name: 'Ana Martínez',
            email: 'ana.m@email.com',
            phone: '+56 9 5566 7788',
            points: 2100,
            lastVisit: '2023-11-30',
            totalSpent: '$89.900'
        },
    ]);

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="customers-page">
            <div className="page-header">
                <div>
                    <h1>Clientes</h1>
                    <p>Gestión de base de datos de clientes</p>
                </div>
                <Button>
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
                                <th></th>
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
                                            <div className="contact-item">
                                                <Mail size={14} />
                                                <span>{customer.email}</span>
                                            </div>
                                            <div className="contact-item">
                                                <Phone size={14} />
                                                <span>{customer.phone}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="points-badge">
                                            <Star size={14} className="star-icon" />
                                            <span>{customer.points} pts</span>
                                        </div>
                                    </td>
                                    <td>{new Date(customer.lastVisit).toLocaleDateString('es-ES')}</td>
                                    <td className="font-medium">{customer.totalSpent}</td>
                                    <td className="text-right">
                                        <button className="action-btn">
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default Customers;
