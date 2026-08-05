import { NextResponse } from 'next/server';

const JSONBLOB_STORE_URL = 'https://jsonblob.com/api/jsonBlob/019fcc1e-0de5-7e25-bd85-bd9756144094';

// Backup in-memory cache for ultra-fast response
let memoryProfiles: any[] = [];
let memoryMoments: any[] = [];

function isVideoMoment(moment: any): boolean {
  return (
    moment?.media_type === 'video' ||
    String(moment?.id || '').includes('video') ||
    String(moment?.media_url || '').startsWith('data:video/')
  );
}

function hasRenderableMedia(moment: any): boolean {
  const mediaUrl = String(moment?.media_url || '');
  if (!moment?.id || !mediaUrl) return false;
  if (mediaUrl.startsWith('blob:')) return false;

  if (isVideoMoment(moment)) {
    return (
      mediaUrl.startsWith('https://') ||
      mediaUrl.startsWith('http://') ||
      mediaUrl.startsWith('/') ||
      mediaUrl.startsWith('data:video/')
    );
  }

  return (
    mediaUrl.startsWith('https://') ||
    mediaUrl.startsWith('http://') ||
    mediaUrl.startsWith('/') ||
    mediaUrl.startsWith('data:image/')
  );
}

function sanitizeMoments(moments: any[]): any[] {
  return moments
    .filter(hasRenderableMedia)
    .filter((m, i, self) => i === self.findIndex((x) => x?.id === m?.id))
    .slice(0, 200);
}

async function fetchFromGlobalStore() {
  try {
    const res = await fetch(JSONBLOB_STORE_URL, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.profiles)) {
        // Purge non-Google dummy profiles - ONLY keep Google Accounts
        memoryProfiles = data.profiles.filter(
          (p: any) =>
            p &&
            p.id &&
            !p.id.startsWith('user-') &&
            !p.id.startsWith('user_dev_') &&
            p.username !== 'manh_locket'
        );
      }
      if (Array.isArray(data.moments)) memoryMoments = sanitizeMoments(data.moments);
    }
  } catch (e) {}
}

async function saveToGlobalStore(profiles: any[], moments: any[]) {
  try {
    // Purge non-Google dummy profiles before saving
    const googleProfilesOnly = profiles.filter(
      (p: any) =>
        p &&
        p.id &&
        !p.id.startsWith('user-') &&
        !p.id.startsWith('user_dev_') &&
        p.username !== 'manh_locket'
    );
    await fetch(JSONBLOB_STORE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profiles: googleProfilesOnly, moments: sanitizeMoments(moments) }),
    });
  } catch (e) {}
}

export async function GET() {
  await fetchFromGlobalStore();
  return NextResponse.json(
    { profiles: memoryProfiles, moments: memoryMoments },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, profile, moment } = body;

    // Always fetch latest state from global store first to prevent overwriting
    await fetchFromGlobalStore();

    if (action === 'push_profile' && profile?.id) {
      const googleProfilesOnly = memoryProfiles.filter(
        (p: any) => p && p.id && !p.id.startsWith('user-') && !p.id.startsWith('user_dev_')
      );
      const idx = googleProfilesOnly.findIndex(
        (p: any) => p.id === profile.id || p.username === profile.username
      );
      if (idx >= 0) {
        googleProfilesOnly[idx] = { ...googleProfilesOnly[idx], ...profile };
      } else {
        googleProfilesOnly.push(profile);
      }
      memoryProfiles = googleProfilesOnly;
    }

    if (action === 'push_moment' && moment?.id && moment?.media_url) {
      if (!hasRenderableMedia(moment)) {
        return NextResponse.json(
          { error: 'Moment media must be a durable, renderable URL' },
          { status: 422 }
        );
      }
      const exists = memoryMoments.some((m: any) => m.id === moment.id);
      if (!exists) {
        memoryMoments.unshift(moment);
        memoryMoments = sanitizeMoments(memoryMoments);
      }
    }

    // Persist merged profiles and moments safely
    memoryMoments = sanitizeMoments(memoryMoments);
    await saveToGlobalStore(memoryProfiles, memoryMoments);

    return NextResponse.json(
      { success: true, profiles: memoryProfiles, moments: memoryMoments },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server Error' }, { status: 500 });
  }
}
