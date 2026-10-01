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

  const { data: allCusts, error } = await supabase.from('customers').select('*');
  if (error) {
    console.error('Error fetching customers:', error);
    return;
  }
  console.log('Total rows in customers:', allCusts.length);

  const keyMap = new Map();
  for (const c of allCusts) {
    const key = ((c.phone || '') + ':::' + (c.full_name || '')).trim().toLowerCase();
    if (!keyMap.has(key)) {
      keyMap.set(key, []);
    }
    keyMap.get(key).push(c);
  }

  console.log('Unique customer identities:', keyMap.size);
  for (const [k, list] of keyMap.entries()) {
    console.log(`Identity "${k}": ${list.length} rows (keeping oldest ID: ${list[list.length - 1].id})`);
  }
}

run();
