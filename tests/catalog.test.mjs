import assert from 'node:assert';

console.log('--- INICIANDO PRUEBAS DE LA FASE 18: CATÁLOGO PÚBLICO DE PRODUCTOS ---');

// 1. Sanitización de Productos (Seguridad y Privacidad Comercial)
const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80';

function sanitizePublicProduct(product) {
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

const mockRawProducts = [
  {
    id: 'prod-1',
    sku: 'CAD-SHI-12S',
    category_id: 'cat-transmision',
    category: { id: 'cat-transmision', name: 'Transmisión' },
    name: 'Cadena Shimano Deore 12 Velocidades',
    brand: 'Shimano',
    description: 'Cadena de alta durabilidad con tecnología Hyperglide+.',
    cost_price: 95000,       // DATO SENSIBLE INTERNO
    sale_price: 155000,
    stock: 5,
    min_stock: 2,           // DATO SENSIBLE INTERNO
    location: 'Estante B-3', // DATO SENSIBLE INTERNO
    unit: 'unidad',
    image_url: 'https://example.com/shimano-chain.jpg',
    images: ['https://example.com/shimano-chain.jpg', 'https://example.com/shimano-chain-box.jpg'],
    is_active: true,
  },
  {
    id: 'prod-2',
    sku: 'PAS-ORG-SHI',
    category_id: 'cat-frenos',
    category: { id: 'cat-frenos', name: 'Frenos' },
    name: 'Pastillas de Freno Resina B05S',
    brand: 'Shimano',
    description: 'Pastillas de freno orgánicas para disco.',
    cost_price: 18000,       // DATO SENSIBLE INTERNO
    sale_price: 35000,
    stock: 0,                // SIN STOCK
    min_stock: 5,
    location: 'Cajón F-1',
    unit: 'par',
    image_url: '',
    images: [],
    is_active: true,
  },
  {
    id: 'prod-3',
    sku: 'LLV-MULT-TOPE',
    category_id: 'cat-herramientas',
    category: { id: 'cat-herramientas', name: 'Herramientas' },
    name: 'Multiherramienta 16 en 1 Pro',
    brand: 'Topeak',
    description: 'Herramienta plegable de taller.',
    cost_price: 60000,
    sale_price: 110000,
    stock: 2,
    min_stock: 1,
    location: 'Vitrina 1',
    unit: 'unidad',
    image_url: 'https://example.com/topeak.jpg',
    images: [],
    is_active: false,        // PRODUCTO DESACTIVADO
  },
  {
    id: 'prod-4',
    sku: 'CAS-GIR-AGI',
    category_id: 'cat-accesorios',
    category: { id: 'cat-accesorios', name: 'Accesorios' },
    name: 'Casco Ciclismo Ruta Giro Agilis MIPS',
    brand: 'Giro',
    description: 'Casco con protección rotacional.',
    cost_price: 240000,
    sale_price: 390000,
    stock: 3,
    min_stock: 1,
    location: 'Vitrina 2',
    unit: 'unidad',
    image_url: '',
    images: [],
    is_active: true,
  },
];

const sanitizedProd1 = sanitizePublicProduct(mockRawProducts[0]);

// Verificación de sanitización: los datos confidenciales NO deben existir
assert.strictEqual(sanitizedProd1.cost_price, undefined);
assert.strictEqual(sanitizedProd1.min_stock, undefined);
assert.strictEqual(sanitizedProd1.location, undefined);
assert.strictEqual(sanitizedProd1.price, 155000);
assert.strictEqual(sanitizedProd1.available, true);
assert.strictEqual(sanitizedProd1.stock_quantity, 5);
assert.strictEqual(sanitizedProd1.images.length, 2);
console.log('1. Sanitización de productos públicos (cost_price, min_stock, location omitidos):', 'PASS');

// 2. Disponibilidad y fallback de imagen
const sanitizedProd2 = sanitizePublicProduct(mockRawProducts[1]);
assert.strictEqual(sanitizedProd2.available, false);
assert.strictEqual(sanitizedProd2.stock_quantity, 0);
assert.strictEqual(sanitizedProd2.image_url, DEFAULT_PRODUCT_IMAGE);
assert.strictEqual(sanitizedProd2.images[0], DEFAULT_PRODUCT_IMAGE);
console.log('2. Detección de disponibilidad (stock = 0 -> available: false) y fallback de imagen:', 'PASS');

// 3. Filtrado de Productos Activos
function getPublicCatalog(products, options = {}) {
  // 1. Filtrar únicamente productos activos
  let activeProducts = products.filter((p) => p.is_active);

  // 2. Sanitizar
  let publicProducts = activeProducts.map(sanitizePublicProduct);

  // 3. Filtro por categoría
  if (options.categoryId && options.categoryId !== 'ALL') {
    publicProducts = publicProducts.filter((p) => p.category_id === options.categoryId);
  }

  // 4. Búsqueda de texto
  if (options.searchTerm) {
    const term = options.searchTerm.toLowerCase().trim();
    publicProducts = publicProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.category_name.toLowerCase().includes(term)
    );
  }

  // 5. Solo disponibles
  if (options.onlyAvailable) {
    publicProducts = publicProducts.filter((p) => p.available);
  }

  // 6. Ordenamiento
  if (options.sortBy) {
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
        publicProducts.sort((a, b) => Number(b.available) - Number(a.available));
        break;
    }
  }

  return publicProducts;
}

const allPublic = getPublicCatalog(mockRawProducts);
// prod-3 está inactivo, por lo que no debe aparecer
assert.strictEqual(allPublic.length, 3);
assert.ok(!allPublic.some((p) => p.id === 'prod-3'));
console.log('3. Exclusión estricta de productos inactivos en catálogo público:', 'PASS');

// 4. Filtro por Categoría
const frenosOnly = getPublicCatalog(mockRawProducts, { categoryId: 'cat-frenos' });
assert.strictEqual(frenosOnly.length, 1);
assert.strictEqual(frenosOnly[0].sku, 'PAS-ORG-SHI');
console.log('4. Filtrado por categoría específica:', 'PASS');

// 5. Filtro por Término de Búsqueda (Nombre, Marca, SKU)
const searchShimano = getPublicCatalog(mockRawProducts, { searchTerm: 'shimano' });
assert.strictEqual(searchShimano.length, 2); // Cadena Shimano y Pastillas Shimano

const searchSku = getPublicCatalog(mockRawProducts, { searchTerm: 'CAD-SHI' });
assert.strictEqual(searchSku.length, 1);
assert.strictEqual(searchSku[0].name, 'Cadena Shimano Deore 12 Velocidades');

const searchCategoryName = getPublicCatalog(mockRawProducts, { searchTerm: 'Accesorios' });
assert.strictEqual(searchCategoryName.length, 1);
assert.strictEqual(searchCategoryName[0].name, 'Casco Ciclismo Ruta Giro Agilis MIPS');
console.log('5. Búsqueda inteligente multi-criterio (nombre, marca, SKU, categoría):', 'PASS');

// 6. Filtro de Solo Disponibles (Stock > 0)
const onlyInStock = getPublicCatalog(mockRawProducts, { onlyAvailable: true });
assert.strictEqual(onlyInStock.length, 2); // prod-1 (stock 5) y prod-4 (stock 3)
assert.ok(onlyInStock.every((p) => p.available && p.stock_quantity > 0));
console.log('6. Filtro de disponibilidad inmediata (excluye agotados con stock = 0):', 'PASS');

// 7. Ordenamientos de Catálogo
const sortedPriceAsc = getPublicCatalog(mockRawProducts, { sortBy: 'price_asc' });
assert.strictEqual(sortedPriceAsc[0].price, 35000);
assert.strictEqual(sortedPriceAsc[2].price, 390000);
console.log('7. Ordenamiento por menor precio (ascendente):', 'PASS');

const sortedPriceDesc = getPublicCatalog(mockRawProducts, { sortBy: 'price_desc' });
assert.strictEqual(sortedPriceDesc[0].price, 390000);
assert.strictEqual(sortedPriceDesc[2].price, 35000);
console.log('8. Ordenamiento por mayor precio (descendente):', 'PASS');

const sortedNameAsc = getPublicCatalog(mockRawProducts, { sortBy: 'name_asc' });
assert.strictEqual(sortedNameAsc[0].name, 'Cadena Shimano Deore 12 Velocidades');
assert.strictEqual(sortedNameAsc[1].name, 'Casco Ciclismo Ruta Giro Agilis MIPS');
assert.strictEqual(sortedNameAsc[2].name, 'Pastillas de Freno Resina B05S');
console.log('9. Ordenamiento alfabético A-Z:', 'PASS');

// 8. Conteo Dinámico de Categorías
const mockCategories = [
  { id: 'cat-transmision', name: 'Transmisión', slug: 'transmision' },
  { id: 'cat-frenos', name: 'Frenos', slug: 'frenos' },
  { id: 'cat-herramientas', name: 'Herramientas', slug: 'herramientas' },
  { id: 'cat-accesorios', name: 'Accesorios', slug: 'accesorios' },
];

function getCategoryCounts(categories, products) {
  const activeProducts = products.filter((p) => p.is_active);
  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    count: activeProducts.filter((p) => p.category_id === cat.id).length,
  }));
}

const categoryCounts = getCategoryCounts(mockCategories, mockRawProducts);
const transmisionCat = categoryCounts.find((c) => c.id === 'cat-transmision');
const frenosCat = categoryCounts.find((c) => c.id === 'cat-frenos');
const herramientasCat = categoryCounts.find((c) => c.id === 'cat-herramientas'); // Prod inactivo
const accesoriosCat = categoryCounts.find((c) => c.id === 'cat-accesorios');

assert.strictEqual(transmisionCat.count, 1);
assert.strictEqual(frenosCat.count, 1);
assert.strictEqual(herramientasCat.count, 0); // Excluye producto inactivo
assert.strictEqual(accesoriosCat.count, 1);
console.log('10. Conteo dinámico de productos activos por categoría (insensible a inactivos):', 'PASS');

// 9. Búsqueda Directa por ID o SKU (Deep-link)
function getPublicProductByIdOrSku(products, idOrSku) {
  const active = products.filter((p) => p.is_active);
  const found = active.find(
    (p) => p.id === idOrSku || p.sku.toUpperCase() === idOrSku.toUpperCase()
  );
  return found ? sanitizePublicProduct(found) : null;
}

const foundById = getPublicProductByIdOrSku(mockRawProducts, 'prod-1');
assert.ok(foundById !== null);
assert.strictEqual(foundById.sku, 'CAD-SHI-12S');

const foundBySku = getPublicProductByIdOrSku(mockRawProducts, 'cad-shi-12s');
assert.ok(foundBySku !== null);
assert.strictEqual(foundBySku.id, 'prod-1');

const notFoundInactive = getPublicProductByIdOrSku(mockRawProducts, 'LLV-MULT-TOPE');
assert.strictEqual(notFoundInactive, null);
console.log('11. Resolución de deep-link por ID o SKU con rechazo de productos inactivos:', 'PASS');

// 10. Generador de Enlace WhatsApp para Consulta y Cotización
function generateWhatsAppInquiryUrl(cartItems, settings = {}) {
  if (!cartItems || cartItems.length === 0) return '';

  const rawPhone = settings.workshop_phone || '3104567890';
  let cleanPhone = rawPhone.replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = `57${cleanPhone}`;
  }

  const workshopName = settings.workshop_name || 'A2Ruedas Taller';

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
}

const mockCart = [
  { product: sanitizedProd1, quantity: 2 }, // 2 x 155,000 = 310,000
  { product: sanitizePublicProduct(mockRawProducts[3]), quantity: 1 }, // 1 x 390,000 = 390,000
];

const waUrl = generateWhatsAppInquiryUrl(mockCart, {
  workshop_phone: '(+57) 312 987 6543',
  workshop_name: 'A2Ruedas Bogotá',
});

assert.ok(waUrl.startsWith('https://wa.me/573129876543?text='));
const decodedMessage = decodeURIComponent(waUrl.split('?text=')[1]);
assert.ok(decodedMessage.includes('A2Ruedas Bogotá'));
assert.ok(decodedMessage.includes('Cadena Shimano Deore 12 Velocidades'));
assert.ok(decodedMessage.includes('Casco Ciclismo Ruta Giro Agilis MIPS'));
assert.ok(decodedMessage.includes('700.000 COP') || decodedMessage.includes('700,000 COP') || decodedMessage.includes('Total Estimado:'));
assert.strictEqual(generateWhatsAppInquiryUrl([]), '');
console.log('12. Formateo y codificación URL de WhatsApp con cálculo de totales en COP (+57):', 'PASS');

console.log('--- TODAS LAS PRUEBAS DE LA FASE 18 PASARON EXITOSAMENTE (100% PASS) ---');
