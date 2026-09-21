import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Clock,
  Share2,
  Eye,
  RotateCcw,
  Coins,
  Smartphone,
  CreditCard,
} from 'lucide-react';
import { Invoice } from '../../types/database';
import { invoiceService } from '../../services/invoiceService';
import { whatsappService } from '../../services/whatsappService';
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
import { InvoiceDetailModal } from '../../components/invoices/InvoiceDetailModal';
import { CreateInvoiceModal } from '../../components/invoices/CreateInvoiceModal';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterMethod, setFilterMethod] = useState<string>('ALL');

  // Modales
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
  } | null>(null);

  // Estadísticas
  const [stats, setStats] = useState({
    totalInvoiced: 0,
    invoicesCount: 0,
    averageTicket: 0,
    pendingCount: 0,
    pendingAmount: 0,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [list, kpis] = await Promise.all([
        invoiceService.getInvoices(),
        invoiceService.getInvoiceStats(),
      ]);
      setInvoices(list);
      setStats(kpis);
    } catch (err) {
      console.error('Error al cargar facturas:', err);
      setAlertMessage({ type: 'error', text: 'Error al conectar con el servidor de facturación.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDetail = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailModalOpen(true);
  };

  // Compartir rápidamente por WhatsApp
  const handleQuickWhatsApp = (invoice: Invoice) => {
    const phone = invoice.customer?.phone || '';
    const cleanPhone = whatsappService.formatWhatsAppPhone(phone);
    if (!cleanPhone) {
      setAlertMessage({
        type: 'warning',
        text: `El cliente ${invoice.customer?.full_name || ''} no tiene un número celular registrado.`,
      });
      return;
    }

    const itemsSummary = (invoice.items || [])
      .map((it) => `• ${it.description} x${it.quantity}: $${it.total_price.toLocaleString('es-CO')}`)
      .join('\n');

    const message = `¡Hola ${invoice.customer?.full_name || 'Cliente'}! 👋 Te compartimos tu comprobante de factura de A2Ruedas Taller:\n\n📄 *Factura N°:* ${invoice.invoice_number}${
      invoice.work_order_id ? `\n🚲 *Orden OT:* ${invoice.work_order_id}` : ''
    }\n\n*Detalle de Servicios & Repuestos:*\n${itemsSummary}\n\n💰 *Total Cancelado:* $${invoice.total.toLocaleString(
      'es-CO'
    )} COP\n💳 *Medio de Pago:* ${invoice.payment_method}\n\n¡Gracias por rodar con A2Ruedas Taller! 🚲🔧`;

    const deepLink = whatsappService.buildWhatsAppDeepLink(cleanPhone, message);
    window.open(deepLink, '_blank');
  };

  // Filtrado reactivo de facturas
  const filteredInvoices = invoices.filter((inv) => {
    if (filterStatus !== 'ALL' && inv.payment_status !== filterStatus) return false;
    if (filterMethod !== 'ALL' && inv.payment_method !== filterMethod) return false;
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase().trim();
    const matchNum = inv.invoice_number.toLowerCase().includes(term);
    const matchCust = inv.customer?.full_name.toLowerCase().includes(term) || false;
    const matchDoc = inv.customer?.document_id?.toLowerCase().includes(term) || false;
    const matchOT = inv.work_order_id?.toLowerCase().includes(term) || false;
    const matchNotes = inv.notes?.toLowerCase().includes(term) || false;

    return matchNum || matchCust || matchDoc || matchOT || matchNotes;
  });

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
            <Receipt className="w-7 h-7 text-blue-600" />
            Facturación y Recibos Comerciales
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Comprobantes internos correlativos (FAC-000001), detalle de cobros, tirillas térmicas e integración de caja.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={loadData} leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
            Actualizar
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-700 text-white border-none shadow-xs"
          >
            Nueva Factura
          </Button>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-blue-600" />
            Total Facturado
          </span>
          <span className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400 block mt-1">
            ${stats.totalInvoiced.toLocaleString('es-CO')}
          </span>
          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Recaudado en caja</span>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
            Facturas Emitidas
          </span>
          <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 block mt-1">
            {stats.invoicesCount}
          </span>
          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Comprobantes pagados</span>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
            Ticket Promedio
          </span>
          <span className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400 block mt-1">
            ${stats.averageTicket.toLocaleString('es-CO')}
          </span>
          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Por servicio / venta</span>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Pendientes de Cobro
          </span>
          <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 block mt-1">
            {stats.pendingCount}
          </span>
          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
            ${stats.pendingAmount.toLocaleString('es-CO')} por recaudar
          </span>
        </Card>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <Card className="p-3.5 border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por N° de factura (FAC-000001), cliente, documento o N° de orden..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Todos los estados</option>
              <option value="PAID">Pagadas</option>
              <option value="PENDING">Pendientes</option>
              <option value="CANCELLED">Anuladas</option>
            </select>

            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">Todos los medios</option>
              <option value="CASH">Efectivo</option>
              <option value="TRANSFER">Transferencia (Nequi)</option>
              <option value="CARD">Datáfono / Tarjeta</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tabla de Facturas */}
      <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
        {isLoading ? (
          <div className="p-16 text-center">
            <LoadingSpinner size="lg" text="Cargando facturas y recibos..." />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-5 h-5" />}
            title="No se encontraron facturas"
            description={
              searchTerm || filterStatus !== 'ALL' || filterMethod !== 'ALL'
                ? 'No hay comprobantes que coincidan con los filtros seleccionados.'
                : 'Aún no se han emitido facturas en el taller. ¡Crea la primera!'
            }
            actionText="Nueva Factura"
            onAction={() => setCreateModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Fecha</TableHead>
                  <TableHead className="w-32">N° Factura</TableHead>
                  <TableHead>Cliente Receptor</TableHead>
                  <TableHead className="w-32">Orden OT</TableHead>
                  <TableHead className="w-36">Medio de Pago</TableHead>
                  <TableHead className="w-28">Estado</TableHead>
                  <TableHead className="text-right w-32">Total (COP)</TableHead>
                  <TableHead className="text-right w-28">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((inv) => {
                  const dateStr = new Date(inv.created_at).toLocaleDateString('es-CO', {
                    day: '2-digit',
                    month: 'short',
                  });

                  return (
                    <TableRow key={inv.id}>
                      {/* Fecha */}
                      <TableCell>
                        <span className="font-mono text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {dateStr}
                        </span>
                      </TableCell>

                      {/* Consecutivo */}
                      <TableCell>
                        <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 block">
                          {inv.invoice_number}
                        </span>
                      </TableCell>

                      {/* Cliente */}
                      <TableCell>
                        <div className="space-y-0.5 text-xs">
                          <strong className="text-slate-900 dark:text-white block">
                            {inv.customer?.full_name || 'Consumidor Final'}
                          </strong>
                          {inv.customer?.document_id && (
                            <span className="text-[10px] text-slate-400 font-mono block">
                              CC: {inv.customer.document_id}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Orden OT */}
                      <TableCell>
                        {inv.work_order_id ? (
                          <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/60">
                            {inv.work_order_id}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium italic">Mostrador</span>
                        )}
                      </TableCell>

                      {/* Medio de Pago */}
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 font-medium">
                          {inv.payment_method === 'CASH' ? (
                            <>
                              <Coins className="w-3 h-3 text-emerald-600" />
                              <span>Efectivo</span>
                            </>
                          ) : inv.payment_method === 'TRANSFER' ? (
                            <>
                              <Smartphone className="w-3 h-3 text-purple-600" />
                              <span>Transferencia</span>
                            </>
                          ) : inv.payment_method === 'CARD' ? (
                            <>
                              <CreditCard className="w-3 h-3 text-blue-600" />
                              <span>Datáfono</span>
                            </>
                          ) : (
                            <span>{inv.payment_method}</span>
                          )}
                        </span>
                      </TableCell>

                      {/* Estado */}
                      <TableCell>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full inline-block ${
                            inv.payment_status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : inv.payment_status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                          }`}
                        >
                          {inv.payment_status === 'PAID'
                            ? 'PAGADA'
                            : inv.payment_status === 'PENDING'
                            ? 'PENDIENTE'
                            : 'ANULADA'}
                        </span>
                      </TableCell>

                      {/* Total */}
                      <TableCell isMono className="font-bold text-xs text-slate-900 dark:text-white text-right">
                        ${inv.total.toLocaleString('es-CO')}
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenDetail(inv)}
                            title="Ver e imprimir tirilla o carta"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleQuickWhatsApp(inv)}
                            className="text-emerald-600 hover:text-emerald-700"
                            title="Compartir por WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
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

      {/* Modal de Detalle / Impresión / Anulación */}
      <InvoiceDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        invoice={selectedInvoice}
        onInvoiceCancelled={(updated) => {
          setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
          setAlertMessage({
            type: 'warning',
            text: `La factura ${updated.invoice_number} ha sido anulada formalmente.`,
          });
          loadData();
        }}
      />

      {/* Modal de Creación de Factura */}
      <CreateInvoiceModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={(newInv) => {
          setInvoices((prev) => [newInv, ...prev]);
          setAlertMessage({
            type: 'success',
            text: `Factura ${newInv.invoice_number} emitida exitosamente por $${newInv.total.toLocaleString('es-CO')} COP.`,
          });
          loadData();
        }}
      />
    </div>
  );
};
