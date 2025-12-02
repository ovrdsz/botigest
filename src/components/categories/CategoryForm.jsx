import React, { useState, useEffect } from 'react';
import './CategoryForm.css';
import Button from '../ui/Button';
import Input from '../ui/Input';

const CategoryForm = ({ onSubmit, onCancel, initialData }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="category-form">
            <div className="form-group">
                <label>Nombre</label>
                <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Nombre de la categoría"
                />
            </div>

            <div className="form-group">
                <label>Descripción</label>
                <textarea
                    name="description"
                    className="form-textarea"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Descripción opcional"
                    rows={3}
                />
            </div>

            <div className="form-actions">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit">
                    {initialData ? 'Guardar Cambios' : 'Crear Categoría'}
                </Button>
            </div>
        </form>
    );
};

export default CategoryForm;
