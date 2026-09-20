import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Product, ProductInsert, ProductUpdate, ProductCategory, InventoryMovement } from '../types/database';

const LOCAL_STORAGE_PRODUCTS = 'a2ruedas_products_cache';
const LOCAL_STORAGE_MOVEMENTS = 'a2ruedas_movements_cache';

const defaultCategories: ProductCategory[] = [
  { id: 'cat-1', name: 'Transmisión', slug: 'transmision', description: 'Cadenas, piñones y mandos', created_at: new Date().toISOString() },
  { id: 'cat-2', name: 'Frenos', slug: 'frenos', description: 'Pastillas, mordazas y discos', created_at: new Date().toISOString() },
  { id: 'cat-3', name: 'Llantas y Neumáticos', slug: 'llantas-neumaticos', description: 'Corazas y neumáticos', created_at: new Date().toISOString() },
  { id: 'cat-4', name: 'Mantenimiento y Grasa', slug: 'mantenimiento-grasa', description: 'Lubricantes y desengrasantes', created_at: new Date().toISOString() },
  { id: 'cat-5', name: 'Pedales y Calas', slug: 'pedales-calas', description: 'Pedales automáticos y calas', created_at: new Date().toISOString() },
];

const initialProducts: Product[] = [
  {
    id: 'prod-001',
    sku: 'REP-CAD-09',
    category_id: 'cat-1',
    name: 'Cadena Shimano 9V Deore CN-HG53',
    brand: 'Shimano',
    description: 'Cadena de 9 velocidades para MTB y ruta con pasadores reforzados.',
    cost_price: 52000,
    sale_price: 85000,
    stock: 1, // Provoca alerta de stock bajo (min_stock = 2)
    min_stock: 2,
    unit: 'unidad',
    location: 'Estante A-1',
    image_url: 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=700&q=80',
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
    description: 'Compuesto de resina silencioso para mordazas MT200.',
    cost_price: 24000,
    sale_price: 45000,
    stock: 2,
    min_stock: 2,
    unit: 'par',
    location: 'Gaveta B-3',
    image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=700&q=80',
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
    description: 'Lubricante sintético con teflón para climas secos y polvorientos.',
    cost_price: 21000,
    sale_price: 38000,
    stock: 14,
    min_stock: 3,
    unit: 'unidad',
    location: 'Mostrador',
    image_url: 'https://images.unsplash.com/photo-1618762044398-ec1e7e048bbd?auto=format&fit=crop&w=700&q=80',
    is_active: true,
    created_at: new Date('2026-01-15').toISOString(),
    updated_at: new Date('2026-01-15').toISOString(),
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
  if (!cached) return [];
  try {
    return JSON.parse(cached);
  } catch {
    return [];
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
    if (categoryId) list = list.filter((p) => p.category_id === categoryId);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          p.brand.toLowerCase().includes(term),
      );
    }
    return list;
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
          return data;
        }
      } catch (err) {
        console.warn('Error al crear producto en Supabase:', err);
      }
    }

    const list = getLocalProducts();
    saveLocalProducts([newProd, ...list]);
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
        let query = supabase.from('inventory_movements').select('*, product:products(*)').order('created_at', { ascending: false });
        if (productId) query = query.eq('product_id', productId);
        const { data, error } = await query;
        if (!error && data) return data;
      } catch (err) {
        console.warn('Error al consultar movimientos en Supabase:', err);
      }
    }

    const local = getLocalMovements();
    if (!productId) return local;
    return local.filter((m) => m.product_id === productId);
  },
};
