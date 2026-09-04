const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

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

const BACKUP_DIR = path.join(__dirname, 'backup_img');
const PHOTOS_DIR = path.join(BACKUP_DIR, 'photos');
const VIDEOS_DIR = path.join(BACKUP_DIR, 'videos');
const AVATARS_DIR = path.join(BACKUP_DIR, 'avatars');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function downloadMedia(url, destPath) {
  return new Promise((resolve) => {
    if (!url || typeof url !== 'string' || url.length === 0) return resolve(false);

    if (url.startsWith('data:')) {
      try {
        const commaIdx = url.indexOf(',');
        if (commaIdx !== -1) {
          const base64 = url.slice(commaIdx + 1);
          const buffer = Buffer.from(base64, 'base64');
          fs.writeFileSync(destPath, buffer);
          return resolve(true);
        }
      } catch (e) { return resolve(false); }
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      const client = url.startsWith('https://') ? https : http;
      const fileStream = fs.createWriteStream(destPath);
      const req = client.get(url, (res) => {
        if (res.statusCode === 200) {
          res.pipe(fileStream);
          fileStream.on('finish', () => { fileStream.close(); resolve(true); });
        } else if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Follow redirect
          fileStream.close();
          fs.unlink(destPath, () => {});
          downloadMedia(res.headers.location, destPath).then(resolve);
        } else {
          fileStream.close();
          fs.unlink(destPath, () => {});
          resolve(false);
        }
      });
      req.setTimeout(15000, () => { req.destroy(); fileStream.close(); fs.unlink(destPath, () => {}); resolve(false); });
      req.on('error', () => { fileStream.close(); fs.unlink(destPath, () => {}); resolve(false); });
    } else {
      resolve(false);
    }
  });
}

async function fetchAllMomentsPaginated() {
  console.log('📡 Đang tải dữ liệu moments theo từng trang nhỏ (tránh timeout)...\n');
  let allMoments = [];
  let page = 0;
  const pageSize = 20;

  while (true) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    console.log(`  📄 Trang ${page + 1}: range [${from}-${to}]...`);
    const { data, error } = await supabase
      .from('moments')
      .select('id, sender_id, caption, media_url, media_type, created_at, thumbnail_url')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.log(`  ⚠️ Lỗi trang ${page + 1}: ${error.message}`);
      // If timeout, wait and retry once
      if (error.code === '57014') {
        console.log('  🔄 Timeout - đợi 2s rồi thử lại...');
        await new Promise(r => setTimeout(r, 2000));
        const { data: retryData, error: retryErr } = await supabase
          .from('moments')
          .select('id, sender_id, caption, media_url, media_type, created_at, thumbnail_url')
          .order('created_at', { ascending: false })
          .range(from, to);
        if (retryErr) {
          console.log(`  ❌ Retry thất bại: ${retryErr.message}`);
          break;
        }
        if (!retryData || retryData.length === 0) break;
        allMoments = allMoments.concat(retryData);
        console.log(`  ✅ Retry thành công: ${retryData.length} records`);
      } else {
        break;
      }
    } else {
      if (!data || data.length === 0) {
        console.log('  ✅ Hết dữ liệu - đã tải xong!');
        break;
      }
      allMoments = allMoments.concat(data);
      console.log(`  ✅ Nhận ${data.length} records (tổng: ${allMoments.length})`);
      
      if (data.length < pageSize) break; // Last page
    }
    
    page++;
    // Small delay between pages
    await new Promise(r => setTimeout(r, 500));
  }
  
  return allMoments;
}

async function fetchAllProfiles() {
  console.log('\n👤 Đang tải profiles...');
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(200);
  if (error) {
    console.log(`  ⚠️ Lỗi: ${error.message}`);
    return [];
  }
  console.log(`  ✅ Nhận ${data?.length || 0} profiles`);
  return data || [];
}

async function startFullBackup() {
  console.log('========================================================');
  console.log('📥 LOCKETWEB - SAO LƯU TOÀN BỘ DỮ LIỆU (PHÂN TRANG)');
  console.log('========================================================\n');

  ensureDir(BACKUP_DIR);
  ensureDir(PHOTOS_DIR);
  ensureDir(VIDEOS_DIR);
  ensureDir(AVATARS_DIR);

  // 1. Fetch all moments (paginated to avoid timeout)
  const allMoments = await fetchAllMomentsPaginated();
  
  // Filter valid moments
  const validMoments = allMoments.filter((m) => {
    const url = String(m.media_url || m.thumbnail_url || '').trim();
    const id = String(m.id || '');
    const caption = String(m.caption || '');
    return (
      url.length > 0 &&
      caption !== '__DELETED_MOMENT__' &&
      !id.startsWith('del_moment_') &&
      !url.includes('1518609878373-06d740f60d8b') &&
      !url.includes('deleted.invalid')
    );
  });

  console.log(`\n📊 THỐNG KÊ:`);
  console.log(`  Tổng raw DB rows: ${allMoments.length}`);
  console.log(`  Khoảnh khắc hợp lệ: ${validMoments.length}`);
  console.log(`  Dữ liệu rác đã lọc: ${allMoments.length - validMoments.length}`);

  // Save metadata JSON
  fs.writeFileSync(
    path.join(BACKUP_DIR, 'moments_data.json'),
    JSON.stringify(validMoments, null, 2)
  );
  console.log(`  📄 Đã lưu moments_data.json`);

  // 2. Download media files
  console.log('\n🖼️ ĐANG TẢI ẢNH/VIDEO...\n');
  let photoCount = 0;
  let videoCount = 0;
  let skipCount = 0;

  for (let i = 0; i < validMoments.length; i++) {
    const m = validMoments[i];
    const url = m.media_url || m.thumbnail_url;
    const isVideo =
      m.media_type === 'video' ||
      String(m.id).includes('video') ||
      (url && url.startsWith('data:video/')) ||
      (url && (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov')));

    let ext = isVideo ? 'mp4' : 'jpg';
    if (url && url.includes('.png')) ext = 'png';
    if (url && url.includes('.webm')) ext = 'webm';
    if (url && url.includes('.mov')) ext = 'mov';

    const safeId = String(m.id).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeId}.${ext}`;
    const destDir = isVideo ? VIDEOS_DIR : PHOTOS_DIR;
    const destPath = path.join(destDir, filename);

    // Skip if already downloaded
    if (fs.existsSync(destPath)) {
      const stats = fs.statSync(destPath);
      if (stats.size > 100) {
        skipCount++;
        continue;
      }
    }

    const ok = await downloadMedia(url, destPath);
    if (ok) {
      if (isVideo) videoCount++;
      else photoCount++;
      console.log(`  [${i + 1}/${validMoments.length}] ✅ ${isVideo ? '🎥' : '🖼️'} ${filename}`);
    } else {
      console.log(`  [${i + 1}/${validMoments.length}] ⚠️ Bỏ qua: ${safeId}`);
    }
  }

  // 3. Fetch and save profiles
  const profiles = await fetchAllProfiles();
  fs.writeFileSync(
    path.join(BACKUP_DIR, 'profiles_data.json'),
    JSON.stringify(profiles, null, 2)
  );

  // 4. Download avatars
  console.log('\n👤 ĐANG TẢI AVATAR...\n');
  let avatarCount = 0;
  for (const p of profiles) {
    if (p.avatar_url && p.avatar_url.startsWith('http')) {
      const safeId = String(p.id).replace(/[^a-zA-Z0-9_-]/g, '_');
      const destPath = path.join(AVATARS_DIR, `${safeId}.jpg`);
      if (!fs.existsSync(destPath)) {
        const ok = await downloadMedia(p.avatar_url, destPath);
        if (ok) {
          avatarCount++;
          console.log(`  ✅ Avatar: ${p.display_name || safeId}`);
        }
      }
    }
  }

  console.log('\n========================================================');
  console.log('🎉 SAO LƯU HOÀN TẤT!');
  console.log('========================================================');
  console.log(`📁 Thư mục: ${BACKUP_DIR}`);
  console.log(`  🖼️ Ảnh mới tải: ${photoCount} | 🎥 Video mới tải: ${videoCount}`);
  console.log(`  ⏭️ Đã có sẵn (bỏ qua): ${skipCount}`);
  console.log(`  👤 Avatar: ${avatarCount}`);
  console.log(`  📄 JSON: moments_data.json & profiles_data.json`);
  console.log('========================================================\n');
  
  process.exit(0);
}

// Global timeout 5 minutes
setTimeout(() => {
  console.log('\n⚠️ GLOBAL TIMEOUT 5 PHÚT - Dừng tiến trình');
  process.exit(1);
}, 300000);

startFullBackup().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
