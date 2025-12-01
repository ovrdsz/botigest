import React, { useState } from 'react';
import { Store, Printer, Users, Database, Save } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import './Settings.css';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('general');

    const renderContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className="settings-form">
                        <div className="form-section">
                            <h3>Información del Negocio</h3>
                            <div className="form-grid">
                                <Input label="Nombre del Negocio" defaultValue="Mi Tienda POS" />
                                <Input label="RUT / ID Fiscal" defaultValue="76.123.456-K" />
                                <Input label="Dirección" defaultValue="Av. Principal 123" />
                                <Input label="Teléfono" defaultValue="+56 9 1234 5678" />
                                <Input label="Email de Contacto" defaultValue="contacto@mitienda.cl" />
                            </div>
                        </div>
                        <div className="form-section">
                            <h3>Configuración Regional</h3>
                            <div className="form-grid">
                                <Input label="Moneda" defaultValue="CLP ($)" />
                                <Input label="Impuesto (%)" defaultValue="19" />
                            </div>
                        </div>
                    </div>
                );
            case 'devices':
                return (
                    <div className="settings-form">
                        <div className="form-section">
                            <h3>Impresoras</h3>
                            <div className="device-card">
                                <div className="device-info">
                                    <Printer size={24} />
                                    <div>
                                        <h4>EPSON TM-T20III</h4>
                                        <p className="text-muted">Impresora de Tickets (USB)</p>
                                    </div>
                                </div>
                                <div className="device-status connected">Conectado</div>
                                <Button variant="secondary" size="sm">Probar</Button>
                            </div>
                            <div className="device-card">
                                <div className="device-info">
                                    <Printer size={24} />
                                    <div>
                                        <h4>Microsoft Print to PDF</h4>
                                        <p className="text-muted">Impresora Virtual</p>
                                    </div>
                                </div>
                                <div className="device-status">Disponible</div>
                                <Button variant="secondary" size="sm">Probar</Button>
                            </div>
                        </div>
                    </div>
                );
            case 'users':
                return (
                    <div className="settings-form">
                        <div className="form-section">
                            <h3>Usuarios del Sistema</h3>
                            <div className="users-list">
                                <div className="user-item">
                                    <div className="user-avatar">A</div>
                                    <div className="user-details">
                                        <h4>Administrador</h4>
                                        <p>admin@botigest.cl</p>
                                    </div>
                                    <span className="role-badge admin">Admin</span>
                                    <Button variant="secondary" size="sm">Editar</Button>
                                </div>
                                <div className="user-item">
                                    <div className="user-avatar">V</div>
                                    <div className="user-details">
                                        <h4>Vendedor Turno Mañana</h4>
                                        <p>vendedor1@botigest.cl</p>
                                    </div>
                                    <span className="role-badge">Vendedor</span>
                                    <Button variant="secondary" size="sm">Editar</Button>
                                </div>
                            </div>
                            <Button className="mt-4">
                                <Users size={18} style={{ marginRight: '8px' }} />
                                Agregar Usuario
                            </Button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="settings-page">
            <div className="page-header">
                <div>
                    <h1>Configuración</h1>
                    <p>Administra las preferencias del sistema</p>
                </div>
                <Button>
                    <Save size={18} style={{ marginRight: '8px' }} />
                    Guardar Cambios
                </Button>
            </div>

            <div className="settings-container">
                <Card className="settings-sidebar">
                    <button
                        className={`settings-nav-item ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        <Store size={20} />
                        <span>General</span>
                    </button>
                    <button
                        className={`settings-nav-item ${activeTab === 'devices' ? 'active' : ''}`}
                        onClick={() => setActiveTab('devices')}
                    >
                        <Printer size={20} />
                        <span>Dispositivos</span>
                    </button>
                    <button
                        className={`settings-nav-item ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <Users size={20} />
                        <span>Usuarios</span>
                    </button>
                    <button
                        className={`settings-nav-item ${activeTab === 'backup' ? 'active' : ''}`}
                        onClick={() => setActiveTab('backup')}
                    >
                        <Database size={20} />
                        <span>Respaldo</span>
                    </button>
                </Card>

                <Card className="settings-content">
                    {renderContent()}
                </Card>
            </div>
        </div>
    );
};

export default Settings;
