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
        onSubmit({
            ...formData,
            points: Number(formData.points)
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
                />
            </div>

            <div className="form-group">
                <label>Teléfono</label>
                <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+56 9 1234 5678"
                />
            </div>

            <div className="form-group">
                <label>Puntos</label>
                <Input
                    name="points"
                    type="number"
                    value={formData.points}
                    onChange={handleChange}
                    min="0"
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
