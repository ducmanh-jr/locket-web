import { NextResponse } from 'next/server';

const JSONBLOB_STORE_URL = 'https://jsonblob.com/api/jsonBlob/019fcc1e-0de5-7e25-bd85-bd9756144094';

// Backup in-memory cache for ultra-fast response
let memoryProfiles: any[] = [];
let memoryMoments: any[] = [];
let globalSeqId = 1000;

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
  const unique = moments
    .filter(hasRenderableMedia)
    .filter((m, i, self) => i === self.findIndex((x) => x?.id === m?.id));

  // Sort strictly by seq_id descending or created_at descending
  unique.sort((a, b) => {
    const seqA = Number(a.seq_id || 0);
    const seqB = Number(b.seq_id || 0);
    if (seqA && seqB && seqA !== seqB) return seqB - seqA;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  return unique.slice(0, 250);
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
        memoryProfiles = data.profiles.filter(
          (p: any) =>
            p &&
            p.id &&
            !p.id.startsWith('user-') &&
            !p.id.startsWith('user_dev_') &&
            p.username !== 'manh_locket'
        );
      }
      if (Array.isArray(data.moments)) {
        memoryMoments = sanitizeMoments(data.moments);
        const maxSeq = Math.max(...memoryMoments.map((m) => Number(m.seq_id || 0)), 1000);
        if (maxSeq > globalSeqId) globalSeqId = maxSeq;
      }
    }
  } catch (e) {}
}

async function saveToGlobalStore(profiles: any[], moments: any[]) {
  try {
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

export async function GET(request: Request) {
  await fetchFromGlobalStore();

  const { searchParams } = new URL(request.url);
  const sinceSeqParam = searchParams.get('since_seq');
  const sinceSeq = sinceSeqParam ? Number(sinceSeqParam) : null;

  let returnedMoments = memoryMoments;
  if (sinceSeq && !isNaN(sinceSeq)) {
    returnedMoments = memoryMoments.filter((m) => Number(m.seq_id || 0) > sinceSeq);
  }

  return NextResponse.json(
    { profiles: memoryProfiles, moments: returnedMoments, latest_seq: globalSeqId },
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
      const idx = memoryMoments.findIndex((m: any) => m.id === moment.id);
      if (idx === -1) {
        globalSeqId += 1;
        const stampedMoment = {
          ...moment,
          seq_id: globalSeqId,
          server_created_at: new Date().toISOString(),
        };
        memoryMoments.unshift(stampedMoment);
      } else {
        memoryMoments[idx] = { ...memoryMoments[idx], ...moment };
      }
      memoryMoments = sanitizeMoments(memoryMoments);
    }

    if (action === 'delete_moment' && body.moment_id) {
      memoryMoments = memoryMoments.filter((m: any) => m.id !== body.moment_id);
    }

    // Persist merged profiles and moments safely
    memoryMoments = sanitizeMoments(memoryMoments);
    await saveToGlobalStore(memoryProfiles, memoryMoments);

    return NextResponse.json(
      { success: true, profiles: memoryProfiles, moments: memoryMoments, latest_seq: globalSeqId },
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

