import { NextResponse } from 'next/server';

const JSONBLOB_STORE_URL = 'https://jsonblob.com/api/jsonBlob/019fcc1e-0de5-7e25-bd85-bd9756144094';

// Backup in-memory cache for ultra-fast response
let memoryProfiles: any[] = [];
let memoryMoments: any[] = [];

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
      if (Array.isArray(data.moments)) memoryMoments = data.moments;
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
      body: JSON.stringify({ profiles: googleProfilesOnly, moments }),
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
    await fetchFromGlobalStore();
    const body = await request.json();
    const { action, profile, moment } = body;

    if (action === 'push_profile' && profile?.id) {
      const idx = memoryProfiles.findIndex(
        (p) => p.id === profile.id || p.username === profile.username
      );
      if (idx >= 0) {
        memoryProfiles[idx] = { ...memoryProfiles[idx], ...profile };
      } else {
        memoryProfiles.push(profile);
      }
    }

    if (action === 'push_moment' && moment?.id && moment?.media_url) {
      const exists = memoryMoments.some((m) => m.id === moment.id);
      if (!exists) {
        memoryMoments.unshift(moment);
        if (memoryMoments.length > 200) {
          memoryMoments = memoryMoments.slice(0, 200);
        }
      }
    }

    // Persist to serverless persistent global JSON blob store asynchronously
    saveToGlobalStore(memoryProfiles, memoryMoments);

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
