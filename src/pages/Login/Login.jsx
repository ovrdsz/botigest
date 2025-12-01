import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // Simular inicio de sesión por ahora
        navigate('/inventory');
    };

    return (
        <div className="login-container">
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
                    <div className="form-group">
                        <Input
                            icon={User}
                            placeholder="Usuario"
                            type="text"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <Input
                            icon={Lock}
                            placeholder="Contraseña"
                            type="password"
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full">
                        Iniciar Sesión
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
