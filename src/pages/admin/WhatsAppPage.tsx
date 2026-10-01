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
  Edit2,
} from 'lucide-react';
import { WhatsAppMessage, Customer, WorkOrder, WhatsAppTemplate } from '../../types/database';
import { whatsappService } from '../../services/whatsappService';
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
  Modal,
} from '../../components/ui';
import { WhatsAppComposeModal } from '../../components/whatsapp/WhatsAppComposeModal';

export const WhatsAppPage: React.FC = () => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Plantillas oficiales y edición
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(() => whatsappService.getTemplates());
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [editFormData, setEditFormData] = useState<{
    title: string;
    description: string;
    template: string;
  } | null>(null);

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

  const handleOpenEditTemplate = (tmpl: WhatsAppTemplate) => {
    setEditingTemplate(tmpl);
    setEditFormData({
      title: tmpl.title,
      description: tmpl.description,
      template: tmpl.template,
    });
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate || !editFormData) return;
    const updated: WhatsAppTemplate = {
      ...editingTemplate,
      title: editFormData.title.trim(),
      description: editFormData.description.trim(),
      template: editFormData.template.trim(),
    };
    whatsappService.saveTemplate(updated);
    setTemplates(whatsappService.getTemplates());
    setEditingTemplate(null);
    setEditFormData(null);
    setAlertMessage({
      type: 'success',
      text: `Plantilla "${updated.title}" actualizada y guardada permanentemente.`,
    });
  };

  const handleResetTemplates = () => {
    const defaults = whatsappService.resetTemplates();
    setTemplates(defaults);
    setAlertMessage({
      type: 'success',
      text: 'Plantillas oficiales restablecidas a los valores de fábrica.',
    });
  };

  const insertVariableIntoTemplate = (variable: string) => {
    if (!editFormData) return;
    setEditFormData({
      ...editFormData,
      template: `${editFormData.template} ${variable}`,
    });
  };

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
      <Card className="p-4 border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Plantillas Oficiales del Taller ({templates.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Plantillas oficiales de comunicación para recepción física y entrega de bicicletas. Puedes editarlas libremente y los cambios quedarán guardados permanentemente.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetTemplates}
              className="text-xs"
              leftIcon={<RotateCcw className="w-3 h-3 text-slate-400" />}
              title="Restablecer textos por defecto"
            >
              Restablecer Valores
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {tmpl.title}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 shrink-0">
                    {tmpl.trigger}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5">
                  {tmpl.description}
                </p>

                {/* Vista previa del mensaje */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 text-xs font-mono whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed max-h-36 overflow-y-auto">
                  {tmpl.template}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenEditTemplate(tmpl)}
                  className="flex-1 text-xs"
                  leftIcon={<Edit2 className="w-3.5 h-3.5 text-blue-600" />}
                >
                  Editar Plantilla
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setSelectedTriggerForCompose(tmpl.trigger);
                    setSelectedCustomerForCompose(customers[0] || null);
                    setComposeModalOpen(true);
                  }}
                  className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Enviar WhatsApp
                </Button>
              </div>
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

      {/* Modal para Editar Plantilla Permanentemente */}
      {editingTemplate && editFormData && (
        <Modal
          isOpen={Boolean(editingTemplate)}
          onClose={() => {
            setEditingTemplate(null);
            setEditFormData(null);
          }}
          title={`Editar Plantilla: ${editingTemplate.title}`}
          description="Los cambios se guardan permanentemente en la aplicación y se aplicarán en todos los envíos futuros."
          maxWidth="md"
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingTemplate(null);
                  setEditFormData(null);
                }}
              >
                Cancelar
              </Button>
              <Button size="sm" variant="primary" onClick={handleSaveTemplate}>
                Guardar Cambios
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveTemplate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre de la Plantilla *
              </label>
              <input
                type="text"
                required
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2.5 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Descripción / Uso *
              </label>
              <input
                type="text"
                required
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2.5 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Texto del Mensaje de WhatsApp *
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  Haz clic en las variables para insertarlas
                </span>
              </div>

              {/* Botones de variables dinámicas */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {editingTemplate.variables.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVariableIntoTemplate(v)}
                    className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                  >
                    + {v}
                  </button>
                ))}
              </div>

              <textarea
                rows={6}
                required
                value={editFormData.template}
                onChange={(e) => setEditFormData({ ...editFormData, template: e.target.value })}
                className="w-full text-xs font-mono rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-2.5 focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                placeholder="Escribe el texto de la plantilla..."
              />
            </div>
          </form>
        </Modal>
      )}

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
