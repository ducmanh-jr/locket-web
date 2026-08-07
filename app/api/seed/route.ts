import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { DEMO_50_MOMENTS, DEFAULT_3_FRIENDS } from '@/lib/demoStore';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase chưa được cấu hình' }, { status: 500 });
  }

  try {
    // 1. Seed demo profiles
    for (const friend of DEFAULT_3_FRIENDS) {
      await supabase.from('profiles').upsert({
        id: friend.id,
        username: friend.username,
        display_name: friend.display_name,
        avatar_url: friend.avatar_url || '',
      });
    }

    // 2. Seed demo moments
    let inserted = 0;
    for (const moment of DEMO_50_MOMENTS) {
      const { error } = await supabase.from('moments').upsert({
        id: moment.id,
        sender_id: moment.sender_id || moment.sender?.id,
        media_url: moment.media_url,
        media_type: 'photo',
        caption: moment.caption || '',
        created_at: moment.created_at || new Date().toISOString(),
      });
      if (!error) inserted++;
    }

    return NextResponse.json({
      success: true,
      message: `Đã nạp ${inserted} khoảnh khắc và ${DEFAULT_3_FRIENDS.length} profiles vào database.`,
      profiles_seeded: DEFAULT_3_FRIENDS.length,
      moments_seeded: inserted,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Seed failed' }, { status: 500 });
  }
}
