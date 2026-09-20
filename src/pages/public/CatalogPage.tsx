import React, { useState } from 'react';
import { Search, Tag, CheckCircle, MessageCircle, ShoppingBag } from 'lucide-react';

interface PublicProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  description: string;
  price: number;
  available: boolean;
  imageUrl?: string;
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
  },
  {
    id: 'p5',
    sku: 'PED-SHI-M520',
    name: 'Pedales Automáticos Shimano SPD PD-M520',
    category: 'Pedales',
    brand: 'Shimano',
    description: 'Cuerpo compacto con diseño abierto para evacuación óptima de lodo. Incluye calas SM-SH51.',
    price: 185000,
    available: false,
  },
];

export const CatalogPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [cart, setCart] = useState<{ [id: string]: number }>({});

  const categories = ['Todas', 'Transmisión', 'Frenos', 'Llantas y Neumáticos', 'Mantenimiento y Grasa', 'Pedales'];

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
            Consulta repuestos disponibles en el taller. Compras y retiros se realizan presencialmente.
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

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => {
          const isSelected = !!cart[product.id];
          return (
            <div
              key={product.id}
              className={`p-4 rounded-lg border bg-white dark:bg-slate-900 flex flex-col justify-between transition-shadow shadow-xs ${
                isSelected
                  ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-slate-400">
                    {product.brand} • {product.sku}
                  </span>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                      product.available
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                    }`}
                  >
                    {product.available ? 'En Stock' : 'Agotado'}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                  {product.name}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {product.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Precio Taller</span>
                  <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                    ${product.price.toLocaleString('es-CO')}
                  </span>
                </div>

                {product.available && (
                  <button
                    type="button"
                    onClick={() => toggleSelect(product.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <CheckCircle className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span>{isSelected ? 'Seleccionado' : 'Añadir a lista'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

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
