import React, { useState } from 'react';
import { Search, Plus, Filter, MoreVertical } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import './Inventory.css';

const Inventory = () => {
    // Datos de prueba para productos
    const [products] = useState([
        {
            id: 1,
            name: 'Producto Ejemplo',
            sku: 'SKU-001',
            category: 'General',
            price: 1000,
            stock: 50,
            status: 'active'
        },
        {
            id: 2,
            name: 'Otro Producto',
            sku: 'SKU-002',
            category: 'Electrónica',
            price: 25000,
            stock: 10,
            status: 'low_stock'
        }
    ]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'status-success';
            case 'low_stock': return 'status-warning';
            case 'out_of_stock': return 'status-error';
            default: return 'status-default';
        }
    };

    return (
        <div className="inventory-page">
            <div className="page-header">
                <div>
                    <h1>Inventario</h1>
                    <p>Gestión de productos y stock</p>
                </div>
                <Button>
                    <Plus size={18} style={{ marginRight: '8px' }} />
                    Nuevo Producto
                </Button>
            </div>

            <Card className="inventory-card">
                <div className="table-actions">
                    <div className="search-wrapper">
                        <Search className="search-icon" size={18} />
                        <Input type="text" placeholder="Buscar producto..." className="table-search" />
                    </div>
                    <Button variant="secondary" className="filter-btn">
                        <Filter size={18} />
                        Filtros
                    </Button>
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>SKU</th>
                                <th>Categoría</th>
                                <th>Precio</th>
                                <th>Stock</th>
                                <th>Estado</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id}>
                                    <td className="font-medium">{product.name}</td>
                                    <td className="text-muted">{product.sku}</td>
                                    <td>{product.category}</td>
                                    <td>${product.price.toLocaleString()}</td>
                                    <td>{product.stock}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusColor(product.status)}`}>
                                            {product.status}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <button className="action-btn">
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default Inventory;
