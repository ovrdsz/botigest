import React, { useState, useEffect } from 'react';
import { Calendar, Download, TrendingUp, DollarSign, CreditCard, ShoppingBag } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { SaleRepository } from '../../repositories/saleRepository';
import './Reports.css';
import { exportToCSV } from '../../utils/exportUtils';

const Reports = () => {
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        count: 0,
        average: 0,
        trend: 0
    });
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [categorySales, setCategorySales] = useState([]);
    const [sellerSales, setSellerSales] = useState([]);
    const [hourlySales, setHourlySales] = useState([]);

    useEffect(() => {
        loadReportsData();
    }, [dateRange]);

    const loadReportsData = async () => {
        try {
            const [
                dailyStats,
                recentSales,
                paymentStats,
                catSales,
                sellSales,
                hourSales
            ] = await Promise.all([
                SaleRepository.getDailyStats(), // Aún obtiene estadísticas de "hoy" para KPIs
                SaleRepository.getSalesByDateRange(dateRange.start, dateRange.end),
                SaleRepository.getSalesByPaymentMethod(), // Estadísticas globales
                SaleRepository.getSalesByCategory(dateRange.start, dateRange.end),
                SaleRepository.getSalesBySeller(dateRange.start, dateRange.end),
                SaleRepository.getHourlySales(dateRange.start) // Por hora para la fecha de inicio
            ]);

            setStats(dailyStats);

            setTransactions(recentSales.map(s => ({
                id: s.id,
                date: new Date(s.created_at).toLocaleString(),
                customer: s.customer || 'Cliente General',
                total: s.total,
                method: s.payment_method === 'cash' ? 'Efectivo' : 'Tarjeta',
                status: s.status === 'completed' ? 'Completado' : s.status
            })));

            setPaymentMethods(paymentStats);
            setCategorySales(catSales);
            setSellerSales(sellSales);
            setHourlySales(hourSales);

        } catch (error) {
            console.error("Error loading reports data:", error);
        }
    };

    const handleExport = async () => {
        try {
            const data = await SaleRepository.getSalesByDateRange(dateRange.start, dateRange.end);
            if (!data || data.length === 0) {
                alert('No hay datos para exportar en el rango de fechas seleccionado.');
                return;
            }

            // Formatear datos para exportar (encabezados y valores en español)
            const formattedData = data.map(item => ({
                'ID': item.id,
                'Fecha': new Date(item.created_at).toLocaleString(),
                'Cliente': item.customer || 'Cliente General',
                'Vendedor': item.seller || 'Desconocido',
                'Método Pago': item.payment_method === 'cash' ? 'Efectivo' : 'Tarjeta',
                'Total': item.total,
                'Estado': item.status === 'completed' ? 'Completado' : item.status
            }));

            exportToCSV(formattedData, 'ventas_reporte');
        } catch (error) {
            console.error("Error exporting data:", error);
            alert('Ocurrió un error al exportar los datos.');
        }
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({ ...prev, [name]: value }));
    };

    // Limpiar y parsear datos de ventas por hora
    const cleanedHourlySales = hourlySales.map(h => {
        // Eliminar caracteres no numéricos excepto punto y menos (si los hay)
        // Esto maneja casos como "$250,000" o "250.000" dependiendo de la configuración regional
        // Asumiendo que la DB retorna un número o una representación en string de un número
        let val = h.total;
        if (typeof val === 'string') {
            // Eliminar símbolos de moneda y comas (asumiendo punto como separador decimal o entero simple)
            // Si el formato es 1.000,00 (Europeo), este reemplazo simple podría ser riesgoso, 
            // pero SQLite usualmente retorna números estándar. 
            // Intentemos parsearlo de forma segura.
            val = parseFloat(val);
        }
        return {
            ...h,
            numericTotal: isNaN(val) ? 0 : val
        };
    });

    // Calcular valor máximo para escala de gráficos
    const maxHourlyTotal = Math.max(...cleanedHourlySales.map(h => h.numericTotal), 1);

    // Calcular ángulos para gráfico de dona
    const cashCount = paymentMethods.find(p => p.payment_method === 'cash')?.count || 0;
    const cardCount = paymentMethods.find(p => p.payment_method === 'card')?.count || 0;
    const totalCount = cashCount + cardCount || 1; // Evitar división por cero
    const cashAngle = (cashCount / totalCount) * 360;

    return (
        <div className="reports-page">
            <div className="page-header">
                <div>
                    <h1>Reportes</h1>
                    <p>Análisis de ventas y rendimiento</p>
                </div>
                <div className="header-actions">
                    <div className="date-inputs">
                        <input
                            type="date"
                            name="start"
                            value={dateRange.start}
                            onChange={handleDateChange}
                            className="date-input"
                        />
                        <span className="date-separator">a</span>
                        <input
                            type="date"
                            name="end"
                            value={dateRange.end}
                            onChange={handleDateChange}
                            className="date-input"
                        />
                    </div>
                    <Button variant="secondary" onClick={handleExport}>
                        <Download size={18} />
                        Exportar
                    </Button>
                </div>
            </div>

            {/* Tarjetas KPI (Siempre muestran HOY para referencia rápida) */}
            <div className="kpi-grid">
                <Card className="kpi-card">
                    <div className="kpi-icon success">
                        <DollarSign size={24} />
                    </div>
                    <div className="kpi-content">
                        <p className="kpi-label">Ventas Hoy</p>
                        <h3 className="kpi-value">${stats.total.toLocaleString()}</h3>
                        <p className={`kpi-trend ${stats.trend >= 0 ? 'positive' : 'negative'}`}>
                            {stats.trend > 0 ? '+' : ''}{stats.trend.toFixed(1)}% vs ayer
                        </p>
                    </div>
                </Card>
                <Card className="kpi-card">
                    <div className="kpi-icon primary">
                        <ShoppingBag size={24} />
                    </div>
                    <div className="kpi-content">
                        <p className="kpi-label">Transacciones Hoy</p>
                        <h3 className="kpi-value">{stats.count}</h3>
                    </div>
                </Card>
                <Card className="kpi-card">
                    <div className="kpi-icon warning">
                        <TrendingUp size={24} />
                    </div>
                    <div className="kpi-content">
                        <p className="kpi-label">Ticket Promedio</p>
                        <h3 className="kpi-value">${stats.average.toLocaleString()}</h3>
                    </div>
                </Card>
            </div>

            <div className="reports-content">
                {/* Sección de Gráficos Superiores */}
                <div className="charts-container">
                    {/* Ventas por Hora */}
                    <Card className="chart-card main-chart">
                        <div className="card-header">
                            <h3>Ventas por Hora ({dateRange.start.split('-').reverse().join('/')})</h3>
                        </div>
                        <div className="list-chart">
                            {cleanedHourlySales.length > 0 ? (
                                cleanedHourlySales.map((item) => (
                                    <div key={item.hour} className="list-chart-item">
                                        <div className="list-chart-info">
                                            <span className="list-chart-label">{item.hour}:00</span>
                                            <span className="list-chart-value">${item.numericTotal.toLocaleString()}</span>
                                        </div>
                                        <div className="progress-bg">
                                            <div
                                                className="progress-fill"
                                                style={{ width: `${(item.numericTotal / maxHourlyTotal) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-data">No hay datos para este día</div>
                            )}
                        </div>
                    </Card>

                    {/* Métodos de Pago */}
                    <Card className="chart-card">
                        <div className="card-header">
                            <h3>Métodos de Pago (Histórico)</h3>
                        </div>
                        <div
                            className="donut-chart-placeholder"
                            style={{
                                background: paymentMethods.length > 0
                                    ? `conic-gradient(
                                        var(--primary) 0deg ${cashAngle}deg, 
                                        var(--success) ${cashAngle}deg 360deg
                                      )`
                                    : 'var(--bg-secondary)'
                            }}
                        >
                            <div className="donut-center">
                                <span>Total</span>
                            </div>
                        </div>
                        <div className="chart-legend">
                            {paymentMethods.map((pm, index) => (
                                <div key={index} className="legend-item">
                                    <span className="dot" style={{ background: index === 0 ? 'var(--primary)' : 'var(--success)' }}></span>
                                    {pm.payment_method === 'card' ? 'Tarjeta' : 'Efectivo'} ({pm.count})
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Sección de Desglose (Categorías y Vendedores) */}
                <div className="charts-container secondary-charts">
                    {/* Ventas por Categoría */}
                    <Card className="chart-card">
                        <div className="card-header">
                            <h3>Ventas por Categoría</h3>
                        </div>
                        <div className="list-chart">
                            {categorySales.map((cat, index) => (
                                <div key={index} className="list-chart-item">
                                    <div className="list-chart-info">
                                        <span className="list-chart-label">{cat.category || 'Sin Categoría'}</span>
                                        <span className="list-chart-value">${cat.total.toLocaleString()}</span>
                                    </div>
                                    <div className="progress-bg">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${(cat.total / (categorySales[0]?.total || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                            {categorySales.length === 0 && <div className="no-data">No hay datos en este rango</div>}
                        </div>
                    </Card>

                    {/* Ventas por Vendedor */}
                    <Card className="chart-card">
                        <div className="card-header">
                            <h3>Rendimiento Vendedores</h3>
                        </div>
                        <div className="table-container small-table">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Vendedor</th>
                                        <th>Ventas</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sellerSales.map((seller, index) => (
                                        <tr key={index}>
                                            <td>{seller.username || 'Desconocido'}</td>
                                            <td>{seller.count}</td>
                                            <td>${seller.total.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {sellerSales.length === 0 && (
                                        <tr><td colSpan="3" className="text-center text-muted">No hay datos</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Tabla de Transacciones */}
                <Card className="transactions-card">
                    <div className="card-header">
                        <h3>Detalle de Transacciones</h3>
                    </div>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Fecha</th>
                                    <th>Cliente</th>
                                    <th>Método</th>
                                    <th>Total</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((trx) => (
                                    <tr key={trx.id}>
                                        <td className="font-medium">#{trx.id}</td>
                                        <td className="text-muted">{trx.date}</td>
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
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-4 text-muted">No hay transacciones en este rango</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Reports;
