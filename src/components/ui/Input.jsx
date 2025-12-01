import React from 'react';
import './Input.css';

const Input = ({ label, type = 'text', id, className = '', ...props }) => {
    return (
        <div className="input-group">
            <input
                type={type}
                id={id}
                className={`input-field ${className}`}
                placeholder=" "
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
