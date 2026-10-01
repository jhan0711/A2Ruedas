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

  const { count: initialCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
  console.log(`Initial customer count: ${initialCount}`);

  // Fetch unique canonical customers:
  // Let's page through and map each normalized phone to the single oldest ID
  const canonicalMap = new Map(); // key -> oldest customer row
  let page = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('customers')
      .select('id, full_name, phone, whatsapp, created_at')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) break;

    for (const c of data) {
      const normPhone = (c.phone || c.whatsapp || '').replace(/\D/g, '');
      const normName = (c.full_name || '').trim().toLowerCase();
      const key = normPhone || normName;
      if (!key) continue;

      if (!canonicalMap.has(key)) {
        canonicalMap.set(key, c);
      }
    }

    if (data.length < PAGE_SIZE) break;
    page++;
  }

  console.log(`Unique real customers to preserve: ${canonicalMap.size}`);
  const canonicalIds = Array.from(canonicalMap.values()).map(c => c.id);
  for (const c of canonicalMap.values()) {
    console.log(`Preserving: ${c.full_name} (${c.phone}) [${c.id}]`);
  }

  // Now delete all rows whose ID is NOT in canonicalIds
  // We can fetch batches of non-canonical IDs
  let deletedTotal = 0;
  while (true) {
    const { data: toDelete, error } = await supabase
      .from('customers')
      .select('id')
      .not('id', 'in', `(${canonicalIds.join(',')})`)
      .limit(200);

    if (error) {
      console.error('Error fetching batch to delete:', error);
      break;
    }
    if (!toDelete || toDelete.length === 0) {
      console.log('No more duplicates found.');
      break;
    }

    const ids = toDelete.map(d => d.id);
    const { error: delErr } = await supabase
      .from('customers')
      .delete()
      .in('id', ids);

    if (delErr) {
      console.error('Error deleting batch:', delErr);
      break;
    }

    deletedTotal += ids.length;
    process.stdout.write(`Deleted ${deletedTotal} duplicates...\r`);
  }

  const { count: finalCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });
  console.log(`\nCleanup complete! Remaining customers: ${finalCount}`);

  const { data: finalCustomers } = await supabase.from('customers').select('id, full_name, phone, whatsapp').order('full_name');
  console.log('Final unique customers:');
  console.table(finalCustomers);
}

run();
