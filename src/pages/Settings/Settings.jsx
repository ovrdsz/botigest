import React, { useState } from 'react';
import { Store, Users, Database, Save, X, Edit, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import './Settings.css';

import { SettingsRepository } from '../../repositories/settingsRepository';
import { UserRepository } from '../../repositories/userRepository';
import { executeQuery } from '../../services/db';

import { save, open, ask } from '@tauri-apps/plugin-dialog';
import { copyFile, readFile, writeFile } from '@tauri-apps/plugin-fs';
import { appLocalDataDir, join } from '@tauri-apps/api/path';
import { relaunch, exit } from '@tauri-apps/plugin-process';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState({
        appName: 'Botigest',
        businessName: '',
        businessRut: '',
        businessAddress: '',
        businessPhone: '',
        businessEmail: '',
        currency: 'CLP ($)',
        taxRate: '19',
        telegramBotToken: '',
        telegramChatId: ''
    });

    // Estado de Gestión de Usuarios
    const [users, setUsers] = useState([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({ username: '', password: '', role: 'user' });

    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const loadedSettings = await SettingsRepository.getAll();
            if (Object.keys(loadedSettings).length > 0) {
                setSettings(prev => ({ ...prev, ...loadedSettings }));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await SettingsRepository.setMany(settings);
            window.dispatchEvent(new CustomEvent('app-settings-changed'));
            alert('Configuración guardada correctamente');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error al guardar la configuración');
        }
    };

    const handleChange = (key, value) => {
        if (key === 'businessPhone') {
            value = value.replace(/[^0-9+]/g, '');
        }
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    // Funciones de Gestión de Usuarios
    const loadUsers = async () => {
        try {
            const usersList = await UserRepository.getAll();
            setUsers(usersList);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const handleSaveUser = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                // Actualizar
                if (!userForm.username) return alert('El nombre de usuario es obligatorio');

                // Prevent last admin demotion
                if (editingUser.role === 'admin' && userForm.role !== 'admin') {
                    const adminCount = users.filter(u => u.role === 'admin').length;
                    if (adminCount <= 1) {
                        return alert('No puedes quitar el rol de administrador al último administrador. Crea otro admin primero.');
                    }
                }

                await UserRepository.update(editingUser.id, userForm);
                alert('Usuario actualizado correctamente');
            } else {
                // Crear
                if (!userForm.username || !userForm.password) return alert('Usuario y contraseña son obligatorios');
                await UserRepository.create(userForm);
                alert('Usuario creado correctamente');
            }
            setShowUserModal(false);
            loadUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Error al guardar usuario: ' + error.message);
        }
    };

    const handleDeleteUser = async (id) => {
        const userToDelete = users.find(u => u.id === id);

        // Prevent last admin deletion
        if (userToDelete && userToDelete.role === 'admin') {
            const adminCount = users.filter(u => u.role === 'admin').length;
            if (adminCount <= 1) {
                return alert('No puedes eliminar al último administrador.');
            }
        }

        if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
            try {
                await UserRepository.delete(id);
                loadUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Error al eliminar usuario');
            }
        }
    };

    const openUserModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setUserForm({ username: user.username, password: '', role: user.role });
        } else {
            setEditingUser(null);
            setUserForm({ username: '', password: '', role: 'user' });
        }
        setShowUserModal(true);
    };

    // Funciones de Respaldo y Restauración
    const handleBackup = async () => {
        try {
            // Checkpoint WAL para asegurar que todos los datos estén en el archivo DB principal
            try {
                await executeQuery('PRAGMA wal_checkpoint(TRUNCATE);');
            } catch (e) {
                console.error('Error checkpointing WAL:', e);
            }

            const { appDataDir } = await import('@tauri-apps/api/path');
            const roamingDir = await appDataDir();

            // Basado en logs, la DB está en Roaming
            const dbPath = await join(roamingDir, 'botigest.db');

            const filePath = await save({
                filters: [{
                    name: 'SQLite Database',
                    extensions: ['db', 'sqlite']
                }],
                defaultPath: 'botigest_backup.db'
            });

            if (!filePath) return;

            // Leer el archivo DB como binario
            const dbContent = await readFile(dbPath);
            // Escribir en la ubicación seleccionada
            await writeFile(filePath, dbContent);

            alert('Respaldo creado exitosamente.');
        } catch (error) {
            console.error('Error creating backup:', error);
            alert('Error al crear el respaldo: ' + error.message);
        }
    };

    const handleRestore = async () => {
        try {
            const confirmed = await ask('Restaurar una copia de seguridad SOBRESCRIBIRÁ todos los datos actuales. Esta acción no se puede deshacer. ¿Deseas continuar?', {
                title: 'Advertencia de Restauración',
                kind: 'warning'
            });

            if (!confirmed) return;

            const filePath = await open({
                multiple: false,
                filters: [{
                    name: 'SQLite Database',
                    extensions: ['db', 'sqlite']
                }]
            });

            if (!filePath) return;

            alert('Preparando restauración...');

            const { appDataDir } = await import('@tauri-apps/api/path');
            const { writeFile, readFile } = await import('@tauri-apps/plugin-fs');
            const roamingDir = await appDataDir();

            // Escribir en un archivo temporal "pendiente de restauración"
            const pendingPath = await join(roamingDir, 'botigest.restore.db');

            const backupContent = await readFile(filePath);
            await writeFile(pendingPath, backupContent);

            alert('Restauración preparada. La aplicación se cerrará ahora.\n\nPOR FAVOR, VUELVE A ABRIR LA APLICACIÓN MANUALMENTE para aplicar los cambios.');
            await exit(0);
        } catch (error) {
            console.error('Error restoring backup:', error);
            alert('Error al preparar la restauración: ' + error.message);
        }
    };

    React.useEffect(() => {
        if (activeTab === 'users') {
            loadUsers();
        }
    }, [activeTab]);

    const renderContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className="settings-form">
                        <div className="form-section">
                            <h3>Información del Negocio</h3>
                            <div className="form-grid">
                                <Input
                                    label="Nombre del Negocio"
                                    value={settings.businessName}
                                    onChange={(e) => handleChange('businessName', e.target.value)}
                                    placeholder="Mi Tienda POS"
                                    maxLength={50}
                                />
                                <Input
                                    label="Nombre de la App (Barra Lateral)"
                                    value={settings.appName}
                                    onChange={(e) => handleChange('appName', e.target.value)}
                                    maxLength={15}
                                    placeholder="Botigest"
                                />
                                <Input
                                    label="RUT / ID Fiscal"
                                    value={settings.businessRut}
                                    onChange={(e) => handleChange('businessRut', e.target.value)}
                                    placeholder="76.123.456-K"
                                    maxLength={15}
                                />
                                <Input
                                    label="Dirección"
                                    value={settings.businessAddress}
                                    onChange={(e) => handleChange('businessAddress', e.target.value)}
                                    placeholder="Av. Principal 123"
                                    maxLength={100}
                                />
                                <Input
                                    label="Teléfono"
                                    value={settings.businessPhone}
                                    onChange={(e) => handleChange('businessPhone', e.target.value)}
                                    placeholder="+56 9 1234 5678"
                                    maxLength={15}
                                />
                                <Input
                                    label="Email de Contacto"
                                    value={settings.businessEmail}
                                    onChange={(e) => handleChange('businessEmail', e.target.value)}
                                    placeholder="contacto@mitienda.cl"
                                />
                            </div>
                        </div>
                        <div className="form-section">
                            <h3>Configuración Regional</h3>
                            <div className="form-grid">
                                <Input
                                    label="Moneda"
                                    value={settings.currency}
                                    onChange={(e) => handleChange('currency', e.target.value)}
                                />
                                <Input
                                    label="Impuesto (%)"
                                    value={settings.taxRate}
                                    onChange={(e) => handleChange('taxRate', e.target.value)}
                                    maxLength={5}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'users':
                return (
                    <div className="settings-form">
                        <div className="form-section">
                            <div className="users-header">
                                <h3>Usuarios del Sistema</h3>
                                <Button onClick={() => openUserModal()}>
                                    <Users size={18} style={{ marginRight: '8px' }} />
                                    Agregar Usuario
                                </Button>
                            </div>

                            <div className="users-list">
                                {users.map(user => (
                                    <div key={user.id} className="user-item">
                                        <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
                                        <div className="user-details">
                                            <h4>{user.username}</h4>
                                            <p className="text-muted">Registrado: {new Date(user.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`role-badge ${user.role === 'admin' ? 'admin' : ''}`}>
                                            {user.role === 'admin' ? 'Admin' : 'Vendedor'}
                                        </span>
                                        <div className="flex gap-2">
                                            <Button variant="secondary" size="sm" onClick={() => openUserModal(user)}>
                                                <Edit size={16} />
                                            </Button>
                                            <Button variant="danger" size="sm" onClick={() => handleDeleteUser(user.id)}>
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {users.length === 0 && <p className="text-muted text-center py-4">No hay usuarios registrados.</p>}
                            </div>
                        </div>

                        {showUserModal && (
                            <div className="modal-overlay">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h2>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                                        <button onClick={() => setShowUserModal(false)}><X size={24} /></button>
                                    </div>
                                    <form onSubmit={handleSaveUser}>
                                        <div className="mb-4">
                                            <Input
                                                label="Nombre de Usuario"
                                                value={userForm.username}
                                                onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <Input
                                                label={editingUser ? "Nueva Contraseña (Opcional)" : "Contraseña"}
                                                type="password"
                                                value={userForm.password}
                                                onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                                                required={!editingUser}
                                                placeholder={editingUser ? "Dejar en blanco para mantener" : ""}
                                            />
                                        </div>
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium mb-1 text-muted">Rol</label>
                                            <select
                                                className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
                                                value={userForm.role}
                                                onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                                            >
                                                <option value="user">Vendedor</option>
                                                <option value="admin">Administrador</option>
                                            </select>
                                        </div>
                                        <div className="modal-actions">
                                            <Button type="button" variant="secondary" onClick={() => setShowUserModal(false)}>Cancelar</Button>
                                            <Button type="submit">Guardar</Button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'backup':
                return (
                    <div className="settings-form">
                        <div className="form-section">
                            <h3>Respaldo y Restauración</h3>
                            <p className="text-muted mb-4">
                                Gestiona copias de seguridad de tu base de datos para prevenir pérdida de información.
                            </p>

                            <div className="backup-grid">
                                <div className="backup-card">
                                    <div className="backup-icon blue">
                                        <Save size={32} />
                                    </div>
                                    <div className="backup-info">
                                        <h4>Crear Respaldo</h4>
                                        <p>
                                            Descarga una copia completa de tu base de datos actual.
                                        </p>
                                        <Button onClick={handleBackup} className="w-full">
                                            Descargar Copia
                                        </Button>
                                    </div>
                                </div>

                                <div className="backup-card danger">
                                    <div className="backup-icon red">
                                        <Database size={32} />
                                    </div>
                                    <div className="backup-info">
                                        <h4>Restaurar Copia</h4>
                                        <p>
                                            Recupera datos desde un archivo de respaldo. <strong>Sobrescribirá los datos actuales.</strong>
                                        </p>
                                        <Button onClick={handleRestore} variant="danger" className="w-full">
                                            Restaurar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="settings-form">
                        <div className="form-section">
                            <h3>Telegram Configuración</h3>
                            <p className="text-muted mb-4">
                                Configura tu bot de Telegram para recibir alertas de stock y tickets (opcional en producción).
                            </p>
                            <div className="form-grid">
                                <Input
                                    label="Bot Token"
                                    value={settings.telegramBotToken}
                                    onChange={(e) => handleChange('telegramBotToken', e.target.value)}
                                    placeholder="123456789:ABCdefGHI..."
                                />
                                <Input
                                    label="Chat ID"
                                    value={settings.telegramChatId}
                                    onChange={(e) => handleChange('telegramChatId', e.target.value)}
                                    placeholder="-123456789"
                                />
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    if (loading) return <div className="p-4">Cargando configuración...</div>;

    return (
        <div className="settings-page">
            <div className="page-header">
                <div>
                    <h1>Configuración</h1>
                    <p>Administra las preferencias del sistema</p>
                </div>
                <Button onClick={handleSave}>
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
                    <button
                        className={`settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('notifications')}
                    >
                        <Store size={20} />
                        <span>Notificaciones</span>
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
