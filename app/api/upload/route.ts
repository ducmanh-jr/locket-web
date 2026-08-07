import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

function getUploadFileName(file: File): string {
  const mime = file.type || 'application/octet-stream';
  const ext = mime.includes('webm')
    ? 'webm'
    : mime.includes('mp4')
      ? 'mp4'
      : mime.includes('png')
        ? 'png'
        : mime.includes('webp')
          ? 'webp'
          : 'jpg';

  const randomId = Math.random().toString(36).substring(2, 9);
  return `moment_${Date.now()}_${randomId}.${ext}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy file tải lên' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Kích thước file vượt quá giới hạn 10MB' },
        { status: 400 }
      );
    }

    const mime = file.type || '';
    if (mime && !ALLOWED_MIME_TYPES.some((type) => mime.startsWith(type.split('/')[0]))) {
      return NextResponse.json(
        { error: 'Định dạng file không được hỗ trợ' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = getUploadFileName(file);

    // 1. Upload to Supabase Storage if configured
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.storage
          .from('moments')
          .upload(fileName, buffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: true,
          });

        if (!error && data?.path) {
          const { data: publicUrlData } = supabase.storage
            .from('moments')
            .getPublicUrl(data.path);

          if (publicUrlData?.publicUrl) {
            return NextResponse.json({ url: publicUrlData.publicUrl });
          }
        } else if (error) {
          console.warn('Supabase storage upload fallback triggered:', error.message);
        }
      } catch (storageErr) {
        console.warn('Supabase storage exception:', storageErr);
      }
    }

    // 2. Fallback: Save to local public/uploads for local development
    try {
      const fs = await import('fs');
      const path = await import('path');
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path.join(uploadsDir, fileName);
      await fs.promises.writeFile(filePath, buffer);

      const host = request.headers.get('host') || 'localhost:3000';
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const publicUrl = `${protocol}://${host}/uploads/${fileName}`;

      return NextResponse.json({ url: publicUrl });
    } catch (fsErr) {
      console.error('Local storage write failed:', fsErr);
    }

    return NextResponse.json({ error: 'Tải file thất bại' }, { status: 500 });
  } catch (error: any) {
    console.error('API Upload error:', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
