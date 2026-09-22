import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Product, ProductInsert, ProductUpdate, ProductCategory, InventoryMovement } from '../types/database';

const LOCAL_STORAGE_PRODUCTS = 'a2ruedas_products_cache';
const LOCAL_STORAGE_MOVEMENTS = 'a2ruedas_movements_cache';
const LOCAL_STORAGE_CATEGORIES = 'a2ruedas_categories_cache';

const defaultCategories: ProductCategory[] = [
  { id: 'cat-bikes', name: 'Bicicletas Convencionales', slug: 'bicicletas', description: 'Bicicletas de ruta, gravel, montaña (MTB), urbanas y BMX', created_at: new Date().toISOString() },
  { id: 'cat-ebikes', name: 'Bicicletas Eléctricas (E-Bikes)', slug: 'bicis-electricas', description: 'Bicicletas asistidas, baterías de litio, motores y cargadores', created_at: new Date().toISOString() },
  { id: 'cat-apparel', name: 'Ropa y Equipamiento', slug: 'ropa-equipamiento', description: 'Jerseys técnicos, badanas, chaquetas cortavientos, guantes y zapatillas', created_at: new Date().toISOString() },
  { id: 'cat-nutrition', name: 'Nutrición y Suplementos', slug: 'suplementos-nutricion', description: 'Geles energéticos, hidratantes isotónicos, electrolitos y barras de proteína', created_at: new Date().toISOString() },
  { id: 'cat-1', name: 'Transmisión', slug: 'transmision', description: 'Cadenas, piñones, cassettes, tensores y mandos', created_at: new Date().toISOString() },
  { id: 'cat-2', name: 'Frenos', slug: 'frenos', description: 'Pastillas, mordazas, discos, rotores y líquido', created_at: new Date().toISOString() },
  { id: 'cat-3', name: 'Llantas y Neumáticos', slug: 'llantas-neumaticos', description: 'Corazas, neumáticos, sellante tubeless y válvulas', created_at: new Date().toISOString() },
  { id: 'cat-4', name: 'Mantenimiento y Grasa', slug: 'mantenimiento-grasa', description: 'Lubricantes, desengrasantes, grasas especiales y ceras', created_at: new Date().toISOString() },
  { id: 'cat-5', name: 'Pedales y Calas', slug: 'pedales-calas', description: 'Pedales automáticos, plataformas y calas SPD/Look', created_at: new Date().toISOString() },
  { id: 'cat-6', name: 'Accesorios y Cascos', slug: 'accesorios', description: 'Portacaramañolas, infladores, herramientas y cascos', created_at: new Date().toISOString() },
];

const initialProducts: Product[] = [];
const initialMovements: InventoryMovement[] = [];

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

function getLocalCategories(): ProductCategory[] {
  const cached = localStorage.getItem(LOCAL_STORAGE_CATEGORIES);
  if (!cached) {
    localStorage.setItem(LOCAL_STORAGE_CATEGORIES, JSON.stringify(defaultCategories));
    return defaultCategories;
  }
  try {
    const parsed = JSON.parse(cached);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultCategories;
  } catch {
    return defaultCategories;
  }
}

function saveLocalCategories(list: ProductCategory[]) {
  localStorage.setItem(LOCAL_STORAGE_CATEGORIES, JSON.stringify(list));
}

export const inventoryService = {
  async getCategories(): Promise<ProductCategory[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('product_categories').select('*').order('name');
        if (!error && data && data.length > 0) {
          saveLocalCategories(data);
          return data;
        }
      } catch (err) {
        console.warn('Usando categorías locales:', err);
      }
    }
    return getLocalCategories();
  },

  async createCategory(categoryData: { name: string; description?: string; slug?: string }): Promise<ProductCategory> {
    const slug =
      categoryData.slug ||
      categoryData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const newCategory: ProductCategory = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: categoryData.name.trim(),
      slug,
      description: categoryData.description?.trim() || null,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('product_categories')
          .insert({
            name: newCategory.name,
            slug: newCategory.slug,
            description: newCategory.description,
          })
          .select()
          .single();

        if (!error && data) {
          const list = getLocalCategories();
          saveLocalCategories([...list, data]);
          return data;
        }
      } catch (err) {
        console.warn('Error al guardar categoría en Supabase, persistiendo localmente:', err);
      }
    }

    const current = getLocalCategories();
    const updated = [...current, newCategory];
    saveLocalCategories(updated);
    return newCategory;
  },

  async updateCategory(id: string, updates: { name?: string; description?: string }): Promise<ProductCategory> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('product_categories')
          .update({
            ...(updates.name ? { name: updates.name.trim() } : {}),
            ...(updates.description !== undefined ? { description: updates.description.trim() } : {}),
          })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          const list = getLocalCategories().map((c) => (c.id === id ? data : c));
          saveLocalCategories(list);
          return data;
        }
      } catch (err) {
        console.warn('Error al actualizar categoría en Supabase:', err);
      }
    }

    const current = getLocalCategories();
    const target = current.find((c) => c.id === id);
    if (!target) throw new Error('Categoría no encontrada');

    const updatedCat: ProductCategory = {
      ...target,
      name: updates.name !== undefined ? updates.name.trim() : target.name,
      description: updates.description !== undefined ? updates.description.trim() : target.description,
    };

    const updatedList = current.map((c) => (c.id === id ? updatedCat : c));
    saveLocalCategories(updatedList);
    return updatedCat;
  },

  async deleteCategory(id: string): Promise<boolean> {
    // 1. Validar si hay productos asignados a esta categoría
    const products = await this.getProducts();
    const hasProducts = products.some((p) => p.category_id === id);
    if (hasProducts) {
      throw new Error(
        'No es posible eliminar esta categoría porque contiene productos asignados. Reasigna o elimina los productos primero.'
      );
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('product_categories').delete().eq('id', id);
        if (!error) {
          const list = getLocalCategories().filter((c) => c.id !== id);
          saveLocalCategories(list);
          return true;
        }
      } catch (err) {
        console.warn('Error al eliminar categoría en Supabase:', err);
      }
    }

    const current = getLocalCategories();
    const updatedList = current.filter((c) => c.id !== id);
    saveLocalCategories(updatedList);
    return true;
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
