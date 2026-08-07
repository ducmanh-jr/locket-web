import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

/**
 * GET /api/recover
 * Scans the Supabase Storage "moments" bucket for all uploaded files,
 * then re-creates the database records that were lost during migration.
 */
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  try {
    // 1. List all folders (user folders) in the moments bucket
    const { data: folders, error: folderError } = await supabase.storage
      .from('moments')
      .list('', { limit: 1000 });

    if (folderError) {
      return NextResponse.json({ error: 'Cannot list storage', detail: folderError.message }, { status: 500 });
    }

    let recoveredCount = 0;
    let skippedCount = 0;
    const recoveredFiles: string[] = [];
    const errors: string[] = [];

    // 2. For each folder (could be user ID folders or direct files)
    for (const item of folders || []) {
      // If it's a folder (user ID folder), list files inside
      if (!item.metadata || item.id === null) {
        const { data: files } = await supabase.storage
          .from('moments')
          .list(item.name, { limit: 1000 });

        for (const file of files || []) {
          if (!file.name || file.name.startsWith('.')) continue;

          const filePath = `${item.name}/${file.name}`;
          const result = await recoverFile(filePath, item.name, file);
          if (result.recovered) {
            recoveredCount++;
            recoveredFiles.push(filePath);
          } else if (result.skipped) {
            skippedCount++;
          } else if (result.error) {
            errors.push(result.error);
          }
        }
      } else {
        // Direct file in root
        if (!item.name || item.name.startsWith('.')) continue;
        const result = await recoverFile(item.name, 'unknown', item);
        if (result.recovered) {
          recoveredCount++;
          recoveredFiles.push(item.name);
        } else if (result.skipped) {
          skippedCount++;
        } else if (result.error) {
          errors.push(result.error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Khôi phục thành công ${recoveredCount} khoảnh khắc từ Storage.`,
      recovered: recoveredCount,
      skipped: skippedCount,
      files: recoveredFiles,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Recovery failed' }, { status: 500 });
  }
}

async function recoverFile(
  filePath: string,
  senderId: string,
  fileInfo: any
): Promise<{ recovered?: boolean; skipped?: boolean; error?: string }> {
  try {
    // Generate a stable ID from the file path
    const momentId = `recovered-${filePath.replace(/[^a-zA-Z0-9]/g, '-')}`;

    // Check if this moment already exists in DB
    const { data: existing } = await supabase
      .from('moments')
      .select('id')
      .eq('id', momentId)
      .maybeSingle();

    if (existing) {
      return { skipped: true };
    }

    // Get the public URL for this file
    const { data: urlData } = supabase.storage
      .from('moments')
      .getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) {
      return { error: `No public URL for ${filePath}` };
    }

    // Determine media type from extension
    const ext = filePath.toLowerCase().split('.').pop() || '';
    const videoExts = ['mp4', 'webm', 'mov', 'avi'];
    const mediaType = videoExts.includes(ext) ? 'video' : 'photo';

    // Determine created_at from file metadata or use current time
    const createdAt = fileInfo?.created_at || fileInfo?.updated_at || new Date().toISOString();

    // Ensure sender profile exists
    await supabase.from('profiles').upsert({
      id: senderId,
      username: senderId.substring(0, 20) || 'user',
      display_name: 'Thành viên Locket',
      avatar_url: '',
    });

    // Insert the recovered moment
    const { error } = await supabase.from('moments').insert({
      id: momentId,
      sender_id: senderId,
      media_url: publicUrl,
      media_type: mediaType,
      caption: '',
      created_at: createdAt,
    });

    if (error) {
      return { error: `Insert failed for ${filePath}: ${error.message}` };
    }

    return { recovered: true };
  } catch (e: any) {
    return { error: `Error recovering ${filePath}: ${e?.message}` };
  }
}
