import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  MapPin,
  DollarSign,
  TrendingUp,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import { Product, ProductInsert, ProductCategory } from '../../types/database';
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
  Modal,
  ConfirmModal,
  LoadingSpinner,
  EmptyState,
  Alert,
} from '../../components/ui';

export const ProductsAdminPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Formulario
  const [formData, setFormData] = useState<ProductInsert>({
    sku: '',
    category_id: '',
    name: '',
    brand: '',
    description: '',
    cost_price: 0,
    sale_price: 0,
    stock: 0,
    min_stock: 2,
    unit: 'unidad',
    location: '',
    image_url: '',
    images: [],
    is_active: true,
  });
  const [photoInput, setPhotoInput] = useState('');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        inventoryService.getProducts(),
        inventoryService.getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Error al cargar catálogo:', err);
      setAlertMessage({ type: 'error', text: 'No se pudieron cargar los productos.' });
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    const initialCat = categories.length > 0 ? categories[0].id : '';
    setFormData({
      sku: `PROD-${Math.floor(1000 + Math.random() * 9000)}`,
      category_id: initialCat,
      name: '',
      brand: '',
      description: '',
      cost_price: 0,
      sale_price: 0,
      stock: 0,
      min_stock: 2,
      unit: 'unidad',
      location: '',
      image_url: '',
      images: [],
      is_active: true,
    });
    setPhotoInput('');
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      category_id: product.category_id,
      name: product.name,
      brand: product.brand,
      description: product.description || '',
      cost_price: product.cost_price,
      sale_price: product.sale_price,
      stock: product.stock,
      min_stock: product.min_stock,
      unit: product.unit,
      location: product.location || '',
      image_url: product.image_url || '',
      images: product.images || (product.image_url ? [product.image_url] : []),
      is_active: product.is_active,
    });
    setPhotoInput('');
    setFormErrors({});
    setModalOpen(true);
  };

  const handleAddPhoto = () => {
    if (!photoInput.trim()) return;
    const currentImages = formData.images || [];
    const updatedImages = [...currentImages, photoInput.trim()];
    setFormData({
      ...formData,
      images: updatedImages,
      image_url: updatedImages[0] || '',
    });
    setPhotoInput('');
  };

  const handleRemovePhoto = (index: number) => {
    const currentImages = formData.images || [];
    const updatedImages = currentImages.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      images: updatedImages,
      image_url: updatedImages[0] || '',
    });
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    if (!formData.name.trim()) errors.name = 'El nombre del producto es obligatorio.';
    if (!formData.brand.trim()) errors.brand = 'La marca es obligatoria.';
    if (!formData.sku.trim()) errors.sku = 'El código SKU es obligatorio.';
    if (!formData.category_id) errors.category_id = 'Debes seleccionar una categoría.';
    if (formData.sale_price < 0) errors.sale_price = 'El precio de venta no puede ser negativo.';
    if (formData.cost_price < 0) errors.cost_price = 'El costo no puede ser negativo.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const dataToSave = {
        ...formData,
        image_url: formData.images && formData.images.length > 0 ? formData.images[0] : formData.image_url,
      };

      if (editingProduct) {
        await inventoryService.updateProduct(editingProduct.id, dataToSave);
        setAlertMessage({ type: 'success', text: `Producto "${formData.name}" actualizado exitosamente.` });
      } else {
        await inventoryService.createProduct(dataToSave);
        setAlertMessage({ type: 'success', text: `Producto "${formData.name}" registrado en el catálogo.` });
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error al guardar producto:', err);
      setAlertMessage({ type: 'error', text: 'Ocurrió un error al guardar el producto.' });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (product: Product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await inventoryService.deleteProduct(productToDelete.id);
      setAlertMessage({ type: 'success', text: `Producto "${productToDelete.name}" eliminado del catálogo.` });
      setDeleteModalOpen(false);
      setProductToDelete(null);
      loadData();
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      setAlertMessage({ type: 'error', text: 'No se pudo eliminar el producto.' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Cálculo de margen comercial
  const marginPercentage =
    formData.cost_price > 0
      ? Math.round(((formData.sale_price - formData.cost_price) / formData.cost_price) * 100)
      : 0;

  // Filtrado reactivo
  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      p.brand.toLowerCase().includes(term) ||
      (p.location && p.location.toLowerCase().includes(term));

    const matchesCategory = selectedCategory === 'ALL' || p.category_id === selectedCategory;

    const matchesStock =
      stockFilter === 'ALL' ||
      (stockFilter === 'LOW' && p.stock <= p.min_stock && p.stock > 0) ||
      (stockFilter === 'OUT' && p.stock === 0);

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Catálogo de Productos y Repuestos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Administra precios de venta, costos de adquisición, márgenes, fotos y ubicación de repuestos.
          </p>
        </div>

        <Button size="sm" onClick={openCreateModal} leftIcon={<Plus className="w-3.5 h-3.5" />}>
          Nuevo Producto
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

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por SKU, nombre, marca o ubicación física..."
            className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setStockFilter('ALL')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              stockFilter === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setStockFilter('LOW')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              stockFilter === 'LOW'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            Stock Bajo
          </button>
        </div>

        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 self-center">
          Total: <span className="font-bold text-slate-900 dark:text-white">{filteredProducts.length}</span> referencias
        </div>
      </div>

      {/* Tabla de Productos */}
      <Card>
        <CardHeader>
          <CardTitle>Listado Maestro de Artículos</CardTitle>
        </CardHeader>
        {isLoading ? (
          <div className="p-8">
            <LoadingSpinner size="md" text="Cargando productos..." />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Package className="w-6 h-6" />}
              title={searchTerm || selectedCategory !== 'ALL' ? 'No se encontraron referencias' : 'Catálogo vacío'}
              description={
                searchTerm || selectedCategory !== 'ALL'
                  ? 'No hay productos que coincidan con la búsqueda o filtros aplicados.'
                  : 'Registra tu primer producto o repuesto para controlar existencias y ventas.'
              }
              actionText={searchTerm || selectedCategory !== 'ALL' ? 'Restablecer Filtros' : 'Crear Producto'}
              onAction={
                searchTerm || selectedCategory !== 'ALL'
                  ? () => {
                      setSearchTerm('');
                      setSelectedCategory('ALL');
                      setStockFilter('ALL');
                    }
                  : openCreateModal
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto / SKU</TableHead>
                <TableHead>Categoría & Marca</TableHead>
                <TableHead>Costo (Compra)</TableHead>
                <TableHead>Precio Venta</TableHead>
                <TableHead>Margen</TableHead>
                <TableHead>Existencias</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((prod) => {
                const margin =
                  prod.cost_price > 0
                    ? Math.round(((prod.sale_price - prod.cost_price) / prod.cost_price) * 100)
                    : 0;

                const isLowStock = prod.stock <= prod.min_stock;
                const isOutOfStock = prod.stock <= 0;
                const photoCount = prod.images ? prod.images.length : prod.image_url ? 1 : 0;

                return (
                  <TableRow key={prod.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shrink-0 relative">
                          {prod.image_url ? (
                            <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          {photoCount > 1 && (
                            <span className="absolute bottom-0 right-0 bg-slate-900/80 text-white font-mono text-[9px] px-1 rounded-tl">
                              +{photoCount}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 block text-xs">
                            {prod.name}
                          </span>
                          <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold block">
                            {prod.sku}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 block w-max">
                          {prod.category?.name || 'General'}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">{prod.brand}</span>
                      </div>
                    </TableCell>

                    <TableCell isMono className="text-slate-600 dark:text-slate-400">
                      ${prod.cost_price.toLocaleString('es-CO')}
                    </TableCell>

                    <TableCell isMono className="font-bold text-slate-900 dark:text-white">
                      ${prod.sale_price.toLocaleString('es-CO')}
                    </TableCell>

                    <TableCell isMono>
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          margin >= 40
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                            : margin >= 20
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        <TrendingUp className="w-2.5 h-2.5" />
                        {margin}%
                      </span>
                    </TableCell>

                    <TableCell isMono>
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300">
                          <AlertTriangle className="w-3 h-3" />
                          Agotado (0)
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                          <AlertTriangle className="w-3 h-3" />
                          {prod.stock} / min {prod.min_stock}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {prod.stock} {prod.unit}
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {prod.location ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                          <MapPin className="w-2.5 h-2.5 text-slate-400" />
                          {prod.location}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(prod)}
                          title="Editar producto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="hover:text-red-600 dark:hover:text-red-400"
                          onClick={() => confirmDelete(prod)}
                          title="Eliminar producto"
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

      {/* Modal de Creación / Edición de Producto */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Editar Producto / Repuesto' : 'Registrar Nuevo Producto'}
        description="Configura los precios de compra, venta, alertas de stock mínimo y fotografías."
        maxWidth="lg"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSaveProduct} isLoading={isSaving}>
              {editingProduct ? 'Guardar Cambios' : 'Registrar en Catálogo'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Código SKU *"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
              placeholder="REP-CAD-09"
              error={formErrors.sku}
              isMono
              required
            />

            <div className="sm:col-span-2">
              <Input
                label="Nombre del Producto *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej. Cadena Shimano Deore 9V"
                error={formErrors.name}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Marca *"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Ej. Shimano, Maxxis, Finish Line..."
              error={formErrors.brand}
              required
            />

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Categoría *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              >
                <option value="">Selecciona categoría...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {formErrors.category_id && (
                <span className="text-[11px] text-red-600 block mt-1">{formErrors.category_id}</span>
              )}
            </div>
          </div>

          {/* Costos, Precios y Margen Comercial */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-blue-600" />
              Estructura de Precios y Rentabilidad
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Costo de Compra (COP) *"
                type="number"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                isMono
                required
              />

              <Input
                label="Precio de Venta (COP) *"
                type="number"
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: Number(e.target.value) })}
                isMono
                required
              />

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Margen Bruto Estimado
                </label>
                <div className="h-8 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">
                    +${(formData.sale_price - formData.cost_price).toLocaleString('es-CO')}
                  </span>
                  <span className={`font-bold ${marginPercentage >= 30 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {marginPercentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stock, Stock Mínimo, Unidad y Ubicación */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input
              label="Stock Inicial"
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
              isMono
              disabled={Boolean(editingProduct)} // Si ya existe, se ajusta por Kardex
            />

            <Input
              label="Stock Mínimo (Alerta) *"
              type="number"
              value={formData.min_stock}
              onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
              isMono
              required
            />

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Unidad
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="unidad">Unidad</option>
                <option value="par">Par</option>
                <option value="juego">Juego / Kit</option>
                <option value="metro">Metro</option>
                <option value="bote">Bote / Botella</option>
              </select>
            </div>

            <Input
              label="Ubicación en Taller"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Estante A-1, Gaveta..."
            />
          </div>

          {/* Fotografías Múltiples de Producto */}
          <div className="space-y-2 p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
              Fotografías del Producto (Múltiples fotos para clientes)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={photoInput}
                onChange={(e) => setPhotoInput(e.target.value)}
                placeholder="Pegar URL de imagen (https://...)"
                className="flex-1 text-xs px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <Button size="sm" type="button" variant="outline" onClick={handleAddPhoto}>
                Agregar Foto
              </Button>
            </div>

            {formData.images && formData.images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pt-1">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-md overflow-hidden border border-slate-200 dark:border-slate-800 group shrink-0">
                    <img src={img} alt="Foto" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      title="Quitar foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1 text-left">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Descripción del Producto
            </label>
            <textarea
              rows={2}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Especificaciones, compatibilidad con transmisiones, uso recomendado..."
              className="w-full text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </form>
      </Modal>

      {/* Confirmación para Eliminar Producto (Regla 44) */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteProduct}
        title="¿Deseas eliminar este producto?"
        message={`Estás a punto de eliminar "${productToDelete?.name}" (${productToDelete?.sku}) del catálogo. Esta acción no se puede deshacer.`}
        confirmText="Eliminar Producto"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
