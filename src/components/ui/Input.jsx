import React from 'react';
import './Input.css';

const Input = ({ label, type = 'text', id, className = '', placeholder, ...props }) => {
    const hasPlaceholder = placeholder && placeholder.length > 0;

    return (
        <div className={`input-group ${hasPlaceholder ? 'has-placeholder' : ''}`}>
            <input
                type={type}
                id={id}
                className={`input-field ${className}`}
                placeholder={placeholder || " "}
                {...props}
            />
            {label && (
                <label htmlFor={id} className="input-label">
                    {label}
                </label>
            )}
        </div>
    );
};

export default Input;
