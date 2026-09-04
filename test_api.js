const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
let supabaseUrl = 'https://zrvoevcwnrdegbwzaexc.supabase.co';
let supabaseAnonKey = 'sb_publishable_q5ipNkes5jd0i6ijlHebDg_R8uPzwST';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.replace('NEXT_PUBLIC_SUPABASE_URL=', '').trim();
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseAnonKey = line.replace('NEXT_PUBLIC_SUPABASE_ANON_KEY=', '').trim();
    }
  });
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('=== MINIMAL SUPABASE CONNECTIVITY TEST ===\n');
  
  // Test 1: Just count (HEAD request, no data returned)
  console.log('Test 1: HEAD count moments...');
  const t1 = Date.now();
  const { count: mCount, error: e1 } = await supabase
    .from('moments')
    .select('id', { count: 'exact', head: true });
  console.log(`  Result: ${e1 ? 'ERROR: ' + e1.message : 'COUNT = ' + mCount} (${Date.now() - t1}ms)`);

  // Test 2: Just count profiles
  console.log('Test 2: HEAD count profiles...');
  const t2 = Date.now();
  const { count: pCount, error: e2 } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true });
  console.log(`  Result: ${e2 ? 'ERROR: ' + e2.message : 'COUNT = ' + pCount} (${Date.now() - t2}ms)`);

  // Test 3: Fetch just 1 moment with only id
  console.log('Test 3: Fetch 1 moment (id only)...');
  const t3 = Date.now();
  const { data: m1, error: e3 } = await supabase
    .from('moments')
    .select('id')
    .limit(1);
  console.log(`  Result: ${e3 ? 'ERROR: ' + e3.message : 'Got ' + (m1?.length || 0) + ' item(s)'} (${Date.now() - t3}ms)`);
  if (m1 && m1[0]) console.log('  First ID:', m1[0].id);

  // Test 4: Fetch moments with RANGE instead of limit (pagination) 
  console.log('Test 4: Fetch moments range 0-2 (id, media_url)...');
  const t4 = Date.now();
  const { data: m2, error: e4 } = await supabase
    .from('moments')
    .select('id, media_url, media_type, caption')
    .order('created_at', { ascending: false })
    .range(0, 2);
  console.log(`  Result: ${e4 ? 'ERROR: ' + e4.message : 'Got ' + (m2?.length || 0) + ' items'} (${Date.now() - t4}ms)`);
  if (m2) m2.forEach((m, i) => {
    console.log(`  [${i}] id=${m.id} type=${m.media_type} url=${(m.media_url||'').substring(0,60)}...`);
  });

  console.log('\n=== TEST DONE ===');
  process.exit(0);
}

// Set a global timeout of 30 seconds
setTimeout(() => {
  console.log('\n⚠️ GLOBAL TIMEOUT - Supabase is unresponsive after 30s');
  process.exit(1);
}, 30000);

test().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
