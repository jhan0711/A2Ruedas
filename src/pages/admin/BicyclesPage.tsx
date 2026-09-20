import React, { useState, useEffect } from 'react';
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
} from '../../types/database';
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

    try {
      const [qr, photos, allOrders] = await Promise.all([
        bicycleService.getOrGenerateQRCode(bike.id),
        bicycleService.getBicyclePhotos(bike.id),
        workOrderService.getWorkOrders(),
      ]);
      setDetailQRCode(qr);
      setDetailPhotos(photos);
      setDetailOrders(allOrders.filter((o) => o.bicycle_id === bike.id));
    } catch (err) {
      console.error('Error al cargar detalle de bicicleta:', err);
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

      {/* Modal de Ficha Técnica Completa (Dossier Técnico) */}
      {detailBike && (
        <Modal
          isOpen={Boolean(detailBike)}
          onClose={() => setDetailBike(null)}
          title={`Ficha Técnica: ${detailBike.brand} ${detailBike.model}`}
          maxWidth="xl"
          footer={
            <Button size="sm" variant="secondary" onClick={() => setDetailBike(null)}>
              Cerrar Ficha
            </Button>
          }
        >
          <div className="space-y-6">
            {/* Cabecera con QR e Identidad */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 via-slate-50 to-amber-50/40 dark:from-blue-950/40 dark:via-slate-900 dark:to-amber-950/20 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="font-bold text-base text-slate-900 dark:text-white">
                    {detailBike.brand} {detailBike.model}
                  </span>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-600 text-white">
                    {detailBike.bike_type}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Color: <span className="font-medium text-slate-900 dark:text-white">{detailBike.color}</span>
                  {detailBike.year && ` • Año: ${detailBike.year}`}
                </p>
                {detailBike.customer && (
                  <div className="flex items-center gap-2 pt-1 justify-center sm:justify-start">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Propietario: <strong className="text-slate-900 dark:text-white">{detailBike.customer.full_name}</strong>
                    </span>
                    <a
                      href={`https://wa.me/${detailBike.customer.phone.replace(/\D/g, '').startsWith('57') ? detailBike.customer.phone.replace(/\D/g, '') : `57${detailBike.customer.phone.replace(/\D/g, '')}`}?text=Hola%20${encodeURIComponent(detailBike.customer.full_name)},%20te%20escribimos%20del%20taller%20A2Ruedas%20sobre%20tu%20bicicleta%20${encodeURIComponent(detailBike.brand)}%20${encodeURIComponent(detailBike.model)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-500" />
                      WhatsApp
                    </a>
                  </div>
                )}
              </div>

              {/* Badge QR y Botón de Escaneo / Impresión */}
              {detailQRCode && (
                <div className="flex flex-col items-center p-3 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 shadow-sm shrink-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold mb-1">
                    CÓDIGO QR ASIGNADO
                  </span>
                  <div className="px-2.5 py-1 rounded bg-slate-900 dark:bg-amber-950/80 text-amber-400 font-mono font-bold text-xs flex items-center gap-1.5 border border-amber-500/40">
                    <QrCode className="w-4 h-4 text-amber-400" />
                    {detailQRCode.qr_code}
                  </div>
                  <a
                    href={`/bike/${detailQRCode.qr_code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Ver Timeline Público</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Datos Técnicos de la Bicicleta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Serial de Cuadro</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {detailBike.serial_number || 'Sin serial'}
                </span>
              </div>

              <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Talla de Marco</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {detailBike.frame_size || 'N/A'}
                </span>
              </div>

              <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Tamaño de Rin</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {detailBike.wheel_size || 'N/A'}
                </span>
              </div>

              <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Fecha de Registro</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(detailBike.created_at).toLocaleDateString('es-CO')}
                </span>
              </div>
            </div>

            {/* Componentes Clave y Observaciones */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block uppercase tracking-wider text-[10px]">
                  Componentes Clave Registrados:
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  {detailBike.key_components || 'No se registraron especificaciones adicionales de transmisión/suspensión.'}
                </p>
              </div>

              <div className="p-3 rounded-md bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/50 space-y-1">
                <span className="font-bold text-amber-800 dark:text-amber-300 block uppercase tracking-wider text-[10px]">
                  Observaciones de Estado y Daños Previos:
                </span>
                <p className="text-amber-900 dark:text-amber-200 text-xs">
                  {detailBike.observations || 'Sin daños previos reportados al momento del ingreso.'}
                </p>
              </div>
            </div>

            {/* Galería de Fotografías de Inspección */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
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
                <div className="p-6 rounded-md border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                  No hay fotografías de inspección registradas para esta bicicleta.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {detailPhotos
                    .filter((p) => selectedPhotoFilter === 'ALL' || p.photo_type === selectedPhotoFilter)
                    .map((photo) => (
                      <div
                        key={photo.id}
                        className="group relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
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

            {/* Historial de Órdenes de Trabajo */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Historial de Órdenes de Trabajo Asociadas ({detailOrders.length})
              </h3>

              {detailOrders.length === 0 ? (
                <div className="p-4 rounded-md border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                  Aún no se han ejecutado órdenes de trabajo para esta bicicleta.
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {detailOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-2.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 block">
                          {order.order_number}
                        </span>
                        <span className="text-[11px] text-slate-500">{order.reported_issues}</span>
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
