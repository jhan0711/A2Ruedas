import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k && v.length) acc[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function testBase64Product() {
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@a2ruedas.com',
    password: 'admin123',
  });
  if (authErr) {
    console.error('Auth error:', authErr);
    return;
  }
  const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } },
  });

  const fakeBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(50000); // 50KB base64
  const testProd = {
    sku: 'PROD-IMG-' + Math.floor(1000 + Math.random() * 9000),
    name: 'Producto con Foto Base64',
    brand: 'Test Brand',
    category_id: 'db25d356-cba5-49cf-aaa1-0b7865a11b1a',
    sale_price: 25000,
    stock: 5,
    min_stock: 2,
    unit: 'unidad',
    image_url: fakeBase64,
    images: [fakeBase64],
  };

  const { data, error } = await client.from('products').insert([testProd]).select().single();
  if (error) {
    console.error('Error inserting product with base64 image:', error);
  } else {
    console.log('Success inserting product with base64 image, id:', data.id);
  }

  const { data: cats } = await client.from('product_categories').select('id, name');
  console.log('Categories count:', cats.length);
  const accesorios = cats.find(c => c.name.toLowerCase().includes('accesorios'));
  console.log('Accesorios y Cascos category:', accesorios);
}

testBase64Product();
