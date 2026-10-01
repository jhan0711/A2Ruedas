import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://bmwrsekgpfculdtzvcfx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtd3JzZWtncGZjdWxkdHp2Y2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MzUzOTUsImV4cCI6MjEwNTUxMTM5NX0.D2QMO1fhhS164TIVWn40xo50oCvL0ETg-1XcyAp8QBQ'
);

async function run() {
  await supabase.auth.signInWithPassword({
    email: 'jhank.45617@gmail.com',
    password: 'JCrs160711.'
  });

  const { data: allCusts, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching customers:', error);
    return;
  }
  console.log('Total rows before cleanup:', allCusts.length);

  const identityMap = new Map();
  for (const c of allCusts) {
    const normPhone = (c.phone || c.whatsapp || '').replace(/\D/g, '');
    const normName = (c.full_name || '').trim().toLowerCase();
    const key = normPhone ? normPhone : normName;

    if (!identityMap.has(key)) {
      identityMap.set(key, { primary: c, duplicates: [] });
    } else {
      identityMap.get(key).duplicates.push(c);
    }
  }

  console.log(`Identified ${identityMap.size} unique customers.`);

  // 1. Re-point in batch
  for (const [key, group] of identityMap.entries()) {
    if (group.duplicates.length === 0) continue;
    const primaryId = group.primary.id;
    const dupIds = group.duplicates.map(d => d.id);

    await Promise.all([
      supabase.from('bicycles').update({ customer_id: primaryId }).in('customer_id', dupIds),
      supabase.from('work_orders').update({ customer_id: primaryId }).in('customer_id', dupIds),
      supabase.from('invoices').update({ customer_id: primaryId }).in('customer_id', dupIds),
      supabase.from('appointments').update({ customer_id: primaryId }).in('customer_id', dupIds),
    ]);
  }
  console.log('Foreign keys re-pointed in batch.');

  // 2. Delete duplicates in batches of 100
  const duplicateIds = [];
  for (const [key, group] of identityMap.entries()) {
    for (const dup of group.duplicates) {
      duplicateIds.push(dup.id);
    }
  }

  console.log(`Deleting ${duplicateIds.length} duplicate customer rows...`);
  const BATCH_SIZE = 100;
  for (let i = 0; i < duplicateIds.length; i += BATCH_SIZE) {
    const batch = duplicateIds.slice(i, i + BATCH_SIZE);
    const { error: delErr } = await supabase.from('customers').delete().in('id', batch);
    if (delErr) {
      console.error(`Error deleting batch ${i}:`, delErr);
    } else {
      console.log(`Deleted batch ${i + 1} - ${i + batch.length}`);
    }
  }

  const { data: remaining } = await supabase.from('customers').select('id, full_name, phone, whatsapp');
  console.log(`Remaining customers in database: ${remaining.length}`);
  for (const c of remaining) {
    console.log(`- ${c.full_name} (Phone: ${c.phone}, WhatsApp: ${c.whatsapp})`);
  }
}

run();
