import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k && v.length) acc[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  return acc;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function checkRLS() {
  console.log('1. Testing anon insert into customers...');
  const testCustomer = {
    full_name: 'Test Anon Customer ' + Date.now(),
    phone: '3001234567',
  };
  const { data: custData, error: custErr } = await supabase.from('customers').insert([testCustomer]).select().single();
  console.log('Anon customer insert:', custErr ? ('ERROR: ' + custErr.code + ' ' + custErr.message) : ('SUCCESS: ' + custData.id));

  console.log('2. Testing anon insert into products...');
  const testProd = {
    sku: 'TEST-ANON-' + Date.now(),
    name: 'Anon Test Product',
    brand: 'Test Brand',
    category_id: 'db25d356-cba5-49cf-aaa1-0b7865a11b1a',
    sale_price: 15000,
    stock: 5,
    min_stock: 1,
    unit: 'unidad',
  };
  const { data: prodData, error: prodErr } = await supabase.from('products').insert([testProd]).select().single();
  console.log('Anon product insert:', prodErr ? ('ERROR: ' + prodErr.code + ' ' + prodErr.message) : ('SUCCESS: ' + prodData.id));

  console.log('3. Testing authenticated insert as admin@a2ruedas.com...');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@a2ruedas.com',
    password: 'admin123',
  });
  if (authErr) {
    console.error('Auth error:', authErr);
    return;
  }
  console.log('Auth SUCCESS, user ID:', authData.user.id);
  console.log('User metadata:', authData.user.user_metadata);
  const authSupabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${authData.session.access_token}`,
      },
    },
  });

  const { data: custAuthData, error: custAuthErr } = await authSupabase.from('customers').insert([{
    full_name: 'Test Auth Customer ' + Date.now(),
    phone: '3009998877',
  }]).select().single();
  console.log('Auth customer insert:', custAuthErr ? ('ERROR: ' + custAuthErr.code + ' ' + custAuthErr.message) : ('SUCCESS: ' + custAuthData.id));

  const { data: prodAuthData, error: prodAuthErr } = await authSupabase.from('products').insert([{
    sku: 'TEST-AUTH-' + Date.now(),
    name: 'Auth Test Product',
    brand: 'Auth Brand',
    category_id: 'db25d356-cba5-49cf-aaa1-0b7865a11b1a',
    sale_price: 25000,
    stock: 10,
    min_stock: 2,
    unit: 'unidad',
  }]).select().single();
  console.log('Auth product insert:', prodAuthErr ? ('ERROR: ' + prodAuthErr.code + ' ' + prodAuthErr.message) : ('SUCCESS: ' + prodAuthData.id));
}

checkRLS();
