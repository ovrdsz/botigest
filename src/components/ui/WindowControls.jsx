import React from 'react';
import { Minus, X } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import './WindowControls.css';

const WindowControls = () => {
    const handleMinimize = async () => {
        try {
            await getCurrentWindow().minimize();
        } catch (error) {
            console.error('Failed to minimize window:', error);
        }
    };

    const handleClose = async () => {
        try {
            await getCurrentWindow().close();
        } catch (error) {
            console.error('Failed to close window:', error);
        }
    };

    return (
        <div className="window-controls">
            <button
                onClick={handleMinimize}
                className="window-btn"
                title="Minimizar"
            >
                <Minus size={20} />
            </button>
            <button
                onClick={handleClose}
                className="window-btn close-btn"
                title="Cerrar"
            >
                <X size={20} />
            </button>
        </div>
    );
};

export default WindowControls;
