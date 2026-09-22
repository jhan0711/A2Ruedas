import React, { useState } from 'react';
import { Bike, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, UserPlus, LogIn } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button, Input, Alert } from '../../components/ui';
import { isSafeInternalRedirect } from '../../utils/securityUtils';

export const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const { login, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const requestedFrom = (location.state as { from?: { pathname: string } })?.from?.pathname;
  const from = isSafeInternalRedirect(requestedFrom) ? (requestedFrom as string) : '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (mode === 'register') {
      if (!fullName.trim()) {
        setFeedback({ type: 'error', message: 'Por favor ingresa tu nombre completo.' });
        return;
      }
      if (password.length < 6) {
        setFeedback({ type: 'error', message: 'La contraseña debe tener al menos 6 caracteres.' });
        return;
      }
      if (password !== confirmPassword) {
        setFeedback({ type: 'error', message: 'Las contraseñas no coinciden. Verifícalas.' });
        return;
      }

      setIsSubmitting(true);
      const result = await signUp(email, password, fullName);
      setIsSubmitting(false);

      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setFeedback({ type: 'error', message: result.error || 'No se pudo crear la cuenta.' });
      }
      return;
    }

    // Modo Login
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
        {/* Cabecera del formulario */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-lg bg-blue-600 flex items-center justify-center text-white mx-auto shadow-xs">
            <Bike className="w-6 h-6" />
          </div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white">
            {mode === 'login' ? 'Acceso al Taller — A2Ruedas' : 'Crear Cuenta de Administrador'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {mode === 'login'
              ? 'Ingreso exclusivo para administradores y mecánicos autorizados'
              : 'Registra tu cuenta maestra para administrar el taller y la tienda'}
          </p>
        </div>

        {/* Selector de modo */}
        <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setFeedback(null);
            }}
            className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setFeedback(null);
            }}
            className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors ${
              mode === 'register'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Registrar Taller
          </button>
        </div>

        {/* Alerta de feedback */}
        {feedback && (
          <Alert
            variant={feedback.type === 'success' ? 'success' : 'error'}
            title={feedback.type === 'success' ? 'Operación Exitosa' : 'Atención'}
            onDismiss={() => setFeedback(null)}
          >
            {feedback.message}
          </Alert>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <Input
              label="Nombre Completo del Responsable"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ej. Andrés Ramírez"
              required
              leftIcon={<UserCheck className="w-4 h-4" />}
            />
          )}

          <Input
            label="Correo Electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@taller.com"
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

          {mode === 'register' && (
            <Input
              label="Confirmar Contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {isSubmitting
              ? 'Procesando...'
              : mode === 'login'
              ? 'Ingresar al Taller'
              : 'Registrar Administrador'}
          </Button>
        </form>

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
