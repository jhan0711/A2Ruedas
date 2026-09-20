import React, { useState, useEffect } from 'react';
import {
  Search,
  Tag,
  CheckCircle,
  MessageCircle,
  ShoppingBag,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { Badge, Button } from '../../components/ui';

interface PublicProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  description: string;
  price: number;
  available: boolean;
  imageUrl: string;
  images: string[];
}

const sampleProducts: PublicProduct[] = [
  {
    id: 'p1',
    sku: 'REP-CAD-09',
    name: 'Cadena Shimano 9V Deore CN-HG53',
    category: 'Transmisión',
    brand: 'Shimano',
    description: 'Cadena de 9 velocidades súper estrecha con pasadores reforzados para MTB y ruta.',
    price: 85000,
    available: true,
    imageUrl: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    id: 'p2',
    sku: 'FRE-PAS-B05',
    name: 'Pastillas de Freno Shimano B05S Resina',
    category: 'Frenos',
    brand: 'Shimano',
    description: 'Compuesto de resina que ofrece frenado progresivo y silencioso para mordazas MT200/M315.',
    price: 45000,
    available: true,
    imageUrl: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    id: 'p3',
    sku: 'LLN-CON-500',
    name: 'Coraza Continental Grand Prix 5000 700x25c',
    category: 'Llantas y Neumáticos',
    brand: 'Continental',
    description: 'Neumático de alto rendimiento para carretera con tecnología BlackChili Compound.',
    price: 290000,
    available: true,
    imageUrl: 'https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    id: 'p4',
    sku: 'LUB-FIN-120',
    name: 'Lubricante Seco Finish Line Dry Teflon 120ml',
    category: 'Mantenimiento y Grasa',
    brand: 'Finish Line',
    description: 'Película sintética de teflón que minimiza la fricción y repele el polvo y la arena.',
    price: 38000,
    available: true,
    imageUrl: 'https://images.unsplash.com/photo-1618762044398-ec1e7e048bbd?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1618762044398-ec1e7e048bbd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    id: 'p5',
    sku: 'PED-SHI-M520',
    name: 'Pedales Automáticos Shimano SPD PD-M520',
    category: 'Pedales y Calas',
    brand: 'Shimano',
    description: 'Cuerpo compacto con diseño abierto para evacuación óptima de lodo. Incluye calas SM-SH51.',
    price: 185000,
    available: false,
    imageUrl: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=800&q=80',
    ],
  },
  {
    id: 'p6',
    sku: 'CAS-SPE-PRV',
    name: 'Casco Aerodinámico de Ciclismo Pro Route',
    category: 'Accesorios',
    brand: 'Specialized',
    description: 'Ventilación activa con canales internos de flujo de aire y ajuste micro-métrico trasero.',
    price: 240000,
    available: true,
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&w=800&q=80',
    ],
  },
];

export const CatalogPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [cart, setCart] = useState<{ [id: string]: number }>({});
  
  // Estado para la galería modal
  const [previewProduct, setPreviewProduct] = useState<PublicProduct | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const categories = [
    'Todas',
    'Transmisión',
    'Frenos',
    'Llantas y Neumáticos',
    'Mantenimiento y Grasa',
    'Pedales y Calas',
    'Accesorios',
  ];

  // Atajos de teclado para la galería (flechas izquierda/derecha y escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!previewProduct) return;
      if (e.key === 'ArrowRight') {
        setCurrentImageIndex((prev) => (prev + 1) % previewProduct.images.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentImageIndex((prev) =>
          prev === 0 ? previewProduct.images.length - 1 : prev - 1,
        );
      } else if (e.key === 'Escape') {
        setPreviewProduct(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewProduct]);

  const openPreview = (product: PublicProduct) => {
    setPreviewProduct(product);
    setCurrentImageIndex(0);
  };

  const filteredProducts = sampleProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleSelect = (id: string) => {
    setCart((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = 1;
      }
      return next;
    });
  };

  const selectedCount = Object.keys(cart).length;
  const selectedTotal = Object.keys(cart).reduce((sum, id) => {
    const prod = sampleProducts.find((p) => p.id === id);
    return sum + (prod ? prod.price : 0);
  }, 0);

  const getWhatsAppOrderLink = () => {
    const itemsText = Object.keys(cart)
      .map((id) => {
        const prod = sampleProducts.find((p) => p.id === id);
        return prod ? `- ${prod.name} ($${prod.price.toLocaleString('es-CO')})` : '';
      })
      .filter(Boolean)
      .join('%0A');

    const message = `Hola A2Ruedas, quisiera consultar disponibilidad en taller para comprar los siguientes productos:%0A${itemsText}%0ATotal aprox: $${selectedTotal.toLocaleString('es-CO')}`;
    return `https://wa.me/573000000000?text=${message}`;
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            Catálogo de Repuestos y Accesorios
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Múltiples fotografías en alta definición por producto. Compras y retiros se realizan presencialmente en taller.
          </p>
        </div>

        {/* Notificación de compra presencial */}
        <div className="px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
          📍 Compra presencial en taller
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por repuesto, marca o referencia..."
            className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Productos con soporte de múltiples imágenes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((product) => {
          const isSelected = !!cart[product.id];
          const hasMultiplePhotos = product.images && product.images.length > 1;

          return (
            <div
              key={product.id}
              className={`rounded-lg border bg-white dark:bg-slate-900 flex flex-col justify-between overflow-hidden transition-all shadow-xs group ${
                isSelected
                  ? 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-600/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
              }`}
            >
              {/* Contenedor de Fotografía */}
              <div
                className="relative w-full h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer"
                onClick={() => openPreview(product)}
              >
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />

                {/* Overlay superior: Marca y Disponibilidad */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2 pointer-events-none">
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold tracking-wider bg-slate-900/80 text-white backdrop-blur-xs">
                    {product.brand}
                  </span>
                  <Badge variant={product.available ? 'success' : 'danger'} withDot>
                    {product.available ? 'En Stock' : 'Agotado'}
                  </Badge>
                </div>

                {/* Badge inferior: Indicador de varias fotos y botón Ver */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  {hasMultiplePhotos ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-900/80 text-white backdrop-blur-xs flex items-center gap-1">
                      <Layers className="w-3 h-3 text-blue-400" />
                      <span>{product.images.length} fotos</span>
                    </span>
                  ) : <span />}

                  <span className="p-1.5 rounded-md bg-slate-900/80 text-white backdrop-blur-xs flex items-center gap-1 text-[10px] font-medium shadow-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Galería</span>
                  </span>
                </div>
              </div>

              {/* Información y Descripción */}
              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">
                    SKU: {product.sku} • {product.category}
                  </span>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                    {product.name}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {product.description}
                  </p>
                </div>

                {/* Precio y Acción */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Precio Taller</span>
                    <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                      ${product.price.toLocaleString('es-CO')}
                    </span>
                  </div>

                  {product.available && (
                    <Button
                      size="sm"
                      variant={isSelected ? 'primary' : 'outline'}
                      onClick={() => toggleSelect(product.id)}
                      leftIcon={
                        <CheckCircle
                          className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`}
                        />
                      }
                    >
                      {isSelected ? 'Seleccionado' : 'Añadir'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Galería Interactiva de Múltiples Fotos */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Botón cerrar */}
            <button
              type="button"
              onClick={() => setPreviewProduct(null)}
              className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors"
              aria-label="Cerrar galería"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Visor principal de la foto activa */}
            <div className="relative h-80 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
              <img
                src={previewProduct.images[currentImageIndex] || previewProduct.imageUrl}
                alt={`${previewProduct.name} - Foto ${currentImageIndex + 1}`}
                className="w-full h-full object-contain"
              />

              {/* Flechas de navegación si hay varias fotos */}
              {previewProduct.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) =>
                        prev === 0 ? previewProduct.images.length - 1 : prev - 1,
                      );
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex((prev) => (prev + 1) % previewProduct.images.length);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors"
                    aria-label="Siguiente foto"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  {/* Contador de fotos */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-900/80 text-white text-[11px] font-mono backdrop-blur-xs">
                    Foto {currentImageIndex + 1} de {previewProduct.images.length}
                  </div>
                </>
              )}
            </div>

            {/* Tira de Miniaturas (Thumbnail Strip) */}
            {previewProduct.images.length > 1 && (
              <div className="p-3 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
                {previewProduct.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`h-14 w-20 rounded-md overflow-hidden shrink-0 border-2 transition-all ${
                      currentImageIndex === idx
                        ? 'border-blue-600 scale-105 shadow-xs'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Detalle del producto */}
            <div className="p-5 space-y-3 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold">
                  {previewProduct.brand} • {previewProduct.sku}
                </span>
                <Badge variant={previewProduct.available ? 'success' : 'danger'} withDot>
                  {previewProduct.available ? 'En Stock' : 'Agotado'}
                </Badge>
              </div>

              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {previewProduct.name}
              </h2>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                {previewProduct.description}
              </p>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">PRECIO TALLER</span>
                  <span className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                    ${previewProduct.price.toLocaleString('es-CO')}
                  </span>
                </div>

                {previewProduct.available && (
                  <Button
                    size="sm"
                    variant={cart[previewProduct.id] ? 'primary' : 'secondary'}
                    onClick={() => {
                      toggleSelect(previewProduct.id);
                      setPreviewProduct(null);
                    }}
                  >
                    {cart[previewProduct.id] ? 'En tu lista' : 'Agregar a tu lista'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra flotante para consultar productos seleccionados por WhatsApp */}
      {selectedCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-40 p-4 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-800 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-xs font-semibold block">
                {selectedCount} {selectedCount === 1 ? 'producto seleccionado' : 'productos seleccionados'}
              </span>
              <span className="text-xs font-mono text-slate-300">
                Total aprox: ${selectedTotal.toLocaleString('es-CO')}
              </span>
            </div>
          </div>

          <a
            href={getWhatsAppOrderLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Consultar Disponibilidad</span>
          </a>
        </div>
      )}
    </div>
  );
};
