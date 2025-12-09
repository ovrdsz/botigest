import React from 'react';
import './Input.css';

const Input = ({ label, type = 'text', id, className = '', placeholder, prefix, ...props }) => {
    const hasPlaceholder = (placeholder && placeholder.length > 0) || prefix;

    return (
        <div className={`input-group ${hasPlaceholder ? 'has-placeholder' : ''} ${prefix ? 'has-prefix' : ''}`}>
            {prefix && <span className="input-prefix">{prefix}</span>}
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
