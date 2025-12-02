import React, { createContext, useState, useContext, useEffect } from 'react';
import { UserRepository } from '../repositories/userRepository';
import { verifyPassword } from '../utils/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Verificar si el usuario persiste en localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const userRecord = await UserRepository.findByUsername(username);

            if (!userRecord) {
                return { success: false, error: 'Usuario no encontrado' };
            }

            const isValid = await verifyPassword(password, userRecord.password_hash);

            if (!isValid) {
                return { success: false, error: 'Contraseña incorrecta' };
            }

            // No almacenar el hash en el estado/localstorage
            const { password_hash, ...safeUser } = userRecord;

            setUser(safeUser);
            localStorage.setItem('user', JSON.stringify(safeUser));
            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Error al iniciar sesión' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
