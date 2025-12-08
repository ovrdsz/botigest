import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, User } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import WindowControls from '../../components/ui/WindowControls';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(username, password);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
        }
        setIsLoading(false);
    };

    return (
        <div className="login-container">
            <WindowControls />
            <div className="login-background">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
            </div>

            <Card className="login-card">
                <div className="login-header">
                    <div className="logo-placeholder">
                        <div className="logo-icon">B</div>
                    </div>
                    <h1>Bienvenido</h1>
                    <p className="text-muted">Ingresa a tu cuenta para continuar</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <Input
                            icon={User}
                            placeholder="Usuario"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            maxLength={50}
                        />
                    </div>
                    <div className="form-group">
                        <Input
                            icon={Lock}
                            placeholder="Contraseña"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            maxLength={50}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                    </Button>
                </form>

                <div className="login-footer">
                    <p>© 2025 Botigest POS</p>
                </div>
            </Card>
        </div>
    );
};

export default Login;
