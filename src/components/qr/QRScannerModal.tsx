import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import {
  Camera,
  QrCode,
  Flashlight,
  RefreshCw,
  X,
  Keyboard,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  Bike,
  User,
  Search,
} from 'lucide-react';
import { extractQRCodeFromText } from '../../utils/qrUtils';
import { bicycleService } from '../../services/bicycleService';
import { Bicycle, BikeQRCode } from '../../types/database';
import { Button, Badge } from '../ui';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBicycle?: (bicycle: Bicycle, qrCode: BikeQRCode) => void;
  onOpenDossier?: (bicycle: Bicycle) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectBicycle,
  onOpenDossier,
}) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  // Estados de cámara
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  // Resultado de escaneo
  const [scannedResult, setScannedResult] = useState<{
    code: string;
    bicycle?: Bicycle;
    qrCode?: BikeQRCode;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  // Reproducir sonido suave y vibración de confirmación
  const playBeep = () => {
    try {
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // La (A5)
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      }
      if (navigator.vibrate) {
        navigator.vibrate(80);
      }
    } catch {
      // Audio no permitido o silenciado
    }
  };

  // Inicializar o detener cámara según estado del modal
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedResult(null);
      setManualCode('');
      setManualError(null);
      return;
    }

    if (mode === 'camera' && !scannedResult) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, mode, scannedResult]);

  // Detener la cámara
  const stopCamera = () => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Iniciar la cámara
  const startCamera = async (deviceId?: string) => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Tu navegador o dispositivo no soporta acceso a la cámara.');
      setMode('manual');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              facingMode: { ideal: 'environment' }, // Cámara trasera ideal en móviles
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      // Enumerar cámaras disponibles
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setCameras(videoDevices);
      } catch (err) {
        console.warn('No se pudieron listar cámaras:', err);
      }

      // Verificar soporte de linterna (torch)
      const track = mediaStream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;
        setTorchSupported(Boolean(capabilities && capabilities.torch));
      }

      // Iniciar ciclo de escaneo de fotogramas
      startScanningLoop();
    } catch (err: any) {
      console.error('Error al acceder a la cámara:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Permiso de cámara denegado. Puedes usar la pestaña de ingreso manual.');
      } else {
        setCameraError('No se pudo acceder a la cámara o está siendo utilizada por otra aplicación.');
      }
    }
  };

  // Alternar linterna en móviles
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextState = !torchEnabled;
      await (track.applyConstraints as any)({
        advanced: [{ torch: nextState }],
      });
      setTorchEnabled(nextState);
    } catch (err) {
      console.warn('Error al activar linterna:', err);
    }
  };

  // Ciclo continuo de análisis de frames con BarcodeDetector y fallback en jsQR
  const startScanningLoop = () => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
    }

    scanIntervalRef.current = window.setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return;

      // 1. Intentar con BarcodeDetector nativo si está disponible
      if ('BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await detector.detect(video);
          if (barcodes && barcodes.length > 0) {
            const raw = barcodes[0].rawValue;
            handleDetectedRawText(raw);
            return;
          }
        } catch {
          // Continuar con fallback jsQR
        }
      }

      // 2. Fallback universal con jsQR en Canvas off-screen
      const canvas = canvasRef.current || document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleDetectedRawText(code.data);
      }
    }, 150);
  };

  // Procesar código QR detectado
  const handleDetectedRawText = useCallback(
    async (rawText: string) => {
      const parsedCode = extractQRCodeFromText(rawText);
      if (!parsedCode || isProcessing) return;

      setIsProcessing(true);
      playBeep();
      stopCamera();

      try {
        const found = await bicycleService.getBicycleByQRCode(parsedCode);
        if (found) {
          setScannedResult({
            code: parsedCode,
            bicycle: found.bicycle,
            qrCode: found.qrCode,
          });
          if (onSelectBicycle) {
            onSelectBicycle(found.bicycle, found.qrCode);
          }
        } else {
          setScannedResult({
            code: parsedCode,
          });
        }
      } catch (err) {
        console.error('Error al resolver código QR escaneado:', err);
        setScannedResult({ code: parsedCode });
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, onSelectBicycle]
  );

  // Manejo de búsqueda manual
  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);
    const parsed = extractQRCodeFromText(manualCode);

    if (!parsed) {
      setManualError('Ingresa un código válido en formato BIKE-XXXXXX (ejemplo: BIKE-8F3A92).');
      return;
    }

    setIsProcessing(true);
    try {
      const found = await bicycleService.getBicycleByQRCode(parsed);
      if (found) {
        setScannedResult({
          code: parsed,
          bicycle: found.bicycle,
          qrCode: found.qrCode,
        });
        if (onSelectBicycle) {
          onSelectBicycle(found.bicycle, found.qrCode);
        }
      } else {
        setScannedResult({ code: parsed });
      }
    } catch (err) {
      console.error('Error en búsqueda manual de QR:', err);
      setManualError('Ocurrió un error al buscar la bicicleta.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reanudar escáner
  const handleScanAgain = () => {
    setScannedResult(null);
    setManualCode('');
    setManualError(null);
    if (mode === 'camera') {
      startCamera(selectedCameraId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Contenedor del Modal */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Cabecera */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Escáner de Códigos QR
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Apunta la cámara al sticker de la bicicleta para identificarla al instante.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Modo (Cámara / Manual) */}
        {!scannedResult && (
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-5 pt-2">
            <button
              onClick={() => {
                setMode('camera');
                setCameraError(null);
              }}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                mode === 'camera'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Cámara en Vivo</span>
            </button>
            <button
              onClick={() => {
                setMode('manual');
                stopCamera();
              }}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                mode === 'manual'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Ingreso por Teclado</span>
            </button>
          </div>
        )}

        {/* Cuerpo */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* VISTA 1: RESULTADO ENCONTRADO O NO ASIGNADO */}
          {scannedResult ? (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  Código QR Detectado
                </h4>
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <QrCode className="w-3.5 h-3.5 text-amber-500" />
                  {scannedResult.code}
                </div>
              </div>

              {scannedResult.bicycle ? (
                /* Ficha de la Bicicleta Encontrada */
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5 capitalize">
                        <Bike className="w-4 h-4 text-blue-600" />
                        {scannedResult.bicycle.brand} {scannedResult.bicycle.model}
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {scannedResult.bicycle.bike_type} • Color: {scannedResult.bicycle.color}
                      </p>
                    </div>
                    <Badge status="RECIBIDA" size="sm" isMono>
                      REGISTRADA
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-blue-100 dark:border-blue-900/40">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Serial</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {scannedResult.bicycle.serial_number || 'Sin serial'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono block">Rin / Marco</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {scannedResult.bicycle.wheel_size || 'N/A'} • {scannedResult.bicycle.frame_size || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {scannedResult.bicycle.customer && (
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <div>
                          <strong className="text-slate-900 dark:text-white block">
                            {scannedResult.bicycle.customer.full_name}
                          </strong>
                          <span className="text-[11px] font-mono text-slate-500">
                            {scannedResult.bicycle.customer.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Acciones principales con la bicicleta escaneada */}
                  <div className="space-y-2 pt-2">
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full"
                      onClick={() => {
                        const bike = scannedResult.bicycle!;
                        onClose();
                        if (onSelectBicycle) {
                          onSelectBicycle(bike, scannedResult.qrCode!);
                        } else {
                          navigate('/admin/ordenes/nueva', {
                            state: {
                              customer_id: bike.customer_id,
                              bicycle_id: bike.id,
                            },
                          });
                        }
                      }}
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      {onSelectBicycle ? 'Seleccionar Bicicleta para Esta Recepción' : 'Iniciar Recepción / Nueva Orden'}
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const bike = scannedResult.bicycle!;
                          onClose();
                          if (onOpenDossier) {
                            onOpenDossier(bike);
                          } else {
                            navigate('/admin/bicicletas');
                          }
                        }}
                      >
                        Ver Dossier Técnico
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          window.open(`/bike/${scannedResult.code}`, '_blank');
                        }}
                        leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                      >
                        Ver Perfil Público
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Código QR libre / no registrado */
                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 text-center space-y-3">
                  <div className="text-xs text-amber-800 dark:text-amber-300">
                    <p className="font-semibold">Código QR válido pero sin bicicleta asignada.</p>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">
                      Este código está disponible en el taller para vincularlo a una nueva bicicleta.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      onClose();
                      navigate('/admin/bicicletas');
                    }}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Registrar Nueva Bicicleta con este QR
                  </Button>
                </div>
              )}

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleScanAgain}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Escanear otro código QR
                </button>
              </div>
            </div>
          ) : mode === 'camera' ? (
            /* VISTA 2: CÁMARA EN VIVO */
            <div className="space-y-3">
              {cameraError ? (
                <div className="p-6 rounded-xl border border-dashed border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                  <div>
                    <h4 className="font-bold text-sm text-red-900 dark:text-red-200">
                      Cámara no disponible
                    </h4>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1 max-w-sm mx-auto">
                      {cameraError}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setMode('manual')}>
                    Ingresar Código por Teclado
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Visor de Cámara con Retícula Animada */}
                  <div className="relative w-full aspect-square max-h-[340px] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className="w-full h-full object-cover"
                    />

                    {/* Marco de Enfoque y Animación Láser */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="relative w-3/4 h-3/4 border-2 border-dashed border-blue-400/80 rounded-2xl">
                        {/* Esquinas destacadas */}
                        <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                        <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                        <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />

                        {/* Línea Láser animada */}
                        <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ef4444] animate-pulse top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    {/* Estado de Escaneo Activo */}
                    <div className="absolute bottom-3 inset-x-0 flex justify-center">
                      <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-slate-900/80 text-white backdrop-blur-xs flex items-center gap-1.5 border border-slate-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        Buscando código QR de bicicleta...
                      </span>
                    </div>
                  </div>

                  {/* Controles de Cámara (Linterna y Cambio de Cámara) */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    {torchSupported ? (
                      <button
                        type="button"
                        onClick={toggleTorch}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                          torchEnabled
                            ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Flashlight className="w-3.5 h-3.5" />
                        <span>{torchEnabled ? 'Linterna Encendida' : 'Linterna'}</span>
                      </button>
                    ) : (
                      <span />
                    )}

                    {cameras.length > 1 && (
                      <select
                        value={selectedCameraId}
                        onChange={(e) => {
                          setSelectedCameraId(e.target.value);
                          startCamera(e.target.value);
                        }}
                        className="text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-1.5 max-w-[200px] truncate"
                      >
                        {cameras.map((c, idx) => (
                          <option key={c.deviceId || idx} value={c.deviceId}>
                            {c.label || `Cámara ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* VISTA 3: INGRESO MANUAL POR TECLADO */
            <form onSubmit={handleManualSearch} className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Código QR o Identificador de Bicicleta
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Ej. BIKE-8F3A92 o 8F3A92"
                    className="w-full text-sm font-mono uppercase tracking-wider rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    autoFocus
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <QrCode className="w-5 h-5" />
                  </div>
                </div>
                {manualError && (
                  <p className="text-[11px] text-red-600 dark:text-red-400 pt-1">{manualError}</p>
                )}
                <p className="text-[11px] text-slate-400">
                  Ingresa el código alfanumérico impreso en la parte superior del sticker adhesivo.
                </p>
              </div>

              <Button
                type="submit"
                size="sm"
                variant="primary"
                className="w-full"
                isLoading={isProcessing}
                leftIcon={<Search className="w-4 h-4" />}
              >
                Buscar Bicicleta
              </Button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            {scannedResult ? '✓ Código verificado' : 'Sistema de Reconocimiento A2Ruedas'}
          </span>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};
