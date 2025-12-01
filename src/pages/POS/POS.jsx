import React, { useState, useEffect, useRef } from 'react';
import { Search, Trash2, Plus, Minus, CreditCard, Banknote, ShoppingCart } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import './POS.css';

const POS = () => {
    const [cart, setCart] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef(null);

    // Datos de prueba - En una app real esto vendría de un contexto o API
    const [products] = useState([
        { id: 1, name: 'Producto Ejemplo', sku: 'SKU-001', price: 1000, category: 'General', stock: 50 },
        { id: 2, name: 'Otro Producto', sku: 'SKU-002', price: 25000, category: 'Electrónica', stock: 10 },
        { id: 3, name: 'Bebida Energética', sku: '789123456', price: 2500, category: 'Bebidas', stock: 100 },
        { id: 4, name: 'Snack Papas', sku: '789123457', price: 1500, category: 'Snacks', stock: 45 },
        { id: 5, name: 'Cable USB-C', sku: 'SKU-005', price: 5000, category: 'Electrónica', stock: 20 },
        { id: 6, name: 'Adaptador HDMI', sku: 'SKU-006', price: 8000, category: 'Electrónica', stock: 15 },
    ]);

    // Focus search input on mount for scanner readiness
    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    const addToCart = (product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === product.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prevCart, { ...product, quantity: 1 }];
        });
        // Keep focus for continuous scanning
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
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        // Simular escáner: si hay coincidencia exacta de SKU, agregar inmediatamente
        const exactMatch = products.find(p => p.sku === query);
        if (exactMatch) {
            addToCart(exactMatch);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <div className="pos-container">
            {/* Left Panel: Products */}
            <div className="pos-products-section">
                <div className="pos-header">
                    <div className="search-bar-container">
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
                </div>

                <div className="products-grid">
                    {filteredProducts.map(product => (
                        <Card
                            key={product.id}
                            className="product-card"
                            onClick={() => addToCart(product)}
                        >
                            <div className="product-info">
                                <h3 className="product-name">{product.name}</h3>
                                <p className="product-sku">{product.sku}</p>
                                <p className="product-price">${product.price.toLocaleString()}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Right Panel: Ticket/Cart */}
            <div className="pos-ticket-section">
                <Card className="ticket-card">
                    <div className="ticket-header">
                        <h2>Ticket de Venta</h2>
                        <span className="ticket-count">{cart.length} artículos</span>
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
                                <span>${total.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="payment-actions">
                            <Button className="pay-btn cash" disabled={cart.length === 0}>
                                <Banknote size={20} />
                                Efectivo
                            </Button>
                            <Button className="pay-btn card" disabled={cart.length === 0}>
                                <CreditCard size={20} />
                                Tarjeta
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default POS;
