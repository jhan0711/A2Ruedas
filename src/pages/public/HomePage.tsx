import React, { useState, useEffect } from 'react';
import { Bike, Wrench, ShieldCheck, Clock, MapPin, ArrowRight, MessageCircle, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  workshopSettingsService,
  WORKSHOP_SETTINGS_EVENT,
  formatPhoneForWhatsApp,
} from '../../services/workshopSettingsService';
import {
  catalogService,
  PublicCatalogProduct,
  DEFAULT_PRODUCT_IMAGE,
} from '../../services/catalogService';

export const HomePage: React.FC = () => {
  const [settings, setSettings] = useState(() => workshopSettingsService.getSettings());
  const [featuredProducts, setFeaturedProducts] = useState<PublicCatalogProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    const handleUpdate = () => {
      setSettings(workshopSettingsService.getSettings());
    };
    window.addEventListener(WORKSHOP_SETTINGS_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(WORKSHOP_SETTINGS_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    catalogService
      .getPublicProducts()
      .then((prods) => {
        if (isMounted) {
          // Tomar los primeros 3 productos activos del catálogo para la vitrina del inicio
          setFeaturedProducts(prods.slice(0, 3));
        }
      })
      .catch((err) => {
        console.error('Error al cargar productos destacados del catálogo:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingProducts(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const cleanPhone = formatPhoneForWhatsApp(settings.phone);
  const waUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(
    `Hola ${settings.name}, quisiera agendar un mantenimiento para mi bicicleta en el taller.`
  )}`;

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
          <Bike className="w-3.5 h-3.5" />
          <span>{settings.header_slogan || 'Taller Profesional de Bicicletas'}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Cuidamos tu bicicleta con precisión y estándares técnicos.
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Mantenimiento preventivo y correctivo, repuestos originales de alta gama, diagnóstico computarizado y atención técnica personalizada.
        </p>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/productos"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <span>Ver Catálogo de Productos</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href={waUrl}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Consultar por WhatsApp</span>
          </a>
        </div>
      </section>

      {/* Repuestos Destacados con Imágenes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Repuestos y Accesorios Disponibles
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Componentes originales en stock físico para instalación inmediata en taller
            </p>
          </div>
          <Link to="/productos" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium">
            <span>Ver todo el catálogo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs animate-pulse"
              >
                <div className="h-36 w-full bg-slate-200 dark:bg-slate-800" />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                to={`/productos?p=${product.id}`}
                className="group rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="h-36 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                  <img
                    src={product.image_url || DEFAULT_PRODUCT_IMAGE}
                    alt={product.name}
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.available ? (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-600/90 text-white backdrop-blur-xs shadow-xs">
                      En stock
                    </span>
                  ) : (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-600/90 text-white backdrop-blur-xs shadow-xs">
                      Consultar
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <span className="text-[10px] font-mono text-slate-400 uppercase truncate block">
                    {product.brand ? `${product.brand} • ` : ''}
                    {product.category_name}
                  </span>
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      ${product.price.toLocaleString('es-CO')}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">COP</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
            <Package className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
              Contamos con repuestos y accesorios en taller. Visita nuestro catálogo en línea o contáctanos por WhatsApp.
            </p>
            <Link
              to="/productos"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              <span>Explorar catálogo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </section>

      {/* Servicios Principales */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <div className="w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600">
            <Wrench className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Mantenimiento General</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Desarme completo, limpieza por ultrasonido, engrase de rodamientos con lubricantes hidrofóbicos y ajuste milimétrico de cambios.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <div className="w-8 h-8 rounded-md bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Repuestos Originales</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Trabajamos con componentes y consumibles certificados: Shimano, SRAM, Maxxis, Continental, Park Tool y Finish Line.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <div className="w-8 h-8 rounded-md bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600">
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Garantía y Rapidez</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Entregas puntuales, diagnósticos claros y respaldo técnico con repuestos garantizados en cada servicio.
          </p>
        </div>
      </section>

      {/* Información del Taller */}
      <section className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            Visítanos en {settings.name}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {settings.address}
            {settings.city ? ` • ${settings.city}` : ''} • Tel: {settings.phone}
          </p>
        </div>
        <div className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 shrink-0 text-center sm:text-left">
          Horario: {settings.weekday_hours || '08:00 - 18:00'} (Sáb: {settings.saturday_hours || '08:00 - 14:00'})
        </div>
      </section>
    </div>
  );
};

