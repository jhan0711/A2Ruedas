import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Bike, Calendar, CheckCircle2, Wrench, ShieldCheck, ArrowLeft, MessageCircle } from 'lucide-react';

export const BikePublicPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();

  // Datos de ejemplo seguros para visualización pública (sin PII)
  const bikeData = {
    code: code || 'BIKE-8F3A92',
    brand: 'Trek',
    model: 'Marlin 7',
    type: 'Montaña (MTB)',
    color: 'Rojo Viper / Negro',
    serial: 'WTU281C0492S',
    lastServiceDate: '2026-07-15',
    timeline: [
      {
        date: '2026-07-15',
        service: 'Mantenimiento General + Purga de Frenos Hidráulicos',
        technicianNote: 'Desarme completo, engrase de rodamientos de dirección y caja pedalier. Pastillas en 70%.',
        partsChanged: ['Cadena Shimano 9V', 'Líquido Mineral Shimano'],
      },
      {
        date: '2026-03-10',
        service: 'Ajuste de Transmisión y Cambio de Guayas',
        technicianNote: 'Calibración de tensor y desviador. Tensión de radios en ambas ruedas.',
        partsChanged: ['Guayas de teflón', 'Terminales'],
      },
    ],
    recommendations: [
      'Revisión preventiva de cadena en 500 km.',
      'Mantener lubricación de cadena con lubricante seco.',
      'Presión sugerida de llantas: 30-35 PSI.',
    ],
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* Botón Volver */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al inicio</span>
      </Link>

      {/* Ficha Principal de la Bicicleta */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 mb-1.5">
              QR: {bikeData.code}
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {bikeData.brand} {bikeData.model}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tipo: {bikeData.type} • Color: {bikeData.color}
            </p>
          </div>

          <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Bike className="w-6 h-6" />
          </div>
        </div>

        {/* Datos técnicos públicos */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[10px] text-slate-400 block font-mono">NÚMERO DE SERIE</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{bikeData.serial}</span>
          </div>
          <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-800/50">
            <span className="text-[10px] text-slate-400 block font-mono">ÚLTIMO SERVICIO</span>
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              {bikeData.lastServiceDate}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline de Mantenimientos Realizados */}
      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
          <Wrench className="w-4 h-4 text-blue-600" />
          Historial de Mantenimientos en Taller
        </h2>

        <div className="space-y-6 pt-2">
          {bikeData.timeline.map((item, idx) => (
            <div key={idx} className="relative pl-6 pb-2 border-l-2 border-blue-500 last:border-transparent">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white">
                <CheckCircle2 className="w-2.5 h-2.5" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {item.date}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {item.service}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {item.technicianNote}
                </p>

                {item.partsChanged.length > 0 && (
                  <div className="pt-1.5 flex flex-wrap gap-1">
                    {item.partsChanged.map((part, pIdx) => (
                      <span
                        key={pIdx}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        Repuesto: {part}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recomendaciones Técnicas */}
      <div className="p-6 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Recomendaciones del Mecánico
        </h3>
        <ul className="space-y-1.5 text-xs text-emerald-900 dark:text-emerald-200">
          {bikeData.recommendations.map((rec, rIdx) => (
            <li key={rIdx} className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Botón de Agendamiento por WhatsApp */}
      <div className="text-center pt-2">
        <a
          href={`https://wa.me/573000000000?text=Hola%20A2Ruedas,%20quisiera%20agendar%20un%20servicio%20para%20la%20bicicleta%20${bikeData.code}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Agendar Próximo Mantenimiento</span>
        </a>
      </div>
    </div>
  );
};
