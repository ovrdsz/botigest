import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, AlertTriangle, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import { SaleRepository } from '../../repositories/saleRepository';
import { ProductRepository } from '../../repositories/productRepository';
import './Dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState([
        {
            title: 'Ventas del Día',
            value: '$0',
            trend: '0%',
            isPositive: true,
            icon: DollarSign,
            variant: 'success'
        },
        {
            title: 'Transacciones',
            value: '0',
            trend: '0%',
            isPositive: true,
            icon: ShoppingBag,
            variant: 'primary'
        },
        {
            title: 'Ticket Promedio',
            value: '$0',
            trend: '0%',
            isPositive: true,
            icon: TrendingUp,
            variant: 'warning'
        },
        {
            title: 'Alertas de Stock',
            value: '0',
            trend: 'Items',
            isPositive: false,
            icon: AlertTriangle,
            variant: 'danger'
        }
    ]);

    const [recentSales, setRecentSales] = useState([]);
    const [hourlySales, setHourlySales] = useState([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [dailyStats, lowStockCount, sales, salesHourly] = await Promise.all([
                SaleRepository.getDailyStats(),
                ProductRepository.getLowStock(10),
                SaleRepository.getRecentSales(5),
                SaleRepository.getHourlySales()
            ]);

            // Actualizar Ventas por Hora para Gráfico (Mapeo simple por ahora)
            // En una librería de gráficos real mapearíamos esto a la estructura de datos del gráfico
            // setHourlySales(hourlyData); 

            setStats([
                {
                    title: 'Ventas del Día',
                    value: `$${dailyStats.total.toLocaleString()}`,
                    trend: `${dailyStats.trend > 0 ? '+' : ''}${dailyStats.trend.toFixed(1)}%`,
                    isPositive: dailyStats.trend >= 0,
                    icon: DollarSign,
                    variant: 'success'
                },
                {
                    title: 'Transacciones',
                    value: dailyStats.count.toString(),
                    trend: `${dailyStats.countTrend > 0 ? '+' : ''}${dailyStats.countTrend.toFixed(1)}%`,
                    isPositive: dailyStats.countTrend >= 0,
                    icon: ShoppingBag,
                    variant: 'primary'
                },
                {
                    title: 'Ticket Promedio',
                    value: `$${dailyStats.average.toLocaleString()}`,
                    trend: `${dailyStats.averageTrend > 0 ? '+' : ''}${dailyStats.averageTrend.toFixed(1)}%`,
                    isPositive: dailyStats.averageTrend >= 0,
                    icon: TrendingUp,
                    variant: 'warning'
                },
                {
                    title: 'Alertas de Stock',
                    value: lowStockCount.toString(),
                    trend: 'Items',
                    isPositive: false,
                    icon: AlertTriangle,
                    variant: 'danger'
                }
            ]);

            setHourlySales(salesHourly);

            setRecentSales(sales.map(s => ({
                id: s.id,
                time: new Date(s.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                total: `$${s.total.toLocaleString()}`,
                items: s.items,
                method: s.payment_method === 'cash' ? 'Efectivo' : 'Tarjeta'
            })));

        } catch (error) {
            console.error("Error loading dashboard data:", error);
        }
    };

    const maxHourlySale = Math.max(...hourlySales.map(h => h.total), 1);

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
                        <div className={`stat-icon-wrapper ${stat.variant}`}>
                            <stat.icon size={24} />
                        </div>
                        <div className="stat-content">
                            <p className="stat-title">{stat.title === 'Ticket Promedio' ? 'Boleta Promedio' : stat.title}</p>
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
                {/* Sección Principal de Gráfico */}
                <Card className="chart-section">
                    <div className="section-header">
                        <h2>Ventas por Hora (Hoy)</h2>
                    </div>
                    <div className="list-chart-container" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }}>
                        {hourlySales.length > 0 ? (
                            <div className="list-chart">
                                {hourlySales.map((item, index) => (
                                    <div key={index} className="list-chart-item">
                                        <div className="list-chart-info">
                                            <span className="list-chart-label">{item.hour}:00</span>
                                            <span className="list-chart-value">${item.total.toLocaleString()}</span>
                                        </div>
                                        <div className="progress-bg">
                                            <div
                                                className="progress-fill"
                                                style={{ width: `${(item.total / maxHourlySale) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted text-center py-8">No hay ventas registradas hoy.</p>
                        )}
                    </div>
                </Card>

                {/* Actividad Reciente */}
                <Card className="activity-section">
                    <div className="section-header">
                        <h2>Actividad Reciente</h2>
                        <button className="view-all-btn">Ver todo</button>
                    </div>
                    <div className="activity-list">
                        {recentSales.length > 0 ? (
                            recentSales.map(sale => (
                                <div key={sale.id} className="activity-item">
                                    <div className="activity-icon">
                                        <ShoppingBag size={18} />
                                    </div>
                                    <div className="activity-details">
                                        <p className="activity-title">Venta #{sale.id}</p>
                                        <p className="activity-subtitle">{sale.items} artículos • {sale.method}</p>
                                    </div>
                                    <div className="activity-amount">
                                        {sale.total}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-muted text-center p-4">No hay ventas recientes</p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
