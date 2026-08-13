import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { DEMO_50_MOMENTS, DEFAULT_3_FRIENDS } from '@/lib/demoStore';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase chưa được cấu hình' }, { status: 500 });
  }

  try {
    // Purge legacy fake profiles from DB
    await supabase.from('profiles').delete().in('id', ['user-dm', 'user-system32', 'user-admin']);
    await supabase.from('profiles').delete().in('username', ['dm', 'system32', 'admin']);

    return NextResponse.json({
      success: true,
      message: 'Zero demo data configuration active.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Seed failed' }, { status: 500 });
  }
}
