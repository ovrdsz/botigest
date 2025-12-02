import React, { useState, useEffect } from 'react';
import { ProductRepository } from '../../repositories/productRepository';
import Modal from '../../components/ui/Modal';
import ProductForm from '../../components/products/ProductForm';
import { Search, Plus, Filter, MoreVertical, X, Trash2, Image as ImageIcon } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { ask } from '@tauri-apps/plugin-dialog';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import './Inventory.css';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await ProductRepository.getAll();
            setProducts(data);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProduct = async (productData) => {
        try {
            if (editingProduct) {
                await ProductRepository.update(editingProduct.id, productData);
            } else {
                await ProductRepository.create(productData);
            }
            setIsModalOpen(false);
            setEditingProduct(null);
            loadProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            if (error.toString().includes('UNIQUE constraint failed') || error.toString().includes('code: 2067')) {
                alert('El código del producto ya existe. Por favor, utiliza un código único.');
            } else {
                alert('Error al guardar el producto');
            }
        }
    };

    const handleEditClick = (product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (id) => {
        const confirmed = await ask('¿Estás seguro de eliminar este producto?', {
            title: 'Confirmar Eliminación',
            kind: 'warning'
        });

        if (confirmed) {
            try {
                await ProductRepository.delete(id);
                loadProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
                if (error.toString().includes('FOREIGN KEY constraint failed') || error.toString().includes('code: 787')) {
                    alert('No se puede eliminar el producto porque tiene ventas asociadas.');
                } else {
                    alert('Error al eliminar el producto');
                }
            }
        }
    };

    const handleCleanOrphans = async () => {
        if (window.confirm('¿Estás seguro de eliminar todos los productos sin categoría que no tengan ventas?')) {
            try {
                const count = await ProductRepository.deleteOrphans();
                alert(`Se eliminaron ${count} productos sin categoría.`);
                loadProducts();
            } catch (error) {
                console.error('Error cleaning orphans:', error);
                alert('Error al limpiar productos');
            }
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const getStatusColor = (stock) => {
        if (stock <= 0) return 'status-error';
        if (stock < 10) return 'status-warning';
        return 'status-success';
    };

    const getStatusText = (stock) => {
        if (stock <= 0) return 'Sin Stock';
        if (stock < 10) return 'Bajo Stock';
        return 'Disponible';
    };

    const filteredProducts = products.filter(product => {
        const searchLower = searchTerm.toLowerCase();
        return (
            product.name.toLowerCase().includes(searchLower) ||
            product.code.toLowerCase().includes(searchLower) ||
            (product.category_name && product.category_name.toLowerCase().includes(searchLower))
        );
    });

    return (
        <div className="inventory-page">
            <div className="page-header">
                <div>
                    <h1>Inventario</h1>
                    <p>Gestión de productos y stock</p>
                </div>
                <Button onClick={() => {
                    setEditingProduct(null);
                    setIsModalOpen(true);
                }}>
                    <Plus size={18} style={{ marginRight: '8px' }} />
                    Nuevo Producto
                </Button>
            </div>

            <Card className="inventory-card">
                <div className="table-actions">
                    <div className="search-wrapper">
                        <Search className="search-icon" size={18} />
                        <Input
                            type="text"
                            placeholder="Buscar producto..."
                            className="table-search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex' }}>
                        <Button variant="secondary" className="filter-btn">
                            <Filter size={18} />
                            Filtros
                        </Button>
                    </div>
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}></th>
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
                            {filteredProducts.map((product) => (
                                <tr key={product.id}>
                                    <td>
                                        <div className="product-thumbnail" style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '6px',
                                            overflow: 'hidden',
                                            background: 'var(--bg-secondary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {product.image_url ? (
                                                <img
                                                    src={convertFileSrc(product.image_url)}
                                                    alt={product.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <ImageIcon size={20} className="text-muted" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="font-medium">{product.name}</td>
                                    <td className="text-muted">{product.code}</td>
                                    <td>{product.category_name || 'Sin Categoría'}</td>
                                    <td>${product.price.toLocaleString()}</td>
                                    <td>{product.stock}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusColor(product.stock)}`}>
                                            {getStatusText(product.stock)}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <div className="action-buttons">
                                            <button
                                                className="action-btn"
                                                onClick={() => handleEditClick(product)}
                                                title="Editar"
                                            >
                                                <MoreVertical size={18} />
                                            </button>
                                            <button
                                                className="action-btn delete-btn"
                                                onClick={() => handleDeleteClick(product.id)}
                                                title="Eliminar"
                                                style={{ marginLeft: '0.5rem', color: 'var(--status-error)' }}
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingProduct ? "Editar Producto" : "Nuevo Producto"}
                className="modal-lg"
            >
                <ProductForm
                    onSubmit={handleCreateProduct}
                    onCancel={handleCloseModal}
                    initialData={editingProduct}
                />
            </Modal>
        </div>
    );
};

export default Inventory;
