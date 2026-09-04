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

async function purgeJunkData() {
  console.log('========================================================');
  console.log('🧹 BẮT ĐẦU DỌN DẸP SẠCH RÁC TRÊN SUPABASE DATABASE');
  console.log('========================================================\n');

  // 1. Fetch all moments
  const { data: moments, error: fetchErr } = await supabase.from('moments').select('id, caption, media_url, thumbnail_url');
  if (fetchErr) {
    console.error('Error fetching moments:', fetchErr.message);
    return;
  }

  const idsToDelete = [];

  (moments || []).forEach((m) => {
    const id = String(m.id || '');
    const caption = String(m.caption || '');
    const url = String(m.media_url || m.thumbnail_url || '').trim();

    // Check if deleted marker
    const isDeletedMarker = caption === '__DELETED_MOMENT__' || id.startsWith('del_moment_') || url.includes('deleted.invalid');
    // Check if legacy Unsplash demo URL
    const isLegacyDemo = url.includes('1518609878373-06d740f60d8b') || url.includes('photo-1518609878373');
    // Check if null/empty media URL
    const isEmptyMedia = !url || url.length === 0;

    if (isDeletedMarker || isLegacyDemo || isEmptyMedia) {
      idsToDelete.push(id);
    }
  });

  console.log(`🔎 Phát hiện ${idsToDelete.length} dòng dữ liệu rác/cũ cần xóa vĩnh viễn.`);

  if (idsToDelete.length > 0) {
    // Delete in batches of 50
    for (let i = 0; i < idsToDelete.length; i += 50) {
      const chunk = idsToDelete.slice(i, i + 50);
      const { error: delErr } = await supabase.from('moments').delete().in('id', chunk);
      if (delErr) {
        console.error('Lỗi khi xóa batch:', delErr.message);
      } else {
        console.log(`✅ Đã xóa thành công batch ${i / 50 + 1} (${chunk.length} dòng)`);
      }
    }
  }

  // Verify remaining rows
  const { data: remaining } = await supabase.from('moments').select('id');
  console.log('\n--------------------------------------------------------');
  console.log(`🎉 DỌN DẸP HOÀN TẤT!`);
  console.log(`📊 Số dòng còn lại trong bảng moments trên Supabase: ${remaining ? remaining.length : 0}`);
  console.log('========================================================\n');
}

purgeJunkData().catch(console.error);
