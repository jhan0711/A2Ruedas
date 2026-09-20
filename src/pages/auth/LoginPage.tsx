import React, { useState } from 'react';
import { Bike, Lock, Mail, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button, Input, Alert } from '../../components/ui';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@a2ruedas.com');
  const [password, setPassword] = useState('admin123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    const result = await login(email, password);

    setIsSubmitting(false);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setLoginError(result.error || 'Credenciales inválidas. Por favor intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="w-full max-w-sm p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md space-y-6">
        {/* Cabecera del formulario */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-lg bg-blue-600 flex items-center justify-center text-white mx-auto shadow-xs">
            <Bike className="w-6 h-6" />
          </div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white">
            Acceso Administrativo — A2Ruedas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ingreso exclusivo para técnicos y administradores del taller
          </p>
        </div>

        {/* Alerta de error si falla la autenticación */}
        {loginError && (
          <Alert variant="error" title="Acceso Denegado" onDismiss={() => setLoginError(null)}>
            {loginError}
          </Alert>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Correo Electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@a2ruedas.com"
            required
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            leftIcon={<Lock className="w-4 h-4" />}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {isSubmitting ? 'Verificando...' : 'Ingresar al Taller'}
          </Button>
        </form>

        {/* Credenciales de acceso de taller sugeridas para pruebas iniciales */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
            <KeyRound className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Acceso Rápido del Taller:</span>
          </div>
          <div className="font-mono space-y-0.5 pl-5">
            <div>Usuario: <span className="text-blue-600 dark:text-blue-400">admin@a2ruedas.com</span></div>
            <div>Clave: <span className="text-blue-600 dark:text-blue-400">admin123</span></div>
          </div>
        </div>

        <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
          <Link
            to="/"
            className="text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Volver a la vista pública de clientes</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
