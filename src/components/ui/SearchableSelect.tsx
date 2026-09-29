import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, X, Search, Check } from 'lucide-react';

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string, selectedOption?: SearchableOption) => void;
  options: SearchableOption[];
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;
  className?: string;
  emptyMessage?: string;
  id?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  error,
  helperText,
  placeholder = 'Selecciona o escribe para buscar...',
  value,
  onChange,
  options,
  disabled = false,
  required = false,
  clearable = true,
  className = '',
  emptyMessage = 'No se encontraron resultados',
  id,
}) => {
  const reactId = useId();
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : `searchable-select-${reactId}`);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Sincronizar el texto del input cuando cambie la opción seleccionada
  useEffect(() => {
    if (selectedOption) {
      setQuery(selectedOption.label);
    } else if (!value) {
      setQuery('');
    }
  }, [value, selectedOption]);

  // Cerrar al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Restaurar el label de la opción seleccionada al perder el foco
        if (selectedOption) {
          setQuery(selectedOption.label);
        } else {
          setQuery('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedOption]);

  // Filtrar opciones
  const filteredOptions = options.filter((opt) => {
    if (!query.trim()) return true;
    // Si el query es exactamente el label del elemento seleccionado, mostrar todas las opciones
    if (selectedOption && query.trim().toLowerCase() === selectedOption.label.toLowerCase()) {
      return true;
    }
    const q = query.toLowerCase();
    const matchesLabel = opt.label.toLowerCase().includes(q);
    const matchesSublabel = opt.sublabel ? opt.sublabel.toLowerCase().includes(q) : false;
    const matchesBadge = opt.badge ? opt.badge.toLowerCase().includes(q) : false;
    return matchesLabel || matchesSublabel || matchesBadge;
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(true);
    setHighlightedIndex(-1);

    // Si el usuario borra todo, limpiar la selección
    if (!newQuery.trim() && value) {
      onChange('');
    }
  };

  const handleSelectOption = (option: SearchableOption) => {
    if (option.disabled) return;
    onChange(option.value, option);
    setQuery(option.label);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelectOption(filteredOptions[highlightedIndex]);
      } else if (filteredOptions.length === 1) {
        handleSelectOption(filteredOptions[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      if (selectedOption) setQuery(selectedOption.label);
    }
  };

  return (
    <div ref={containerRef} className={`w-full space-y-1 text-left relative ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          id={selectId}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          disabled={disabled}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            setIsOpen(true);
            // Si hay texto seleccionado, seleccionarlo todo para facilitar escribir otra búsqueda
            inputRef.current?.select();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`block w-full text-xs rounded-md border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed pl-2.5 pr-14 py-2 ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
          }`}
        />

        {/* Botones de acción derecha (Limpiar y Desplegar) */}
        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
          {clearable && value && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={handleClear}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Limpiar selección"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                setIsOpen(!isOpen);
                inputRef.current?.focus();
              }
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Menú Desplegable Flotante */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 text-xs focus:outline-none animate-in fade-in zoom-in-95 duration-100">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-4 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center gap-1">
              <Search className="w-4 h-4 text-slate-300 dark:text-slate-600" />
              <span>{emptyMessage}</span>
            </div>
          ) : (
            filteredOptions.map((opt, index) => {
              const isSelected = opt.value === value;
              const isHighlighted = index === highlightedIndex;

              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectOption(opt)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                    opt.disabled ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-950' : ''
                  } ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                      : isHighlighted
                      ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="truncate">{opt.label}</span>
                      {opt.badge && (
                        <span className="shrink-0 text-[10px] px-1.5 py-0.2 rounded font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    {opt.sublabel && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-normal">
                        {opt.sublabel}
                      </p>
                    )}
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {error ? (
        <p role="alert" className="text-[11px] text-red-600 dark:text-red-400 font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
};
