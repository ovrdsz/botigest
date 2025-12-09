import React, { useState, useEffect } from 'react';
import './CustomerForm.css';
import Button from '../ui/Button';
import Input from '../ui/Input';

const CustomerForm = ({ onSubmit, onCancel, initialData }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        points: 0
    });

    useEffect(() => {
        if (initialData) {
            // Strip +569 or +56 9 if present to show only the 8 digits
            let phone = initialData.phone || '';
            phone = phone.replace(/^\+56\s*9\s*/, '');
            setFormData({
                ...initialData,
                phone
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        let { name, value } = e.target;

        // Strict: Phone only digits
        if (name === 'phone') {
            value = value.replace(/[^0-9]/g, '');
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Basic validation for phone length
        if (formData.phone.length !== 8) {
            // You might want to show a toast or error state here
            // distinct from the HTML5 validation (which we'll use minLength for)
            return;
        }

        onSubmit({
            ...formData,
            phone: `+569${formData.phone}`
        });
    };

    return (
        <form onSubmit={handleSubmit} className="customer-form">
            <div className="form-group">
                <label>Nombre</label>
                <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Nombre del cliente"
                    maxLength={50}
                />
            </div>

            <div className="form-group">
                <label>Email</label>
                <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="correo@ejemplo.com"
                    maxLength={80}
                />
            </div>

            <div className="form-group">
                <label>Teléfono</label>
                <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="1234 5678"
                    prefix="+56 9 "
                    minLength={8}
                    maxLength={8}
                />
            </div>

            <div className="form-actions">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit">
                    {initialData ? 'Guardar Cambios' : 'Crear Cliente'}
                </Button>
            </div>
        </form>
    );
};

export default CustomerForm;
