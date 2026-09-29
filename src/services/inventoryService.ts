import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Product, ProductInsert, ProductUpdate, ProductCategory, InventoryMovement } from '../types/database';

const LOCAL_STORAGE_PRODUCTS = 'a2ruedas_products_cache';
const LOCAL_STORAGE_MOVEMENTS = 'a2ruedas_movements_cache';
const LOCAL_STORAGE_CATEGORIES = 'a2ruedas_categories_cache';

const defaultCategories: ProductCategory[] = [
  { id: '1a2b2bf9-fe6f-46e6-a8d4-3a18103766c5', name: 'Bicicletas Convencionales', slug: 'bicicletas', description: 'Bicicletas de ruta, gravel, montaña (MTB), urbanas y BMX', created_at: '2026-09-29T00:00:56.402069+00:00' },
  { id: '68bd25db-054f-460c-b921-8b9944e351d5', name: 'Bicicletas Eléctricas (E-Bikes)', slug: 'bicis-electricas', description: 'Bicicletas asistidas, baterías de litio, motores y cargadores', created_at: '2026-09-29T00:00:56.892916+00:00' },
  { id: '0d9a138f-473d-481d-a5f1-8119759d6296', name: 'Ropa y Equipamiento', slug: 'ropa-equipamiento', description: 'Jerseys técnicos, badanas, chaquetas cortavientos, guantes y zapatillas', created_at: '2026-09-29T00:00:57.394898+00:00' },
  { id: '1e8f0998-05a9-43d3-b0b0-9bb082a8154f', name: 'Nutrición y Suplementos', slug: 'suplementos-nutricion', description: 'Geles energéticos, hidratantes isotónicos, electrolitos y barras de proteína', created_at: '2026-09-29T00:00:57.879017+00:00' },
  { id: 'c074d156-e7f4-482a-8a27-a992269753e9', name: 'Accesorios y Cascos', slug: 'accesorios', description: 'Portacaramañolas, infladores, herramientas y cascos', created_at: '2026-09-29T00:00:58.347078+00:00' },
  { id: 'db25d356-cba5-49cf-aaa1-0b7865a11b1a', name: 'Transmisión', slug: 'transmision', description: 'Cadenas, piñones, coronas, tensores y mandos de cambio', created_at: '2026-09-26T16:02:15.433789+00:00' },
  { id: '1a3d7128-eb20-46fb-a507-740ce3ea36ce', name: 'Frenos', slug: 'frenos', description: 'Pastillas, discos, zapatas, mordazas y guayas de freno', created_at: '2026-09-26T16:02:15.433789+00:00' },
  { id: '6eed6583-940c-456f-923e-279ffa035c6d', name: 'Llantas y Neumáticos', slug: 'llantas-neumaticos', description: 'Corazas tubeless, neumáticos, válvulas y sellantes', created_at: '2026-09-26T16:02:15.433789+00:00' },
  { id: 'c9e08e92-411f-44a0-acf3-4baec5a8c334', name: 'Mantenimiento y Grasa', slug: 'mantenimiento-grasa', description: 'Lubricantes de cadena, desengrasantes y grasas de rodamientos', created_at: '2026-09-26T16:02:15.433789+00:00' },
  { id: '1081ab24-7efe-4112-9415-8e8c6d3155e0', name: 'Pedales y Calas', slug: 'pedales-calas', description: 'Pedales automáticos, plataformas y calas SPD', created_at: '2026-09-26T16:02:15.433789+00:00' },
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
        if (!error && data) {
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
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-0000-0000-' + String(Date.now()).padStart(12, '0').slice(-12),
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
        if (!error && data) {
          saveLocalProducts(data);
          return data;
        }
        if (error) {
          console.warn('Error al consultar productos en Supabase:', error.message);
        }
      } catch (err) {
        console.warn('Error inesperado al consultar productos en Supabase:', err);
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
      const dbPayload = {
        sku: product.sku,
        category_id: product.category_id,
        name: product.name,
        brand: product.brand,
        description: product.description || null,
        sale_price: Number(product.sale_price) || 0,
        stock: Number(product.stock) || 0,
        min_stock: Number(product.min_stock) || 0,
        unit: product.unit || 'unidad',
        location: product.location || null,
        image_url: product.image_url || null,
        images: Array.isArray(product.images)
          ? product.images
          : product.image_url
          ? [product.image_url]
          : [],
        is_active: product.is_active !== undefined ? product.is_active : true,
      };

      const { data, error } = await supabase.from('products').insert([dbPayload]).select().single();
      if (error) {
        console.error('Error al crear producto en Supabase:', error);
        throw new Error(`Error en base de datos: ${error.message}`);
      }
      if (data) {
        const list = getLocalProducts();
        saveLocalProducts([data, ...list]);

        // Registrar movimiento inicial de stock si es > 0
        if (product.stock > 0) {
          try {
            await this.adjustStock(data.id, product.stock, 'in', 'Inventario inicial al crear referencia');
          } catch (e) {
            console.warn('Error al asentar stock inicial:', e);
          }
        }
        return data;
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
      const dbUpdates: Record<string, any> = {};
      if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
      if (updates.category_id !== undefined) dbUpdates.category_id = updates.category_id;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.sale_price !== undefined) dbUpdates.sale_price = Number(updates.sale_price) || 0;
      if (updates.stock !== undefined) dbUpdates.stock = Number(updates.stock) || 0;
      if (updates.min_stock !== undefined) dbUpdates.min_stock = Number(updates.min_stock) || 0;
      if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.image_url !== undefined) dbUpdates.image_url = updates.image_url;
      if (updates.images !== undefined) dbUpdates.images = updates.images;
      if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;

      const { data, error } = await supabase
        .from('products')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('Error al actualizar producto en Supabase:', error);
        throw new Error(`Error en base de datos: ${error.message}`);
      }
      if (data) {
        const list = getLocalProducts().map((p) => (p.id === id ? data : p));
        saveLocalProducts(list);
        return data;
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
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        console.error('Error al eliminar producto en Supabase:', error);
        throw new Error(`Error en base de datos: ${error.message}`);
      }
      const list = getLocalProducts().filter((p) => p.id !== id);
      saveLocalProducts(list);
      return;
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
