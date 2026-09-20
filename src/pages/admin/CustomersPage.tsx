import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageCircle,
  FileText,
  Bike,
  Edit2,
  Trash2,
  Eye,
} from 'lucide-react';
import { customerService } from '../../services/customerService';
import { bicycleService } from '../../services/bicycleService';
import { workOrderService } from '../../services/workOrderService';
import { Customer, CustomerInsert, Bicycle, WorkOrder } from '../../types/database';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Modal,
  ConfirmModal,
  LoadingSpinner,
  EmptyState,
  Alert,
} from '../../components/ui';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estados de modales
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [customerBikes, setCustomerBikes] = useState<Bicycle[]>([]);
  const [customerOrders, setCustomerOrders] = useState<WorkOrder[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Estado para eliminación
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Formulario
  const [formData, setFormData] = useState<CustomerInsert>({
    full_name: '',
    phone: '',
    whatsapp: '',
    email: '',
    document_id: '',
    address: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async (search?: string) => {
    setIsLoading(true);
    try {
      const data = await customerService.getCustomers(search);
      setCustomers(data);
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      setAlertMessage({ type: 'error', text: 'No se pudieron cargar los clientes.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    loadCustomers(val);
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      full_name: '',
      phone: '',
      whatsapp: '',
      email: '',
      document_id: '',
      address: '',
      notes: '',
    });
    setFormErrors({});
    setFormModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      full_name: customer.full_name,
      phone: customer.phone,
      whatsapp: customer.whatsapp || '',
      email: customer.email || '',
      document_id: customer.document_id || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setFormErrors({});
    setFormModalOpen(true);
  };

  const openDetailModal = async (customer: Customer) => {
    setDetailCustomer(customer);
    setIsLoadingDetails(true);
    try {
      const [bikes, orders] = await Promise.all([
        bicycleService.getBicycles(customer.id),
        workOrderService.getWorkOrders(),
      ]);
      setCustomerBikes(bikes.filter((b) => b.customer_id === customer.id));
      setCustomerOrders(orders.filter((o) => o.customer_id === customer.id));
    } catch (err) {
      console.error('Error al cargar detalles del cliente:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    if (!formData.full_name.trim()) {
      errors.full_name = 'El nombre completo es obligatorio.';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'El teléfono es obligatorio.';
    } else if (formData.phone.trim().length < 7) {
      errors.phone = 'Ingresa un número telefónico válido.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      if (editingCustomer) {
        await customerService.updateCustomer(editingCustomer.id, formData);
        setAlertMessage({ type: 'success', text: `Cliente "${formData.full_name}" actualizado exitosamente.` });
      } else {
        await customerService.createCustomer(formData);
        setAlertMessage({ type: 'success', text: `Cliente "${formData.full_name}" registrado exitosamente.` });
      }
      setFormModalOpen(false);
      loadCustomers(searchTerm);
    } catch (err) {
      console.error('Error al guardar cliente:', err);
      setAlertMessage({ type: 'error', text: 'Ocurrió un error al guardar el cliente.' });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteModalOpen(true);
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    try {
      await customerService.deleteCustomer(customerToDelete.id);
      setAlertMessage({ type: 'success', text: `Cliente "${customerToDelete.full_name}" eliminado.` });
      setDeleteModalOpen(false);
      setCustomerToDelete(null);
      loadCustomers(searchTerm);
    } catch (err) {
      console.error('Error al eliminar cliente:', err);
      setAlertMessage({ type: 'error', text: 'No se pudo eliminar el cliente.' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Directorio de Clientes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Administra los clientes del taller, sus bicicletas registradas y el historial de órdenes de trabajo.
          </p>
        </div>

        <Button size="sm" onClick={openCreateModal} leftIcon={<Plus className="w-3.5 h-3.5" />}>
          Nuevo Cliente
        </Button>
      </div>

      {/* Alerta de feedback */}
      {alertMessage && (
        <Alert
          variant={alertMessage.type === 'success' ? 'success' : 'error'}
          title={alertMessage.type === 'success' ? 'Operación Exitosa' : 'Atención'}
          onDismiss={() => setAlertMessage(null)}
        >
          {alertMessage.text}
        </Alert>
      )}

      {/* Barra de Búsqueda y Filtros */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Buscar por nombre, teléfono o documento..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
          Total: <span className="font-bold text-slate-900 dark:text-white">{customers.length}</span> clientes
        </div>
      </div>

      {/* Listado de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Listado General de Clientes</CardTitle>
        </CardHeader>
        {isLoading ? (
          <div className="p-8">
            <LoadingSpinner size="md" text="Cargando directorio de clientes..." />
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Users className="w-6 h-6" />}
              title={searchTerm ? 'No se encontraron clientes' : 'Aún no hay clientes registrados'}
              description={
                searchTerm
                  ? `No existen coincidencias para "${searchTerm}". Intenta con otro término o número.`
                  : 'Registra el primer cliente para comenzar a ingresar bicicletas y generar órdenes de trabajo.'
              }
              actionText={searchTerm ? 'Limpiar Búsqueda' : 'Registrar Cliente'}
              onAction={searchTerm ? () => { setSearchTerm(''); loadCustomers(); } : openCreateModal}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contacto / WhatsApp</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Registrado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => {
                const initials = customer.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                const whatsappNumber = customer.whatsapp || customer.phone;
                const cleanWhatsApp = whatsappNumber.replace(/\D/g, '');
                const waFormatted = cleanWhatsApp.startsWith('57') ? cleanWhatsApp : `57${cleanWhatsApp}`;

                return (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                          {initials}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                            {customer.full_name}
                          </span>
                          {customer.email && (
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {customer.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="flex items-center gap-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {customer.phone}
                        </span>
                        {whatsappNumber && (
                          <a
                            href={`https://wa.me/${waFormatted}?text=Hola%20${encodeURIComponent(customer.full_name)},%20te%20escribimos%20de%20A2Ruedas%20Taller`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-500" />
                            <span>Abrir WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </TableCell>

                    <TableCell isMono>
                      {customer.document_id ? customer.document_id : <span className="text-slate-400">—</span>}
                    </TableCell>

                    <TableCell className="max-w-xs truncate">
                      {customer.address ? customer.address : <span className="text-slate-400">—</span>}
                    </TableCell>

                    <TableCell isMono className="text-[11px] text-slate-500">
                      {new Date(customer.created_at).toLocaleDateString('es-CO')}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDetailModal(customer)}
                          title="Ver perfil e historial"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(customer)}
                          title="Editar datos"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="hover:text-red-600 dark:hover:text-red-400"
                          onClick={() => confirmDelete(customer)}
                          title="Eliminar cliente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Modal de Creación / Edición de Cliente */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingCustomer ? 'Editar Datos del Cliente' : 'Registrar Nuevo Cliente'}
        description="Ingresa la información personal y de contacto para asociarlo a bicicletas y órdenes."
        maxWidth="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setFormModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSaveCustomer} isLoading={isSaving}>
              {editingCustomer ? 'Guardar Cambios' : 'Registrar Cliente'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          <Input
            label="Nombre Completo *"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="Ej. Juan Pérez"
            error={formErrors.full_name}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Teléfono Principal *"
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                const phone = e.target.value;
                setFormData({
                  ...formData,
                  phone,
                  whatsapp: formData.whatsapp ? formData.whatsapp : phone,
                });
              }}
              placeholder="3101234567"
              error={formErrors.phone}
              isMono
              leftIcon={<Phone className="w-3.5 h-3.5" />}
              required
            />

            <Input
              label="WhatsApp (para notificaciones)"
              type="tel"
              value={formData.whatsapp || ''}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              placeholder="3101234567"
              isMono
              leftIcon={<MessageCircle className="w-3.5 h-3.5 text-emerald-500" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Documento de Identidad (Cédula)"
              value={formData.document_id || ''}
              onChange={(e) => setFormData({ ...formData, document_id: e.target.value })}
              placeholder="1020304050"
              isMono
            />

            <Input
              label="Correo Electrónico (opcional)"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="cliente@email.com"
            />
          </div>

          <Input
            label="Dirección de Residencia"
            value={formData.address || ''}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Cra 10 #20-30"
          />

          <div className="space-y-1 text-left">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Notas u Observaciones del Cliente
            </label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Preferencias del cliente, historial de uso, recomendaciones..."
              className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </form>
      </Modal>

      {/* Modal de Detalle e Historial del Cliente */}
      {detailCustomer && (
        <Modal
          isOpen={Boolean(detailCustomer)}
          onClose={() => setDetailCustomer(null)}
          title={`Ficha de Cliente: ${detailCustomer.full_name}`}
          maxWidth="lg"
          footer={
            <Button size="sm" variant="secondary" onClick={() => setDetailCustomer(null)}>
              Cerrar Ficha
            </Button>
          }
        >
          <div className="space-y-6">
            {/* Datos de Contacto Rápidos */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">TELÉFONO</span>
                <span className="font-mono font-semibold">{detailCustomer.phone}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">WHATSAPP</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {detailCustomer.whatsapp || detailCustomer.phone}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">DOCUMENTO</span>
                <span className="font-mono font-semibold">
                  {detailCustomer.document_id || 'Sin registrar'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">ALTA EN SISTEMA</span>
                <span className="font-mono">
                  {new Date(detailCustomer.created_at).toLocaleDateString('es-CO')}
                </span>
              </div>
            </div>

            {/* Bicicletas Asociadas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5 text-blue-600" />
                  Bicicletas Vinculadas ({customerBikes.length})
                </h3>
              </div>

              {isLoadingDetails ? (
                <LoadingSpinner size="sm" text="Consultando bicicletas..." />
              ) : customerBikes.length === 0 ? (
                <div className="p-4 rounded-md border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                  Este cliente aún no tiene bicicletas registradas en el taller.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {customerBikes.map((bike) => (
                    <div
                      key={bike.id}
                      className="p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {bike.brand} {bike.model}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-50 dark:bg-blue-950 text-blue-600">
                          {bike.bike_type}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Color: {bike.color} {bike.serial_number && `• Serial: ${bike.serial_number}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Órdenes de Trabajo del Cliente */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Historial de Órdenes de Trabajo ({customerOrders.length})
              </h3>

              {customerOrders.length === 0 ? (
                <div className="p-4 rounded-md border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                  No hay órdenes de trabajo registradas para este cliente.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {customerOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-2.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block">
                          {order.order_number}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {order.reported_issues}
                        </span>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge status={order.status} withDot isMono />
                        <span className="font-mono font-bold block text-slate-900 dark:text-white">
                          ${order.grand_total.toLocaleString('es-CO')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Confirmación para Eliminar Cliente (Regla 44) */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteCustomer}
        title="¿Deseas eliminar este cliente?"
        message={`Estás a punto de eliminar a "${customerToDelete?.full_name}". Esta acción es irreversible y desvinculará sus registros del directorio de clientes.`}
        confirmText="Eliminar Cliente"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
