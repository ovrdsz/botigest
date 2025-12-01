import React from 'react';
import './Card.css';

const Card = ({ children, className = '', ...props }) => {
    return (
        <div className={`card glass-panel ${className}`} {...props}>
            {children}
        </div>
    );
};

export default Card;
