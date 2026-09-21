import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Bike,
  Calendar,
  CheckCircle2,
  Wrench,
  ShieldCheck,
  ArrowLeft,
  MessageCircle,
  Gauge,
  QrCode,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { bicycleService } from '../../services/bicycleService';
import { PublicBikeTimeline } from '../../types/database';
import { LoadingSpinner, EmptyState, Badge, Button } from '../../components/ui';

export const BikePublicPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [timelineData, setTimelineData] = useState<PublicBikeTimeline | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      setIsLoading(true);
      try {
        if (code) {
          const data = await bicycleService.getPublicBicycleTimeline(code);
          setTimelineData(data);
        }
      } catch (err) {
        console.error('Error al cargar timeline de bicicleta:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimeline();
  }, [code]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <LoadingSpinner size="lg" text="Consultando historial certificado de bicicleta..." />
        <p className="text-xs text-slate-400">Verificando firma y registros en el taller A2Ruedas...</p>
      </div>
    );
  }

  if (!timelineData) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <EmptyState
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
          title="Bicicleta no encontrada"
          description={`El código QR o identificador "${code}" no se encuentra registrado en el sistema oficial del taller A2Ruedas o aún no ha sido activado.`}
        >
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
            <Link to="/" className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full">
                Volver al inicio
              </Button>
            </Link>
            <a
              href={`https://wa.me/573000000000?text=${encodeURIComponent(`Hola A2Ruedas, tengo una duda sobre el código QR ${code}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button size="sm" leftIcon={<MessageCircle className="w-3.5 h-3.5" />} className="w-full">
                Consultar al Taller
              </Button>
            </a>
          </div>
        </EmptyState>
      </div>
    );
  }

  // Enlace directo a WhatsApp para agendar turno
  const whatsappUrl = `https://wa.me/573000000000?text=${encodeURIComponent(
    `Hola A2Ruedas! Quisiera agendar un mantenimiento para mi bicicleta ${timelineData.brand} ${timelineData.model} (Código: ${timelineData.qr_code}).`
  )}`;

  return (
    <div className="max-w-2xl mx-auto space-y-5 py-4 px-2 sm:px-0">
      {/* Botón Volver */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a la tienda</span>
      </Link>

      {/* Ficha Principal de la Bicicleta */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                <QrCode className="w-3 h-3 text-amber-500" />
                {timelineData.qr_code}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                Historial Verificado A2Ruedas ✓
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight pt-1">
              {timelineData.brand} {timelineData.model}
            </h1>

            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{timelineData.bike_type}</span>
              <span>•</span>
              <span>{timelineData.color}</span>
              {timelineData.year && (
                <>
                  <span>•</span>
                  <span>Año {timelineData.year}</span>
                </>
              )}
              {timelineData.wheel_size && (
                <>
                  <span>•</span>
                  <span>Rin {timelineData.wheel_size}</span>
                </>
              )}
            </div>
          </div>

          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Bike className="w-7 h-7" />
          </div>
        </div>

        {/* Métricas clave de la bicicleta */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">SERIAL DE CUADRO</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
              {timelineData.serial_number || 'Sin serial'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">ODÓMETRO REGISTRADO</span>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
              <Gauge className="w-3.5 h-3.5" />
              {timelineData.current_mileage_km != null
                ? `${timelineData.current_mileage_km.toLocaleString('es-CO')} km`
                : 'Sin odómetro'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">ÚLTIMO SERVICIO</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              {timelineData.last_service_date
                ? new Date(timelineData.last_service_date).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'En atención'}
            </span>
          </div>
        </div>

        {/* Componentes Clave */}
        {timelineData.key_components && (
          <div className="p-3 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs">
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase block mb-0.5">
              COMPONENTES CLAVE Y TRANSMISIÓN
            </span>
            <p className="text-slate-700 dark:text-slate-300">{timelineData.key_components}</p>
          </div>
        )}

        {/* Galería de Fotografías Públicas */}
        {timelineData.photos && timelineData.photos.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              FOTOGRAFÍAS DE REGISTRO ({timelineData.photos.length})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {timelineData.photos.map((p) => (
                <div
                  key={p.id}
                  className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video bg-slate-100 dark:bg-slate-800"
                >
                  <img src={p.photo_url} alt={p.caption || 'Foto'} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Timeline Cronológico de Mantenimientos */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-600" />
            Línea de Tiempo de Mantenimientos ({timelineData.work_orders.length})
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">Trazabilidad oficial</span>
        </div>

        {timelineData.work_orders.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 space-y-2">
            <Wrench className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
            <p>Esta bicicleta aún no tiene servicios concluidos registrados en el taller.</p>
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {timelineData.work_orders.map((item, idx) => (
              <div
                key={item.id || idx}
                className="relative pl-6 pb-2 border-l-2 border-blue-500 last:border-transparent"
              >
                {/* Marcador de Timeline */}
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-white ring-4 ring-white dark:ring-slate-900">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        {item.order_number}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.date).toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.entry_mileage_km != null && (
                        <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                          📍 {item.entry_mileage_km.toLocaleString('es-CO')} km
                        </span>
                      )}
                      <Badge status={item.status} size="sm" isMono />
                    </div>
                  </div>

                  {/* Servicios Ejecutados */}
                  {item.services.length > 0 && (
                    <div className="space-y-1">
                      {item.services.map((srv, sIdx) => (
                        <h3 key={sIdx} className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          • {srv}
                        </h3>
                      ))}
                    </div>
                  )}

                  {/* Falla reportada y Notas del taller */}
                  {item.reported_issues && (
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      <strong className="text-slate-700 dark:text-slate-300">Motivo de ingreso:</strong>{' '}
                      {item.reported_issues}
                    </p>
                  )}

                  {item.technician_notes && (
                    <p className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-slate-800/40 p-2 rounded border border-slate-100 dark:border-slate-800">
                      "{item.technician_notes}"
                    </p>
                  )}

                  {/* Repuestos Cambiados */}
                  {item.parts_changed.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        REPUESTOS REEMPLAZADOS / INSTALADOS:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.parts_changed.map((part, pIdx) => (
                          <span
                            key={pIdx}
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                          >
                            🔧 {part}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recomendaciones Técnicas Preventivas */}
      <div className="p-5 sm:p-6 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Recomendaciones Técnicas Preventivas (Especialidad {timelineData.bike_type})
        </h3>
        <ul className="space-y-1.5 text-xs text-emerald-900 dark:text-emerald-200">
          {timelineData.recommendations.map((rec, rIdx) => (
            <li key={rIdx} className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Botón de Agendamiento por WhatsApp */}
      <div className="text-center pt-2 pb-6">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Agendar Mantenimiento por WhatsApp</span>
        </a>
        <p className="text-[11px] text-slate-400 mt-2">
          Comunícate directamente con nuestros mecánicos certificados mencionando el código {timelineData.qr_code}.
        </p>
      </div>
    </div>
  );
};
