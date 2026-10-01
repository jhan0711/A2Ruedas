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

  const names = ['yeidy torres', 'lucero quintero', 'camila montoya', 'Nicolas'];

  for (const name of names) {
    const { data: rows } = await supabase
      .from('customers')
      .select('id, full_name, phone, created_at')
      .ilike('full_name', name)
      .order('created_at', { ascending: true });

    if (!rows || rows.length <= 1) continue;

    const primaryId = rows[0].id;
    const dupIds = rows.slice(1).map(r => r.id);

    console.log(`Re-pointing references for ${name} (${dupIds.length} duplicates) to primary ${primaryId}...`);
    // Re-point
    await Promise.all([
      supabase.from('bicycles').update({ customer_id: primaryId }).in('customer_id', dupIds),
      supabase.from('work_orders').update({ customer_id: primaryId }).in('customer_id', dupIds),
      supabase.from('invoices').update({ customer_id: primaryId }).in('customer_id', dupIds),
      supabase.from('appointments').update({ customer_id: primaryId }).in('customer_id', dupIds),
    ]);

    // Delete in batches of 100
    for (let i = 0; i < dupIds.length; i += 100) {
      const batch = dupIds.slice(i, i + 100);
      const { error } = await supabase.from('customers').delete().in('id', batch);
      if (error) {
        console.error(`Error deleting batch for ${name}:`, error);
      }
    }
    console.log(`Cleaned ${name}.`);
  }

  const { count } = await supabase.from('customers').select('*', { count: 'exact', head: true });
  console.log(`\nFinal count of customers in database: ${count}`);

  const { data: allFinal } = await supabase.from('customers').select('id, full_name, phone, whatsapp').order('full_name');
  console.table(allFinal);
}

run();
