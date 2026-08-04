import { NextResponse } from 'next/server';

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

interface Moment {
  id: string;
  sender_id: string;
  sender?: Profile;
  media_url: string;
  caption: string;
  created_at: string;
  reactions: any[];
}

// In-memory store for Next.js Serverless runtime
let globalProfiles: Profile[] = [];
let globalMoments: Moment[] = [];

export async function GET() {
  return NextResponse.json(
    { profiles: globalProfiles, moments: globalMoments },
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

    if (action === 'push_profile' && profile?.id) {
      const idx = globalProfiles.findIndex(
        (p) => p.id === profile.id || p.username === profile.username
      );
      if (idx >= 0) {
        globalProfiles[idx] = { ...globalProfiles[idx], ...profile };
      } else {
        globalProfiles.push(profile);
      }
    }

    if (action === 'push_moment' && moment?.id && moment?.media_url) {
      const exists = globalMoments.some((m) => m.id === moment.id);
      if (!exists) {
        globalMoments.unshift(moment);
        // Keep max 50 recent compressed moments (~15KB each)
        if (globalMoments.length > 50) {
          globalMoments = globalMoments.slice(0, 50);
        }
      }
    }

    return NextResponse.json(
      { success: true, profiles: globalProfiles, moments: globalMoments },
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
