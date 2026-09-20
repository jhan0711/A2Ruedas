import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../ui';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <LoadingSpinner size="lg" text="Verificando credenciales de acceso al taller..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirigir a login guardando la ubicación a la que intentaba acceder
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
