import React, { useState } from 'react';
import { Bike, Wrench, ShieldCheck, Clock, MapPin, Search, ArrowRight, MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const HomePage: React.FC = () => {
  const [qrCodeInput, setQrCodeInput] = useState('');
  const navigate = useNavigate();

  const handleLookupBike = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = qrCodeInput.trim().toUpperCase();
    if (cleanCode) {
      navigate(`/bike/${cleanCode}`);
    }
  };

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
          <Bike className="w-3.5 h-3.5" />
          <span>Taller Profesional de Bicicletas</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Cuidamos tu bicicleta con precisión y estándares técnicos.
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Mantenimiento preventivo y correctivo, repuestos originales de alta gama, diagnóstico computarizado y seguimiento en tiempo real con código QR.
        </p>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/productos"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <span>Ver Catálogo de Productos</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://wa.me/573000000000?text=Hola%20A2Ruedas,%20quisiera%20agendar%20un%20mantenimiento%20para%20mi%20bicicleta"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Consultar por WhatsApp</span>
          </a>
        </div>
      </section>

      {/* Caja de consulta de Bicicleta por Código QR */}
      <section className="max-w-lg mx-auto p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="text-center mb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            ¿Tienes el código QR de tu bicicleta?
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ingresa el identificador (ejemplo: <span className="font-mono text-blue-600 font-semibold">BIKE-8F3A92</span>) para ver el historial de mantenimiento.
          </p>
        </div>

        <form onSubmit={handleLookupBike} className="flex gap-2">
          <input
            type="text"
            value={qrCodeInput}
            onChange={(e) => setQrCodeInput(e.target.value)}
            placeholder="BIKE-XXXXXX"
            className="flex-1 px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono uppercase tracking-wider text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Consultar</span>
          </button>
        </form>
      </section>

      {/* Repuestos Destacados con Imágenes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Repuestos y Accesorios Disponibles
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Componentes originales en stock físico para instalación inmediata en taller
            </p>
          </div>
          <Link to="/productos" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium">
            <span>Ver todo el catálogo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/productos" className="group rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="h-36 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src="https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=500&q=80"
                alt="Cadena Shimano 9V"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Shimano • Transmisión</span>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                Cadena Shimano 9V Deore
              </h3>
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white mt-1 block">
                $85.000
              </span>
            </div>
          </Link>

          <Link to="/productos" className="group rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="h-36 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=500&q=80"
                alt="Pastillas Shimano B05S"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Shimano • Frenos</span>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                Pastillas de Freno B05S
              </h3>
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white mt-1 block">
                $45.000
              </span>
            </div>
          </Link>

          <Link to="/productos" className="group rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="h-36 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src="https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&w=500&q=80"
                alt="Coraza Continental Grand Prix"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Continental • Llantas</span>
              <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                Coraza Grand Prix 5000
              </h3>
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white mt-1 block">
                $290.000
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Servicios Principales */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <div className="w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600">
            <Wrench className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Mantenimiento General</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Desarme completo, limpieza por ultrasonido, engrase de rodamientos con lubricantes hidrofóbicos y ajuste milimétrico de cambios.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <div className="w-8 h-8 rounded-md bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Repuestos Originales</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Trabajamos con componentes y consumibles certificados: Shimano, SRAM, Maxxis, Continental, Park Tool y Finish Line.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <div className="w-8 h-8 rounded-md bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600">
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Trazabilidad por QR</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Cada bicicleta recibe un adhesivo con código QR único para consultar cuándo se realizó su último servicio y qué repuestos se cambiaron.
          </p>
        </div>
      </section>

      {/* Información del Taller */}
      <section className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            Visítanos en nuestro taller
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Calle Principal del Taller #12-34 • Atención personalizada para ciclistas de ruta, montaña y urbanos.
          </p>
        </div>
        <div className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700">
          Horario: Lun - Sáb 8:00 AM - 6:30 PM
        </div>
      </section>
    </div>
  );
};
