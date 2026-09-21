import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, CheckCircle2, AlertCircle, PenTool } from 'lucide-react';
import { Button } from '../ui/Button';

interface TouchSignaturePadProps {
  onSignatureChange: (signatureDataUrl: string | null) => void;
  signerName: string;
  onSignerNameChange: (name: string) => void;
  signerDoc?: string;
  onSignerDocChange?: (doc: string) => void;
  label?: string;
  description?: string;
  height?: number;
  disabled?: boolean;
}

export const TouchSignaturePad: React.FC<TouchSignaturePadProps> = ({
  onSignatureChange,
  signerName,
  onSignerNameChange,
  signerDoc = '',
  onSignerDocChange,
  label = 'Firma del Cliente',
  description = 'Firme con el dedo, lápiz óptico o mouse sobre el recuadro.',
  height = 190,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);

  // Ajustar dimensiones del canvas considerando devicePixelRatio para máxima nitidez (Retina / pantallas móviles)
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;

    // Guardar temporalmente si ya había un dibujo para no perderlo en resize si es posible
    const tempUrl = hasDrawn ? canvas.toDataURL('image/png') : null;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1e3a8a'; // Tinta azul bolígrafo profesional
      ctx.lineWidth = 2.5;

      if (tempUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
        };
        img.src = tempUrl;
      }
    }
  }, [hasDrawn, height]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Obtener coordenadas relativas precisas tanto para Mouse como para Touch
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else if ('clientX' in e) {
      return {
        x: (e as MouseEvent).clientX - rect.left,
        y: (e as MouseEvent).clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    if ('touches' in e) {
      // Prevenir scroll en dispositivos móviles
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e.nativeEvent);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    if ('touches' in e) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e.nativeEvent);
    ctx.lineTo(x, y);
    ctx.stroke();

    if (!hasDrawn) {
      setHasDrawn(true);
    }
  };

  const endDrawing = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e && 'touches' in e) {
      e.preventDefault();
    }
    setIsDrawing(false);
    setStrokeCount((prev) => prev + 1);

    const canvas = canvasRef.current;
    if (canvas && hasDrawn) {
      const dataUrl = canvas.toDataURL('image/png');
      onSignatureChange(dataUrl);
    }
  };

  const clearCanvas = () => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasDrawn(false);
    setStrokeCount(0);
    onSignatureChange(null);
  };

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Cabecera y Estado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <label className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <PenTool className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            {label}
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{description}</p>
        </div>

        <div>
          {hasDrawn ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3" />
              Firma capturada ({strokeCount} trazos)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-3 h-3" />
              Pendiente de firma
            </span>
          )}
        </div>
      </div>

      {/* Recuadro Interactivo de Firma */}
      <div className="relative rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 overflow-hidden shadow-inner group">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          className={`block w-full touch-none select-none cursor-crosshair ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{ height: `${height}px` }}
        />

        {/* Línea guía base de firma estilo documento formal */}
        <div className="absolute bottom-6 left-6 right-6 border-b border-slate-200 dark:border-slate-800 pointer-events-none flex justify-between items-center text-[10px] text-slate-400 font-mono">
          <span>X___________________________</span>
          <span className="hidden sm:inline">Línea de firma</span>
        </div>

        {/* Botón flotante para limpiar / rehacer firma */}
        {hasDrawn && !disabled && (
          <div className="absolute top-2 right-2 z-10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearCanvas}
              leftIcon={<Eraser className="w-3 h-3 text-red-500" />}
              className="text-[11px] bg-white/90 dark:bg-slate-900/90 shadow-xs"
            >
              Borrar Firma
            </Button>
          </div>
        )}
      </div>

      {/* Datos del Firmante (Nombre y Cédula) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Nombre del Firmante *
          </label>
          <input
            type="text"
            required
            value={signerName}
            disabled={disabled}
            onChange={(e) => onSignerNameChange(e.target.value)}
            placeholder="Nombre y apellido de quien entrega/recibe"
            className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
          />
        </div>

        {onSignerDocChange && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Documento de Identidad (C.C. / DNI)
            </label>
            <input
              type="text"
              value={signerDoc}
              disabled={disabled}
              onChange={(e) => onSignerDocChange(e.target.value)}
              placeholder="Número de cédula o identificación"
              className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
            />
          </div>
        )}
      </div>
    </div>
  );
};
