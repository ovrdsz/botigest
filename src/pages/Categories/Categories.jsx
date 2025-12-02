import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Tag } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import CategoryForm from '../../components/categories/CategoryForm';
import { CategoryRepository } from '../../repositories/categoryRepository';
import './Categories.css';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await CategoryRepository.getAll();
            setCategories(data);
        } catch (error) {
            console.error('Error loading categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCategory = async (categoryData) => {
        try {
            if (editingCategory) {
                await CategoryRepository.update(editingCategory.id, categoryData);
            } else {
                await CategoryRepository.create(categoryData);
            }
            setIsModalOpen(false);
            setEditingCategory(null);
            loadCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Error al guardar la categoría');
        }
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm('¿Estás seguro de eliminar esta categoría?')) {
            try {
                await CategoryRepository.delete(id);
                loadCategories();
            } catch (error) {
                console.error('Error deleting category:', error);
                alert(error.message || 'Error al eliminar la categoría');
            }
        }
    };

    const handleEditClick = (category) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="categories-page">
            <div className="page-header">
                <div>
                    <h1>Categorías</h1>
                    <p>Gestión de categorías de productos</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} style={{ marginRight: '8px' }} />
                    Nueva Categoría
                </Button>
            </div>

            <Card className="categories-card">
                <div className="table-actions">
                    <div className="search-wrapper">
                        <Search className="search-icon" size={18} />
                        <Input
                            type="text"
                            placeholder="Buscar categorías..."
                            className="table-search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Descripción</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCategories.map((category) => (
                                <tr key={category.id}>
                                    <td>
                                        <div className="category-info">
                                            <div className="category-icon">
                                                <Tag size={16} />
                                            </div>
                                            <span className="font-medium">{category.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="text-muted">
                                            {category.description || '-'}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <div className="action-buttons">
                                            <button
                                                className="action-btn"
                                                onClick={() => handleEditClick(category)}
                                                title="Editar"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => handleDeleteClick(category.id)}
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredCategories.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="text-center py-8 text-muted">
                                        No se encontraron categorías
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingCategory ? "Editar Categoría" : "Nueva Categoría"}
            >
                <CategoryForm
                    onSubmit={handleCreateCategory}
                    onCancel={handleCloseModal}
                    initialData={editingCategory}
                />
            </Modal>
        </div>
    );
};

export default Categories;
