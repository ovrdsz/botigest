import React, { useState, useEffect } from 'react';
import { CategoryRepository } from '../../repositories/categoryRepository';
import { open } from '@tauri-apps/plugin-dialog';
import { convertFileSrc } from '@tauri-apps/api/core';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Image as ImageIcon, Upload } from 'lucide-react';
import './ProductForm.css';

const ProductForm = ({ onSubmit, onCancel, initialData = null }) => {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        price: '',
        cost: '',
        stock: '',
        category_id: '',
        image_url: ''
    });

    const [categories, setCategories] = useState([]);

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const loadCategories = async () => {
        try {
            const data = await CategoryRepository.getAll();
            setCategories(data);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectImage = async () => {
        try {
            const file = await open({
                multiple: false,
                filters: [{
                    name: 'Images',
                    extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif']
                }]
            });

            if (file) {
                setFormData(prev => ({
                    ...prev,
                    image_url: file
                }));
            }
        } catch (error) {
            console.error('Error selecting image:', error);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            ...formData,
            price: Number(formData.price),
            cost: Number(formData.cost),
            stock: Number(formData.stock),
            category_id: formData.category_id ? Number(formData.category_id) : null
        });
    };

    return (
        <form onSubmit={handleSubmit} className="product-form">
            <div className="form-row" style={{ alignItems: 'flex-start' }}>
                <div className="form-group" style={{ flex: 1 }}>
                    <label>Código</label>
                    <Input
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        required
                        placeholder="Ej: PROD-001"
                    />
                </div>

                <div className="image-upload-section" style={{ marginLeft: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <div
                        className="image-preview"
                        style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '8px',
                            border: '1px dashed var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            background: 'var(--bg-secondary)'
                        }}
                    >
                        {formData.image_url ? (
                            <img
                                src={convertFileSrc(formData.image_url)}
                                alt="Preview"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <ImageIcon size={24} className="text-muted" />
                        )}
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleSelectImage}
                        style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                    >
                        <Upload size={14} style={{ marginRight: '4px' }} />
                        Imagen
                    </Button>
                </div>
            </div>

            <div className="form-group">
                <label>Nombre</label>
                <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Nombre del producto"
                />
            </div>

            <div className="form-group">
                <label>Categoría</label>
                <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    className="form-select"
                >
                    <option value="">Seleccionar Categoría</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Precio Venta</label>
                    <Input
                        name="price"
                        type="number"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        min="0"
                    />
                </div>
                <div className="form-group">
                    <label>Costo</label>
                    <Input
                        name="cost"
                        type="number"
                        value={formData.cost}
                        onChange={handleChange}
                        min="0"
                    />
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Stock Inicial</label>
                    <Input
                        name="stock"
                        type="number"
                        value={formData.stock}
                        onChange={handleChange}
                        required
                        min="0"
                    />
                </div>
            </div>

            <div className="form-group">
                <label>Descripción</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="form-textarea"
                    rows="3"
                />
            </div>

            <div className="form-actions">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit">
                    {initialData ? 'Guardar Cambios' : 'Crear Producto'}
                </Button>
            </div>
        </form>
    );
};

export default ProductForm;
