import React, { useState, useEffect, useRef } from 'react';
import { Download, Printer, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import { Bicycle, BikeQRCode } from '../../types/database';
import {
  generateBikeStickerCanvas,
  downloadStickerPNG,
  printStickersWindow,
  buildPublicBikeUrl,
} from '../../utils/qrUtils';
import { Modal, Button } from '../ui';

interface StickerPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bicycle: Bicycle | null;
  qrCode: BikeQRCode | null;
}

export const StickerPreviewModal: React.FC<StickerPreviewModalProps> = ({
  isOpen,
  onClose,
  bicycle,
  qrCode,
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen || !bicycle || !qrCode) {
      setDataUrl(null);
      setCopied(false);
      return;
    }

    const renderCanvas = async () => {
      setIsGenerating(true);
      try {
        const canvas = await generateBikeStickerCanvas(bicycle, qrCode.qr_code);
        canvasRef.current = canvas;
        setDataUrl(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error('Error al generar sticker de bicicleta:', err);
      } finally {
        setIsGenerating(false);
      }
    };

    renderCanvas();
  }, [isOpen, bicycle, qrCode]);

  if (!bicycle || !qrCode) return null;

  const publicUrl = buildPublicBikeUrl(qrCode.qr_code);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const filename = `sticker-${qrCode.qr_code}-${bicycle.brand.toLowerCase()}-${bicycle.model.toLowerCase()}`;
    downloadStickerPNG(canvasRef.current, filename);
  };

  const handlePrint = () => {
    if (!dataUrl) return;
    printStickersWindow([
      {
        dataUrl,
        qrCode: qrCode.qr_code,
        bikeName: `${bicycle.brand} ${bicycle.model}`,
      },
    ]);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Etiqueta Adhesiva QR: ${bicycle.brand} ${bicycle.model}`}
      description="Sticker técnico de alta durabilidad para adherir al cuadro de la bicicleta."
      maxWidth="lg"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              leftIcon={<Printer className="w-3.5 h-3.5" />}
            >
              Imprimir Etiqueta
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleDownload}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Descargar PNG (Alta Resolución)
            </Button>
          </div>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Previsualización del Sticker Físico */}
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-2">
          {isGenerating ? (
            <div className="py-16 text-center text-xs text-slate-500 font-medium">
              Generando sticker de alta definición...
            </div>
          ) : dataUrl ? (
            <div className="w-full max-w-md shadow-lg rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 bg-white">
              <img
                src={dataUrl}
                alt={`Sticker QR ${qrCode.qr_code}`}
                className="w-full h-auto block"
              />
            </div>
          ) : (
            <div className="py-12 text-xs text-red-500">Error al renderizar el sticker.</div>
          )}

          <span className="text-[11px] text-slate-500 font-mono">
            Dimensiones estimadas: 50 mm × 30 mm (Proporción estándar para cuadro de bicicleta)
          </span>
        </div>

        {/* Enlace Público y Acciones Rápidas */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] block">
            Enlace Directo del Historial Técnico:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="flex-1 font-mono text-[11px] px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 select-all"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyLink}
              leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open(publicUrl, '_blank')}
              title="Abrir en pestaña nueva"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Consejos de Instalación del Sticker */}
        <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 space-y-1">
          <span className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 text-blue-700 dark:text-blue-300">
            <Sparkles className="w-3 h-3 text-blue-500" />
            Recomendaciones para el Taller:
          </span>
          <p className="text-[11px] text-blue-950 dark:text-blue-300 leading-relaxed">
            Se sugiere imprimir en vinilo adhesivo laminado resistente al agua y grasa. Ubicaciones ideales en la bicicleta: bajo el tubo superior, en la parte posterior del tubo de asiento o junto al soporte de caramañola.
          </p>
        </div>
      </div>
    </Modal>
  );
};
