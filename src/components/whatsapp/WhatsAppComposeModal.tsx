import React, { useState, useEffect } from 'react';
import {
  Send,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Phone,
  User,
  Bike,
  FileText,
  CheckCheck,
} from 'lucide-react';
import {
  Customer,
  WorkOrder,
  Bicycle,
  WhatsAppTrigger,
  WhatsAppTemplateId,
  WhatsAppMessage,
} from '../../types/database';
import { whatsappService } from '../../services/whatsappService';
import { buildPublicBikeUrl } from '../../utils/qrUtils';
import { Modal, Button, Badge } from '../ui';

interface WhatsAppComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  workOrder?: WorkOrder | null;
  bicycle?: Bicycle | null;
  defaultTrigger?: WhatsAppTrigger | string;
  defaultMessage?: string;
  onSent?: (message: WhatsAppMessage) => void;
}

export const WhatsAppComposeModal: React.FC<WhatsAppComposeModalProps> = ({
  isOpen,
  onClose,
  customer,
  workOrder,
  bicycle,
  defaultTrigger,
  defaultMessage,
  onSent,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<WhatsAppTemplateId>('ORDEN_RECIBIDA');
  const [messageText, setMessageText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customPhone, setCustomPhone] = useState('');

  const templates = whatsappService.getTemplates();

  // Inicializar estado cuando se abre el modal
  useEffect(() => {
    if (!isOpen) return;

    // Número de teléfono inicial
    const initialPhone = customer?.phone || workOrder?.customer?.phone || '';
    setCustomPhone(initialPhone);

    // Si viene un mensaje predefinido desde la acción, usarlo
    if (defaultMessage) {
      setMessageText(defaultMessage);
      setSelectedTemplateId('PERSONALIZADO');
      return;
    }

    // O seleccionar plantilla según trigger
    let targetTemplate = templates[0];
    if (defaultTrigger) {
      targetTemplate = whatsappService.getTemplateForStatus(defaultTrigger);
    } else if (workOrder?.status) {
      targetTemplate = whatsappService.getTemplateForStatus(workOrder.status);
    }

    setSelectedTemplateId(targetTemplate.id);
    applyTemplate(targetTemplate.id);
  }, [isOpen, customer, workOrder, bicycle, defaultTrigger, defaultMessage]);

  const resolvedCustomer = customer || workOrder?.customer || null;
  const resolvedBike = bicycle || workOrder?.bicycle || null;

  // Aplicar plantilla interpolando los datos vigentes
  const applyTemplate = (templateId: WhatsAppTemplateId) => {
    setSelectedTemplateId(templateId);
    const tmpl = whatsappService.getTemplateById(templateId);
    if (!tmpl) return;

    const bikeName = resolvedBike
      ? `${resolvedBike.brand} ${resolvedBike.model}`
      : 'su bicicleta';

    const grandTotal = workOrder?.grand_total || 0;
    const deposit = workOrder?.internal_notes?.match(/\$([0-9.]+)\svía/)?.[1]?.replace(/\./g, '') || 0;
    const balanceDue = Math.max(0, grandTotal - Number(deposit));

    const publicUrl = resolvedBike
      ? buildPublicBikeUrl(`BIKE-${resolvedBike.id.slice(0, 6).toUpperCase()}`)
      : 'https://a2ruedas.app';

    const interpolated = whatsappService.interpolateTemplate(tmpl.template, {
      customerName: resolvedCustomer?.full_name,
      bikeName,
      orderNumber: workOrder?.order_number,
      totalAmount: grandTotal,
      balanceDue: balanceDue,
      reportedIssues: workOrder?.reported_issues,
      publicUrl,
    });

    setMessageText(interpolated);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    if (!resolvedCustomer && !customPhone) return;
    const targetPhone = customPhone || resolvedCustomer?.phone || '';
    if (!targetPhone) return;

    setIsSubmitting(true);
    try {
      const activeTemplate = whatsappService.getTemplateById(selectedTemplateId);
      const trigger = defaultTrigger || activeTemplate?.trigger || 'MANUAL';

      const logged = await whatsappService.sendAndLogMessage({
        customerId: resolvedCustomer?.id || 'anon',
        workOrderId: workOrder?.id || null,
        phone: targetPhone,
        message: messageText,
        trigger,
      });

      if (onSent) {
        onSent(logged);
      }
      onClose();
    } catch (err) {
      console.error('Error al enviar mensaje por WhatsApp:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const validPhone = customPhone.replace(/\D/g, '').length >= 10;
  const currentTime = new Date().toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enviar Mensaje por WhatsApp"
      description="Notificación formal de taller con registro automático de trazabilidad en bitácora."
      maxWidth="2xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={handleSend}
              disabled={!validPhone || !messageText.trim() || isSubmitting}
              isLoading={isSubmitting}
              leftIcon={<Send className="w-3.5 h-3.5" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-xs"
            >
              Abrir WhatsApp y Registrar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copied ? 'Copiado' : 'Copiar Texto'}
            </Button>
          </div>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Cabecera de Destinatario y Contexto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Cliente:</span>
              <strong className="text-slate-900 dark:text-white">
                {resolvedCustomer?.full_name || 'Cliente sin registrar'}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <span className="text-slate-500 block text-[10px] uppercase font-mono">WhatsApp (Móvil):</span>
              <input
                type="text"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="Ej: 310 456 7890"
                className="w-full text-xs font-mono font-semibold py-0.5 px-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {resolvedBike && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 col-span-full sm:col-span-1">
              <Bike className="w-4 h-4 text-purple-600 shrink-0" />
              <div className="truncate">
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Bicicleta:</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium truncate block">
                  {resolvedBike.brand} {resolvedBike.model} ({resolvedBike.color})
                </span>
              </div>
            </div>
          )}

          {workOrder && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 col-span-full sm:col-span-1">
              <FileText className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Orden Asociada:</span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                  {workOrder.order_number} ({workOrder.status})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Alerta si falta el teléfono */}
        {!validPhone && (
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Por favor ingresa un número de celular válido de 10 dígitos para enviar el WhatsApp.</span>
          </div>
        )}

        {/* Selector de Plantillas Rápidas de Taller */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Plantilla Oficial de Taller:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
            {templates.map((t) => {
              const isSelected = selectedTemplateId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t.id)}
                  className={`text-left p-2 rounded-lg border text-[11px] transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 shadow-xs font-semibold'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className="truncate block">{t.title}</span>
                  <span className="text-[9px] text-slate-400 uppercase font-mono mt-1">
                    {t.trigger}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor de Mensaje y Vista Previa de Chat */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Editor Editable */}
          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Mensaje a Enviar (Editable):
            </label>
            <textarea
              rows={9}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Escribe el mensaje..."
              className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white leading-relaxed focus:ring-2 focus:ring-emerald-500 flex-1 resize-none font-sans"
            />
            <span className="text-[10px] text-slate-400 text-right block font-mono">
              {messageText.length} caracteres
            </span>
          </div>

          {/* Simulador Fotorrealista de Chat WhatsApp */}
          <div className="space-y-1.5 flex flex-col">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Vista Previa en el Celular del Cliente:
            </label>
            <div className="rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden flex-1 flex flex-col bg-[#efeae2] dark:bg-[#0b141a]">
              {/* Barra superior de chat WhatsApp */}
              <div className="bg-[#075e54] dark:bg-[#1f2c34] text-white px-3 py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-[10px] border border-white/20">
                    A2
                  </div>
                  <div>
                    <span className="font-semibold block leading-tight">A2Ruedas Taller</span>
                    <span className="text-[9px] text-emerald-200 block leading-none">en línea</span>
                  </div>
                </div>
                <Badge status="RECIBIDA" size="sm" isMono>
                  WHATSAPP
                </Badge>
              </div>

              {/* Contenedor de burbuja */}
              <div className="p-3 flex-1 overflow-y-auto flex flex-col justify-end">
                <div className="max-w-[90%] self-end bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 p-2.5 rounded-lg rounded-tr-none shadow-xs text-[11px] leading-relaxed relative">
                  <div className="whitespace-pre-wrap">{messageText || 'Sin mensaje'}</div>
                  <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-500 dark:text-emerald-200 font-mono">
                    <span>{currentTime}</span>
                    <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
