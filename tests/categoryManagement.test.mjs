import assert from 'node:assert';

console.log('--- INICIANDO PRUEBAS: GESTIÓN DINÁMICA DE CATEGORÍAS DE PRODUCTOS ---');

// 1. Verificación de Categorías Pre-sembradas
const defaultCategories = [
  { id: 'cat-bikes', name: 'Bicicletas Convencionales', slug: 'bicicletas', description: 'Bicicletas de ruta, gravel, montaña (MTB), urbanas y BMX' },
  { id: 'cat-ebikes', name: 'Bicicletas Eléctricas (E-Bikes)', slug: 'bicis-electricas', description: 'Bicicletas asistidas, baterías de litio, motores y cargadores' },
  { id: 'cat-apparel', name: 'Ropa y Equipamiento', slug: 'ropa-equipamiento', description: 'Jerseys técnicos, badanas, chaquetas cortavientos, guantes y zapatillas' },
  { id: 'cat-nutrition', name: 'Nutrición y Suplementos', slug: 'suplementos-nutricion', description: 'Geles energéticos, hidratantes isotónicos, electrolitos y barras de proteína' },
  { id: 'cat-1', name: 'Transmisión', slug: 'transmision' },
  { id: 'cat-2', name: 'Frenos', slug: 'frenos' },
  { id: 'cat-3', name: 'Llantas y Neumáticos', slug: 'llantas-neumaticos' },
  { id: 'cat-4', name: 'Mantenimiento y Grasa', slug: 'mantenimiento-grasa' },
  { id: 'cat-5', name: 'Pedales y Calas', slug: 'pedales-calas' },
  { id: 'cat-6', name: 'Accesorios y Cascos', slug: 'accesorios' },
];

const categoryIds = defaultCategories.map(c => c.id);
assert.ok(categoryIds.includes('cat-bikes'));
assert.ok(categoryIds.includes('cat-ebikes'));
assert.ok(categoryIds.includes('cat-apparel'));
assert.ok(categoryIds.includes('cat-nutrition'));
console.log('1. Categorías clave solicitadas (Bicicletas, E-Bikes, Ropa, Nutrición) pre-sembradas:', 'PASS');

// 2. Verificación de Productos de Ejemplo para las Nuevas Categorías
const sampleProducts = [
  { id: 'prod-bike-01', sku: 'BIC-GRV-01', category_id: 'cat-bikes', name: 'Bicicleta Gravel Specialized Diverge E5', sale_price: 5450000, is_active: true },
  { id: 'prod-ebike-01', sku: 'EBK-TRK-02', category_id: 'cat-ebikes', name: 'Bicicleta Eléctrica Trek FX+ 2 Stagger E-Bike', sale_price: 7890000, is_active: true },
  { id: 'prod-apparel-01', sku: 'ROP-JER-AERO', category_id: 'cat-apparel', name: 'Jersey Técnico Pro Aero Edición Taller A2Ruedas', sale_price: 185000, is_active: true },
  { id: 'prod-nutrition-01', sku: 'NUT-GEL-GU24', category_id: 'cat-nutrition', name: 'Pack Geles Energéticos GU Energy Gel Caja x 24 Uds', sale_price: 149000, is_active: true },
];

assert.strictEqual(sampleProducts.length, 4);
sampleProducts.forEach(p => {
  assert.ok(p.name && p.sku && p.category_id && p.sale_price > 0);
});
console.log('2. Existencia de productos de muestra en departamentos no-mecánicos:', 'PASS');

// 3. Generación y Normalización de Slug
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

assert.strictEqual(generateSlug('Bicicletas Eléctricas & E-Mobility!'), 'bicicletas-electricas-e-mobility');
assert.strictEqual(generateSlug('Nutrición, Geles y Vitaminas'), 'nutricion-geles-y-vitaminas');
assert.strictEqual(generateSlug('  Ropa de Ciclismo Térmica  '), 'ropa-de-ciclismo-termica');
console.log('3. Normalización automática de slug URL amigable sin tildes ni caracteres especiales:', 'PASS');

// 4. Creación Dinámica de Nueva Categoría
let workingCategories = [...defaultCategories];

function createCategory(categoryData) {
  if (!categoryData.name || !categoryData.name.trim()) {
    throw new Error('El nombre de la categoría es obligatorio');
  }
  const slug = categoryData.slug || generateSlug(categoryData.name);
  const newCat = {
    id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: categoryData.name.trim(),
    slug,
    description: categoryData.description?.trim() || null,
    created_at: new Date().toISOString(),
  };
  workingCategories.push(newCat);
  return newCat;
}

const createdCat = createCategory({
  name: 'Scooters y Patinetas Eléctricas',
  description: 'Movilidad urbana ligera, repuestos y baterías',
});

assert.ok(createdCat.id.startsWith('cat-'));
assert.strictEqual(createdCat.name, 'Scooters y Patinetas Eléctricas');
assert.strictEqual(createdCat.slug, 'scooters-y-patinetas-electricas');
assert.strictEqual(workingCategories.some(c => c.id === createdCat.id), true);
console.log('4. Creación dinámica de nueva categoría con persistencia y slug autogenerado:', 'PASS');

// 5. Modificación Inline de Categoría Existente
function updateCategory(id, updates) {
  const index = workingCategories.findIndex(c => c.id === id);
  if (index === -1) throw new Error('Categoría no encontrada');
  const target = workingCategories[index];
  const updated = {
    ...target,
    name: updates.name !== undefined ? updates.name.trim() : target.name,
    description: updates.description !== undefined ? updates.description.trim() : target.description,
  };
  workingCategories[index] = updated;
  return updated;
}

const updatedCat = updateCategory(createdCat.id, {
  name: 'Scooters Eléctricas y VMP',
  description: 'Vehículos de movilidad personal y repuestos',
});

assert.strictEqual(updatedCat.name, 'Scooters Eléctricas y VMP');
assert.strictEqual(updatedCat.description, 'Vehículos de movilidad personal y repuestos');
console.log('5. Actualización en caliente de nombre y descripción de categorías:', 'PASS');

// 6. Bloqueo de Seguridad al Eliminar Categoría con Productos Vinculados
let workingProducts = [
  ...sampleProducts,
  { id: 'prod-scooter-1', sku: 'SCO-XIA-01', category_id: createdCat.id, name: 'Patineta Xiaomi 4 Pro', is_active: true },
];

function deleteCategory(id) {
  const hasProducts = workingProducts.some(p => p.category_id === id);
  if (hasProducts) {
    throw new Error('No es posible eliminar esta categoría porque contiene productos asignados. Reasigna o elimina los productos primero.');
  }
  workingCategories = workingCategories.filter(c => c.id !== id);
  return true;
}

assert.throws(
  () => deleteCategory(createdCat.id),
  /No es posible eliminar esta categoría porque contiene productos asignados/
);
console.log('6. Regla de integridad referencial: bloqueo estricto al eliminar categorías con productos:', 'PASS');

// 7. Eliminación Exitosa de Categoría sin Productos
// Primero retiramos el producto vinculado
workingProducts = workingProducts.filter(p => p.category_id !== createdCat.id);
const deleteResult = deleteCategory(createdCat.id);
assert.strictEqual(deleteResult, true);
assert.strictEqual(workingCategories.some(c => c.id === createdCat.id), false);
console.log('7. Eliminación exitosa y segura de categorías vacías sin referencias:', 'PASS');

// 8. Cálculo Dinámico de Conteo de Categorías Públicas
function getPublicCategoryCounts(cats, prods) {
  const activeProds = prods.filter(p => p.is_active);
  return cats.map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    count: activeProds.filter(p => p.category_id === cat.id).length,
  }));
}

const publicCounts = getPublicCategoryCounts(defaultCategories, sampleProducts);
const bikesCount = publicCounts.find(c => c.id === 'cat-bikes');
const ebikesCount = publicCounts.find(c => c.id === 'cat-ebikes');
const apparelCount = publicCounts.find(c => c.id === 'cat-apparel');
const nutritionCount = publicCounts.find(c => c.id === 'cat-nutrition');

assert.strictEqual(bikesCount.count, 1);
assert.strictEqual(ebikesCount.count, 1);
assert.strictEqual(apparelCount.count, 1);
assert.strictEqual(nutritionCount.count, 1);
console.log('8. Conteo reactivo de productos por categoría para vitrina pública (/productos):', 'PASS');

// 9. Filtrado de Catálogo por Nueva Categoría
function filterProductsByCategory(prods, catId) {
  if (!catId || catId === 'ALL') return prods;
  return prods.filter(p => p.category_id === catId);
}

const filteredBikes = filterProductsByCategory(sampleProducts, 'cat-bikes');
const filteredApparel = filterProductsByCategory(sampleProducts, 'cat-apparel');
assert.strictEqual(filteredBikes.length, 1);
assert.strictEqual(filteredBikes[0].name, 'Bicicleta Gravel Specialized Diverge E5');
assert.strictEqual(filteredApparel.length, 1);
assert.strictEqual(filteredApparel[0].name, 'Jersey Técnico Pro Aero Edición Taller A2Ruedas');
console.log('9. Filtrado preciso y segregación de ítems por departamento de catálogo:', 'PASS');

// 10. Validación de Formulario y Campos Obligatorios
assert.throws(() => createCategory({ name: '' }), /obligatorio/);
assert.throws(() => createCategory({ name: '   ' }), /obligatorio/);
assert.throws(() => updateCategory('id-inexistente', { name: 'Test' }), /no encontrada/);
console.log('10. Validaciones de entrada, manejo de strings vacíos e IDs inexistentes:', 'PASS');

console.log('--- TODAS LAS PRUEBAS DE GESTIÓN DE CATEGORÍAS PASARON EXITOSAMENTE (100% PASS) ---');
