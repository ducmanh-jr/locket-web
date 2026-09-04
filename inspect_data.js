const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
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

async function inspectData() {
  console.log('========================================================');
  console.log('📊 LOCKETWEB - BÁO CÁO KIỂM TRẢ DỮ LIỆU THỰC TẾ TRÊN SUPABASE');
  console.log('========================================================\n');

  // 1. Inspect Profiles
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('*');
  if (profErr) {
    console.error('Error fetching profiles:', profErr.message);
  } else {
    console.log(`👤 Tổng số Tài khoản / Bạn bè (Profiles): ${profiles ? profiles.length : 0}`);
  }

  // 2. Inspect Moments
  const { data: moments, error: momErr } = await supabase.from('moments').select('*');
  if (momErr) {
    console.error('Error fetching moments:', momErr.message);
    return;
  }

  const totalRaw = moments ? moments.length : 0;
  console.log(`📸 Tổng số dòng trong bảng moments (Raw DB Rows): ${totalRaw}`);

  let validPhotoCount = 0;
  let validVideoCount = 0;
  let emptyOrNullMediaCount = 0;
  let legacyUnsplashDemoCount = 0;
  let deletedMarkerCount = 0;

  const validMomentsList = [];

  (moments || []).forEach((m) => {
    const id = String(m.id || '');
    const caption = String(m.caption || '');
    const url = String(m.media_url || m.thumbnail_url || '').trim();

    if (caption === '__DELETED_MOMENT__' || id.startsWith('del_moment_')) {
      deletedMarkerCount++;
      return;
    }

    if (!url || url.length === 0) {
      emptyOrNullMediaCount++;
      return;
    }

    if (url.includes('1518609878373-06d740f60d8b') || url.includes('photo-1518609878373')) {
      legacyUnsplashDemoCount++;
      return;
    }

    const isVideo =
      m.media_type === 'video' ||
      id.includes('video') ||
      url.startsWith('data:video/') ||
      url.endsWith('.mp4') ||
      url.endsWith('.webm') ||
      url.endsWith('.mov');

    if (isVideo) {
      validVideoCount++;
    } else {
      validPhotoCount++;
    }

    validMomentsList.push({
      id: m.id,
      media_type: isVideo ? 'video' : 'photo',
      caption: m.caption || '(không có caption)',
      created_at: m.created_at,
      media_url: url.length > 60 ? url.substring(0, 60) + '...' : url,
    });
  });

  const totalValid = validPhotoCount + validVideoCount;

  console.log('\n--------------------------------------------------------');
  console.log('🔎 PHÂN TÍCH CHI TIẾT TỪNG LOẠI DỮ LIỆU:');
  console.log('--------------------------------------------------------');
  console.log(`✅ TỔNG SỐ KHOẢNH KHẮC HỢP LỆ HIỂN THỊ: ${totalValid}`);
  console.log(`   └─ 🖼️  Số lượng Ảnh (Photos): ${validPhotoCount}`);
  console.log(`   └─ 🎥 Số lượng Video: ${validVideoCount}`);

  console.log('\n--------------------------------------------------------');
  console.log('⚠️ BẢNG LỌC CÁC RECORD DƯ THỪA / RÁC ĐÃ LỌC BỎ:');
  console.log('--------------------------------------------------------');
  console.log(`   ❌ Record dính URL Demo Unsplash cũ: ${legacyUnsplashDemoCount}`);
  console.log(`   ❌ Record rỗng/null media_url: ${emptyOrNullMediaCount}`);
  console.log(`   ❌ Record dán nhãn Xóa (Deleted Markers): ${deletedMarkerCount}`);

  console.log('\n--------------------------------------------------------');
  console.log('📋 DANH SÁCH KHÁM PHÁ CÁC KHOẢNH KHẮC THẬT (MỚI NHẤT):');
  console.log('--------------------------------------------------------');
  validMomentsList
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 10)
    .forEach((m, idx) => {
      console.log(`${idx + 1}. [${m.media_type.toUpperCase()}] ID: ${m.id} | Caption: "${m.caption}" | Date: ${m.created_at}`);
    });
  console.log('========================================================\n');
}

inspectData().catch(console.error);
