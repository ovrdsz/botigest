import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Package, ShoppingCart, Users, FileText, Settings, LogOut, Tag, MessageSquare } from 'lucide-react';
import WindowControls from '../components/ui/WindowControls';
import { SettingsRepository } from '../repositories/settingsRepository';
import './MainLayout.css';

const MainLayout = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [appName, setAppName] = React.useState('Botigest');

    const updateAppName = async () => {
        const name = await SettingsRepository.get('appName');
        if (name) setAppName(name);
    };

    React.useEffect(() => {
        updateAppName();

        const handleSettingsChange = () => {
            updateAppName();
        };

        window.addEventListener('app-settings-changed', handleSettingsChange);

        return () => {
            window.removeEventListener('app-settings-changed', handleSettingsChange);
        };
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="layout-container">
            <WindowControls />
            <aside className="sidebar glass-panel">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <h2>{appName}</h2>
                </div>

                <nav className="sidebar-nav">
                    {user?.role === 'admin' && (
                        <>
                            <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <LayoutDashboard size={20} />
                                <span>Dashboard</span>
                            </NavLink>
                            <NavLink to="/inventory" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <Package size={20} />
                                <span>Inventario</span>
                            </NavLink>
                            <NavLink to="/categories" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <Tag size={20} />
                                <span>Categorías</span>
                            </NavLink>
                        </>
                    )}

                    <NavLink to="/pos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <ShoppingCart size={20} />
                        <span>Ventas (POS)</span>
                    </NavLink>

                    {user?.role === 'admin' && (
                        <NavLink to="/cash-shifts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <FileText size={20} />
                            <span>Caja</span>
                        </NavLink>
                    )}

                    <NavLink to="/tickets" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <MessageSquare size={20} />
                        <span>Soporte / Tickets</span>
                    </NavLink>

                    {user?.role === 'admin' && (
                        <>
                            <NavLink to="/customers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <Users size={20} />
                                <span>Clientes</span>
                            </NavLink>
                            <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <FileText size={20} />
                                <span>Reportes</span>
                            </NavLink>
                            <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <Settings size={20} />
                                <span>Configuración</span>
                            </NavLink>
                        </>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <p className="user-name">{user?.username}</p>
                        <p className="user-role">{user?.role}</p>
                    </div>
                    <button onClick={handleLogout} className="nav-item logout-btn">
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <div className="content-wrapper">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
