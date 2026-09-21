import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Plus,
  Phone,
  User,
  Clock,
  Copy,
  Check,
  Filter,
  CheckCheck,
  Sparkles,
  Send,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { WhatsAppMessage, Customer, WorkOrder } from '../../types/database';
import { whatsappService, WHATSAPP_TEMPLATES } from '../../services/whatsappService';
import { customerService } from '../../services/customerService';
import {
  Button,
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
import { WhatsAppComposeModal } from '../../components/whatsapp/WhatsAppComposeModal';

export const WhatsAppPage: React.FC = () => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTrigger, setFilterTrigger] = useState('ALL');

  // Estados de interfaz
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [selectedCustomerForCompose, setSelectedCustomerForCompose] = useState<Customer | null>(null);
  const [selectedOrderForCompose, setSelectedOrderForCompose] = useState<WorkOrder | null>(null);
  const [selectedTriggerForCompose, setSelectedTriggerForCompose] = useState<string | undefined>(undefined);
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
  } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [msgs, custs] = await Promise.all([
        whatsappService.getMessages(),
        customerService.getCustomers(),
      ]);
      setMessages(msgs);
      setCustomers(custs);
    } catch (err) {
      console.error('Error al cargar datos de WhatsApp:', err);
      setAlertMessage({ type: 'error', text: 'Error al conectar con la bitácora de mensajes.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar mensajes reactivamente
  const filteredMessages = messages.filter((m) => {
    if (filterTrigger !== 'ALL' && m.status_trigger !== filterTrigger) {
      return false;
    }
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase().trim();
    const matchClient = m.customer?.full_name?.toLowerCase().includes(term);
    const matchPhone = m.phone_number?.toLowerCase().includes(term);
    const matchOrder = m.work_order?.order_number?.toLowerCase().includes(term);
    const matchContent = m.message_content?.toLowerCase().includes(term);
    const matchTrigger = m.status_trigger?.toLowerCase().includes(term);

    return matchClient || matchPhone || matchOrder || matchContent || matchTrigger;
  });

  // Copiar texto del mensaje al portapapeles
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Reenviar mensaje abriendo el modal de composición
  const handleResend = (msg: WhatsAppMessage) => {
    setSelectedCustomerForCompose(msg.customer || null);
    setSelectedOrderForCompose(msg.work_order || null);
    setSelectedTriggerForCompose(msg.status_trigger);
    setComposeModalOpen(true);
  };

  // Apertura de redactor rápido
  const handleNewMessage = () => {
    setSelectedCustomerForCompose(customers[0] || null);
    setSelectedOrderForCompose(null);
    setSelectedTriggerForCompose('MANUAL');
    setComposeModalOpen(true);
  };

  // KPIs
  const totalMessages = messages.length;
  const uniqueCustomers = new Set(messages.map((m) => m.customer_id)).size;
  const orderRelated = messages.filter((m) => m.work_order_id).length;

  return (
    <div className="space-y-6">
      {/* Alerta */}
      {alertMessage && (
        <Alert variant={alertMessage.type} onDismiss={() => setAlertMessage(null)}>
          {alertMessage.text}
        </Alert>
      )}

      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <MessageSquare className="w-7 h-7 text-emerald-600" />
            Centro de Comunicación por WhatsApp
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Plantillas automáticas para el taller, deep links dinámicos y bitácora de trazabilidad de mensajes enviados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadData}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Actualizar
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handleNewMessage}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-xs"
          >
            Nuevo Mensaje
          </Button>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-emerald-600" />
            Mensajes Enviados
          </span>
          <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 block mt-1">
            {totalMessages}
          </span>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-500" />
            Clientes Contactados
          </span>
          <span className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 block mt-1">
            {uniqueCustomers}
          </span>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            Avisos de Órdenes OT
          </span>
          <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 block mt-1">
            {orderRelated}
          </span>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <CheckCheck className="w-3.5 h-3.5 text-purple-500" />
            Trazabilidad de Taller
          </span>
          <span className="text-sm font-bold text-purple-600 dark:text-purple-400 block mt-2 flex items-center gap-1">
            <Sparkles className="w-4 h-4" /> 100% Auditado
          </span>
        </Card>
      </div>

      {/* Catálogo Visual de Plantillas Oficiales */}
      <Card className="p-4 border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Plantillas Oficiales Disponibles ({WHATSAPP_TEMPLATES.length})
          </h2>
          <span className="text-[11px] text-slate-500 font-mono">
            Variables automáticas: {'{CLIENTE}'}, {'{BICICLETA}'}, {'{ORDEN}'}, {'{TOTAL}'}, {'{SALDO}'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {WHATSAPP_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                    {tmpl.title}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                    {tmpl.trigger}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                  {tmpl.description}
                </p>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedTriggerForCompose(tmpl.trigger);
                  setSelectedCustomerForCompose(customers[0] || null);
                  setComposeModalOpen(true);
                }}
                className="w-full text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 mt-1"
                leftIcon={<Send className="w-3 h-3" />}
              >
                Probar Plantilla
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Barra de Filtros y Búsqueda */}
      <Card className="p-4 border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en bitácora por cliente, teléfono, orden OT o contenido..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filterTrigger}
              onChange={(e) => setFilterTrigger(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto"
            >
              <option value="ALL">Todos los disparadores</option>
              <option value="RECIBIDA">RECIBIDA</option>
              <option value="PRESUPUESTO">PRESUPUESTO</option>
              <option value="ESPERANDO_REPUESTO">ESPERANDO REPUESTO</option>
              <option value="LISTA">LISTA</option>
              <option value="ENTREGADA">ENTREGADA</option>
              <option value="CITA_PROGRAMADA">CITA PROGRAMADA</option>
              <option value="HISTORIAL_QR">HISTORIAL QR</option>
              <option value="MANUAL">MANUAL</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tabla de Bitácora de Mensajes */}
      <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
        {isLoading ? (
          <div className="p-12 text-center">
            <LoadingSpinner size="lg" text="Cargando bitácora de mensajes de WhatsApp..." />
          </div>
        ) : filteredMessages.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="w-5 h-5" />}
            title="No se encontraron mensajes"
            description={
              searchTerm || filterTrigger !== 'ALL'
                ? 'No hay registros de WhatsApp que coincidan con los filtros seleccionados.'
                : 'Aún no se han enviado mensajes de WhatsApp desde el taller. ¡Envía el primero!'
            }
            actionText="Redactar Mensaje"
            onAction={handleNewMessage}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Fecha y Hora</TableHead>
                  <TableHead>Cliente y Teléfono</TableHead>
                  <TableHead>Tipo / Disparador</TableHead>
                  <TableHead>Orden OT</TableHead>
                  <TableHead className="min-w-[280px]">Mensaje Enviado</TableHead>
                  <TableHead className="text-right w-28">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((msg) => {
                  const dateStr = new Date(msg.created_at).toLocaleString('es-CO', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <TableRow key={msg.id}>
                      {/* Fecha */}
                      <TableCell>
                        <div className="text-xs font-mono text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{dateStr}</span>
                        </div>
                      </TableCell>

                      {/* Cliente */}
                      <TableCell>
                        <div className="space-y-0.5 text-xs">
                          <strong className="text-slate-900 dark:text-white block">
                            {msg.customer?.full_name || 'Cliente sin registrar'}
                          </strong>
                          <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            +{msg.phone_number}
                          </span>
                        </div>
                      </TableCell>

                      {/* Disparador */}
                      <TableCell>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                          {msg.status_trigger}
                        </span>
                      </TableCell>

                      {/* Orden OT */}
                      <TableCell>
                        {msg.work_order ? (
                          <div className="text-xs">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block">
                              {msg.work_order.order_number}
                            </span>
                            <span className="text-[10px] text-slate-400 capitalize">
                              {msg.work_order.status}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>

                      {/* Contenido del Mensaje */}
                      <TableCell>
                        <div className="p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-[11px] text-slate-800 dark:text-slate-200 leading-relaxed font-sans max-h-24 overflow-y-auto whitespace-pre-wrap">
                          {msg.message_content}
                        </div>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyText(msg.message_content, msg.id)}
                            title="Copiar texto al portapapeles"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResend(msg)}
                            title="Reenviar o editar mensaje"
                            leftIcon={<Send className="w-3 h-3 text-emerald-600" />}
                          >
                            Reenviar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Modal de Envío de WhatsApp */}
      <WhatsAppComposeModal
        isOpen={composeModalOpen}
        onClose={() => setComposeModalOpen(false)}
        customer={selectedCustomerForCompose}
        workOrder={selectedOrderForCompose}
        bicycle={selectedOrderForCompose?.bicycle || null}
        defaultTrigger={selectedTriggerForCompose}
        onSent={(loggedMsg) => {
          setMessages((prev) => [loggedMsg, ...prev]);
          setAlertMessage({
            type: 'success',
            text: `Mensaje de WhatsApp registrado con éxito para ${loggedMsg.customer?.full_name || loggedMsg.phone_number}.`,
          });
        }}
      />
    </div>
  );
};
