import React from 'react';
import './Ticket.css';

const Ticket = React.forwardRef(({ sale, businessInfo }, ref) => {
    if (!sale) return null;

    const { items, total, date, id, paymentMethod, user, customer } = sale;

    // Map settings keys to local variables
    const name = businessInfo?.businessName || 'Mi Tienda POS';
    const address = businessInfo?.businessAddress || 'Av. Principal 123';
    const phone = businessInfo?.businessPhone || '+56 9 1234 5678';
    const rut = businessInfo?.businessRut || '76.123.456-K';

    return (
        <div className="ticket-print-container" ref={ref}>
            <div className="ticket-header">
                <h2 className="business-name">{name}</h2>
                <p>{address}</p>
                <p>Tel: {phone}</p>
                <p>RUT: {rut}</p>
                <div className="ticket-divider">--------------------------------</div>
                <p>Ticket #{id}</p>
                <p>Fecha: {new Date(date).toLocaleString()}</p>
                <p>Cajero: {user?.username || 'Admin'}</p>
                {customer && <p>Cliente: {customer.name}</p>}
            </div>

            <div className="ticket-divider">--------------------------------</div>

            <div className="ticket-items">
                <table>
                    <thead>
                        <tr>
                            <th className="col-qty">Cant.</th>
                            <th className="col-desc">Desc.</th>
                            <th className="col-price">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td className="col-qty">{item.quantity}</td>
                                <td className="col-desc">
                                    {item.name}
                                    {item.quantity > 1 && (
                                        <div className="item-unit-price">
                                            {item.quantity} x ${item.price.toLocaleString()}
                                        </div>
                                    )}
                                </td>
                                <td className="col-price">${(item.price * item.quantity).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="ticket-divider">--------------------------------</div>

            <div className="ticket-totals">
                <div className="total-row large">
                    <span>TOTAL</span>
                    <span>${total.toLocaleString()}</span>
                </div>
                <div className="total-row">
                    <span>Forma de Pago:</span>
                    <span>{paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}</span>
                </div>
            </div>

            <div className="ticket-footer">
                <p>¡Gracias por su compra!</p>
                <p>Conserve este ticket para cambios</p>
            </div>
        </div>
    );
});

export default Ticket;
