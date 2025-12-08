import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import Inventory from './pages/Inventory/Inventory';
import POS from './pages/POS/POS';
import Dashboard from './pages/Dashboard/Dashboard';
import Customers from './pages/Customers/Customers';
import Categories from './pages/Categories/Categories';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';
import CashShifts from './pages/CashShifts/CashShifts';
import Tickets from './pages/Tickets/Tickets';
import MainLayout from './layouts/MainLayout';
import { AuthProvider } from './context/AuthContext';
import { CashProvider } from './context/CashContext';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

import { useEffect } from 'react';
import { initDB } from './services/db';
import { telegramService } from './services/telegramService';

import { useAuth } from './context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user || user.role !== 'admin') {
    return <Navigate to="/pos" replace />;
  }
  return children;
};

function App() {
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    const init = async () => {
      // Verificar restauración pendiente
      try {
        const { appDataDir, join } = await import('@tauri-apps/api/path');
        const { exists, rename, remove } = await import('@tauri-apps/plugin-fs');

        const roamingDir = await appDataDir();
        const pendingPath = await join(roamingDir, 'botigest.restore.db');
        const dbPath = await join(roamingDir, 'botigest.db');
        const walPath = await join(roamingDir, 'botigest.db-wal');
        const shmPath = await join(roamingDir, 'botigest.db-shm');

        if (await exists(pendingPath)) {
          console.log('Found pending restore file. Applying...');

          // Limpiar WAL/SHM para prevenir corrupción
          try { await remove(walPath); } catch (e) { /* ignore */ }
          try { await remove(shmPath); } catch (e) { /* ignore */ }

          // Intercambiar archivos
          // Podemos intentar renombrar el actual a .old por si acaso
          const backupPath = await join(roamingDir, 'botigest.db.old');
          try {
            if (await exists(backupPath)) await remove(backupPath);
            if (await exists(dbPath)) await rename(dbPath, backupPath);
          } catch (e) {
            console.error('Failed to backup current DB during restore:', e);
          }

          // Mover pendiente a DB real
          await rename(pendingPath, dbPath);
          console.log('Restore applied successfully.');
        }
      } catch (error) {
        console.error('Error applying restore:', error);
      }

      // Inicializar DB
      await initDB();
      setIsInitialized(true);
    };

    init();

    // Iniciar polling de Telegram
    telegramService.startPolling();

    return () => {
      telegramService.stopPolling();
    };
  }, []);

  if (!isInitialized) {
    return <div className="flex items-center justify-center h-screen bg-slate-900 text-white">Iniciando sistema...</div>;
  }

  return (
    <AuthProvider>
      <CashProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />

            {/* Rutas Protegidas */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                {/* Rutas comunes */}
                <Route path="/pos" element={<POS />} />

                {/* Rutas solo Admin */}
                <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
                <Route path="/inventory" element={<AdminRoute><Inventory /></AdminRoute>} />
                <Route path="/customers" element={<AdminRoute><Customers /></AdminRoute>} />
                <Route path="/categories" element={<AdminRoute><Categories /></AdminRoute>} />
                <Route path="/reports" element={<AdminRoute><Reports /></AdminRoute>} />
                <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
                <Route path="/cash-shifts" element={<AdminRoute><CashShifts /></AdminRoute>} />
                <Route path="/tickets" element={<Tickets />} />

                <Route path="*" element={<Navigate to="/pos" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </CashProvider>
    </AuthProvider>
  );
}

export default App;
