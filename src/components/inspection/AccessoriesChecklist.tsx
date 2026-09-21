import React from 'react';
import { Package, CheckSquare, Square } from 'lucide-react';

interface AccessoriesChecklistProps {
  selectedAccessories: string[];
  onAccessoriesChange: (accessories: string[]) => void;
  additionalNotes: string;
  onAdditionalNotesChange: (notes: string) => void;
  readOnly?: boolean;
}

const COMMON_ACCESSORIES = [
  { id: 'luces', label: 'Luces (delantera / trasera)' },
  { id: 'ciclocomputador', label: 'Ciclocomputador / Soporte GPS' },
  { id: 'candado', label: 'Candado y llaves' },
  { id: 'inflador', label: 'Bomba / Inflador portátil' },
  { id: 'alforja', label: 'Alforja / Bolso bajo sillín' },
  { id: 'porta_caramanola', label: 'Porta caramañola / Bidón' },
  { id: 'casco', label: 'Casco de protección' },
  { id: 'herramientas', label: 'Multiherramienta / Neumático repuesto' },
  { id: 'soporte_celular', label: 'Soporte para teléfono móvil' },
  { id: 'pedales_clips', label: 'Pedales automáticos / Calas' },
];

export const AccessoriesChecklist: React.FC<AccessoriesChecklistProps> = ({
  selectedAccessories,
  onAccessoriesChange,
  additionalNotes,
  onAdditionalNotesChange,
  readOnly = false,
}) => {
  const toggleAccessory = (label: string) => {
    if (readOnly) return;
    if (selectedAccessories.includes(label)) {
      onAccessoriesChange(selectedAccessories.filter((item) => item !== label));
    } else {
      onAccessoriesChange([...selectedAccessories, label]);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          Inventario de Accesorios en Custodia
        </label>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Seleccione los elementos y accesorios que el cliente deja instalados o junto con la bicicleta.
        </p>
      </div>

      {/* Grid de Accesorios */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {COMMON_ACCESSORIES.map((acc) => {
          const isSelected = selectedAccessories.includes(acc.label);
          return (
            <button
              key={acc.id}
              type="button"
              disabled={readOnly}
              onClick={() => toggleAccessory(acc.label)}
              className={`p-2.5 rounded-lg border text-left flex items-start gap-2 text-xs transition-colors ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-medium'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {isSelected ? (
                <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-tight select-none">{acc.label}</span>
            </button>
          );
        })}
      </div>

      {/* Otros accesorios o pertenencias */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Otros accesorios o pertenencias recibidas
        </label>
        <input
          type="text"
          disabled={readOnly}
          value={additionalNotes}
          onChange={(e) => onAdditionalNotesChange(e.target.value)}
          placeholder="Ej: Timbre metálico, guardabarros trasero, soporte de pie..."
          className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
        />
      </div>
    </div>
  );
};
