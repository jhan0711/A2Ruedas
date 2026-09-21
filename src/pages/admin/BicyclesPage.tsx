import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bike,
  Search,
  Plus,
  QrCode,
  Camera,
  Edit2,
  Trash2,
  Eye,
  MessageCircle,
  FileText,
  User,
  Hash,
  ExternalLink,
  Wrench,
  Clock,
  Gauge,
  Package,
  Printer,
  DollarSign,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { bicycleService } from '../../services/bicycleService';
import { customerService } from '../../services/customerService';
import { workOrderService } from '../../services/workOrderService';
import {
  Bicycle,
  BicycleInsert,
  Customer,
  BikeQRCode,
  BicyclePhoto,
  WorkOrder,
  BicycleFullDossier,
} from '../../types/database';
import { WorkOrderTicketModal } from '../../components/receipts/WorkOrderTicketModal';
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

const BIKE_TYPES = [
  { value: 'MTB', label: 'Montaña (MTB)' },
  { value: 'Ruta', label: 'Ruta / Carretera' },
  { value: 'Urbana', label: 'Urbana / Ciudad' },
  { value: 'Gravel', label: 'Gravel' },
  { value: 'BMX', label: 'BMX / Freestyle' },
  { value: 'Eléctrica', label: 'Eléctrica (E-Bike)' },
  { value: 'Infantil', label: 'Infantil / Niños' },
  { value: 'Otra', label: 'Otra / Especial' },
];

const PHOTO_TYPES = [
  { value: 'general', label: 'Vista General' },
  { value: 'danio', label: 'Daño o Rayón Previo' },
  { value: 'transmision', label: 'Transmisión / Cadena' },
  { value: 'frenos', label: 'Frenos / Rotores' },
  { value: 'cuadro', label: 'Cuadro / Tenedor' },
];

export const BicyclesPage: React.FC = () => {
  const navigate = useNavigate();

  const [bicycles, setBicycles] = useState<Bicycle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [qrCodes, setQrCodes] = useState<Record<string, BikeQRCode>>({});
  const [photosMap, setPhotosMap] = useState<Record<string, BicyclePhoto[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estados de modales
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingBike, setEditingBike] = useState<Bicycle | null>(null);
  const [detailBike, setDetailBike] = useState<Bicycle | null>(null);
  const [detailQRCode, setDetailQRCode] = useState<BikeQRCode | null>(null);
  const [detailPhotos, setDetailPhotos] = useState<BicyclePhoto[]>([]);
  const [detailOrders, setDetailOrders] = useState<WorkOrder[]>([]);
  const [selectedPhotoFilter, setSelectedPhotoFilter] = useState('ALL');

  // Dossier técnico administrativo
  const [dossierData, setDossierData] = useState<BicycleFullDossier | null>(null);
  const [isDossierLoading, setIsDossierLoading] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'timeline' | 'specs' | 'photos' | 'parts'>('timeline');
  const [orderToPrint, setOrderToPrint] = useState<WorkOrder | null>(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);

  // Subida de nueva foto dentro de la ficha
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoType, setNewPhotoType] = useState<'general' | 'danio' | 'transmision' | 'frenos' | 'cuadro'>('general');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);

  // Eliminación
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bikeToDelete, setBikeToDelete] = useState<Bicycle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Formulario de Bicicleta
  const [formData, setFormData] = useState<BicycleInsert>({
    customer_id: '',
    brand: '',
    model: '',
    bike_type: 'MTB',
    color: '',
    frame_size: '',
    wheel_size: '29"',
    serial_number: '',
    year: new Date().getFullYear(),
    key_components: '',
    observations: '',
  });
  const [initialPhotoUrl, setInitialPhotoUrl] = useState('');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bikesData, customersData] = await Promise.all([
        bicycleService.getBicycles(),
        customerService.getCustomers(),
      ]);
      setBicycles(bikesData);
      setCustomers(customersData);

      // Cargar QRs y conteo de fotos para cada bicicleta
      const qrs: Record<string, BikeQRCode> = {};
      const photos: Record<string, BicyclePhoto[]> = {};

      await Promise.all(
        bikesData.map(async (bike) => {
          const [qr, bikePhotos] = await Promise.all([
            bicycleService.getOrGenerateQRCode(bike.id),
            bicycleService.getBicyclePhotos(bike.id),
          ]);
          qrs[bike.id] = qr;
          photos[bike.id] = bikePhotos;
        })
      );

      setQrCodes(qrs);
      setPhotosMap(photos);
    } catch (err) {
      console.error('Error al cargar bicicletas:', err);
      setAlertMessage({ type: 'error', text: 'No se pudieron cargar los datos de bicicletas.' });
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingBike(null);
    setFormData({
      customer_id: customers.length > 0 ? customers[0].id : '',
      brand: '',
      model: '',
      bike_type: 'MTB',
      color: '',
      frame_size: '',
      wheel_size: '29"',
      serial_number: '',
      year: new Date().getFullYear(),
      key_components: '',
      observations: '',
    });
    setInitialPhotoUrl('');
    setFormErrors({});
    setFormModalOpen(true);
  };

  const openEditModal = (bike: Bicycle) => {
    setEditingBike(bike);
    setFormData({
      customer_id: bike.customer_id,
      brand: bike.brand,
      model: bike.model,
      bike_type: bike.bike_type,
      color: bike.color,
      frame_size: bike.frame_size || '',
      wheel_size: bike.wheel_size || '29"',
      serial_number: bike.serial_number || '',
      year: bike.year || new Date().getFullYear(),
      key_components: bike.key_components || '',
      observations: bike.observations || '',
    });
    setInitialPhotoUrl('');
    setFormErrors({});
    setFormModalOpen(true);
  };

  const openDetailModal = async (bike: Bicycle) => {
    setDetailBike(bike);
    setSelectedPhotoFilter('ALL');
    setNewPhotoUrl('');
    setNewPhotoCaption('');
    setActiveDetailTab('timeline');
    setIsDossierLoading(true);

    try {
      const [dossier, qr, photos, allOrders] = await Promise.all([
        bicycleService.getBicycleFullDossier(bike.id),
        bicycleService.getOrGenerateQRCode(bike.id),
        bicycleService.getBicyclePhotos(bike.id),
        workOrderService.getWorkOrders(),
      ]);
      setDossierData(dossier);
      setDetailQRCode(qr);
      setDetailPhotos(photos);
      setDetailOrders(allOrders.filter((o) => o.bicycle_id === bike.id));
    } catch (err) {
      console.error('Error al cargar detalle de bicicleta:', err);
    } finally {
      setIsDossierLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    if (!formData.customer_id) {
      errors.customer_id = 'Debes seleccionar el cliente propietario.';
    }
    if (!formData.brand.trim()) {
      errors.brand = 'La marca es obligatoria.';
    }
    if (!formData.model.trim()) {
      errors.model = 'El modelo es obligatorio.';
    }
    if (!formData.color.trim()) {
      errors.color = 'El color de la bicicleta es obligatorio.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveBicycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      if (editingBike) {
        await bicycleService.updateBicycle(editingBike.id, formData);
        setAlertMessage({
          type: 'success',
          text: `Bicicleta ${formData.brand} ${formData.model} actualizada con éxito.`,
        });
      } else {
        const created = await bicycleService.createBicycle(formData);

        // Si se agregó una fotografía inicial de ingreso
        if (initialPhotoUrl.trim()) {
          await bicycleService.addBicyclePhoto({
            bicycle_id: created.id,
            photo_url: initialPhotoUrl.trim(),
            photo_type: 'general',
            caption: 'Fotografía inicial de registro en el taller',
          });
        }

        setAlertMessage({
          type: 'success',
          text: `Bicicleta ${formData.brand} ${formData.model} registrada con código QR asignado.`,
        });
      }

      setFormModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error al guardar bicicleta:', err);
      setAlertMessage({ type: 'error', text: 'Ocurrió un error al guardar la bicicleta.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPhotoInDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailBike || !newPhotoUrl.trim()) return;

    setIsAddingPhoto(true);
    try {
      const added = await bicycleService.addBicyclePhoto({
        bicycle_id: detailBike.id,
        photo_url: newPhotoUrl.trim(),
        photo_type: newPhotoType,
        caption: newPhotoCaption.trim() || undefined,
      });

      const updated = [added, ...detailPhotos];
      setDetailPhotos(updated);
      setDossierData((prev) => (prev ? { ...prev, photos: updated } : null));
      setPhotosMap((prev) => ({ ...prev, [detailBike.id]: updated }));
      setNewPhotoUrl('');
      setNewPhotoCaption('');
      setAlertMessage({ type: 'success', text: 'Fotografía de inspección agregada exitosamente.' });
    } catch (err) {
      console.error('Error al agregar foto:', err);
      setAlertMessage({ type: 'error', text: 'No se pudo guardar la fotografía.' });
    } finally {
      setIsAddingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!detailBike) return;
    try {
      await bicycleService.deleteBicyclePhoto(photoId);
      const filtered = detailPhotos.filter((p) => p.id !== photoId);
      setDetailPhotos(filtered);
      setDossierData((prev) => (prev ? { ...prev, photos: filtered } : null));
      setPhotosMap((prev) => ({ ...prev, [detailBike.id]: filtered }));
    } catch (err) {
      console.error('Error al eliminar fotografía:', err);
    }
  };

  const confirmDelete = (bike: Bicycle) => {
    setBikeToDelete(bike);
    setDeleteModalOpen(true);
  };

  const handleDeleteBicycle = async () => {
    if (!bikeToDelete) return;
    setIsDeleting(true);
    try {
      await bicycleService.deleteBicycle(bikeToDelete.id);
      setAlertMessage({
        type: 'success',
        text: `Bicicleta ${bikeToDelete.brand} ${bikeToDelete.model} eliminada.`,
      });
      setDeleteModalOpen(false);
      setBikeToDelete(null);
      loadData();
    } catch (err) {
      console.error('Error al eliminar bicicleta:', err);
      setAlertMessage({ type: 'error', text: 'No se pudo eliminar la bicicleta.' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrado reactivo multicriterio
  const filteredBicycles = bicycles.filter((b) => {
    const matchesSearch =
      b.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.serial_number && b.serial_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.color && b.color.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.customer?.full_name && b.customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'ALL' || b.bike_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Bike className="w-5 h-5 text-blue-600" />
            Fichas Técnicas de Bicicletas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Registro de bicicletas, seriales de marco, códigos QR, fotos de estado previo y clientes propietarios.
          </p>
        </div>

        <Button size="sm" onClick={openCreateModal} leftIcon={<Plus className="w-3.5 h-3.5" />}>
          Nueva Bicicleta
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por marca, modelo, serial, color o cliente propietario..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">Todos los tipos</option>
            {BIKE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 self-center">
          Total: <span className="font-bold text-slate-900 dark:text-white">{filteredBicycles.length}</span> bicicletas
        </div>
      </div>

      {/* Tabla de Bicicletas */}
      <Card>
        <CardHeader>
          <CardTitle>Directorio de Bicicletas Registradas</CardTitle>
        </CardHeader>
        {isLoading ? (
          <div className="p-8">
            <LoadingSpinner size="md" text="Cargando fichas de bicicletas..." />
          </div>
        ) : filteredBicycles.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Bike className="w-6 h-6" />}
              title={searchTerm || filterType !== 'ALL' ? 'No se encontraron bicicletas' : 'Aún no hay bicicletas registradas'}
              description={
                searchTerm || filterType !== 'ALL'
                  ? 'No hay bicicletas que coincidan con los filtros seleccionados.'
                  : 'Registra la primera bicicleta para emitir su código QR e iniciar órdenes de trabajo.'
              }
              actionText={searchTerm || filterType !== 'ALL' ? 'Restablecer Filtros' : 'Registrar Bicicleta'}
              onAction={
                searchTerm || filterType !== 'ALL'
                  ? () => {
                      setSearchTerm('');
                      setFilterType('ALL');
                    }
                  : openCreateModal
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bicicleta / Tipo</TableHead>
                <TableHead>Serial & Talla</TableHead>
                <TableHead>Propietario</TableHead>
                <TableHead>Código QR</TableHead>
                <TableHead>Fotos Inspección</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBicycles.map((bike) => {
                const qr = qrCodes[bike.id];
                const photos = photosMap[bike.id] || [];
                const customer = bike.customer;

                return (
                  <TableRow key={bike.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
                          <Bike className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {bike.brand} {bike.model}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {bike.bike_type}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block">
                            Color: <span className="font-medium text-slate-700 dark:text-slate-300">{bike.color}</span>
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs text-slate-800 dark:text-slate-200 block">
                          {bike.serial_number ? (
                            <span className="flex items-center gap-1">
                              <Hash className="w-3 h-3 text-slate-400" />
                              {bike.serial_number}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Sin serial grabado</span>
                          )}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          Talla: {bike.frame_size || 'N/A'} • Rin: {bike.wheel_size || 'N/A'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {customer ? (
                        <div className="space-y-0.5">
                          <span className="font-medium text-slate-900 dark:text-slate-100 text-xs block">
                            {customer.full_name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                            {customer.phone}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {qr ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60">
                          <QrCode className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          {qr.qr_code}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Generando...</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <button
                        onClick={() => openDetailModal(bike)}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        <Camera className="w-3 h-3 text-blue-500" />
                        <span>{photos.length} {photos.length === 1 ? 'foto' : 'fotos'}</span>
                      </button>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDetailModal(bike)}
                          title="Ver ficha técnica completa y fotos"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(bike)}
                          title="Editar bicicleta"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="hover:text-red-600 dark:hover:text-red-400"
                          onClick={() => confirmDelete(bike)}
                          title="Eliminar bicicleta"
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

      {/* Modal de Registro / Edición de Bicicleta */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingBike ? 'Editar Ficha de Bicicleta' : 'Registrar Nueva Bicicleta'}
        description="Ingresa los datos técnicos y asocia la bicicleta a su cliente propietario."
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setFormModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSaveBicycle} isLoading={isSaving}>
              {editingBike ? 'Guardar Cambios' : 'Registrar Bicicleta'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveBicycle} className="space-y-4">
          {/* Propietario */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Cliente Propietario *
            </label>
            <select
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            >
              <option value="">Selecciona un cliente...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} — Tel: {c.phone} {c.document_id ? `(Cédula: ${c.document_id})` : ''}
                </option>
              ))}
            </select>
            {formErrors.customer_id && (
              <span className="text-[11px] text-red-600 block mt-1">{formErrors.customer_id}</span>
            )}
          </div>

          {/* Marca, Modelo y Tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Marca *"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Ej. Trek, Specialized, GW..."
              error={formErrors.brand}
              required
            />

            <Input
              label="Modelo *"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="Ej. Marlin 7, Allez, Aspect..."
              error={formErrors.model}
              required
            />

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Bicicleta *
              </label>
              <select
                value={formData.bike_type}
                onChange={(e) => setFormData({ ...formData, bike_type: e.target.value })}
                className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {BIKE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Color, Talla de Marco, Tamaño Rin y Año */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input
              label="Color Principal *"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="Rojo Viper / Negro"
              error={formErrors.color}
              required
            />

            <Input
              label="Talla Marco"
              value={formData.frame_size || ''}
              onChange={(e) => setFormData({ ...formData, frame_size: e.target.value })}
              placeholder="S, M, L, 54 cm..."
            />

            <Input
              label="Tamaño Rin/Rueda"
              value={formData.wheel_size || ''}
              onChange={(e) => setFormData({ ...formData, wheel_size: e.target.value })}
              placeholder="29'', 700c, 27.5''..."
            />

            <Input
              label="Año Modelo"
              type="number"
              value={formData.year || ''}
              onChange={(e) => setFormData({ ...formData, year: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="2024"
              isMono
            />
          </div>

          {/* Serial de Cuadro / Marco */}
          <Input
            label="Número de Serie de Marco (Serial de fábrica)"
            value={formData.serial_number || ''}
            onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
            placeholder="Ej. WTU281C0492S (ubicado bajo la caja de centro)"
            isMono
            leftIcon={<Hash className="w-3.5 h-3.5 text-slate-400" />}
          />

          {/* Componentes Clave */}
          <Input
            label="Componentes Clave / Transmisión"
            value={formData.key_components || ''}
            onChange={(e) => setFormData({ ...formData, key_components: e.target.value })}
            placeholder="Ej. Shimano Deore 1x10, Frenos MT200, Horquilla RockShox Judy..."
          />

          {/* Observaciones / Daños Previos */}
          <div className="space-y-1 text-left">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Observaciones de Ingreso / Daños Previos Registrados
            </label>
            <textarea
              rows={2}
              value={formData.observations || ''}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              placeholder="Detallar rayones, abolladuras previas o condiciones de piezas para constancia del cliente..."
              className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Foto inicial (solo al crear) */}
          {!editingBike && (
            <div className="p-3 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-blue-500" />
                Fotografía Inicial de Estado de Ingreso (URL o Imagen)
              </label>
              <input
                type="url"
                value={initialPhotoUrl}
                onChange={(e) => setInitialPhotoUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {initialPhotoUrl && (
                <div className="relative w-28 h-20 rounded-md overflow-hidden border border-slate-200 dark:border-slate-800">
                  <img src={initialPhotoUrl} alt="Vista previa" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          )}
        </form>
      </Modal>

      {/* Modal de Dossier & Timeline Técnico Completo */}
      {detailBike && (
        <Modal
          isOpen={Boolean(detailBike)}
          onClose={() => setDetailBike(null)}
          title={`Dossier Técnico: ${detailBike.brand} ${detailBike.model}`}
          description="Historial integral, odómetro, órdenes de trabajo, fotografías de inspección y repuestos instalados."
          maxWidth="4xl"
          footer={
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2">
                {detailQRCode && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/bike/${detailQRCode.qr_code}`, '_blank')}
                    leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    Ver Vista Pública Cliente
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    const targetBike = detailBike;
                    setDetailBike(null);
                    navigate('/admin/ordenes/nueva', {
                      state: {
                        customer_id: targetBike.customer_id,
                        bicycle_id: targetBike.id,
                      },
                    });
                  }}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Crear Nueva Orden
                </Button>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setDetailBike(null)}>
                Cerrar Dossier
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            {/* Cabecera con Identidad, QR y Acciones Rápidas */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 via-slate-50 to-amber-50/50 dark:from-blue-950/40 dark:via-slate-900 dark:to-amber-950/20 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2 capitalize">
                    <Bike className="w-5 h-5 text-blue-600" />
                    {detailBike.brand} {detailBike.model}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-600 text-white">
                    {detailBike.bike_type}
                  </span>
                  {detailBike.year && (
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Año {detailBike.year}
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>Color: <strong className="text-slate-900 dark:text-white">{detailBike.color}</strong></span>
                  {detailBike.serial_number && (
                    <span>Serial: <strong className="font-mono text-slate-900 dark:text-white">{detailBike.serial_number}</strong></span>
                  )}
                </div>

                {detailBike.customer && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Propietario: <strong className="text-slate-900 dark:text-white">{detailBike.customer.full_name}</strong>
                    </span>
                    <a
                      href={`https://wa.me/${detailBike.customer.phone.replace(/\D/g, '').startsWith('57') ? detailBike.customer.phone.replace(/\D/g, '') : `57${detailBike.customer.phone.replace(/\D/g, '')}`}?text=Hola%20${encodeURIComponent(detailBike.customer.full_name)},%20te%20compartimos%20el%20historial%20t%C3%A9cnico%20de%20tu%20bicicleta%20${encodeURIComponent(detailBike.brand)}%20${encodeURIComponent(detailBike.model)}%20en%20A2Ruedas:%20${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/bike/${detailQRCode?.qr_code || ''}` : '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 transition-colors"
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-600" />
                      Enviar Historial por WhatsApp
                    </a>
                  </div>
                )}
              </div>

              {/* Badge QR y Enlace Directo */}
              {detailQRCode && (
                <div className="flex sm:flex-col items-center justify-between sm:justify-center p-3 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 shadow-xs shrink-0 gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-2 sm:flex-col sm:items-center">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
                      QR ASIGNADO
                    </span>
                    <div className="px-2.5 py-1 rounded bg-slate-900 dark:bg-amber-950/80 text-amber-400 font-mono font-bold text-xs flex items-center gap-1.5 border border-amber-500/40">
                      <QrCode className="w-3.5 h-3.5 text-amber-400" />
                      {detailQRCode.qr_code}
                    </div>
                  </div>
                  <a
                    href={`/bike/${detailQRCode.qr_code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>Ver Timeline Público</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Pestañas de Navegación del Dossier */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveDetailTab('timeline')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeDetailTab === 'timeline'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Timeline de Mantenimientos</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {dossierData?.workOrders.length ?? detailOrders.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDetailTab('specs')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeDetailTab === 'specs'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ficha Técnica & Componentes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDetailTab('photos')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeDetailTab === 'photos'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Fotos de Inspección</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {detailPhotos.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDetailTab('parts')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeDetailTab === 'parts'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Historial de Repuestos</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  {dossierData?.allPartsReplaced.length ?? 0}
                </span>
              </button>
            </div>

            {/* TAB 1: TIMELINE DE MANTENIMIENTOS */}
            {activeDetailTab === 'timeline' && (
              <div className="space-y-4">
                {/* Métricas / KPIs del Dossier */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-blue-500" />
                      Odómetro Actual
                    </span>
                    <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white block mt-0.5">
                      {dossierData?.currentMileageKm ? `${dossierData.currentMileageKm.toLocaleString('es-CO')} km` : 'Sin registrar'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-emerald-500" />
                      Inversión en Taller
                    </span>
                    <span className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400 block mt-0.5">
                      ${(dossierData?.totalSpent ?? 0).toLocaleString('es-CO')}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Wrench className="w-3 h-3 text-amber-500" />
                      Órdenes Totales
                    </span>
                    <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white block mt-0.5">
                      {dossierData?.totalServicesCount ?? detailOrders.length}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Package className="w-3 h-3 text-purple-500" />
                      Repuestos Usados
                    </span>
                    <span className="text-base font-extrabold font-mono text-purple-600 dark:text-purple-400 block mt-0.5">
                      {dossierData?.allPartsReplaced.length ?? 0}
                    </span>
                  </div>
                </div>

                {/* Lista cronológica vertical */}
                {isDossierLoading ? (
                  <div className="py-12 flex justify-center">
                    <LoadingSpinner text="Cargando historial cronológico..." />
                  </div>
                ) : (dossierData?.workOrders || []).length === 0 ? (
                  <div className="p-8 text-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                    <Wrench className="w-8 h-8 text-slate-400 mx-auto" />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        Aún no hay órdenes de trabajo para esta bicicleta
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        Al ingresar la bicicleta a recepción técnica, se registrará su kilometraje inicial, diagnóstico, servicios y repuestos.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        const targetBike = detailBike;
                        setDetailBike(null);
                        navigate('/admin/ordenes/nueva', {
                          state: {
                            customer_id: targetBike.customer_id,
                            bicycle_id: targetBike.id,
                          },
                        });
                      }}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      Crear Primera Orden
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                      <span>Línea de tiempo cronológica de servicios ejecutados</span>
                      <span className="text-[11px] text-slate-400">Ordenado del más reciente al más antiguo</span>
                    </div>

                    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                      {dossierData?.workOrders.map((order) => {
                        const servicesList = (order.items || [])
                          .filter((it) => it.item_type === 'service')
                          .map((it) => it.description);
                        const partsList = (order.items || [])
                          .filter((it) => it.item_type === 'part')
                          .map((it) => it.description);

                        return (
                          <div
                            key={order.id}
                            className="relative p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2.5 transition-all hover:border-blue-400 dark:hover:border-blue-700"
                          >
                            {/* Punto en la línea de tiempo */}
                            <div className="absolute -left-[27px] top-4 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white dark:ring-slate-900" />

                            {/* Cabecera de la orden */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                                  {order.order_number}
                                </span>
                                <Badge status={order.status} withDot isMono />
                                {typeof order.entry_mileage_km === 'number' && order.entry_mileage_km > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/60">
                                    <Gauge className="w-3 h-3" />
                                    {order.entry_mileage_km.toLocaleString('es-CO')} km
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 font-mono">
                                {new Date(order.created_at).toLocaleDateString('es-CO', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>

                            {/* Motivo y Diagnóstico */}
                            <div className="text-xs space-y-1">
                              <div>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">Motivo / Problema: </span>
                                <span className="text-slate-600 dark:text-slate-400">{order.reported_issues}</span>
                              </div>
                              {(() => {
                                const notes = order.internal_notes || '';
                                if (!notes) return null;
                                const damageMatch = notes.match(/\[INSPECCIÓN DE DAÑOS PREVIOS \(\d+\)\]: (.*?)(?=\s*\[|$)/);
                                const damageList = damageMatch ? damageMatch[1].split(' | ').map((d) => d.trim()) : [];
                                const depositMatch = notes.match(/\[ANTICIPO RECIBIDO\]: (.*?)(?=\s*\[|$)/);
                                const depositStr = depositMatch ? depositMatch[1] : '';
                                const cleanNote = notes
                                  .replace(/\[INSPECCIÓN DE DAÑOS PREVIOS \(\d+\)\]:.*?(?=\s*\[|$)/, '')
                                  .replace(/\[INSPECCIÓN\]:.*?(?=\s*\[|$)/, '')
                                  .replace(/\[ANTICIPO RECIBIDO\]:.*?(?=\s*\[|$)/, '')
                                  .trim();

                                return (
                                  <div className="space-y-1.5 pt-0.5">
                                    {damageList.length > 0 && (
                                      <div className="p-2 rounded bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[11px] space-y-1">
                                        <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                                          Daños o Rayones Previos Registrados:
                                        </span>
                                        <ul className="list-disc pl-4 space-y-0.5 text-amber-800 dark:text-amber-200/90 font-medium">
                                          {damageList.map((d, dIdx) => (
                                            <li key={dIdx}>{d}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {cleanNote && (
                                      <div>
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">Nota Técnica: </span>
                                        <span className="text-slate-600 dark:text-slate-400">{cleanNote}</span>
                                      </div>
                                    )}
                                    {depositStr && (
                                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                                        💵 Anticipo registrado: {depositStr}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Servicios y Repuestos */}
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {servicesList.map((srv, idx) => (
                                <span
                                  key={`srv-${idx}`}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                >
                                  <Wrench className="w-2.5 h-2.5 text-blue-500" />
                                  {srv}
                                </span>
                              ))}
                              {partsList.map((prt, idx) => (
                                <span
                                  key={`prt-${idx}`}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/50"
                                >
                                  <Package className="w-2.5 h-2.5 text-amber-500" />
                                  {prt}
                                </span>
                              ))}
                            </div>

                            {/* Footer de la tarjeta de orden: Total y botones de acción */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                              <div className="text-xs">
                                <span className="text-slate-500">Total: </span>
                                <strong className="font-mono text-sm text-slate-900 dark:text-white">
                                  ${order.grand_total.toLocaleString('es-CO')}
                                </strong>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setOrderToPrint(order);
                                    setTicketModalOpen(true);
                                  }}
                                  leftIcon={<Printer className="w-3 h-3" />}
                                >
                                  Imprimir Comprobante
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setDetailBike(null);
                                    navigate('/admin/ordenes');
                                  }}
                                  title="Ver en módulo de órdenes"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: FICHA TÉCNICA & COMPONENTES */}
            {activeDetailTab === 'specs' && (
              <div className="space-y-4">
                {/* Cuadrícula de especificaciones */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">Serial de Cuadro</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs block mt-0.5">
                      {detailBike.serial_number || 'Sin serial registrado'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">Talla de Marco</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs block mt-0.5">
                      {detailBike.frame_size || 'N/A'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">Tamaño de Rin</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs block mt-0.5">
                      {detailBike.wheel_size || 'N/A'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">Fecha de Registro</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs block mt-0.5">
                      {new Date(detailBike.created_at).toLocaleDateString('es-CO')}
                    </span>
                  </div>
                </div>

                {/* Componentes Clave & Observaciones */}
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="font-bold text-slate-900 dark:text-white block uppercase tracking-wider text-[10px]">
                      Componentes Clave & Transmisión:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300">
                      {detailBike.key_components || 'No se registraron especificaciones adicionales de transmisión/suspensión.'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/50 space-y-1">
                    <span className="font-bold text-amber-800 dark:text-amber-300 block uppercase tracking-wider text-[10px]">
                      Observaciones de Estado y Daños Previos:
                    </span>
                    <p className="text-amber-900 dark:text-amber-200 text-xs">
                      {detailBike.observations || 'Sin daños previos reportados al momento del ingreso inicial.'}
                    </p>
                  </div>
                </div>

                {/* Historial de Odómetro */}
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="font-bold text-slate-900 dark:text-white block uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-blue-600" />
                    Historial de Odómetro Registrado ({dossierData?.mileageHistory.length ?? 0} registros)
                  </span>

                  {(dossierData?.mileageHistory || []).length === 0 ? (
                    <p className="text-xs text-slate-400">
                      No se han ingresado kilometrajes en las órdenes de servicio de esta bicicleta.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {dossierData?.mileageHistory.map((m, idx) => (
                        <div
                          key={`m-${idx}`}
                          className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block">
                              {m.km.toLocaleString('es-CO')} km
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">Orden {m.order_number}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {new Date(m.date).toLocaleDateString('es-CO')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recomendaciones Preventivas del Taller */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/70 to-indigo-50/40 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-900/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                      Recomendaciones Preventivas Inteligentes ({detailBike.bike_type})
                    </h4>
                  </div>
                  <ul className="space-y-1.5 pl-4 list-disc text-xs text-blue-950 dark:text-blue-200">
                    {(dossierData?.recommendations || []).map((rec, idx) => (
                      <li key={`rec-${idx}`}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 3: FOTOS DE INSPECCIÓN */}
            {activeDetailTab === 'photos' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-blue-600" />
                    Fotografías de Inspección Física ({detailPhotos.length})
                  </h3>

                  {/* Filtro de tipos de foto */}
                  <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                    <button
                      onClick={() => setSelectedPhotoFilter('ALL')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        selectedPhotoFilter === 'ALL'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Todas
                    </button>
                    {PHOTO_TYPES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setSelectedPhotoFilter(t.value)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap transition-colors ${
                          selectedPhotoFilter === t.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subir Nueva Fotografía */}
                <form
                  onSubmit={handleAddPhotoInDetail}
                  className="p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 space-y-2.5 text-xs"
                >
                  <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    Agregar Fotografía de Evidencia / Rayón / Estado
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="url"
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      placeholder="URL de la imagen (o foto de cámara)..."
                      className="sm:col-span-2 px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      required
                    />
                    <select
                      value={newPhotoType}
                      onChange={(e) => setNewPhotoType(e.target.value as any)}
                      className="px-2 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      {PHOTO_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPhotoCaption}
                      onChange={(e) => setNewPhotoCaption(e.target.value)}
                      placeholder="Descripción o nota del daño (Ej: Rayón de 5cm en tirante trasero)..."
                      className="flex-1 px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                    <Button size="sm" type="submit" isLoading={isAddingPhoto} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                      Guardar Foto
                    </Button>
                  </div>
                </form>

                {/* Grid de Fotografías */}
                {detailPhotos.length === 0 ? (
                  <div className="p-8 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    No hay fotografías de inspección registradas para esta bicicleta.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {detailPhotos
                      .filter((p) => selectedPhotoFilter === 'ALL' || p.photo_type === selectedPhotoFilter)
                      .map((photo) => (
                        <div
                          key={photo.id}
                          className="group relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
                        >
                          <div className="aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                            <img
                              src={photo.photo_url}
                              alt={photo.caption || 'Foto de inspección'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                          <div className="p-2 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {photo.photo_type}
                              </span>
                              <button
                                onClick={() => handleDeletePhoto(photo.id)}
                                className="text-slate-400 hover:text-red-600 transition-colors p-0.5"
                                title="Eliminar fotografía"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            {photo.caption && (
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                                {photo.caption}
                              </p>
                            )}
                            <span className="text-[9px] font-mono text-slate-400 block">
                              {new Date(photo.created_at).toLocaleDateString('es-CO')}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: HISTORIAL DE REPUESTOS CONSOLIDADO */}
            {activeDetailTab === 'parts' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-amber-600" />
                    Consolidado de Repuestos y Componentes Reemplazados
                  </h3>
                  <span className="text-xs font-mono text-slate-500">
                    {dossierData?.allPartsReplaced.length ?? 0} piezas instaladas
                  </span>
                </div>

                {(dossierData?.allPartsReplaced || []).length === 0 ? (
                  <div className="p-8 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    Aún no se han reemplazado repuestos o componentes en las órdenes de esta bicicleta.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Repuesto / Pieza</TableHead>
                          <TableHead>Cant.</TableHead>
                          <TableHead>Orden OT</TableHead>
                          <TableHead className="text-right">Unitario</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dossierData?.allPartsReplaced.map((part, idx) => (
                          <TableRow key={`part-${idx}`}>
                            <TableCell className="font-mono text-xs text-slate-500 whitespace-nowrap">
                              {new Date(part.date).toLocaleDateString('es-CO')}
                            </TableCell>
                            <TableCell className="font-medium text-xs text-slate-900 dark:text-white">
                              {part.description}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {part.quantity}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-blue-600 dark:text-blue-400">
                              {part.order_number}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                              ${part.unit_price.toLocaleString('es-CO')}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-xs text-slate-900 dark:text-white">
                              ${part.total_price.toLocaleString('es-CO')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal de Impresión de Comprobante / Orden de Trabajo */}
      <WorkOrderTicketModal
        isOpen={ticketModalOpen}
        onClose={() => {
          setTicketModalOpen(false);
          setOrderToPrint(null);
        }}
        order={orderToPrint}
      />

      {/* Modal de Confirmación para Eliminar Bicicleta (Regla 44) */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteBicycle}
        title="¿Deseas eliminar esta bicicleta?"
        message={`Estás a punto de eliminar la bicicleta ${bikeToDelete?.brand} ${bikeToDelete?.model} (Serial: ${bikeToDelete?.serial_number || 'N/A'}). Esta acción desvinculará sus fotos y fichas técnicas.`}
        confirmText="Eliminar Bicicleta"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
