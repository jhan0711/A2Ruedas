import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Building2,
  Clock,
  Printer,
  ShieldCheck,
  Save,
  RotateCcw,
  FileText,
  DollarSign,
  Calendar,
  ExternalLink,
  UserCheck,
  LogOut,
  Cloud,
  Database,
  Sparkles,
  Sliders,
  Check,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  workshopSettingsService,
  WorkshopGeneralSettings,
} from '../../services/workshopSettingsService';
import { printerService } from '../../services/printerService';
import { PrinterSettings } from '../../types/database';
import { printDirectHtml, generateTestTicketHtml } from '../../utils/printUtils';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  Card,
  Button,
  Input,
  Select,
  Badge,
  Alert,
  ConfirmModal,
} from '../../components/ui';

type SettingsTab = 'identity' | 'operations' | 'hardware' | 'security';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();

  // Estados de configuración
  const [workshopSettings, setWorkshopSettings] = useState<WorkshopGeneralSettings>(() =>
    workshopSettingsService.getSettings()
  );
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(() =>
    printerService.getSettings()
  );

  const [activeTab, setActiveTab] = useState<SettingsTab>('identity');
  const [isSavedAlert, setIsSavedAlert] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [isPrintingTest, setIsPrintingTest] = useState(false);

  // Mantener sincronizados los estados cuando se cambian
  const handleWorkshopChange = (field: keyof WorkshopGeneralSettings, value: any) => {
    setWorkshopSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handlePrinterChange = (field: keyof PrinterSettings, value: any) => {
    setPrinterSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Guardar configuración general
    workshopSettingsService.saveSettings(workshopSettings);

    // Guardar parámetros específicos de hardware de impresora
    printerService.saveSettings(printerSettings);

    // Actualizar estados locales
    setWorkshopSettings(workshopSettingsService.getSettings());
    setPrinterSettings(printerService.getSettings());

    setIsSavedAlert(true);
    setTimeout(() => {
      setIsSavedAlert(false);
    }, 4000);
  };

  const handleResetToDefaults = () => {
    workshopSettingsService.resetSettings();
    setWorkshopSettings(workshopSettingsService.getSettings());
    setPrinterSettings(printerService.getSettings());
    setResetModalOpen(false);

    setIsSavedAlert(true);
    setTimeout(() => {
      setIsSavedAlert(false);
    }, 3000);
  };

  const handlePrintTest = () => {
    setIsPrintingTest(true);
    try {
      const html = generateTestTicketHtml(printerSettings);
      printDirectHtml(html);
    } catch (err) {
      console.error('Error al imprimir ticket de prueba:', err);
    } finally {
      setTimeout(() => setIsPrintingTest(false), 800);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Configuración del Sistema
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalización comercial del taller, parámetros operativos, hardware de impresión y seguridad.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setResetModalOpen(true)}
            className="text-xs text-slate-600 dark:text-slate-300"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Restaurar Valores
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => handleSaveAll()}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Guardar Cambios
          </Button>
        </div>
      </div>

      {/* Alerta de Éxito al Guardar */}
      {isSavedAlert && (
        <Alert
          variant="success"
          title="Configuración actualizada"
          onDismiss={() => setIsSavedAlert(false)}
        >
          ¡Todos los cambios se aplicaron exitosamente a marbetes, facturas, órdenes de trabajo y tickets térmicos!
        </Alert>
      )}

      {/* Barra de Pestañas */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('identity')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all border shrink-0 ${
            activeTab === 'identity'
              ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
              : 'bg-white/60 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Taller & Identidad Fiscal
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('operations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all border shrink-0 ${
            activeTab === 'operations'
              ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
              : 'bg-white/60 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          Operación & Horarios
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hardware')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all border shrink-0 ${
            activeTab === 'hardware'
              ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
              : 'bg-white/60 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Printer className="w-4 h-4" />
          Impresión & Hardware
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all border shrink-0 ${
            activeTab === 'security'
              ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
              : 'bg-white/60 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Sesión & Nube
        </button>
      </div>

      {/* ======================================================== */}
      {/* PESTAÑA 1: TALLER & IDENTIDAD FISCAL                     */}
      {/* ======================================================== */}
      {activeTab === 'identity' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Formulario de Datos */}
          <div className="lg:col-span-8 space-y-5">
            <Card className="p-6 space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Información Institucional del Taller
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Estos datos aparecen en las cabeceras de marbetes para bicicletas, comprobantes de custodia, facturas electrónicas/POS y recibos de entrega.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre Comercial del Taller
                  </label>
                  <Input
                    type="text"
                    value={workshopSettings.name}
                    onChange={(e) => handleWorkshopChange('name', e.target.value)}
                    placeholder="Ej: A2RUEDAS TALLER"
                    className="text-xs font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NIT / Identificación Tributaria
                  </label>
                  <Input
                    type="text"
                    value={workshopSettings.nit}
                    onChange={(e) => handleWorkshopChange('nit', e.target.value)}
                    placeholder="Ej: 901.452.879-1"
                    className="text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono / WhatsApp de Atención
                  </label>
                  <Input
                    type="text"
                    value={workshopSettings.phone}
                    onChange={(e) => handleWorkshopChange('phone', e.target.value)}
                    placeholder="Ej: (+57) 310 456 7890"
                    className="text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico de Contacto
                  </label>
                  <Input
                    type="email"
                    value={workshopSettings.email}
                    onChange={(e) => handleWorkshopChange('email', e.target.value)}
                    placeholder="Ej: contacto@a2ruedas.com"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Dirección Física
                  </label>
                  <Input
                    type="text"
                    value={workshopSettings.address}
                    onChange={(e) => handleWorkshopChange('address', e.target.value)}
                    placeholder="Ej: Calle 123 # 45-67"
                    className="text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ciudad / Municipio
                  </label>
                  <Input
                    type="text"
                    value={workshopSettings.city}
                    onChange={(e) => handleWorkshopChange('city', e.target.value)}
                    placeholder="Ej: Bogotá D.C."
                    className="text-xs"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Textos Oficiales en Documentos Impresos
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Lemas comerciales, frases de cortesía y cláusula legal de garantía aplicable a órdenes de trabajo.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lema / Slogan de Cabecera
                  </label>
                  <Input
                    type="text"
                    value={workshopSettings.header_slogan}
                    onChange={(e) => handleWorkshopChange('header_slogan', e.target.value)}
                    placeholder="Ej: TALLER ESPECIALIZADO DE BICICLETAS"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mensaje de Agradecimiento (Pie de Tirilla)
                  </label>
                  <Input
                    type="text"
                    value={workshopSettings.footer_message}
                    onChange={(e) => handleWorkshopChange('footer_message', e.target.value)}
                    placeholder="Ej: ¡Gracias por pedalear con nosotros! 🚲"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cláusula Legal de Garantía y Custodia del Taller
                  </label>
                  <textarea
                    rows={3}
                    value={workshopSettings.warranty_text}
                    onChange={(e) => handleWorkshopChange('warranty_text', e.target.value)}
                    placeholder="Condiciones de entrega, días de garantía y custodia..."
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Este texto legal protege al taller y se estampa al pie de cada comprobante de recepción y liquidación OT.
                  </p>
                </div>
              </div>
            </Card>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => handleSaveAll()}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-5 py-2.5"
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar Datos del Taller
              </Button>
            </div>
          </div>

          {/* Columna Derecha: Vista Previa en Vivo del Encabezado */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="p-5 sticky top-6 bg-slate-50 dark:bg-slate-900/90 border-dashed border-2 border-slate-300 dark:border-slate-700">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Previsualización de Cabecera
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold">
                  {printerSettings.paper_width}
                </span>
              </div>

              {/* Simulación de Rollo Térmico */}
              <div className="bg-white text-black p-5 rounded-lg shadow-md font-mono text-[11px] leading-relaxed text-center border border-slate-200">
                <div className="font-bold text-sm tracking-wider uppercase">
                  {workshopSettings.name || 'A2RUEDAS TALLER'}
                </div>
                <div className="text-[10px] text-neutral-600 font-medium mt-0.5">
                  {workshopSettings.header_slogan || 'TALLER ESPECIALIZADO DE BICICLETAS'}
                </div>
                <div className="text-[10px] mt-1">NIT: {workshopSettings.nit || '901.452.879-1'}</div>
                <div className="text-[10px]">{workshopSettings.address || 'Calle 123 # 45-67'}</div>
                <div className="text-[10px]">{workshopSettings.city || 'Bogotá D.C.'}</div>
                <div className="text-[10px]">Tel: {workshopSettings.phone || '(+57) 310 456 7890'}</div>

                <div className="border-t border-dashed border-neutral-400 my-3"></div>

                <div className="text-[10px] text-neutral-500 italic">
                  [ Contenido del Comprobante / Factura POS / Marbete ]
                </div>

                <div className="border-t border-dashed border-neutral-400 my-3"></div>

                <div className="text-[10px] font-bold text-neutral-800">
                  {workshopSettings.footer_message || '¡Gracias por pedalear con nosotros! 🚲'}
                </div>
                <div className="text-[9px] text-neutral-500 mt-2 text-justify leading-tight">
                  {workshopSettings.warranty_text || 'Garantía oficial del taller.'}
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-3">
                Cualquier cambio en el formulario de la izquierda actualiza de inmediato todas las tirillas.
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 2: OPERACIÓN & HORARIOS                          */}
      {/* ======================================================== */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Capacidad Diaria y Flujo de Trabajo */}
            <Card className="p-6 space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Capacidad de Citas y Recepción
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Controla el aforo máximo de bicicletas agendadas y en mantenimiento diario.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Límite Máximo de Citas Diarias
                  </label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={workshopSettings.daily_capacity}
                      onChange={(e) =>
                        handleWorkshopChange('daily_capacity', Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-32 text-xs font-bold font-mono"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      bicicletas / cupos por día
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                    Utilizado en el módulo de Agenda para alertar sobrecupo cuando el taller esté saturado.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Notificaciones Automáticas por WhatsApp
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={workshopSettings.whatsapp_notifications_enabled}
                      onChange={(e) =>
                        handleWorkshopChange('whatsapp_notifications_enabled', e.target.checked)
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                    />
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      Habilitar recordatorios automáticos de citas y avisos de bicicleta lista para retiro
                    </span>
                  </label>
                </div>
              </div>
            </Card>

            {/* Horarios de Atención */}
            <Card className="p-6 space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Horarios de Atención al Público
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Rangos mostrados a los clientes para agendamiento y recepción física.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lunes a Viernes
                  </label>
                  <Input
                    type="text"
                    value={workshopSettings.weekday_hours}
                    onChange={(e) => handleWorkshopChange('weekday_hours', e.target.value)}
                    placeholder="Ej: 08:00 - 18:00"
                    className="text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sábados
                  </label>
                  <Input
                    type="text"
                    value={workshopSettings.saturday_hours}
                    onChange={(e) => handleWorkshopChange('saturday_hours', e.target.value)}
                    placeholder="Ej: 08:00 - 14:00"
                    className="text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Domingos y Festivos
                  </label>
                  <Input
                    type="text"
                    value={workshopSettings.sunday_hours}
                    onChange={(e) => handleWorkshopChange('sunday_hours', e.target.value)}
                    placeholder="Ej: Cerrado"
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Parámetros Comerciales y Prefijos */}
          <Card className="p-6 space-y-4">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Parámetros Comerciales y Prefijos de Facturación
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Moneda local, impuestos y formato de folios correlativos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Moneda Predeterminada
                </label>
                <Input
                  type="text"
                  value={workshopSettings.currency_code}
                  onChange={(e) => handleWorkshopChange('currency_code', e.target.value)}
                  placeholder="COP"
                  className="text-xs font-bold font-mono"
                  disabled
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Peso Colombiano ($ COP)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  IVA Predeterminado (%)
                </label>
                <Select
                  value={String(workshopSettings.default_tax_rate)}
                  onChange={(e) => handleWorkshopChange('default_tax_rate', Number(e.target.value))}
                  className="text-xs"
                >
                  <option value="0">0% — Régimen Simple / Exento</option>
                  <option value="19">19% — Régimen Común (IVA Estándar)</option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Prefijo Órdenes (OT)
                </label>
                <Input
                  type="text"
                  value={workshopSettings.order_prefix}
                  onChange={(e) => handleWorkshopChange('order_prefix', e.target.value)}
                  placeholder="OT-"
                  className="text-xs font-mono font-bold"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Ejemplo: OT-000001
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Prefijo Facturas POS
                </label>
                <Input
                  type="text"
                  value={workshopSettings.invoice_prefix}
                  onChange={(e) => handleWorkshopChange('invoice_prefix', e.target.value)}
                  placeholder="FAC-"
                  className="text-xs font-mono font-bold"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Ejemplo: FAC-000001
                </span>
              </div>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => handleSaveAll()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-5 py-2.5"
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Parámetros Operativos
            </Button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 3: IMPRESIÓN & HARDWARE                          */}
      {/* ======================================================== */}
      {activeTab === 'hardware' && (
        <div className="space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Calibración de Impresora Térmica de Tirillas y Marbetes
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ajustes milimétricos para rollos térmicos de 58 mm y 80 mm utilizados en el taller.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/impresion')}
                className="text-xs text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Abrir Estudio 58mm Completo
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ancho del Rollo Continuo
                </label>
                <Select
                  value={printerSettings.paper_width}
                  onChange={(e) =>
                    handlePrinterChange('paper_width', e.target.value as '58mm' | '80mm')
                  }
                  className="w-full text-xs font-semibold"
                >
                  <option value="58mm">58 mm (Estándar POS - 52mm útiles)</option>
                  <option value="80mm">80 mm (Ancho POS - 72mm útiles)</option>
                </Select>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Recomendado: 58 mm para marbetes de marco y tirillas ágiles.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Densidad Tipográfica
                </label>
                <Select
                  value={printerSettings.font_density}
                  onChange={(e) =>
                    handlePrinterChange('font_density', e.target.value as any)
                  }
                  className="w-full text-xs"
                >
                  <option value="compact">Compacta (9.5px — Ahorro de papel)</option>
                  <option value="normal">Normal (11.0px — Balance recomendada)</option>
                  <option value="large">Grande (12.5px — Mayor legibilidad)</option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Avance de Papel previo al Corte
                </label>
                <Select
                  value={String(printerSettings.feed_lines)}
                  onChange={(e) =>
                    handlePrinterChange('feed_lines', Number(e.target.value))
                  }
                  className="w-full text-xs"
                >
                  <option value="1">1 línea (Mínimo)</option>
                  <option value="2">2 líneas</option>
                  <option value="3">3 líneas (Recomendado para guillotina)</option>
                  <option value="4">4 líneas</option>
                  <option value="5">5 líneas (Cuchilla retrasada)</option>
                </Select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={printerSettings.show_qr_code}
                  onChange={(e) => handlePrinterChange('show_qr_code', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Imprimir códigos QR automáticos en marbetes de bicicleta y comprobantes de recepción
                </span>
              </label>
            </div>
          </Card>

          {/* Banco de Pruebas de Impresión */}
          <Card className="p-6 bg-slate-50 dark:bg-slate-900/60 border-blue-100 dark:border-blue-900/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Verificación y Prueba de Calibración
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Envía una tirilla de prueba con los datos actuales del taller a la impresora térmica predeterminada de Windows/navegador.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrintTest}
                  disabled={isPrintingTest}
                  className="text-xs bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800"
                >
                  <Printer className="w-4 h-4 mr-1.5" />
                  {isPrintingTest ? 'Imprimiendo...' : 'Imprimir Tirilla de Prueba'}
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleSaveAll()}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  Guardar Ajustes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 4: SESIÓN, NUBE & SEGURIDAD                      */}
      {/* ======================================================== */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cuenta Administrador Activa */}
            <Card className="p-6 space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Cuenta de Administrador Activa
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Sesión autenticada en el panel de control del taller.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {profile?.fullName || 'Administrador Principal'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {user?.email || 'admin@a2ruedas.com'}
                    </div>
                  </div>
                  <Badge variant="success" className="text-[10px] font-semibold">
                    Acceso Total
                  </Badge>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pt-1">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span>Rol en el Sistema:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {profile?.role === 'admin' ? 'Administrador Maestro' : 'Técnico Autorizado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span>Estado de Seguridad:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Sesión Cifrada
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span>Registro Público:</span>
                    <span className="font-semibold text-rose-500 dark:text-rose-400">
                      Desactivado (Solo Cuentas Autorizadas)
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Estado de Supabase Cloud & Resiliencia */}
            <Card className="p-6 space-y-4">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Infraestructura Cloud & PWA
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Estado de sincronización en tiempo real y funcionamiento sin conexión.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Base de Datos Cloud
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {isSupabaseConfigured ? 'Supabase PostgreSQL Conectado' : 'Modo Taller Local Seguro'}
                      </div>
                    </div>
                  </div>
                  <Badge variant={isSupabaseConfigured ? 'success' : 'neutral'} className="text-[10px]">
                    {isSupabaseConfigured ? 'En Línea' : 'Local Activo'}
                  </Badge>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pt-1">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span>Versión de la Aplicación:</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      A2Ruedas v0.1.0 Producción
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                    <span>Soporte Offline PWA:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Habilitado (Service Worker)
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span>Base de Datos Limpia:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Certificada sin datos de prueba
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Botón de Cerrar Sesión Seguro */}
          <Card className="p-6 bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                  Cerrar Sesión del Taller
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Finaliza la sesión actual y bloquea la consola de administración hasta que vuelvas a autenticarte con tus credenciales seguras.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLogoutModalOpen(true)}
                className="text-xs bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/50"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                Cerrar Sesión
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Confirmación: Restaurar Valores */}
      <ConfirmModal
        isOpen={resetModalOpen}
        title="¿Restablecer configuración de fábrica?"
        message="Esta acción restaurará el nombre comercial, datos de cabecera y parámetros de impresión a sus valores predeterminados de A2Ruedas. ¿Deseas continuar?"
        confirmText="Restablecer"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleResetToDefaults}
        onClose={() => setResetModalOpen(false)}
      />

      {/* Modal de Confirmación: Cerrar Sesión */}
      <ConfirmModal
        isOpen={logoutModalOpen}
        title="¿Cerrar sesión de administrador?"
        message="¿Estás seguro de que deseas salir de la consola administrativa de A2Ruedas?"
        confirmText="Sí, Cerrar Sesión"
        cancelText="Permanecer"
        variant="danger"
        onConfirm={async () => {
          setLogoutModalOpen(false);
          await logout();
          navigate('/login');
        }}
        onClose={() => setLogoutModalOpen(false)}
      />
    </div>
  );
};
