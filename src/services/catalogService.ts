import { inventoryService } from './inventoryService';
import { workshopSettingsService, formatPhoneForWhatsApp } from './workshopSettingsService';
import { Product } from '../types/database';


export interface PublicCatalogProduct {
  id: string;
  sku: string;
  category_id: string;
  category_name: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  available: boolean;
  stock_quantity: number;
  unit: string;
  image_url: string;
  images: string[];
}

export interface PublicCategoryCount {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface CartItem {
  product: PublicCatalogProduct;
  quantity: number;
}

export type CatalogSortOption = 'relevance' | 'price_asc' | 'price_desc' | 'name_asc';

export const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80';

/**
 * Sanitiza un producto de la base de datos interna para consumo público seguro.
 * Elimina: precio de costo (cost_price), stock mínimo (min_stock), ubicación física (location).
 */
export function sanitizePublicProduct(product: Product): PublicCatalogProduct {
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : product.image_url
    ? [product.image_url]
    : [DEFAULT_PRODUCT_IMAGE];

  return {
    id: product.id,
    sku: product.sku,
    category_id: product.category_id,
    category_name: product.category?.name || 'General',
    name: product.name,
    brand: product.brand,
    description: product.description || 'Repuesto y accesorio para ciclismo garantizado por A2Ruedas.',
    price: product.sale_price,
    available: product.stock > 0,
    stock_quantity: product.stock,
    unit: product.unit || 'unidad',
    image_url: product.image_url || images[0] || DEFAULT_PRODUCT_IMAGE,
    images,
  };
}

export const catalogService = {
  /**
   * Obtiene todos los productos públicos activos sanitizados
   */
  async getPublicProducts(options?: {
    categoryId?: string;
    searchTerm?: string;
    onlyAvailable?: boolean;
    sortBy?: CatalogSortOption;
  }): Promise<PublicCatalogProduct[]> {
    const rawProducts = await inventoryService.getProducts();

    // 1. Filtrar únicamente productos activos para la vitrina pública
    let activeProducts = rawProducts.filter((p) => p.is_active);

    // 2. Sanitizar retirando datos sensibles de costo y almacén
    let publicProducts = activeProducts.map(sanitizePublicProduct);

    // 3. Filtro por categoría
    if (options?.categoryId && options.categoryId !== 'ALL') {
      publicProducts = publicProducts.filter((p) => p.category_id === options.categoryId);
    }

    // 4. Filtro por búsqueda de texto (nombre, marca, SKU o categoría)
    if (options?.searchTerm) {
      const term = options.searchTerm.toLowerCase().trim();
      publicProducts = publicProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.brand.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          p.category_name.toLowerCase().includes(term)
      );
    }

    // 5. Filtro de disponibilidad inmediata
    if (options?.onlyAvailable) {
      publicProducts = publicProducts.filter((p) => p.available);
    }

    // 6. Ordenamiento
    if (options?.sortBy) {
      switch (options.sortBy) {
        case 'price_asc':
          publicProducts.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          publicProducts.sort((a, b) => b.price - a.price);
          break;
        case 'name_asc':
          publicProducts.sort((a, b) => a.name.localeCompare(b.name, 'es'));
          break;
        case 'relevance':
        default:
          // Mantiene el orden preferente (disponibles primero)
          publicProducts.sort((a, b) => Number(b.available) - Number(a.available));
          break;
      }
    }

    return publicProducts;
  },

  /**
   * Obtiene las categorías públicas con el conteo de productos activos en cada una
   */
  async getPublicCategories(): Promise<PublicCategoryCount[]> {
    const [categories, rawProducts] = await Promise.all([
      inventoryService.getCategories(),
      inventoryService.getProducts(),
    ]);

    const activeProducts = rawProducts.filter((p) => p.is_active);

    const counts: PublicCategoryCount[] = categories.map((cat) => {
      const count = activeProducts.filter((p) => p.category_id === cat.id).length;
      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        count,
      };
    });

    return counts;
  },

  /**
   * Busca un producto por ID o por SKU para enlaces directos
   */
  async getPublicProductByIdOrSku(idOrSku: string): Promise<PublicCatalogProduct | null> {
    const rawProducts = await inventoryService.getProducts();
    const product = rawProducts.find(
      (p) => p.is_active && (p.id === idOrSku || p.sku.toUpperCase() === idOrSku.toUpperCase())
    );

    return product ? sanitizePublicProduct(product) : null;
  },

  /**
   * Construye el enlace dinámico de cotización y consulta para WhatsApp
   */
  generateWhatsAppInquiryUrl(cartItems: CartItem[]): string {
    if (!cartItems || cartItems.length === 0) return '';

    const settings = workshopSettingsService.getSettings();
    const cleanPhone = formatPhoneForWhatsApp(settings.phone);
    const workshopName = settings.name || 'A2Ruedas Taller';


    let total = 0;
    const itemsList = cartItems
      .map((item, idx) => {
        const lineTotal = item.product.price * item.quantity;
        total += lineTotal;
        return `${idx + 1}. *${item.quantity}x ${item.product.name}* (${item.product.brand})\n   • Ref: ${item.product.sku} | $${item.product.price.toLocaleString('es-CO')} c/u = $${lineTotal.toLocaleString('es-CO')}`;
      })
      .join('\n\n');

    const message = `¡Hola *${workshopName}*! 👋🚴\n\nEstuve revisando su catálogo público y me gustaría consultar disponibilidad para adquirir los siguientes repuestos en el taller:\n\n${itemsList}\n\n━━━━━━━━━━━━━━━━━━━━\n💰 *Total Estimado:* $${total.toLocaleString('es-CO')} COP\n\n¿Tienen disponibilidad para retiro o instalación en el taller? ¡Muchas gracias!`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  },
};
