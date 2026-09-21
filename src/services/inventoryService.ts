import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Product, ProductInsert, ProductUpdate, ProductCategory, InventoryMovement } from '../types/database';

const LOCAL_STORAGE_PRODUCTS = 'a2ruedas_products_cache';
const LOCAL_STORAGE_MOVEMENTS = 'a2ruedas_movements_cache';

const defaultCategories: ProductCategory[] = [
  { id: 'cat-1', name: 'Transmisión', slug: 'transmision', description: 'Cadenas, piñones, cassettes, tensores y mandos', created_at: new Date().toISOString() },
  { id: 'cat-2', name: 'Frenos', slug: 'frenos', description: 'Pastillas, mordazas, discos, rotores y líquido', created_at: new Date().toISOString() },
  { id: 'cat-3', name: 'Llantas y Neumáticos', slug: 'llantas-neumaticos', description: 'Corazas, neumáticos, sellante tubeless y válvulas', created_at: new Date().toISOString() },
  { id: 'cat-4', name: 'Mantenimiento y Grasa', slug: 'mantenimiento-grasa', description: 'Lubricantes, desengrasantes, grasas especiales y ceras', created_at: new Date().toISOString() },
  { id: 'cat-5', name: 'Pedales y Calas', slug: 'pedales-calas', description: 'Pedales automáticos, plataformas y calas SPD/Look', created_at: new Date().toISOString() },
  { id: 'cat-6', name: 'Accesorios y Cascos', slug: 'accesorios', description: 'Portacaramañolas, infladores, herramientas y cascos', created_at: new Date().toISOString() },
];

const initialProducts: Product[] = [
  {
    id: 'prod-001',
    sku: 'REP-CAD-09',
    category_id: 'cat-1',
    name: 'Cadena Shimano 9V Deore CN-HG53',
    brand: 'Shimano',
    description: 'Cadena de 9 velocidades para MTB y ruta con pasadores reforzados y cierre rápido.',
    cost_price: 52000,
    sale_price: 85000,
    stock: 1, // Provoca alerta de stock bajo (min_stock = 2)
    min_stock: 2,
    unit: 'unidad',
    location: 'Estante A-1',
    image_url: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=700&q=80',
    images: [
      'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=700&q=80',
    ],
    is_active: true,
    created_at: new Date('2026-01-10').toISOString(),
    updated_at: new Date('2026-01-10').toISOString(),
  },
  {
    id: 'prod-002',
    sku: 'FRE-PAS-B05',
    category_id: 'cat-2',
    name: 'Pastillas de Freno Shimano B05S Resina',
    brand: 'Shimano',
    description: 'Compuesto de resina silencioso de alta duración para mordazas MT200 y Acera.',
    cost_price: 24000,
    sale_price: 45000,
    stock: 2, // En nivel mínimo de stock
    min_stock: 2,
    unit: 'par',
    location: 'Gaveta B-3',
    image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=700&q=80',
    images: [
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=700&q=80',
    ],
    is_active: true,
    created_at: new Date('2026-01-12').toISOString(),
    updated_at: new Date('2026-01-12').toISOString(),
  },
  {
    id: 'prod-003',
    sku: 'LUB-FIN-120',
    category_id: 'cat-4',
    name: 'Lubricante Seco Finish Line Dry Teflon 120ml',
    brand: 'Finish Line',
    description: 'Lubricante sintético con teflón para climas secos y polvorientos. No acumula mugre.',
    cost_price: 21000,
    sale_price: 38000,
    stock: 14,
    min_stock: 3,
    unit: 'unidad',
    location: 'Vitrina Mostrador',
    image_url: 'https://images.unsplash.com/photo-1618762044398-ec1e7e048bbd?auto=format&fit=crop&w=700&q=80',
    images: [
      'https://images.unsplash.com/photo-1618762044398-ec1e7e048bbd?auto=format&fit=crop&w=700&q=80',
    ],
    is_active: true,
    created_at: new Date('2026-01-15').toISOString(),
    updated_at: new Date('2026-01-15').toISOString(),
  },
  {
    id: 'prod-004',
    sku: 'LLA-MAXX-IKON',
    category_id: 'cat-3',
    name: 'Coraza Maxxis Ikon 29x2.20 EXO TR',
    brand: 'Maxxis',
    description: 'Cubierta rodadora ligera para cross country con protección EXO y lista para tubeless.',
    cost_price: 135000,
    sale_price: 210000,
    stock: 6,
    min_stock: 2,
    unit: 'unidad',
    location: 'Estante C-2',
    image_url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=700&q=80',
    images: [
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=700&q=80',
    ],
    is_active: true,
    created_at: new Date('2026-02-01').toISOString(),
    updated_at: new Date('2026-02-01').toISOString(),
  },
];

const initialMovements: InventoryMovement[] = [
  {
    id: 'mov-001',
    product_id: 'prod-001',
    movement_type: 'in',
    quantity: 5,
    previous_stock: 0,
    new_stock: 5,
    reason: 'Inventario inicial de apertura de taller',
    created_at: new Date('2026-01-10T09:00:00Z').toISOString(),
  },
  {
    id: 'mov-002',
    product_id: 'prod-001',
    movement_type: 'out',
    quantity: 4,
    previous_stock: 5,
    new_stock: 1,
    reason: 'Instalación en servicio OT-000001 (Trek Marlin)',
    created_at: new Date('2026-01-15T14:30:00Z').toISOString(),
  },
  {
    id: 'mov-003',
    product_id: 'prod-002',
    movement_type: 'in',
    quantity: 6,
    previous_stock: 0,
    new_stock: 6,
    reason: 'Compra a distribuidor Shimano Colombia',
    created_at: new Date('2026-01-12T10:15:00Z').toISOString(),
  },
  {
    id: 'mov-004',
    product_id: 'prod-002',
    movement_type: 'out',
    quantity: 4,
    previous_stock: 6,
    new_stock: 2,
    reason: 'Venta de mostrador y servicio de frenos',
    created_at: new Date('2026-01-18T16:00:00Z').toISOString(),
  },
  {
    id: 'mov-005',
    product_id: 'prod-003',
    movement_type: 'in',
    quantity: 15,
    previous_stock: 0,
    new_stock: 15,
    reason: 'Recepción pedido lubricantes Finish Line',
    created_at: new Date('2026-01-15T11:00:00Z').toISOString(),
  },
  {
    id: 'mov-006',
    product_id: 'prod-003',
    movement_type: 'out',
    quantity: 1,
    previous_stock: 15,
    new_stock: 14,
    reason: 'Venta mostrador a cliente habitual',
    created_at: new Date('2026-01-20T12:00:00Z').toISOString(),
  },
];

function getLocalProducts(): Product[] {
  const cached = localStorage.getItem(LOCAL_STORAGE_PRODUCTS);
  if (!cached) {
    localStorage.setItem(LOCAL_STORAGE_PRODUCTS, JSON.stringify(initialProducts));
    return initialProducts;
  }
  try {
    return JSON.parse(cached);
  } catch {
    return initialProducts;
  }
}

function saveLocalProducts(list: Product[]) {
  localStorage.setItem(LOCAL_STORAGE_PRODUCTS, JSON.stringify(list));
}

function getLocalMovements(): InventoryMovement[] {
  const cached = localStorage.getItem(LOCAL_STORAGE_MOVEMENTS);
  if (!cached) {
    localStorage.setItem(LOCAL_STORAGE_MOVEMENTS, JSON.stringify(initialMovements));
    return initialMovements;
  }
  try {
    return JSON.parse(cached);
  } catch {
    return initialMovements;
  }
}

function saveLocalMovements(list: InventoryMovement[]) {
  localStorage.setItem(LOCAL_STORAGE_MOVEMENTS, JSON.stringify(list));
}

export const inventoryService = {
  async getCategories(): Promise<ProductCategory[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('product_categories').select('*').order('name');
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn('Usando categorías locales:', err);
      }
    }
    return defaultCategories;
  },

  async getProducts(categoryId?: string, searchTerm?: string): Promise<Product[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('products').select('*, category:product_categories(*)').order('name');
        if (categoryId) query = query.eq('category_id', categoryId);
        if (searchTerm) {
          query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          saveLocalProducts(data);
          return data;
        }
      } catch (err) {
        console.warn('Usando productos locales:', err);
      }
    }

    let list = getLocalProducts();
    const categories = await this.getCategories();
    const catMap = new Map(categories.map((c) => [c.id, c]));

    list = list.map((p) => ({
      ...p,
      category: p.category || catMap.get(p.category_id),
    }));

    if (categoryId) list = list.filter((p) => p.category_id === categoryId);
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          p.brand.toLowerCase().includes(term) ||
          (p.location && p.location.toLowerCase().includes(term)),
      );
    }
    return list;
  },

  async getProductById(id: string): Promise<Product | null> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, category:product_categories(*)')
          .eq('id', id)
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Error al obtener producto en Supabase:', err);
      }
    }
    const list = await this.getProducts();
    return list.find((p) => p.id === id) || null;
  },

  async getLowStockProducts(): Promise<Product[]> {
    const all = await this.getProducts();
    return all.filter((p) => p.stock <= p.min_stock);
  },

  async createProduct(product: ProductInsert): Promise<Product> {
    const now = new Date().toISOString();
    const newProd: Product = {
      ...product,
      id: crypto.randomUUID ? crypto.randomUUID() : `prod-${Date.now()}`,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('products').insert([product]).select().single();
        if (!error && data) {
          const list = getLocalProducts();
          saveLocalProducts([data, ...list]);

          // Registrar movimiento inicial de stock si es > 0
          if (product.stock > 0) {
            await this.adjustStock(data.id, product.stock, 'in', 'Inventario inicial al crear referencia');
          }
          return data;
        }
      } catch (err) {
        console.warn('Error al crear producto en Supabase:', err);
      }
    }

    const list = getLocalProducts();
    saveLocalProducts([newProd, ...list]);

    // Registrar movimiento inicial si stock > 0
    if (newProd.stock > 0) {
      const initialMov: InventoryMovement = {
        id: crypto.randomUUID ? crypto.randomUUID() : `mov-${Date.now()}`,
        product_id: newProd.id,
        movement_type: 'in',
        quantity: newProd.stock,
        previous_stock: 0,
        new_stock: newProd.stock,
        reason: 'Inventario inicial al crear referencia',
        created_at: now,
      };
      const movements = getLocalMovements();
      saveLocalMovements([initialMov, ...movements]);
    }

    return newProd;
  },

  async updateProduct(id: string, updates: ProductUpdate): Promise<Product> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('products')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) {
          const list = getLocalProducts().map((p) => (p.id === id ? data : p));
          saveLocalProducts(list);
          return data;
        }
      } catch (err) {
        console.warn('Error al actualizar producto en Supabase:', err);
      }
    }

    const list = getLocalProducts();
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Producto no encontrado');
    const updated: Product = { ...list[index], ...updates, updated_at: now };
    list[index] = updated;
    saveLocalProducts(list);
    return updated;
  },

  async deleteProduct(id: string): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (!error) {
          const list = getLocalProducts().filter((p) => p.id !== id);
          saveLocalProducts(list);
          return;
        }
      } catch (err) {
        console.warn('Error al eliminar producto en Supabase:', err);
      }
    }

    const list = getLocalProducts().filter((p) => p.id !== id);
    saveLocalProducts(list);
  },

  async adjustStock(
    productId: string,
    quantity: number,
    movementType: 'in' | 'out' | 'adjustment',
    reason: string,
  ): Promise<{ product: Product; movement: InventoryMovement }> {
    const list = getLocalProducts();
    const index = list.findIndex((p) => p.id === productId);
    if (index === -1) throw new Error('Producto no encontrado');

    const product = list[index];
    const previousStock = product.stock;
    let newStock = previousStock;

    if (movementType === 'in') {
      newStock = previousStock + quantity;
    } else if (movementType === 'out') {
      if (previousStock < quantity) {
        throw new Error(`Stock insuficiente. Stock actual: ${previousStock}, Solicitado: ${quantity}`);
      }
      newStock = previousStock - quantity;
    } else if (movementType === 'adjustment') {
      newStock = quantity;
    }

    const movement: InventoryMovement = {
      id: crypto.randomUUID ? crypto.randomUUID() : `mov-${Date.now()}`,
      product_id: productId,
      movement_type: movementType,
      quantity,
      previous_stock: previousStock,
      new_stock: newStock,
      reason,
      created_at: new Date().toISOString(),
      product,
    };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('products').update({ stock: newStock }).eq('id', productId);
        await supabase.from('inventory_movements').insert([movement]);
      } catch (err) {
        console.warn('Error al registrar movimiento en Supabase:', err);
      }
    }

    product.stock = newStock;
    product.updated_at = new Date().toISOString();
    list[index] = product;
    saveLocalProducts(list);

    const movements = getLocalMovements();
    saveLocalMovements([movement, ...movements]);

    return { product, movement };
  },

  async getMovements(productId?: string): Promise<InventoryMovement[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('inventory_movements')
          .select('*, product:products(*)')
          .order('created_at', { ascending: false });
        if (productId) query = query.eq('product_id', productId);
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn('Error al consultar movimientos en Supabase:', err);
      }
    }

    const local = getLocalMovements();
    const products = await this.getProducts();
    const prodMap = new Map(products.map((p) => [p.id, p]));

    const populated = local.map((m) => ({
      ...m,
      product: m.product || prodMap.get(m.product_id),
    }));

    if (!productId) return populated;
    return populated.filter((m) => m.product_id === productId);
  },
};
