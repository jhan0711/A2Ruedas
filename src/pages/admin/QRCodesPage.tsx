import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Camera,
  Printer,
  Search,
  ExternalLink,
  CheckCircle2,
  Bike,
  Sparkles,
  Layers,
  Copy,
  Check,
  Receipt,
} from 'lucide-react';
import { bicycleService } from '../../services/bicycleService';
import { Bicycle, BikeQRCode } from '../../types/database';
import {
  Button,
  Input,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  LoadingSpinner,
  EmptyState,
  Alert,
} from '../../components/ui';
import { QRScannerModal } from '../../components/qr/QRScannerModal';
import { StickerPreviewModal } from '../../components/qr/StickerPreviewModal';
import {
  generateBikeStickerCanvas,
  printStickersWindow,
  printThermalStickersWindow,
  buildPublicBikeUrl,
} from '../../utils/qrUtils';

const BIKE_TYPES = [
  { value: 'ALL', label: 'Todos los tipos' },
  { value: 'MTB', label: 'Montaña (MTB)' },
  { value: 'Ruta', label: 'Ruta' },
  { value: 'Urbana', label: 'Urbana' },
  { value: 'Gravel', label: 'Gravel' },
  { value: 'BMX', label: 'BMX' },
  { value: 'Eléctrica', label: 'Eléctrica' },
];

export const QRCodesPage: React.FC = () => {
  const [bicycles, setBicycles] = useState<Bicycle[]>([]);
  const [qrCodes, setQrCodes] = useState<Record<string, BikeQRCode>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [selectedBikeIds, setSelectedBikeIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    text: string;
  } | null>(null);

  // Estados de Modales
  const [scannerOpen, setScannerOpen] = useState(false);
  const [stickerModalOpen, setStickerModalOpen] = useState(false);
  const [selectedBikeForSticker, setSelectedBikeForSticker] = useState<Bicycle | null>(null);
  const [selectedQrForSticker, setSelectedQrForSticker] = useState<BikeQRCode | null>(null);
  const [isBatchPrinting, setIsBatchPrinting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const bikesData = await bicycleService.getBicycles();
      setBicycles(bikesData);

      const qrs: Record<string, BikeQRCode> = {};
      await Promise.all(
        bikesData.map(async (bike) => {
          const qr = await bicycleService.getOrGenerateQRCode(bike.id);
          qrs[bike.id] = qr;
        })
      );
      setQrCodes(qrs);
    } catch (err) {
      console.error('Error al cargar datos de códigos QR:', err);
      setAlertMessage({ type: 'error', text: 'No se pudieron cargar los códigos QR.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrado reactivo multicriterio
  const filteredBicycles = bicycles.filter((b) => {
    const qr = qrCodes[b.id];
    const term = searchTerm.toLowerCase().trim();

    const matchesSearch =
      !term ||
      b.brand.toLowerCase().includes(term) ||
      b.model.toLowerCase().includes(term) ||
      (b.serial_number && b.serial_number.toLowerCase().includes(term)) ||
      (b.customer?.full_name && b.customer.full_name.toLowerCase().includes(term)) ||
      (qr && qr.qr_code.toLowerCase().includes(term));

    const matchesType = filterType === 'ALL' || b.bike_type === filterType;
    return matchesSearch && matchesType;
  });

  // Manejo de Selección Múltiple para Impresión Masiva
  const handleToggleSelect = (bikeId: string) => {
    setSelectedBikeIds((prev) =>
      prev.includes(bikeId) ? prev.filter((id) => id !== bikeId) : [...prev, bikeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBikeIds.length === filteredBicycles.length) {
      setSelectedBikeIds([]);
    } else {
      setSelectedBikeIds(filteredBicycles.map((b) => b.id));
    }
  };

  // Abrir Modal de Sticker Individual
  const openStickerModal = (bike: Bicycle) => {
    const qr = qrCodes[bike.id];
    if (!qr) return;
    setSelectedBikeForSticker(bike);
    setSelectedQrForSticker(qr);
    setStickerModalOpen(true);
  };

  // Copiar código al portapapeles
  const handleCopyCode = (qrCode: string, bikeId: string) => {
    navigator.clipboard.writeText(qrCode);
    setCopiedId(bikeId);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Impresión masiva en rollo continuo de IMPRESORA TÉRMICA (58 mm)
  const handleBatchPrintThermal = async (targetBikes: Bicycle[]) => {
    if (targetBikes.length === 0) return;
    setIsBatchPrinting(true);

    try {
      const items = targetBikes
        .map((bike) => {
          const qr = qrCodes[bike.id];
          return qr ? { bike, qrCode: qr.qr_code } : null;
        })
        .filter(Boolean) as Array<{ bike: Bicycle; qrCode: string }>;

      if (items.length === 0) {
        setAlertMessage({
          type: 'warning',
          text: 'No hay códigos QR asociados a las bicicletas seleccionadas.',
        });
        return;
      }

      await printThermalStickersWindow(items);
    } catch (err) {
      console.error('Error al generar impresión térmica:', err);
      setAlertMessage({
        type: 'error',
        text: 'Ocurrió un error al preparar la impresión térmica.',
      });
    } finally {
      setIsBatchPrinting(false);
    }
  };

  // Impresión en lote (Batch Print) de Stickers en Hoja Carta / A4
  const handleBatchPrint = async (targetBikes: Bicycle[]) => {
    if (targetBikes.length === 0) return;
    setIsBatchPrinting(true);

    try {
      const stickersData: Array<{ dataUrl: string; qrCode: string; bikeName: string }> = [];

      for (const bike of targetBikes) {
        const qr = qrCodes[bike.id];
        if (qr) {
          const canvas = await generateBikeStickerCanvas(bike, qr.qr_code);
          stickersData.push({
            dataUrl: canvas.toDataURL('image/png'),
            qrCode: qr.qr_code,
            bikeName: `${bike.brand} ${bike.model}`,
          });
        }
      }

      printStickersWindow(stickersData);
    } catch (err) {
      console.error('Error al generar pliego de stickers:', err);
      setAlertMessage({ type: 'error', text: 'Ocurrió un error al preparar el pliego de impresión.' });
    } finally {
      setIsBatchPrinting(false);
    }
  };

  const selectedBikesList = bicycles.filter((b) => selectedBikeIds.includes(b.id));

  return (
    <div className="space-y-6">
      {/* Alerta de notificación */}
      {alertMessage && (
        <Alert
          variant={alertMessage.type}
          onDismiss={() => setAlertMessage(null)}
        >
          {alertMessage.text}
        </Alert>
      )}

      {/* Cabecera y Acciones Principales */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <QrCode className="w-7 h-7 text-amber-500" />
            Centro de Códigos QR y Etiquetas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generación de stickers para marco, rollo de impresora térmica de 58 mm y escáner por cámara.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botón de Impresión Térmica Directa (58 mm) */}
          <Button
            size="sm"
            variant="primary"
            onClick={() =>
              handleBatchPrintThermal(
                selectedBikesList.length > 0 ? selectedBikesList : bicycles
              )
            }
            isLoading={isBatchPrinting}
            leftIcon={<Receipt className="w-4 h-4" />}
            title="Imprimir en rollo continuo de impresora térmica de 58 mm (sin márgenes)"
          >
            {selectedBikesList.length > 0
              ? `Imprimir Térmica (${selectedBikesList.length})`
              : 'Imprimir Todas en Térmica'}
          </Button>

          {/* Botón de Pliego en Hoja Carta / A4 */}
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              handleBatchPrint(selectedBikesList.length > 0 ? selectedBikesList : bicycles)
            }
            isLoading={isBatchPrinting}
            leftIcon={<Printer className="w-4 h-4" />}
            title="Imprimir pliego en hoja adhesiva tamaño Carta o A4"
          >
            {selectedBikesList.length > 0
              ? `Pliego Carta (${selectedBikesList.length})`
              : 'Pliego Carta Completo'}
          </Button>

          {/* Botón de Escáner por Cámara */}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setScannerOpen(true)}
            leftIcon={<Camera className="w-4 h-4" />}
          >
            Escanear QR
          </Button>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-amber-500" />
            Códigos QR Asignados
          </span>
          <span className="text-2xl font-black font-mono text-slate-900 dark:text-white block mt-1">
            {Object.keys(qrCodes).length}
          </span>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Bike className="w-3.5 h-3.5 text-blue-500" />
            Bicicletas Identificadas
          </span>
          <span className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 block mt-1">
            {bicycles.length}
          </span>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-500" />
            Stickers Seleccionados
          </span>
          <span className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400 block mt-1">
            {selectedBikeIds.length}
          </span>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Red de Trazabilidad
          </span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block mt-2 flex items-center gap-1">
            <Sparkles className="w-4 h-4" /> 100% Activa y Verificada
          </span>
        </Card>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <Card className="p-4 border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Buscar por código (BIKE-...), marca, modelo, cliente o serial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto text-xs">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {BIKE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            <Button
              size="sm"
              variant="outline"
              onClick={handleSelectAll}
              className="whitespace-nowrap"
            >
              {selectedBikeIds.length === filteredBicycles.length && filteredBicycles.length > 0
                ? 'Deseleccionar Todas'
                : 'Seleccionar Visibles'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabla de Códigos QR y Bicicletas */}
      <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner text="Cargando directorio de códigos QR..." />
          </div>
        ) : filteredBicycles.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState
              icon={<QrCode className="w-8 h-8 text-amber-500" />}
              title="No se encontraron códigos QR"
              description="No hay bicicletas registradas que coincidan con los criterios de búsqueda actuales."
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredBicycles.length > 0 &&
                      selectedBikeIds.length === filteredBicycles.length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </TableHead>
                <TableHead>Código QR Asignado</TableHead>
                <TableHead>Bicicleta / Modelo</TableHead>
                <TableHead>Cliente Propietario</TableHead>
                <TableHead>Serial de Cuadro</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones de Sticker</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBicycles.map((bike) => {
                const qr = qrCodes[bike.id];
                const isSelected = selectedBikeIds.includes(bike.id);
                const isCopied = copiedId === bike.id;

                return (
                  <TableRow
                    key={bike.id}
                    className={isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : undefined}
                  >
                    {/* Checkbox de selección */}
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(bike.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </TableCell>

                    {/* Código QR e Identificador */}
                    <TableCell>
                      {qr ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openStickerModal(bike)}
                            className="p-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 transition-colors shrink-0"
                            title="Ver sticker"
                          >
                            <QrCode className="w-5 h-5 text-amber-500" />
                          </button>
                          <div>
                            <span className="font-mono font-bold text-xs text-slate-900 dark:text-white block">
                              {qr.qr_code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(qr.qr_code, bike.id)}
                              className="text-[10px] text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-mono inline-flex items-center gap-0.5"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-2.5 h-2.5 text-emerald-500" />
                                  <span className="text-emerald-600">Copiado</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-2.5 h-2.5" />
                                  <span>Copiar</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Generando...</span>
                      )}
                    </TableCell>

                    {/* Bicicleta */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="font-bold text-xs text-slate-900 dark:text-white capitalize block">
                          {bike.brand} {bike.model}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {bike.bike_type}
                          </span>
                          <span>• {bike.color}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Cliente Propietario */}
                    <TableCell>
                      {bike.customer ? (
                        <div className="space-y-0.5 text-xs">
                          <span className="font-medium text-slate-900 dark:text-slate-100 block">
                            {bike.customer.full_name}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 block">
                            {bike.customer.phone}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>

                    {/* Serial de Cuadro */}
                    <TableCell>
                      <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                        {bike.serial_number || 'Sin serial'}
                      </span>
                    </TableCell>

                    {/* Estado del QR */}
                    <TableCell>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Activo
                      </span>
                    </TableCell>

                    {/* Acciones */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {qr && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() =>
                              printThermalStickersWindow([
                                { bike, qrCode: qr.qr_code },
                              ])
                            }
                            title="Imprimir directamente en rollo de impresora térmica de 58 mm"
                            leftIcon={<Receipt className="w-3.5 h-3.5" />}
                          >
                            Térmica (58mm)
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openStickerModal(bike)}
                          title="Previsualizar opciones de sticker o descargar PNG"
                          leftIcon={<Printer className="w-3.5 h-3.5" />}
                        >
                          Sticker
                        </Button>

                        {qr && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(buildPublicBikeUrl(qr.qr_code), '_blank')}
                            title="Ver vista pública del cliente"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Modal del Escáner de Códigos QR */}
      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onOpenDossier={(bike) => {
          setScannerOpen(false);
          openStickerModal(bike);
        }}
      />

      {/* Modal de Previsualización y Descarga de Sticker */}
      <StickerPreviewModal
        isOpen={stickerModalOpen}
        onClose={() => setStickerModalOpen(false)}
        bicycle={selectedBikeForSticker}
        qrCode={selectedQrForSticker}
      />
    </div>
  );
};
