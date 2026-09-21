import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Receipt,
  FileText,
} from 'lucide-react';
import { Bicycle, BikeQRCode } from '../../types/database';
import {
  generateBikeStickerCanvas,
  downloadStickerPNG,
  printStickersWindow,
  printThermalStickersWindow,
  generateQRDataURL,
  buildPublicBikeUrl,
} from '../../utils/qrUtils';
import { Modal, Button } from '../ui';

interface StickerPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bicycle: Bicycle | null;
  qrCode: BikeQRCode | null;
}

type StickerFormat = '58mm' | 'sticker';

export const StickerPreviewModal: React.FC<StickerPreviewModalProps> = ({
  isOpen,
  onClose,
  bicycle,
  qrCode,
}) => {
  const [format, setFormat] = useState<StickerFormat>('58mm');
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [thermalQrUrl, setThermalQrUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen || !bicycle || !qrCode) {
      setDataUrl(null);
      setThermalQrUrl(null);
      setCopied(false);
      return;
    }

    const renderArtifacts = async () => {
      setIsGenerating(true);
      try {
        const publicUrl = buildPublicBikeUrl(qrCode.qr_code);

        // 1. Renderizar Canvas horizontal
        const canvas = await generateBikeStickerCanvas(bicycle, qrCode.qr_code);
        canvasRef.current = canvas;
        setDataUrl(canvas.toDataURL('image/png'));

        // 2. Renderizar QR monocromático de alto contraste para térmica
        const thermalQr = await generateQRDataURL(publicUrl, {
          width: 240,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
        });
        setThermalQrUrl(thermalQr);
      } catch (err) {
        console.error('Error al generar sticker de bicicleta:', err);
      } finally {
        setIsGenerating(false);
      }
    };

    renderArtifacts();
  }, [isOpen, bicycle, qrCode]);

  if (!bicycle || !qrCode) return null;

  const publicUrl = buildPublicBikeUrl(qrCode.qr_code);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const filename = `sticker-${qrCode.qr_code}-${bicycle.brand.toLowerCase()}-${bicycle.model.toLowerCase()}`;
    downloadStickerPNG(canvasRef.current, filename);
  };

  const handlePrintCarta = () => {
    if (!dataUrl) return;
    printStickersWindow([
      {
        dataUrl,
        qrCode: qrCode.qr_code,
        bikeName: `${bicycle.brand} ${bicycle.model}`,
      },
    ]);
  };

  const handlePrintThermal = () => {
    printThermalStickersWindow([
      {
        bike: bicycle,
        qrCode: qrCode.qr_code,
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
      title={`Etiqueta QR de Bicicleta: ${bicycle.brand} ${bicycle.model}`}
      description="Selecciona si deseas imprimir en la impresora térmica del taller (58 mm) o en formato carta/adhesivo."
      maxWidth="lg"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            {format === '58mm' ? (
              <Button
                size="sm"
                variant="primary"
                onClick={handlePrintThermal}
                leftIcon={<Receipt className="w-3.5 h-3.5" />}
              >
                Imprimir en Térmica (58 mm)
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={handlePrintCarta}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                Imprimir en Hoja Carta / A4
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Descargar PNG
            </Button>
          </div>

          <Button size="sm" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Selector de Formato de Impresión */}
        <div className="flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setFormat('58mm')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
              format === '58mm'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Tirilla Térmica POS (58 mm)</span>
          </button>

          <button
            type="button"
            onClick={() => setFormat('sticker')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
              format === 'sticker'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Sticker Horizontal (Carta / A4)</span>
          </button>
        </div>

        {/* VISTA PREVIA SEGÚN FORMATO SELECCIONADO */}
        {format === '58mm' ? (
          /* Previsualización Térmica 58 mm */
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-2">
            {isGenerating ? (
              <div className="py-16 text-center text-xs text-slate-500 font-medium">
                Generando formato térmico...
              </div>
            ) : (
              <div className="w-[270px] bg-white p-4 rounded-md shadow-md border border-slate-300 text-slate-900 font-mono text-[11px] leading-tight space-y-2 text-center select-none">
                <div className="font-black text-sm tracking-wider">A2RUEDAS TALLER</div>
                <div className="text-[10px] text-slate-600 font-sans font-semibold">
                  IDENTIFICACIÓN DE BICICLETA
                </div>
                <div className="border-b border-dashed border-slate-400 my-1" />

                {thermalQrUrl ? (
                  <div className="flex justify-center py-1">
                    <img
                      src={thermalQrUrl}
                      alt={qrCode.qr_code}
                      className="w-36 h-36 block mx-auto"
                    />
                  </div>
                ) : (
                  <div className="w-36 h-36 mx-auto bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                    Cargando QR...
                  </div>
                )}

                <div className="inline-block border-2 border-black px-2.5 py-0.5 font-bold text-xs tracking-wider">
                  {qrCode.qr_code}
                </div>

                <div className="font-sans font-black text-xs uppercase pt-1">
                  {bicycle.brand} {bicycle.model}
                </div>
                <div className="text-[10px] text-slate-600 font-sans">
                  {bicycle.bike_type} • Color: {bicycle.color}
                </div>
                {bicycle.serial_number && (
                  <div className="text-[10px]">
                    Serial: <strong>{bicycle.serial_number}</strong>
                  </div>
                )}
                {bicycle.customer?.full_name && (
                  <div className="text-[10px] text-slate-700">
                    Prop: {bicycle.customer.full_name}
                  </div>
                )}

                <div className="border-b border-dashed border-slate-400 my-1" />
                <div className="text-[10px] font-bold">✓ HISTORIAL CERTIFICADO A2RUEDAS</div>
                <div className="text-[9px] text-slate-600 font-sans leading-tight">
                  Escanea con tu celular para consultar el historial completo, repuestos y mantenimientos.
                </div>
                <div className="text-[8px] text-slate-500 break-all font-mono pt-0.5">
                  {publicUrl.replace(/^https?:\/\//, '')}
                </div>
                <div className="text-[8px] text-slate-400 border-t border-dashed border-slate-300 pt-1">
                  - - - - - - CORTE DE PAPEL - - - - - -
                </div>
              </div>
            )}

            <span className="text-[11px] text-slate-500 font-mono">
              Ancho de rollo térmico: 58 mm (Área imprimible: ~50 mm) • Sin márgenes vacíos
            </span>
          </div>
        ) : (
          /* Previsualización Sticker Gráfico Horizontal */
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
        )}

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
              leftIcon={
                copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )
              }
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
            {format === '58mm'
              ? 'Para impresora térmica: Una vez impresa la tirilla, se recomienda protegerla con una cinta transparente adhesiva sobre el marco de la bicicleta (por ejemplo debajo del tubo superior o en la vaina) para protegerla de la grasa, agua y roces.'
              : 'Para formato carta/A4: Se sugiere imprimir en vinilo adhesivo laminado resistente al agua y grasa. Ubicaciones ideales: bajo el tubo superior, tubo de asiento o junto al soporte de caramañola.'}
          </p>
        </div>
      </div>
    </Modal>
  );
};
