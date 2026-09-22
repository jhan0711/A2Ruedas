import React, { useState } from 'react';
import { Bike, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button, Input, Alert } from '../../components/ui';
import { isSafeInternalRedirect } from '../../utils/securityUtils';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const requestedFrom = (location.state as { from?: { pathname: string } })?.from?.pathname;
  const from = isSafeInternalRedirect(requestedFrom) ? (requestedFrom as string) : '/admin';

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    setFeedback(null);

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setFeedback({
        type: 'error',
        message: result.error || 'Credenciales incorrectas. Verifica tu correo y contraseña.',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="w-full max-w-sm p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md space-y-5">
        {/* Cabecera */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-lg bg-blue-600 flex items-center justify-center text-white mx-auto shadow-xs">
            <Bike className="w-6 h-6" />
          </div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white">
            Acceso al Taller — A2Ruedas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ingreso exclusivo para administradores y mecánicos autorizados
          </p>
        </div>

        {/* Alerta de feedback */}
        {feedback && (
          <Alert
            variant={feedback.type === 'success' ? 'success' : 'error'}
            title={feedback.type === 'success' ? 'Operación Exitosa' : 'Acceso Denegado'}
            onDismiss={() => setFeedback(null)}
          >
            {feedback.message}
          </Alert>
        )}

        {/* Formulario de Login Únicamente */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input
            label="Correo Electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@taller.com"
            required
            autoComplete="email"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            leftIcon={<Lock className="w-4 h-4" />}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {isSubmitting ? 'Verificando...' : 'Iniciar Sesión'}
          </Button>
        </form>

        {/* Nota de Seguridad y Enlace Público */}
        <div className="pt-3 space-y-3 text-center border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
            🔒 Panel privado del taller. El registro público está deshabilitado. Las cuentas son asignadas internamente por la administración.
          </p>

          <Link
            to="/productos"
            className="text-xs text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-1 font-medium"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Volver al Catálogo Público</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
