import React, { useState, useEffect } from 'react';
import { Download, Search } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { CashShiftRepository } from '../../repositories/cashShiftRepository';
import { exportToCSV } from '../../utils/exportUtils';
import './CashShifts.css';

const CashShifts = () => {
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [shifts, setShifts] = useState([]);

    useEffect(() => {
        loadShifts();
    }, [dateRange]);

    const loadShifts = async () => {
        try {
            const data = await CashShiftRepository.getAll(dateRange.start, dateRange.end);
            setShifts(data);
        } catch (error) {
            console.error("Error loading cash shifts:", error);
        }
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({ ...prev, [name]: value }));
    };

    const handleExport = () => {
        if (!shifts || shifts.length === 0) {
            alert('No hay datos para exportar.');
            return;
        }

        const formattedData = shifts.map(shift => ({
            'ID': shift.id,
            'Estado': shift.status === 'open' ? 'Abierto' : 'Cerrado',
            'Apertura': new Date(shift.start_time).toLocaleString(),
            'Abierto Por': shift.opened_by_username || 'Desconocido',
            'Monto Inicial': shift.start_amount,
            'Cierre': shift.end_time ? new Date(shift.end_time).toLocaleString() : '-',
            'Cerrado Por': shift.closed_by_username || '-',
            'Monto Final': shift.end_amount || 0,
            'Esperado': shift.expected_amount || 0,
            'Diferencia': (shift.end_amount || 0) - (shift.expected_amount || 0),
            'Notas': shift.notes || ''
        }));

        exportToCSV(formattedData, 'historial_caja');
    };

    return (
        <div className="cash-shifts-page">
            <div className="page-header">
                <div>
                    <h1>Historial de Caja</h1>
                    <p>Registro de aperturas y cierres</p>
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
                        Exportar CSV
                    </Button>
                </div>
            </div>

            <Card className="shifts-card">
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Estado</th>
                                <th>Apertura</th>
                                <th>Responsable</th>
                                <th>Inicial</th>
                                <th>Cierre</th>
                                <th>Final</th>
                                <th>Dif.</th>
                                <th>Notas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shifts.map((shift) => {
                                const difference = (shift.end_amount || 0) - (shift.expected_amount || 0);
                                return (
                                    <tr key={shift.id}>
                                        <td className="font-medium">#{shift.id}</td>
                                        <td>
                                            <span className={`status-badge ${shift.status === 'open' ? 'status-success' : ''}`}>
                                                {shift.status === 'open' ? 'Abierto' : 'Cerrado'}
                                            </span>
                                        </td>
                                        <td>{new Date(shift.start_time).toLocaleString()}</td>
                                        <td>
                                            <div>AB: {shift.opened_by_username}</div>
                                            {shift.closed_by_username && <div className="text-muted text-xs">CR: {shift.closed_by_username}</div>}
                                        </td>
                                        <td>${shift.start_amount?.toLocaleString()}</td>
                                        <td>{shift.end_time ? new Date(shift.end_time).toLocaleString() : '-'}</td>
                                        <td>${shift.end_amount?.toLocaleString() || '-'}</td>
                                        <td className={difference < 0 ? 'diff-negative' : difference > 0 ? 'diff-positive' : ''}>
                                            {shift.status === 'closed' ? `$${difference.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="text-muted text-xs" style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {shift.notes || '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                            {shifts.length === 0 && (
                                <tr>
                                    <td colSpan="9" className="text-center py-4 text-muted">No hay registros en este rango</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default CashShifts;
