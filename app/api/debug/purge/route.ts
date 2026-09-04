import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: 'Supabase chưa được cấu hình' }, { status: 400 });
  }

  try {
    // 1. Fetch all moments to identify junk
    const { data: moments, error: fetchErr } = await supabase
      .from('moments')
      .select('id, caption, media_url, thumbnail_url');

    if (fetchErr) {
      return NextResponse.json({ message: `Lỗi fetch: ${fetchErr.message}` }, { status: 500 });
    }

    const idsToDelete: string[] = [];
    (moments || []).forEach((m: any) => {
      const id = String(m.id || '');
      const caption = String(m.caption || '');
      const url = String(m.media_url || m.thumbnail_url || '').trim();

      const isDeletedMarker = caption === '__DELETED_MOMENT__' || id.startsWith('del_moment_') || url.includes('deleted.invalid');
      const isLegacyDemo = url.includes('1518609878373-06d740f60d8b') || url.includes('photo-1518609878373');
      const isEmptyMedia = !url || url.length === 0;

      if (isDeletedMarker || isLegacyDemo || isEmptyMedia) {
        idsToDelete.push(id);
      }
    });

    if (idsToDelete.length === 0) {
      return NextResponse.json({
        message: '✅ Không có dữ liệu rác nào cần dọn dẹp!',
        deleted: 0,
      });
    }

    // Delete in batches of 50
    let totalDeleted = 0;
    for (let i = 0; i < idsToDelete.length; i += 50) {
      const chunk = idsToDelete.slice(i, i + 50);
      const { error: delErr } = await supabase.from('moments').delete().in('id', chunk);
      if (!delErr) {
        totalDeleted += chunk.length;
      }
    }

    // Verify remaining
    const { count } = await supabase.from('moments').select('id', { count: 'exact', head: true });

    return NextResponse.json({
      message: `🧹 Đã dọn sạch ${totalDeleted}/${idsToDelete.length} dòng rác. Còn lại ${count} dòng trong DB.`,
      deleted: totalDeleted,
      remaining: count,
    });
  } catch (e: any) {
    return NextResponse.json({ message: `Lỗi: ${e?.message}` }, { status: 500 });
  }
}
