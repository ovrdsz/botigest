import React from 'react';
import { Calendar, Download, TrendingUp, DollarSign, CreditCard, ShoppingBag } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import './Reports.css';

const Reports = () => {
    // Datos de prueba para transacciones
    const transactions = [
        { id: 'TRX-001', date: '2023-11-30 10:42', customer: 'Juan Pérez', total: 4500, method: 'Efectivo', status: 'Completado' },
        { id: 'TRX-002', date: '2023-11-30 10:38', customer: 'Cliente General', total: 12900, method: 'Tarjeta', status: 'Completado' },
        { id: 'TRX-003', date: '2023-11-30 10:15', customer: 'María García', total: 2100, method: 'Efectivo', status: 'Completado' },
        { id: 'TRX-004', date: '2023-11-30 09:55', customer: 'Cliente General', total: 8400, method: 'Tarjeta', status: 'Completado' },
        { id: 'TRX-005', date: '2023-11-30 09:30', customer: 'Carlos López', total: 15000, method: 'Transferencia', status: 'Completado' },
    ];

    return (
        <div className="reports-page">
            <div className="page-header">
                <div>
                    <h1>Reportes</h1>
                    <p>Análisis de ventas y rendimiento</p>
                </div>
                <div className="header-actions">
                    <Button variant="secondary" className="date-range-btn">
                        <Calendar size={18} />
                        <span>Hoy: 30 Nov</span>
                    </Button>
                    <Button variant="secondary">
                        <Download size={18} />
                        Exportar
                    </Button>
                </div>
            </div>

            {/* Tarjetas KPI */}
            <div className="kpi-grid">
                <Card className="kpi-card">
                    <div className="kpi-icon success">
                        <DollarSign size={24} />
                    </div>
                    <div className="kpi-content">
                        <p className="kpi-label">Ventas Totales</p>
                        <h3 className="kpi-value">$154.900</h3>
                        <p className="kpi-trend positive">+12.5% vs ayer</p>
                    </div>
                </Card>
                <Card className="kpi-card">
                    <div className="kpi-icon primary">
                        <ShoppingBag size={24} />
                    </div>
                    <div className="kpi-content">
                        <p className="kpi-label">Transacciones</p>
                        <h3 className="kpi-value">45</h3>
                        <p className="kpi-trend positive">+5.2% vs ayer</p>
                    </div>
                </Card>
                <Card className="kpi-card">
                    <div className="kpi-icon warning">
                        <TrendingUp size={24} />
                    </div>
                    <div className="kpi-content">
                        <p className="kpi-label">Ticket Promedio</p>
                        <h3 className="kpi-value">$3.442</h3>
                        <p className="kpi-trend negative">-2.1% vs ayer</p>
                    </div>
                </Card>
            </div>

            <div className="reports-content">
                {/* Sección de Gráficos */}
                <div className="charts-container">
                    <Card className="chart-card main-chart">
                        <div className="card-header">
                            <h3>Ventas por Hora</h3>
                        </div>
                        <div className="chart-placeholder-large">
                            {/* Representación visual de un gráfico de líneas */}
                            <svg viewBox="0 0 100 40" className="chart-svg">
                                <path d="M0,35 Q10,30 20,32 T40,25 T60,15 T80,20 T100,5" fill="none" stroke="var(--primary)" strokeWidth="2" />
                                <path d="M0,35 L0,40 L100,40 L100,5 L100,40 Z" fill="url(#gradient)" opacity="0.2" />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.5" />
                                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                    </Card>
                    <Card className="chart-card">
                        <div className="card-header">
                            <h3>Métodos de Pago</h3>
                        </div>
                        <div className="donut-chart-placeholder">
                            <div className="donut-segment" style={{ '--deg': '220deg', '--color': 'var(--primary)' }}></div>
                            <div className="donut-segment" style={{ '--deg': '100deg', '--color': 'var(--success)' }}></div>
                            <div className="donut-segment" style={{ '--deg': '40deg', '--color': 'var(--warning)' }}></div>
                            <div className="donut-center">
                                <span>Total</span>
                            </div>
                        </div>
                        <div className="chart-legend">
                            <div className="legend-item"><span className="dot" style={{ background: 'var(--primary)' }}></span>Tarjeta (60%)</div>
                            <div className="legend-item"><span className="dot" style={{ background: 'var(--success)' }}></span>Efectivo (30%)</div>
                            <div className="legend-item"><span className="dot" style={{ background: 'var(--warning)' }}></span>Otros (10%)</div>
                        </div>
                    </Card>
                </div>

                {/* Tabla de Transacciones */}
                <Card className="transactions-card">
                    <div className="card-header">
                        <h3>Últimas Transacciones</h3>
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Hora</th>
                                    <th>Cliente</th>
                                    <th>Método</th>
                                    <th>Total</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((trx) => (
                                    <tr key={trx.id}>
                                        <td className="font-medium">{trx.id}</td>
                                        <td className="text-muted">{trx.date.split(' ')[1]}</td>
                                        <td>{trx.customer}</td>
                                        <td>
                                            <div className="method-badge">
                                                <CreditCard size={14} />
                                                {trx.method}
                                            </div>
                                        </td>
                                        <td className="font-medium">${trx.total.toLocaleString()}</td>
                                        <td>
                                            <span className="status-badge status-success">{trx.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Reports;
