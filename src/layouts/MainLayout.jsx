import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Package, ShoppingCart, Users, FileText, Settings, LogOut, Tag } from 'lucide-react';
import WindowControls from '../components/ui/WindowControls';
import './MainLayout.css';

const MainLayout = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="layout-container">
            <WindowControls />
            <aside className="sidebar glass-panel">
                <div className="sidebar-header">
                    <div className="sidebar-logo">B</div>
                    <h2>Botigest</h2>
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
