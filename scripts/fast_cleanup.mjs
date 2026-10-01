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

  const phones = [
    '3116014661',
    '3122295426',
    '3119998877',
    '3109998877',
    '3001112244',
    '3127171570',
    '3147027496',
    '320 5854758',
    '3103638284',
    '31363655311',
    '3103882281',
    '3146178925',
    '310638236',
    '3009998877',
    '3105347270',
    '3137454728',
    '3145731455',
    '0000000000',
  ];

  for (const phone of phones) {
    while (true) {
      const { data: rows } = await supabase
        .from('customers')
        .select('id, full_name, created_at')
        .eq('phone', phone)
        .order('created_at', { ascending: true })
        .limit(500);

      if (!rows || rows.length <= 1) break;

      // Keep rows[0], delete the rest in this chunk
      const toDelete = rows.slice(1).map(r => r.id);
      const { error } = await supabase.from('customers').delete().in('id', toDelete);
      if (error) {
        console.error(`Error deleting for phone ${phone}:`, error);
        break;
      }
      console.log(`Deleted ${toDelete.length} duplicates for ${rows[0].full_name} (${phone})`);
    }
  }

  const { count } = await supabase.from('customers').select('*', { count: 'exact', head: true });
  console.log(`\nFinal count of customers in database: ${count}`);

  const { data: finalCusts } = await supabase.from('customers').select('id, full_name, phone, whatsapp').order('full_name');
  console.table(finalCusts);
}

run();
