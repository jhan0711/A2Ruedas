import React, { useState, useRef } from 'react';
import { Trash2, Plus, Check, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';

export type DamageType = 'rayon' | 'golpe' | 'desgaste' | 'fisura' | 'faltante';
export type DamageSeverity = 'leve' | 'moderado' | 'critico';

export interface DamagePoint {
  id: string;
  x: number; // Porcentaje 0 a 100
  y: number; // Porcentaje 0 a 100
  type: DamageType;
  severity: DamageSeverity;
  zone: string;
  notes: string;
}

interface BicycleDamageDiagramProps {
  damages: DamagePoint[];
  onChange: (damages: DamagePoint[]) => void;
  readOnly?: boolean;
}

const DAMAGE_TYPES_CONFIG: Record<
  DamageType,
  { label: string; color: string; badgeClass: string; pinBg: string }
> = {
  rayon: {
    label: 'Rayón / Rasguño',
    color: '#f59e0b',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300',
    pinBg: 'bg-amber-500',
  },
  golpe: {
    label: 'Golpe / Abolladura',
    color: '#ef4444',
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300',
    pinBg: 'bg-red-500',
  },
  desgaste: {
    label: 'Desgaste Severo',
    color: '#3b82f6',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300',
    pinBg: 'bg-blue-500',
  },
  fisura: {
    label: 'Fisura / Roto',
    color: '#a855f7',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300',
    pinBg: 'bg-purple-500',
  },
  faltante: {
    label: 'Pieza Faltante',
    color: '#64748b',
    badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300',
    pinBg: 'bg-slate-500',
  },
};

export const BicycleDamageDiagram: React.FC<BicycleDamageDiagramProps> = ({
  damages,
  onChange,
  readOnly = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedDamageId, setSelectedDamageId] = useState<string | null>(null);

  // Estado para el modal o formulario rápido de creación de un punto de daño
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number } | null>(null);
  const [newType, setNewType] = useState<DamageType>('rayon');
  const [newSeverity, setNewSeverity] = useState<DamageSeverity>('leve');
  const [newZone, setNewZone] = useState('Marco / Cuadro');
  const [newNotes, setNewNotes] = useState('');

  // Identificar zona aproximada según coordenadas relativas
  const estimateZone = (x: number, y: number): string => {
    if (x < 32 && y > 40) return 'Rueda Trasera / Piñonería';
    if (x > 68 && y > 40) return 'Rueda Delantera / Aro';
    if (x > 65 && y <= 40) return 'Manillar / Potencia / Mandos';
    if (x > 45 && x <= 65 && y > 40) return 'Horquilla / Suspensión';
    if (x >= 28 && x <= 45 && y <= 40) return 'Sillín / Tubo de Asiento';
    if (x >= 35 && x <= 55 && y > 60) return 'Caja de Centro / Pedales / Bielas';
    return 'Marco / Tubo Principal';
  };

  const handleDiagramClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const percentX = Math.round((clickX / rect.width) * 100);
    const percentY = Math.round((clickY / rect.height) * 100);

    const detectedZone = estimateZone(percentX, percentY);
    setNewZone(detectedZone);
    setNewNotes('');
    setPendingPoint({ x: percentX, y: percentY });
  };

  const handleSavePendingDamage = () => {
    if (!pendingPoint) return;
    const newDamage: DamagePoint = {
      id: `dmg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      x: pendingPoint.x,
      y: pendingPoint.y,
      type: newType,
      severity: newSeverity,
      zone: newZone,
      notes: newNotes.trim(),
    };

    onChange([...damages, newDamage]);
    setPendingPoint(null);
    setSelectedDamageId(newDamage.id);
  };

  const handleDeleteDamage = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onChange(damages.filter((d) => d.id !== id));
    if (selectedDamageId === id) setSelectedDamageId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <label className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Diagrama de Inspección y Daños Preexistentes
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {readOnly
              ? 'Puntos de daño o desgastes registrados durante el ingreso de la bicicleta.'
              : 'Haz clic sobre la silueta de la bicicleta para marcar rayones, golpes o fisuras preexistentes.'}
          </p>
        </div>

        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          {damages.length === 0 ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              0 Daños Marcados (Impecable)
            </span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              {damages.length} {damages.length === 1 ? 'Daño Registrado' : 'Daños Registrados'}
            </span>
          )}
        </div>
      </div>

      {/* Silueta Técnica de Bicicleta SVG Vectorial Interactiva */}
      <div
        ref={containerRef}
        onClick={handleDiagramClick}
        className={`relative w-full aspect-16/9 max-h-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 overflow-hidden flex items-center justify-center ${
          readOnly ? 'cursor-default' : 'cursor-crosshair hover:border-blue-400 transition-colors'
        }`}
      >
        {/* SVG Esquemático Técnico de Bicicleta */}
        <svg
          viewBox="0 0 800 450"
          className="w-full h-full select-none pointer-events-none p-4"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Suelo de referencia */}
          <line
            x1="50"
            y1="390"
            x2="750"
            y2="390"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="6 6"
            className="text-slate-300 dark:text-slate-700"
          />

          {/* Rueda Trasera (Izquierda) */}
          <circle
            cx="200"
            cy="290"
            r="95"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-slate-400 dark:text-slate-600"
          />
          <circle
            cx="200"
            cy="290"
            r="85"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-slate-300 dark:text-slate-700"
          />
          {/* Radios rueda trasera */}
          <line x1="200" y1="205" x2="200" y2="375" stroke="currentColor" strokeWidth="1" className="text-slate-300 dark:text-slate-700" />
          <line x1="115" y1="290" x2="285" y2="290" stroke="currentColor" strokeWidth="1" className="text-slate-300 dark:text-slate-700" />
          <line x1="140" y1="230" x2="260" y2="350" stroke="currentColor" strokeWidth="1" className="text-slate-300 dark:text-slate-700" />
          <line x1="140" y1="350" x2="260" y2="230" stroke="currentColor" strokeWidth="1" className="text-slate-300 dark:text-slate-700" />
          <circle cx="200" cy="290" r="14" fill="currentColor" className="text-slate-500 dark:text-slate-500" />

          {/* Rueda Delantera (Derecha) */}
          <circle
            cx="600"
            cy="290"
            r="95"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-slate-400 dark:text-slate-600"
          />
          <circle
            cx="600"
            cy="290"
            r="85"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-slate-300 dark:text-slate-700"
          />
          {/* Radios rueda delantera */}
          <line x1="600" y1="205" x2="600" y2="375" stroke="currentColor" strokeWidth="1" className="text-slate-300 dark:text-slate-700" />
          <line x1="515" y1="290" x2="685" y2="290" stroke="currentColor" strokeWidth="1" className="text-slate-300 dark:text-slate-700" />
          <line x1="540" y1="230" x2="660" y2="350" stroke="currentColor" strokeWidth="1" className="text-slate-300 dark:text-slate-700" />
          <line x1="540" y1="350" x2="660" y2="230" stroke="currentColor" strokeWidth="1" className="text-slate-300 dark:text-slate-700" />
          <circle cx="600" cy="290" r="14" fill="currentColor" className="text-slate-500 dark:text-slate-500" />

          {/* Caja de Centro / Pedalier (BB) */}
          <circle cx="370" cy="290" r="18" fill="currentColor" className="text-slate-700 dark:text-slate-300" />

          {/* Marco Principal (Geometría Diamante Robusta) */}
          {/* Vaina inferior (Chainstay): eje trasero a pedalier */}
          <line x1="200" y1="290" x2="370" y2="290" stroke="currentColor" strokeWidth="6" className="text-slate-700 dark:text-slate-300" />
          {/* Vaina superior (Seatstay): eje trasero a unión de asiento */}
          <line x1="200" y1="290" x2="330" y2="170" stroke="currentColor" strokeWidth="6" className="text-slate-700 dark:text-slate-300" />
          {/* Tubo de asiento (Seat tube): pedalier a unión de asiento */}
          <line x1="370" y1="290" x2="330" y2="170" stroke="currentColor" strokeWidth="8" className="text-slate-700 dark:text-slate-300" />
          {/* Tubo superior (Top tube): unión de asiento a tubo de dirección */}
          <line x1="330" y1="170" x2="520" y2="155" stroke="currentColor" strokeWidth="8" className="text-slate-700 dark:text-slate-300" />
          {/* Tubo inferior (Down tube): pedalier a tubo de dirección */}
          <line x1="370" y1="290" x2="520" y2="155" stroke="currentColor" strokeWidth="10" className="text-slate-700 dark:text-slate-300" />
          {/* Tubo de dirección (Head tube) */}
          <line x1="520" y1="155" x2="535" y2="120" stroke="currentColor" strokeWidth="10" className="text-slate-700 dark:text-slate-300" />

          {/* Horquilla Delantera: tubo dirección hacia eje delantero */}
          <line x1="520" y1="155" x2="600" y2="290" stroke="currentColor" strokeWidth="8" className="text-blue-600 dark:text-blue-400" />

          {/* Tija y Sillín */}
          <line x1="330" y1="170" x2="315" y2="125" stroke="currentColor" strokeWidth="5" className="text-slate-600 dark:text-slate-400" />
          <path d="M 285 125 Q 315 115 355 125 Q 325 133 285 125 Z" fill="currentColor" className="text-slate-900 dark:text-slate-100" />

          {/* Potencia y Manillar */}
          <line x1="535" y1="120" x2="545" y2="105" stroke="currentColor" strokeWidth="5" className="text-slate-600 dark:text-slate-400" />
          <path d="M 525 105 L 565 105" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-slate-900 dark:text-slate-100" />

          {/* Bielas y Pedales */}
          <line x1="370" y1="290" x2="340" y2="330" stroke="currentColor" strokeWidth="5" strokeLinecap="round" className="text-slate-500" />
          <circle cx="340" cy="330" r="5" fill="currentColor" className="text-slate-700 dark:text-slate-300" />

          {/* Transmisión y Cadena */}
          <path
            d="M 200 290 L 370 278 L 370 302 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="4 3"
            className="text-slate-500 dark:text-slate-400"
          />
        </svg>

        {/* Pines de Daños Registrados */}
        {damages.map((dmg, idx) => {
          const config = DAMAGE_TYPES_CONFIG[dmg.type] || DAMAGE_TYPES_CONFIG.rayon;
          const isSelected = selectedDamageId === dmg.id;

          return (
            <div
              key={dmg.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDamageId(dmg.id);
              }}
              style={{
                left: `${dmg.x}%`,
                top: `${dmg.y}%`,
              }}
              title={`${config.label} (${dmg.zone}) - ${dmg.notes || 'Sin nota'}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 transition-transform ${
                isSelected ? 'scale-125 z-20' : 'hover:scale-110'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] text-white shadow-md border-2 border-white dark:border-slate-900 ${config.pinBg} ${
                  isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                }`}
              >
                {idx + 1}
              </div>
            </div>
          );
        })}

        {/* Punto temporal mientras se añade nota */}
        {pendingPoint && (
          <div
            style={{
              left: `${pendingPoint.x}%`,
              top: `${pendingPoint.y}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none animate-pulse"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600/90 text-white flex items-center justify-center border-2 border-white shadow-lg text-xs font-bold">
              +
            </div>
          </div>
        )}
      </div>

      {/* Modal / Panel contextual para registrar el daño seleccionado en el punto */}
      {pendingPoint && !readOnly && (
        <div className="p-3.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/40 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Nuevo Marcador en: <span className="underline">{newZone}</span>
            </span>
            <button
              type="button"
              onClick={() => setPendingPoint(null)}
              className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Daño
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as DamageType)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs p-1.5 focus:ring-2 focus:ring-blue-600"
              >
                <option value="rayon">Rayón / Rasguño</option>
                <option value="golpe">Golpe / Abolladura</option>
                <option value="desgaste">Desgaste Severo</option>
                <option value="fisura">Fisura / Roto</option>
                <option value="faltante">Pieza Faltante</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Severidad
              </label>
              <select
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value as DamageSeverity)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs p-1.5 focus:ring-2 focus:ring-blue-600"
              >
                <option value="leve">Leve (Superficial)</option>
                <option value="moderado">Moderado</option>
                <option value="critico">Crítico / Seguridad</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Zona de la Bicicleta
              </label>
              <input
                type="text"
                value={newZone}
                onChange={(e) => setNewZone(e.target.value)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs p-1.5 focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observaciones / Detalle específico
            </label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Ej: Rayón de 4cm en cara exterior, pintura descascarada..."
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs p-1.5 focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPendingPoint(null)}
            >
              Descartar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSavePendingDamage}
              leftIcon={<Check className="w-3.5 h-3.5" />}
            >
              Registrar Marcador
            </Button>
          </div>
        </div>
      )}

      {/* Lista Desglosada de Daños Registrados */}
      {damages.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block uppercase tracking-wider">
            Detalle de Daños Previos ({damages.length})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {damages.map((dmg, idx) => {
              const config = DAMAGE_TYPES_CONFIG[dmg.type] || DAMAGE_TYPES_CONFIG.rayon;
              const isSelected = selectedDamageId === dmg.id;

              return (
                <div
                  key={dmg.id}
                  onClick={() => setSelectedDamageId(dmg.id)}
                  className={`p-2.5 rounded-lg border flex items-start justify-between gap-2 text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white shrink-0 mt-0.5 ${config.pinBg}`}
                    >
                      {idx + 1}
                    </span>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {dmg.zone}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${config.badgeClass}`}
                        >
                          {config.label}
                        </span>
                        {dmg.severity === 'critico' && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-red-600 text-white font-bold">
                            CRÍTICO
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        {dmg.notes || 'Sin observaciones adicionales.'}
                      </p>
                    </div>
                  </div>

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteDamage(dmg.id, e)}
                      title="Eliminar marcador"
                      className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
