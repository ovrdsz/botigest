import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, AlertTriangle, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import { SaleRepository } from '../../repositories/saleRepository';
import { ProductRepository } from '../../repositories/productRepository';
import { convertFileSrc } from '@tauri-apps/api/core';
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
    const [topProducts, setTopProducts] = useState([]);
    // Remove hourlySales state if unused or keep if needed for other things, but prompt says replace chart.
    // Clean code: remove hourlySales state.

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const today = new Date();
            const lastWeek = new Date(today);
            lastWeek.setDate(today.getDate() - 7);

            const formatDate = (date) => date.toISOString().split('T')[0];

            const [dailyStats, lowStockCount, sales, topSelling] = await Promise.all([
                SaleRepository.getDailyStats(),
                ProductRepository.getLowStock(10),
                SaleRepository.getRecentSales(5),
                SaleRepository.getTopSellingProducts(formatDate(lastWeek), formatDate(today))
            ]);

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

            setTopProducts(topSelling);

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
                {/* Sección Tendencia */}
                <Card className="chart-section">
                    <div className="section-header">
                        <h2>Tendencia</h2>
                        <span className="text-muted" style={{ fontSize: '0.9rem' }}>Esta semana</span>
                    </div>

                    <div className="trend-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1rem',
                        padding: '0.5rem 0'
                    }}>
                        {topProducts.length > 0 ? (
                            topProducts.map((product, index) => (
                                <div key={index} className="trend-card" style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    padding: '1rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div className="product-image-container" style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        marginBottom: '0.75rem',
                                        background: 'var(--bg-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {product.image_url ? (
                                            <img
                                                src={convertFileSrc(product.image_url)}
                                                alt={product.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'block';
                                                }}
                                            />
                                        ) : null}
                                        <div style={{
                                            display: product.image_url ? 'none' : 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            width: '100%',
                                            height: '100%'
                                        }}>
                                            <ShoppingBag size={24} className="text-muted" />
                                        </div>
                                    </div>

                                    <h4 style={{
                                        margin: '0 0 0.25rem 0',
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        color: 'var(--text-primary)',
                                        display: '-webkit-box',
                                        WebkitLineClamp: '2',
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        minHeight: '2.5em'
                                    }}>
                                        {product.name}
                                    </h4>

                                    <div className="trend-stats" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            color: 'var(--primary-color)',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: '500'
                                        }}>
                                            {product.count} vendidos
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                                <p className="text-muted">No hay datos de tendencias aún.</p>
                            </div>
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
