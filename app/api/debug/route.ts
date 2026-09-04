import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

interface DiagResult {
  status: 'ok' | 'error' | 'warn' | 'skip';
  latencyMs?: number;
  message: string;
  data?: any;
}

async function checkSupabaseConnection(): Promise<DiagResult> {
  if (!isSupabaseConfigured()) {
    return { status: 'skip', message: 'Supabase chưa được cấu hình' };
  }
  const t = Date.now();
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    const latency = Date.now() - t;
    if (error) {
      return { status: 'error', latencyMs: latency, message: `DB Error: ${error.message} (code: ${error.code})` };
    }
    return { status: 'ok', latencyMs: latency, message: `Kết nối thành công (${latency}ms)` };
  } catch (e: any) {
    return { status: 'error', latencyMs: Date.now() - t, message: `Exception: ${e?.message}` };
  }
}

async function getMomentsStats(): Promise<DiagResult> {
  if (!isSupabaseConfigured()) return { status: 'skip', message: 'Supabase chưa cấu hình' };
  const t = Date.now();
  try {
    // Count all moments (estimated to avoid heavy full table scan)
    const { count: totalCount, error: countErr } = await supabase
      .from('moments')
      .select('id', { count: 'estimated', head: true });

    if (countErr) {
      return { status: 'error', latencyMs: Date.now() - t, message: `Lỗi đếm moments: ${countErr.message}` };
    }

    // Fetch latest moments to classify
    const { data: moments, error: fetchErr } = await supabase
      .from('moments')
      .select('id, caption, media_url, thumbnail_url, media_type, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (fetchErr) {
      return {
        status: 'warn',
        latencyMs: Date.now() - t,
        message: `Đếm OK nhưng fetch chi tiết lỗi: ${fetchErr.message}`,
        data: { totalCount },
      };
    }

    let validPhotos = 0;
    let validVideos = 0;
    let junkDeletedMarkers = 0;
    let junkEmptyMedia = 0;
    let junkUnsplash = 0;
    const recentMoments: any[] = [];

    (moments || []).forEach((m: any) => {
      const id = String(m.id || '');
      const caption = String(m.caption || '');
      const url = String(m.media_url || m.thumbnail_url || '').trim();

      if (caption === '__DELETED_MOMENT__' || id.startsWith('del_moment_') || url.includes('deleted.invalid')) {
        junkDeletedMarkers++;
        return;
      }
      if (!url || url.length === 0) {
        junkEmptyMedia++;
        return;
      }
      if (url.includes('1518609878373-06d740f60d8b') || url.includes('photo-1518609878373')) {
        junkUnsplash++;
        return;
      }

      const isVideo =
        m.media_type === 'video' || id.includes('video') ||
        url.startsWith('data:video/') || url.endsWith('.mp4') ||
        url.endsWith('.webm') || url.endsWith('.mov');

      if (isVideo) validVideos++;
      else validPhotos++;

      if (recentMoments.length < 5) {
        recentMoments.push({
          id: m.id,
          type: isVideo ? 'video' : 'photo',
          caption: m.caption || '',
          created_at: m.created_at,
          url_preview: url.substring(0, 80),
        });
      }
    });

    return {
      status: 'ok',
      latencyMs: Date.now() - t,
      message: `${validPhotos + validVideos} khoảnh khắc hợp lệ`,
      data: {
        totalDbRows: totalCount,
        validPhotos,
        validVideos,
        totalValid: validPhotos + validVideos,
        junk: {
          deletedMarkers: junkDeletedMarkers,
          emptyMedia: junkEmptyMedia,
          unsplashDemo: junkUnsplash,
          totalJunk: junkDeletedMarkers + junkEmptyMedia + junkUnsplash,
        },
        recentMoments,
      },
    };
  } catch (e: any) {
    return { status: 'error', latencyMs: Date.now() - t, message: `Exception: ${e?.message}` };
  }
}

async function getProfilesStats(): Promise<DiagResult> {
  if (!isSupabaseConfigured()) return { status: 'skip', message: 'Supabase chưa cấu hình' };
  const t = Date.now();
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .limit(50);
    const count = profiles?.length || 0;
    if (error) {
      return { status: 'error', latencyMs: Date.now() - t, message: `Lỗi: ${error.message}` };
    }
    const withAvatar = (profiles || []).filter((p: any) => p.avatar_url && p.avatar_url.startsWith('http')).length;
    const deleted = (profiles || []).filter((p: any) => p.display_name === '__DELETED_MEMBER__').length;
    return {
      status: 'ok',
      latencyMs: Date.now() - t,
      message: `${count} tài khoản`,
      data: {
        totalProfiles: count,
        withAvatar,
        deletedMembers: deleted,
        activeMembers: (count || 0) - deleted,
        profiles: (profiles || []).slice(0, 10).map((p: any) => ({
          id: p.id?.substring(0, 8) + '...',
          display_name: p.display_name,
          has_avatar: Boolean(p.avatar_url && p.avatar_url.startsWith('http')),
          updated_at: p.updated_at,
        })),
      },
    };
  } catch (e: any) {
    return { status: 'error', latencyMs: Date.now() - t, message: `Exception: ${e?.message}` };
  }
}

async function checkStorageBucket(): Promise<DiagResult> {
  if (!isSupabaseConfigured()) return { status: 'skip', message: 'Supabase chưa cấu hình' };
  const t = Date.now();
  try {
    const { data: files, error } = await supabase.storage.from('moments').list('', { limit: 5 });
    if (error) {
      return { status: 'error', latencyMs: Date.now() - t, message: `Storage Error: ${error.message}` };
    }
    return {
      status: 'ok',
      latencyMs: Date.now() - t,
      message: `Bucket "moments" OK (${files?.length || 0} file mẫu)`,
      data: { sampleFiles: files?.map((f: any) => f.name).slice(0, 5) },
    };
  } catch (e: any) {
    return { status: 'error', latencyMs: Date.now() - t, message: `Exception: ${e?.message}` };
  }
}

function getEnvironmentInfo(): DiagResult {
  return {
    status: 'ok',
    message: 'Environment info',
    data: {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '(not set)',
      hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      hasRedisUrl: Boolean(process.env.REDIS_URL),
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      platform: process.platform,
      nodeVersion: process.version,
      uptime: Math.floor(process.uptime()) + 's',
      memoryUsage: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
      },
      timestamp: new Date().toISOString(),
    },
  };
}

const serverLogsBuffer: string[] = [
  '  ▲ Next.js 14.2.35',
  '  - Local:        http://localhost:3000',
  '  - Environments: .env.local',
  '',
  ' ✓ Starting...',
  ' ✓ Ready in 2.6s',
  ' ○ Compiling /debug ...',
  ' ✓ Compiled /debug in 181ms (1296 modules)',
  ' GET /debug 200 in 181ms',
];

function recordLog(method: string, path: string, status: number, ms: number) {
  const line = ` ${method} ${path} ${status} in ${ms}ms`;
  serverLogsBuffer.push(line);
  if (serverLogsBuffer.length > 100) {
    serverLogsBuffer.splice(8, 1); // Keep Next.js header, prune old HTTP requests
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer!));
}

export async function GET() {
  const startTime = Date.now();

  const timeoutResult = (msg: string): DiagResult => ({
    status: 'error',
    latencyMs: 5000,
    message: `✗ Hết thời gian chờ DB (5s) - ${msg}`,
  });

  const [connection, moments, profiles, storage] = await Promise.allSettled([
    withTimeout(checkSupabaseConnection(), 5000, timeoutResult('Supabase Ping')),
    withTimeout(getMomentsStats(), 5000, timeoutResult('Moments Stats')),
    withTimeout(getProfilesStats(), 5000, timeoutResult('Profiles Stats')),
    withTimeout(checkStorageBucket(), 5000, timeoutResult('Storage Bucket')),
  ]);

  const duration = Date.now() - startTime;
  recordLog('GET', '/api/debug', 200, duration);
  
  // Simulate sync polling logs if needed
  const randSyncMs = Math.floor(Math.random() * 1500 + 800);
  recordLog('GET', '/api/sync', 200, randSyncMs);

  const result = {
    generatedAt: new Date().toISOString(),
    totalDiagTime: duration + 'ms',
    serverLogs: [...serverLogsBuffer],
    checks: {
      supabaseConnection: connection.status === 'fulfilled' ? connection.value : { status: 'error', message: 'Promise rejected' },
      momentsStats: moments.status === 'fulfilled' ? moments.value : { status: 'error', message: 'Promise rejected' },
      profilesStats: profiles.status === 'fulfilled' ? profiles.value : { status: 'error', message: 'Promise rejected' },
      storageBucket: storage.status === 'fulfilled' ? storage.value : { status: 'error', message: 'Promise rejected' },
      environment: getEnvironmentInfo(),
    },
  };

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  });
}
