import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function downloadMedia(url: string, destPath: string): Promise<boolean> {
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
      } catch (e) {
        return resolve(false);
      }
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      const client = url.startsWith('https://') ? https : http;
      const fileStream = fs.createWriteStream(destPath);
      const req = client.get(url, (res) => {
        if (res.statusCode === 200) {
          res.pipe(fileStream);
          fileStream.on('finish', () => {
            fileStream.close();
            resolve(true);
          });
        } else if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fileStream.close();
          fs.unlink(destPath, () => {});
          downloadMedia(res.headers.location, destPath).then(resolve);
        } else {
          fileStream.close();
          fs.unlink(destPath, () => {});
          resolve(false);
        }
      });
      req.setTimeout(15000, () => {
        req.destroy();
        fileStream.close();
        fs.unlink(destPath, () => {});
        resolve(false);
      });
      req.on('error', () => {
        fileStream.close();
        fs.unlink(destPath, () => {});
        resolve(false);
      });
    } else {
      resolve(false);
    }
  });
}

export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: 'Supabase chưa được cấu hình' }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(type: 'CMD' | 'HTTP' | 'DB' | 'SYS' | 'ERR', text: string, data?: any) {
        try {
          const line = JSON.stringify({ type, text, data, time: new Date().toISOString() }) + '\n';
          controller.enqueue(encoder.encode(line));
        } catch (e) {
          // ignore
        }
      }

      sendEvent('SYS', '🚀 Bắt đầu khởi tạo tiến trình Sao Lưu Dữ Liệu LocketWeb...');

      try {
        const rootDir = process.cwd();
        const backupDir = path.join(rootDir, 'backup_img');
        const photosDir = path.join(backupDir, 'photos');
        const videosDir = path.join(backupDir, 'videos');
        const avatarsDir = path.join(backupDir, 'avatars');

        ensureDir(backupDir);
        ensureDir(photosDir);
        ensureDir(videosDir);
        ensureDir(avatarsDir);
        sendEvent('SYS', '📁 Đã khởi tạo cấu trúc thư mục local: /backup_img (photos, videos, avatars)');

        // 1. Fetch moments
        sendEvent('DB', '📡 Đang kết nối Supabase, truy vấn bảng Moments...');
        const fetchStart = Date.now();
        const { data: moments, error: momentsErr } = await supabase
          .from('moments')
          .select('id, sender_id, caption, media_url, media_type, created_at, thumbnail_url')
          .order('created_at', { ascending: false })
          .limit(500);

        if (momentsErr) {
          sendEvent('ERR', `✗ Lỗi truy vấn Supabase Moments: ${momentsErr.message}`);
          controller.close();
          return;
        }

        const allMoments = moments || [];
        sendEvent('DB', `✅ Đã nhận ${allMoments.length} bản ghi thô từ bảng Moments (${Date.now() - fetchStart}ms)`);

        const validMoments = allMoments.filter((m: any) => {
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

        fs.writeFileSync(
          path.join(backupDir, 'moments_data.json'),
          JSON.stringify(validMoments, null, 2)
        );
        sendEvent('SYS', `📄 Đã xuất file metadata: backup_img/moments_data.json (${validMoments.length} hợp lệ, ${allMoments.length - validMoments.length} rác)`);

        // 2. Download Media Files
        sendEvent('SYS', `🖼️ Bắt đầu kiểm tra & tải về ${validMoments.length} khoảnh khắc media...`);
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
          const destDir = isVideo ? videosDir : photosDir;
          const destPath = path.join(destDir, filename);

          if (fs.existsSync(destPath)) {
            const stats = fs.statSync(destPath);
            if (stats.size > 100) {
              skipCount++;
              sendEvent('SYS', `  [${i + 1}/${validMoments.length}] ⏭️ Bỏ qua (đã có): ${filename}`);
              continue;
            }
          }

          const dlStart = Date.now();
          const ok = await downloadMedia(url, destPath);
          const dlTime = Date.now() - dlStart;

          if (ok) {
            if (isVideo) videoCount++;
            else photoCount++;
            sendEvent('SYS', `  [${i + 1}/${validMoments.length}] ✅ Đã lưu ${isVideo ? '🎥 video' : '🖼️ ảnh'}: ${filename} (${dlTime}ms)`);
          } else {
            sendEvent('ERR', `  [${i + 1}/${validMoments.length}] ⚠️ Bỏ qua (không tải được): ${filename}`);
          }
        }

        // 3. Fetch profiles
        sendEvent('DB', '👤 Đang truy vấn bảng Profiles từ Supabase...');
        const profStart = Date.now();
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .limit(200);

        const allProfiles = profiles || [];
        sendEvent('DB', `✅ Đã nhận ${allProfiles.length} tài khoản từ Profiles (${Date.now() - profStart}ms)`);

        fs.writeFileSync(
          path.join(backupDir, 'profiles_data.json'),
          JSON.stringify(allProfiles, null, 2)
        );
        sendEvent('SYS', `📄 Đã xuất file metadata: backup_img/profiles_data.json`);

        // 4. Download avatars
        sendEvent('SYS', `👤 Bắt đầu tải ${allProfiles.length} ảnh đại diện người dùng...`);
        let avatarCount = 0;
        for (let j = 0; j < allProfiles.length; j++) {
          const p = allProfiles[j];
          if (p.avatar_url && typeof p.avatar_url === 'string' && p.avatar_url.startsWith('http')) {
            const safeId = String(p.id).replace(/[^a-zA-Z0-9_-]/g, '_');
            const destPath = path.join(avatarsDir, `${safeId}.jpg`);
            if (!fs.existsSync(destPath)) {
              const ok = await downloadMedia(p.avatar_url, destPath);
              if (ok) {
                avatarCount++;
                sendEvent('SYS', `  ✅ Avatar: ${p.display_name || safeId}.jpg`);
              }
            } else {
              sendEvent('SYS', `  ⏭️ Avatar đã có sẵn: ${p.display_name || safeId}.jpg`);
            }
          }
        }

        // Final summary event
        sendEvent('SYS', '🎉 SAO LƯU DỮ LIỆU HOÀN TẤT!', {
          summary: {
            rawDbRows: allMoments.length,
            validMoments: validMoments.length,
            photoCount,
            videoCount,
            skipCount,
            profilesCount: allProfiles.length,
            avatarCount,
            backupDir,
          }
        });

      } catch (err: any) {
        sendEvent('ERR', `❌ Lỗi tiến trình sao lưu: ${err?.message || 'Unknown'}`);
      } finally {
        controller.close();
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
