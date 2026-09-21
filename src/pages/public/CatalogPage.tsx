import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  CheckCircle,
  MessageCircle,
  ShoppingBag,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  Share2,
  Check,
  RotateCcw,
  SlidersHorizontal,
  Plus,
  Minus,
  Trash2,
  Store,
  Info,
} from 'lucide-react';
import {
  catalogService,
  PublicCatalogProduct,
  PublicCategoryCount,
  CartItem,
  CatalogSortOption,
} from '../../services/catalogService';
import { Badge, Button, LoadingSpinner } from '../../components/ui';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Estados de datos
  const [products, setProducts] = useState<PublicCatalogProduct[]>([]);
  const [categories, setCategories] = useState<PublicCategoryCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState<CatalogSortOption>('relevance');

  // Bolsa de Consulta (Carrito)
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  // Galería y Visualizador de Producto
  const [previewProduct, setPreviewProduct] = useState<PublicCatalogProduct | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Notificaciones
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Cargar catálogo inicial
  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    setIsLoading(true);
    try {
      const [prodsData, catsData] = await Promise.all([
        catalogService.getPublicProducts(),
        catalogService.getPublicCategories(),
      ]);
      setProducts(prodsData);
      setCategories(catsData);

      // Revisar si viene un parámetro deep-link en la URL (?p=id o ?sku=code)
      const paramP = searchParams.get('p') || searchParams.get('sku');
      if (paramP) {
        const found = prodsData.find(
          (p) => p.id === paramP || p.sku.toUpperCase() === paramP.toUpperCase()
        );
        if (found) {
          setPreviewProduct(found);
          setCurrentImageIndex(0);
        }
      }
    } catch (err) {
      console.error('Error al cargar el catálogo público:', err);
      showToast('Error al conectar con el inventario del taller.');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => {
      setToastMessage((current) => (current === text ? null : current));
    }, 3500);
  };

  // Atajos de teclado para la galería (flechas izquierda/derecha y escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!previewProduct) return;
      if (e.key === 'ArrowRight' && previewProduct.images.length > 1) {
        setCurrentImageIndex((prev) => (prev + 1) % previewProduct.images.length);
      } else if (e.key === 'ArrowLeft' && previewProduct.images.length > 1) {
        setCurrentImageIndex((prev) =>
          prev === 0 ? previewProduct.images.length - 1 : prev - 1
        );
      } else if (e.key === 'Escape') {
        closePreview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewProduct]);

  // Manejo de apertura y cierre de modal con sincronización de URL
  const openPreview = (product: PublicCatalogProduct) => {
    setPreviewProduct(product);
    setCurrentImageIndex(0);
    setSearchParams({ p: product.id });
  };

  const closePreview = () => {
    setPreviewProduct(null);
    setSearchParams({});
  };

  // Copiar enlace directo del producto
  const handleCopyProductLink = (product: PublicCatalogProduct) => {
    const url = `${window.location.origin}/productos?p=${product.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    showToast('Enlace del repuesto copiado al portapapeles');
  };

  // Filtrado y ordenamiento en cliente
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Categoría
    if (selectedCategory !== 'ALL') {
      result = result.filter((p) => p.category_id === selectedCategory);
    }

    // 2. Búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.brand.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          p.category_name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term)
      );
    }

    // 3. Solo disponibles
    if (onlyAvailable) {
      result = result.filter((p) => p.available);
    }

    // 4. Ordenamiento
    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name, 'es'));
        break;
      case 'relevance':
      default:
        result.sort((a, b) => Number(b.available) - Number(a.available));
        break;
    }

    return result;
  }, [products, selectedCategory, searchTerm, onlyAvailable, sortBy]);

  // Manejo de la Bolsa de Consulta
  const toggleAddToCart = (product: PublicCatalogProduct) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[product.id]) {
        delete next[product.id];
        showToast(`Removido de tu lista: ${product.name}`);
      } else {
        next[product.id] = 1;
        showToast(`Añadido a tu lista: ${product.name}`);
      }
      return next;
    });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      const next = { ...prev };
      const current = next[productId] || 0;
      const updated = current + delta;
      if (updated <= 0) {
        delete next[productId];
      } else {
        next[productId] = updated;
      }
      return next;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const clearCart = () => {
    setCart({});
    setIsCartModalOpen(false);
    showToast('Lista de consulta vaciada');
  };

  // Cálculos de la bolsa
  const cartItemsList: CartItem[] = useMemo(() => {
    return Object.keys(cart)
      .map((id) => {
        const prod = products.find((p) => p.id === id);
        return prod ? { product: prod, quantity: cart[id] } : null;
      })
      .filter((it): it is CartItem => it !== null);
  }, [cart, products]);

  const selectedCount = cartItemsList.reduce((sum, it) => sum + it.quantity, 0);
  const selectedTotal = cartItemsList.reduce(
    (sum, it) => sum + it.product.price * it.quantity,
    0
  );

  const whatsAppUrl = useMemo(() => {
    return catalogService.generateWhatsAppInquiryUrl(cartItemsList);
  }, [cartItemsList]);

  // Total de productos disponibles
  const totalInStockCount = useMemo(() => {
    return products.filter((p) => p.available).length;
  }, [products]);

  return (
    <div className="space-y-6 pb-20">
      {/* Notificación flotante (Toast) */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Banner de Cabecera */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
              Vitrina Taller
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {products.length} repuestos en inventario
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            Catálogo de Repuestos y Accesorios
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl mt-1">
            Componentes originales, pastillas, cubiertas y herramientas especializadas. Todos los retiros e instalaciones mecánicas se realizan presencialmente en nuestro taller físico.
          </p>
        </div>

        {/* Indicador de Taller Físico */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Atención Presencial
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
              Compra y servicio en taller
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Campo de búsqueda */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por repuesto, marca (Shimano, Continental...), referencia SKU..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Menú de Ordenamiento */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as CatalogSortOption)}
              className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-xs"
            >
              <option value="relevance">Ordenar: Disponibles primero</option>
              <option value="price_asc">Ordenar: Menor precio</option>
              <option value="price_desc">Ordenar: Mayor precio</option>
              <option value="name_asc">Ordenar: Nombre (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Carrusel / Pastillas de Categorías */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span>Todas</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === 'ALL'
                  ? 'bg-blue-800 text-blue-100'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {products.length}
            </span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === cat.id
                    ? 'bg-blue-800 text-blue-100'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Barra de Filtros Secundarios y Conteo */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span>Solo productos con stock disponible ({totalInStockCount})</span>
          </label>

          <span>
            Mostrando <strong>{filteredProducts.length}</strong> de {products.length}
          </span>
        </div>
      </div>

      {/* Grid de Productos */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <LoadingSpinner size="lg" />
          <span className="text-xs font-mono text-slate-500">
            Cargando catálogo oficial de repuestos A2Ruedas...
          </span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No se encontraron repuestos con los filtros seleccionados
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Prueba ajustando el término de búsqueda, seleccionando otra categoría o desmarcando el filtro de stock disponible.
          </p>
          <div className="mt-4">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('ALL');
                setOnlyAvailable(false);
              }}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Restablecer filtros
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => {
            const isSelected = !!cart[product.id];
            const hasMultiplePhotos = product.images && product.images.length > 1;

            return (
              <div
                key={product.id}
                className={`rounded-2xl border bg-white dark:bg-slate-900 flex flex-col justify-between overflow-hidden transition-all shadow-xs group ${
                  isSelected
                    ? 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-600/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
                }`}
              >
                {/* Contenedor de Fotografía */}
                <div
                  className="relative w-full h-52 bg-slate-100 dark:bg-slate-950 overflow-hidden cursor-pointer"
                  onClick={() => openPreview(product)}
                >
                  <img
                    src={product.image_url}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Overlay superior: Marca y Disponibilidad */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] uppercase font-mono font-black tracking-wider bg-slate-950/80 text-white backdrop-blur-xs border border-white/10 shadow-xs">
                      {product.brand}
                    </span>
                    <Badge variant={product.available ? 'success' : 'danger'} withDot>
                      {product.available ? 'En Stock' : 'Agotado'}
                    </Badge>
                  </div>

                  {/* Overlay inferior: Galería y Fotos */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    {hasMultiplePhotos ? (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold bg-slate-950/80 text-white backdrop-blur-xs flex items-center gap-1 border border-white/10 shadow-xs">
                        <Layers className="w-3 h-3 text-blue-400" />
                        <span>{product.images.length} fotos</span>
                      </span>
                    ) : (
                      <span />
                    )}

                    <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 text-white backdrop-blur-xs flex items-center gap-1.5 text-[10px] font-semibold shadow-xs opacity-0 group-hover:opacity-100 transition-opacity border border-white/10">
                      <Eye className="w-3 h-3 text-blue-400" />
                      <span>Ver Galería</span>
                    </span>
                  </div>
                </div>

                {/* Contenido e Información */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        {product.category_name}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                        Ref: {product.sku}
                      </span>
                    </div>

                    <h3
                      onClick={() => openPreview(product)}
                      className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                    >
                      {product.name}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Precio y Acción */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">
                        Precio Taller
                      </span>
                      <span className="font-mono text-base font-black text-slate-900 dark:text-white">
                        ${product.price.toLocaleString('es-CO')}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1 font-mono">
                        COP
                      </span>
                    </div>

                    {product.available ? (
                      <Button
                        size="sm"
                        variant={isSelected ? 'primary' : 'secondary'}
                        onClick={() => toggleAddToCart(product)}
                        leftIcon={
                          <CheckCircle
                            className={`w-3.5 h-3.5 ${
                              isSelected ? 'text-white' : 'text-slate-400'
                            }`}
                          />
                        }
                        className={
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'hover:border-blue-500 hover:text-blue-600'
                        }
                      >
                        {isSelected ? 'En tu lista' : 'Añadir'}
                      </Button>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 italic">
                        No disponible
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Galería Interactiva con Miniaturas y Teclado */}
      {previewProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={closePreview}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón cerrar */}
            <button
              type="button"
              onClick={closePreview}
              className="absolute top-3 right-3 z-20 p-2 rounded-full bg-slate-950/70 text-white hover:bg-slate-900 transition-colors shadow-md"
              aria-label="Cerrar visor"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Visor principal de la foto */}
            <div className="relative h-72 sm:h-88 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
              <img
                src={previewProduct.images[currentImageIndex] || previewProduct.image_url}
                alt={`${previewProduct.name} - Foto ${currentImageIndex + 1}`}
                className="w-full h-full object-contain"
              />

              {/* Controles de navegación */}
              {previewProduct.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) =>
                        prev === 0 ? previewProduct.images.length - 1 : prev - 1
                      );
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 text-white hover:bg-slate-900 transition-colors shadow-md"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(
                        (prev) => (prev + 1) % previewProduct.images.length
                      );
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 text-white hover:bg-slate-900 transition-colors shadow-md"
                    aria-label="Siguiente foto"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Contador */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-950/80 text-white text-[11px] font-mono backdrop-blur-xs border border-white/10">
                    Foto {currentImageIndex + 1} de {previewProduct.images.length}
                  </div>
                </>
              )}
            </div>

            {/* Tira de Miniaturas */}
            {previewProduct.images.length > 1 && (
              <div className="p-2.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
                {previewProduct.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`h-14 w-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                      currentImageIndex === idx
                        ? 'border-blue-600 scale-105 shadow-xs'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Miniatura ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Ficha técnica y detalles */}
            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                    {previewProduct.brand}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-500">
                    SKU: {previewProduct.sku}
                  </span>
                </div>
                <Badge variant={previewProduct.available ? 'success' : 'danger'} withDot>
                  {previewProduct.available ? 'En Stock' : 'Agotado'}
                </Badge>
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                  {previewProduct.name}
                </h2>
                <span className="text-xs text-slate-400 font-mono block mt-0.5">
                  Categoría: {previewProduct.category_name}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {previewProduct.description}
              </p>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">PRECIO TALLER</span>
                  <span className="font-mono text-xl font-black text-slate-900 dark:text-white">
                    ${previewProduct.price.toLocaleString('es-CO')}
                  </span>
                  <span className="text-xs text-slate-400 font-mono ml-1">COP</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopyProductLink(previewProduct)}
                    leftIcon={
                      copiedLink ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )
                    }
                  >
                    {copiedLink ? '¡Copiado!' : 'Compartir'}
                  </Button>

                  {previewProduct.available && (
                    <Button
                      size="sm"
                      variant={cart[previewProduct.id] ? 'primary' : 'secondary'}
                      onClick={() => toggleAddToCart(previewProduct)}
                      leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
                    >
                      {cart[previewProduct.id] ? 'En tu lista' : 'Agregar a tu lista'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra flotante de Bolsa de Consulta */}
      {selectedCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-40 p-4 rounded-2xl bg-slate-900/95 text-white shadow-2xl border border-slate-700/80 backdrop-blur-md flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setIsCartModalOpen(true)}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold block">
                {selectedCount} {selectedCount === 1 ? 'repuesto seleccionado' : 'repuestos seleccionados'}
              </span>
              <span className="text-xs font-mono text-blue-300">
                Total estimado: ${selectedTotal.toLocaleString('es-CO')} COP
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsCartModalOpen(true)}
              className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700 text-xs"
            >
              Revisar Lista
            </Button>

            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      )}

      {/* Modal / Drawer de Revisión de la Bolsa de Consulta */}
      {isCartModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsCartModalOpen(false)}
        >
          <div
            className="relative w-full max-w-xl rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Bolsa de Consulta de Repuestos
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {cartItemsList.length} referencias para cotizar por WhatsApp
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCartModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Listado de Productos en la Bolsa */}
            <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
              {cartItemsList.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Tu bolsa de consulta está vacía. Añade repuestos desde el catálogo.
                </div>
              ) : (
                cartItemsList.map((item) => (
                  <div
                    key={item.product.id}
                    className="pt-3 first:pt-0 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight line-clamp-1">
                          {item.product.name}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {item.product.brand} • SKU: {item.product.sku}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                          ${(item.product.price * item.quantity).toLocaleString('es-CO')} COP
                        </span>
                      </div>
                    </div>

                    {/* Controles de Cantidad */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.product.id, -1)}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                          aria-label="Disminuir cantidad"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.product.id, 1)}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        aria-label="Eliminar repuesto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total y Botón de WhatsApp */}
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  TOTAL ESTIMADO:
                </span>
                <span className="font-mono text-lg font-black text-slate-900 dark:text-white">
                  ${selectedTotal.toLocaleString('es-CO')} COP
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="md"
                  variant="outline"
                  onClick={clearCart}
                  className="text-xs text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 hover:bg-rose-50"
                >
                  Vaciar
                </Button>

                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Consultar Disponibilidad por WhatsApp</span>
                </a>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Los precios son informativos para retiro o instalación en el taller físico.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
