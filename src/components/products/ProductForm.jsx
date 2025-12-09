import React, { useState, useEffect } from 'react';
import { CategoryRepository } from '../../repositories/categoryRepository';
import { open } from '@tauri-apps/plugin-dialog';
import { stat } from '@tauri-apps/plugin-fs';
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
        let { name, value } = e.target;

        // Validation for code: alphanumeric only
        if (name === 'code') {
            const alphanumericRegex = /^[a-zA-Z0-9-]*$/; // Allowing hyphens as they are common in codes
            if (!alphanumericRegex.test(value)) {
                return;
            }
            // Prevent multiple hyphens
            if ((value.match(/-/g) || []).length > 1) {
                return;
            }
            value = value.toUpperCase();
        }

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
                    extensions: ['png', 'jpg', 'jpeg']
                }]
            });

            if (file) {
                // Validación de peso (10MB)
                try {
                    const fileStat = await stat(file);
                    const MAX_SIZE = 10 * 1024 * 1024; // 10MB in bytes

                    if (fileStat.size > MAX_SIZE) {
                        alert('El archivo supera el tamaño máximo permitido de 10MB.');
                        return;
                    }

                    setFormData(prev => ({
                        ...prev,
                        image_url: file
                    }));
                } catch (statError) {
                    console.error('Error checking file size:', statError);
                    // Si falla el stat, permitimos la selección pero advertimos en consola
                    setFormData(prev => ({
                        ...prev,
                        image_url: file
                    }));
                }
            }
        } catch (error) {
            console.error('Error selecting image:', error);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Manual validation
        const price = Number(formData.price || 0);
        const cost = Number(formData.cost || 0);
        const stock = Number(formData.stock || 0);

        if (price < 0 || cost < 0 || stock < 0) {
            alert('Los valores numéricos no pueden ser negativos.');
            return;
        }

        if (price > 100000000 || cost > 100000000 || stock > 1000000) {
            alert('Valores numéricos exceden el límite permitido.');
            return;
        }

        onSubmit({
            ...formData,
            price,
            cost,
            stock,
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
                        maxLength={20}
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

            {/* Name and Category Row */}
            <div className="form-row" style={{ gridTemplateColumns: '1fr 2fr' }}>
                <div className="form-group">
                    <label>Nombre</label>
                    <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Nombre del producto"
                        maxLength={80}
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
                        <option value="">Seleccionar...</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Pricing and Stock Row - 3 Columns */}
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="form-group">
                    <label>Precio Venta</label>
                    <Input
                        name="price"
                        type="number"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        min="0"
                        max="99999999"
                        placeholder="0"
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
                        max="99999999"
                        placeholder="0"
                    />
                </div>
                <div className="form-group">
                    <label>Stock Inicial</label>
                    <Input
                        name="stock"
                        type="number"
                        value={formData.stock}
                        onChange={handleChange}
                        required
                        min="0"
                        max="1000000"
                        placeholder="0"
                    />
                </div>
            </div>

            {/* Description Row */}
            <div className="form-group" style={{ width: '100%' }}>
                <label>Descripción</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="form-textarea"
                    rows="4"
                    maxLength={250}
                    style={{ minHeight: '120px' }}
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
