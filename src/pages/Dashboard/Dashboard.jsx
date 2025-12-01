import React from 'react';
import { TrendingUp, ShoppingBag, AlertTriangle, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import './Dashboard.css';

const Dashboard = () => {
    // Datos de prueba
    const stats = [
        {
            title: 'Ventas del Día',
            value: '$154.900',
            trend: '+12.5%',
            isPositive: true,
            icon: DollarSign,
            color: 'var(--success)'
        },
        {
            title: 'Transacciones',
            value: '45',
            trend: '+5.2%',
            isPositive: true,
            icon: ShoppingBag,
            color: 'var(--primary)'
        },
        {
            title: 'Ticket Promedio',
            value: '$3.442',
            trend: '-2.1%',
            isPositive: false,
            icon: TrendingUp,
            color: 'var(--warning)'
        },
        {
            title: 'Alertas de Stock',
            value: '3',
            trend: 'Items',
            isPositive: false, // Contexto Neutral/Negativo
            icon: AlertTriangle,
            color: 'var(--danger)'
        }
    ];

    const recentSales = [
        { id: 1, time: '10:42', total: '$4.500', items: 2, method: 'Efectivo' },
        { id: 2, time: '10:38', total: '$12.900', items: 5, method: 'Tarjeta' },
        { id: 3, time: '10:15', total: '$2.100', items: 1, method: 'Efectivo' },
        { id: 4, time: '09:55', total: '$8.400', items: 3, method: 'Tarjeta' },
    ];

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div>
                    <h1>Hola, Usuario</h1>
                    <p>Resumen de actividad para hoy, {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
            </div>

            {/* Cuadrícula de Estadísticas */}
            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <Card key={index} className="stat-card">
                        <div className="stat-icon-wrapper" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                            <stat.icon size={24} />
                        </div>
                        <div className="stat-content">
                            <p className="stat-title">{stat.title}</p>
                            <h3 className="stat-value">{stat.value}</h3>
                            <div className="stat-trend">
                                {stat.isPositive ? (
                                    <ArrowUpRight size={16} className="trend-icon positive" />
                                ) : (
                                    <ArrowDownRight size={16} className="trend-icon negative" />
                                )}
                                <span className={stat.isPositive ? 'positive' : 'negative'}>
                                    {stat.trend}
                                </span>
                                <span className="trend-label">vs ayer</span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="dashboard-content">
                {/* Sección Principal de Gráfico (Marcador de posición) */}
                <Card className="chart-section">
                    <div className="section-header">
                        <h2>Ventas por Hora</h2>
                        <select className="chart-filter">
                            <option>Hoy</option>
                            <option>Esta Semana</option>
                        </select>
                    </div>
                    <div className="chart-placeholder">
                        {/* Representación visual de un gráfico */}
                        <div className="bar" style={{ height: '40%' }}></div>
                        <div className="bar" style={{ height: '65%' }}></div>
                        <div className="bar" style={{ height: '50%' }}></div>
                        <div className="bar" style={{ height: '85%' }}></div>
                        <div className="bar" style={{ height: '60%' }}></div>
                        <div className="bar" style={{ height: '75%' }}></div>
                        <div className="bar" style={{ height: '45%' }}></div>
                        <div className="bar" style={{ height: '90%' }}></div>
                        <div className="bar active" style={{ height: '70%' }}></div>
                        <div className="bar" style={{ height: '55%' }}></div>
                        <div className="bar" style={{ height: '40%' }}></div>
                        <div className="bar" style={{ height: '30%' }}></div>
                    </div>
                </Card>

                {/* Actividad Reciente */}
                <Card className="activity-section">
                    <div className="section-header">
                        <h2>Actividad Reciente</h2>
                        <button className="view-all-btn">Ver todo</button>
                    </div>
                    <div className="activity-list">
                        {recentSales.map(sale => (
                            <div key={sale.id} className="activity-item">
                                <div className="activity-icon">
                                    <ShoppingBag size={18} />
                                </div>
                                <div className="activity-details">
                                    <p className="activity-title">Venta #{1000 + sale.id}</p>
                                    <p className="activity-subtitle">{sale.items} artículos • {sale.method}</p>
                                </div>
                                <div className="activity-amount">
                                    {sale.total}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
