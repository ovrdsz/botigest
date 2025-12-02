import React, { useState, useEffect, useRef } from 'react';
import { ProductRepository } from '../../repositories/productRepository';
import { SaleRepository } from '../../repositories/saleRepository';
import { CustomerRepository } from '../../repositories/customerRepository';
import { useAuth } from '../../context/AuthContext';
import { useCash } from '../../context/CashContext';
import Ticket from '../../components/pos/Ticket';
import { Search, Trash2, Plus, Minus, CreditCard, Banknote, ShoppingCart, User, X, Lock, Image as ImageIcon } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import './POS.css';

import { SettingsRepository } from '../../repositories/settingsRepository';

const POS = () => {
    const [cart, setCart] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef(null);
    const { user } = useAuth();
    const { currentShift, openShift, closeShift, loading: cashLoading } = useCash();

    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const customerDropdownRef = useRef(null);
    const [lastSale, setLastSale] = useState(null);
    const [businessInfo, setBusinessInfo] = useState(null);

    // Estado de Gestión de Caja
    const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
    const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
    const [startAmount, setStartAmount] = useState('');
    const [endAmount, setEndAmount] = useState('');
    const [closeNotes, setCloseNotes] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
                setShowCustomerSearch(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const loadData = async () => {
        try {
            const [productsData, customersData, settingsData] = await Promise.all([
                ProductRepository.getAll(),
                CustomerRepository.getAll(),
                SettingsRepository.getAll()
            ]);
            setProducts(productsData);
            setCustomers(customersData);
            setBusinessInfo(settingsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const handleCheckout = async (paymentMethod) => {
        if (cart.length === 0) return;
        if (!currentShift) {
            alert('Debe abrir la caja antes de realizar ventas.');
            setShowOpenShiftModal(true);
            return;
        }

        try {
            const saleData = {
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                })),
                total: calculateTotal(),
                paymentMethod,
                date: new Date().toISOString(),
                user_id: user?.id,
                customer_id: selectedCustomer?.id || null,
                shift_id: currentShift.id
            };

            const saleId = await SaleRepository.create(saleData);

            // Preparar objeto de venta para ticket
            const completedSale = {
                ...saleData,
                id: saleId,
                user: user,
                customer: selectedCustomer
            };

            setLastSale(completedSale);

            // Feedback de éxito
            // alert('Venta realizada con éxito'); // Alerta eliminada para no bloquear el flujo de impresión inmediatamente
            setCart([]);
            setSelectedCustomer(null);
            loadData(); // Recargar para actualizar stock

            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }

            // Activar impresión después de actualizar estado
            setTimeout(() => {
                window.print();
            }, 500);

        } catch (error) {
            console.error('Error processing sale:', error);
            alert('Error al procesar la venta');
        }
    };

    const handleOpenShift = async (e) => {
        e.preventDefault();
        const amount = parseFloat(startAmount);
        if (isNaN(amount)) {
            alert('Ingrese un monto válido');
            return;
        }
        const result = await openShift(amount);
        if (result.success) {
            setShowOpenShiftModal(false);
            setStartAmount('');
        } else {
            alert('Error al abrir caja: ' + result.error);
        }
    };

    const handleCloseShift = async (e) => {
        e.preventDefault();
        const amount = parseFloat(endAmount);
        if (isNaN(amount)) {
            alert('Ingrese un monto válido');
            return;
        }

        const result = await closeShift(amount, 0, closeNotes);
        if (result.success) {
            setShowCloseShiftModal(false);
            setEndAmount('');
            setCloseNotes('');
            alert('Caja cerrada correctamente');
        } else {
            alert('Error al cerrar caja: ' + result.error);
        }
    };

    // Enfocar input de búsqueda al montar para preparación del escáner
    useEffect(() => {
        if (searchInputRef.current && !showOpenShiftModal && !showCloseShiftModal) {
            searchInputRef.current.focus();
        }
    }, [showOpenShiftModal, showCloseShiftModal]);

    const addToCart = (product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                if (existingItem.quantity + 1 > product.stock) {
                    alert(`No hay suficiente stock. Stock disponible: ${product.stock}`);
                    return prevCart;
                }
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            if (product.stock < 1) {
                alert('Producto sin stock');
                return prevCart;
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
        // Mantener foco para escaneo continuo
        if (searchInputRef.current) {
            searchInputRef.current.focus();
            setSearchQuery('');
        }
    };

    const removeFromCart = (productId) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId, delta) => {
        setCart(prevCart => prevCart.map(item => {
            if (item.id === productId) {
                const newQuantity = Math.max(1, item.quantity + delta);
                // Verificar límite de stock solo al aumentar
                if (delta > 0 && newQuantity > item.stock) {
                    alert(`No hay suficiente stock. Stock disponible: ${item.stock}`);
                    return item;
                }
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        // Simular escáner: si hay coincidencia exacta de código, agregar inmediatamente
        const exactMatch = products.find(p => p.code === query);
        if (exactMatch) {
            addToCart(exactMatch);
            setSearchQuery(''); // Limpiar después de escanear
        }
    };

    const filteredProducts = products.filter(p =>
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.code.toLowerCase().includes(searchQuery.toLowerCase())) &&
        p.stock > 0
    );

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        (c.rut && c.rut.toLowerCase().includes(customerSearchQuery.toLowerCase()))
    );

    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setShowCustomerSearch(false);
        setCustomerSearchQuery('');
    };

    if (cashLoading) return <div className="p-4">Cargando sistema de caja...</div>;

    // Vista: Abrir Caja (Cuando no hay turno activo)
    if (!currentShift) {
        return (
            <div className="flex items-center justify-center h-full bg-black/20">
                <Card className="w-96 p-6">
                    <h2 className="text-xl font-bold mb-4">Apertura de Caja</h2>
                    <p className="text-muted mb-6">La caja está cerrada. Ingrese el monto inicial para comenzar.</p>
                    <form onSubmit={handleOpenShift}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Monto Inicial</label>
                            <Input
                                type="number"
                                value={startAmount}
                                onChange={(e) => setStartAmount(e.target.value)}
                                placeholder="0.00"
                                autoFocus
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="submit" className="w-full">Abrir Caja</Button>
                        </div>
                    </form>
                </Card>
            </div>
        );
    }

    // Vista: Cerrar Caja (Cuando el modal de cierre está activo)
    if (showCloseShiftModal) {
        return (
            <div className="flex items-center justify-center h-full bg-black/20">
                <Card className="w-96 p-6">
                    <h2 className="text-xl font-bold mb-4">Cierre de Caja</h2>
                    <p className="text-muted mb-6">Ingrese el efectivo real en caja para cerrar el turno.</p>
                    <form onSubmit={handleCloseShift}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Efectivo en Caja (Real)</label>
                            <Input
                                type="number"
                                value={endAmount}
                                onChange={(e) => setEndAmount(e.target.value)}
                                placeholder="0.00"
                                autoFocus
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Notas</label>
                            <Input
                                value={closeNotes}
                                onChange={(e) => setCloseNotes(e.target.value)}
                                placeholder="Observaciones..."
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={() => setShowCloseShiftModal(false)}>Cancelar</Button>
                            <Button type="submit" className="bg-red-600 hover:bg-red-700">Cerrar Caja</Button>
                        </div>
                    </form>
                </Card>
            </div>
        );
    }

    // Vista: POS Activo
    return (
        <div className="pos-container">
            {/* Panel Izquierdo: Productos */}
            <div className="pos-products-section">
                <div className="pos-header flex justify-between items-center gap-4">
                    <div className="search-bar-container flex-1">
                        <Search className="pos-search-icon" size={20} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            className="pos-search-input"
                            placeholder="Escanear código de barras o buscar..."
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>
                    <Button
                        variant="secondary"
                        className="whitespace-nowrap"
                        onClick={() => setShowCloseShiftModal(true)}
                    >
                        <Lock size={16} className="mr-2" />
                        Cerrar Caja
                    </Button>
                </div>

                <div className="products-grid">
                    {filteredProducts.map(product => (
                        <Card
                            key={product.id}
                            className={`product-card ${product.stock <= 0 ? 'out-of-stock' : ''}`}
                            onClick={() => product.stock > 0 && addToCart(product)}
                        >
                            <div className="product-image-container" style={{
                                height: '120px',
                                width: '100%',
                                background: 'var(--bg-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                borderBottom: '1px solid var(--border-color)'
                            }}>
                                {product.image_url ? (
                                    <img
                                        src={convertFileSrc(product.image_url)}
                                        alt={product.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <ImageIcon size={32} className="text-muted" />
                                )}
                            </div>
                            <div className="product-info">
                                <h3 className="product-name">{product.name}</h3>
                                <p className="product-sku">{product.code}</p>
                                <div className="product-meta">
                                    <p className="product-price">${product.price.toLocaleString()}</p>
                                    <p className={`product-stock ${product.stock < 10 ? 'low-stock' : ''}`}>
                                        Stock: {product.stock}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Panel Derecho: Ticket/Carrito */}
            <div className="pos-ticket-section">
                <Card className="ticket-card">
                    <div className="ticket-header">
                        <h2>Ticket de Venta</h2>
                        <span className="ticket-count">{cart.length} artículos</span>
                    </div>

                    <div className="customer-section">
                        {selectedCustomer ? (
                            <div className="selected-customer">
                                <div className="customer-info">
                                    <User size={16} className="text-primary" />
                                    <div>
                                        <p className="font-medium">{selectedCustomer.name}</p>
                                        <p className="text-xs text-muted">Puntos: {selectedCustomer.points}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedCustomer(null)}
                                    className="remove-customer-btn"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="customer-selector" ref={customerDropdownRef}>
                                <button
                                    className="select-customer-btn"
                                    onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                                >
                                    <User size={16} />
                                    <span>Seleccionar Cliente (Opcional)</span>
                                </button>

                                {showCustomerSearch && (
                                    <div className="customer-dropdown">
                                        <input
                                            type="text"
                                            placeholder="Buscar cliente..."
                                            className="customer-search-input"
                                            autoFocus
                                            value={customerSearchQuery}
                                            onChange={(e) => setCustomerSearchQuery(e.target.value)}
                                        />
                                        <div className="customer-list">
                                            {filteredCustomers.map(customer => (
                                                <div
                                                    key={customer.id}
                                                    className="customer-option"
                                                    onClick={() => handleSelectCustomer(customer)}
                                                >
                                                    <p className="font-medium">{customer.name}</p>
                                                    {customer.rut && <p className="text-xs text-muted">{customer.rut}</p>}
                                                </div>
                                            ))}
                                            {filteredCustomers.length === 0 && (
                                                <div className="p-3 text-sm text-muted text-center">
                                                    No se encontraron clientes
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="ticket-items">
                        {cart.length === 0 ? (
                            <div className="empty-cart">
                                <ShoppingCart size={48} className="empty-icon" />
                                <p>El carrito está vacío</p>
                                <p className="text-sm">Escanea un producto para comenzar</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="ticket-item">
                                    <div className="item-details">
                                        <span className="item-name">{item.name}</span>
                                        <span className="item-price">${item.price.toLocaleString()}</span>
                                    </div>
                                    <div className="item-controls">
                                        <div className="quantity-controls">
                                            <button onClick={() => updateQuantity(item.id, -1)} className="qty-btn">
                                                <Minus size={14} />
                                            </button>
                                            <span className="qty-value">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)} className="qty-btn">
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <span className="item-total">${(item.price * item.quantity).toLocaleString()}</span>
                                        <button onClick={() => removeFromCart(item.id)} className="remove-btn">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="ticket-footer">
                        <div className="ticket-summary">
                            <div className="summary-row total">
                                <span>Total</span>
                                <span>${calculateTotal().toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="payment-actions">
                            <Button
                                className="pay-btn cash"
                                disabled={cart.length === 0}
                                onClick={() => handleCheckout('cash')}
                            >
                                <Banknote size={20} />
                                Efectivo
                            </Button>
                            <Button
                                className="pay-btn card"
                                disabled={cart.length === 0}
                                onClick={() => handleCheckout('card')}
                            >
                                <CreditCard size={20} />
                                Tarjeta
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Ticket Oculto para Impresión */}
            <Ticket sale={lastSale} businessInfo={businessInfo} />
        </div>
    );
};

export default POS;
