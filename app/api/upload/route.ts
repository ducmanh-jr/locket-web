import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function getUploadName(file: File): string {
  const mime = file.type || 'application/octet-stream';
  const ext = mime.includes('webm')
    ? 'webm'
    : mime.includes('mp4')
      ? 'mp4'
      : mime.includes('png')
        ? 'png'
        : mime.includes('jpeg') || mime.includes('jpg')
          ? 'jpg'
          : 'bin';

  const originalName = typeof file.name === 'string' ? file.name : '';
  const safeBaseName = originalName
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 60);

  return `${safeBaseName || 'locket_media'}_${Date.now()}.${ext}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = getUploadName(file);

    // 1. Save to local public/uploads directory for high-speed local serving
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path.join(uploadsDir, fileName);
      await fs.promises.writeFile(filePath, buffer);
      
      const origin = request.headers.get('origin') || request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const host = request.headers.get('host') || 'localhost:3000';
      const publicUrl = `${protocol}://${host}/uploads/${fileName}`;

      return NextResponse.json({ url: publicUrl });
    } catch (fsErr) {
      console.warn('Local uploads folder write failed, falling back to Catbox:', fsErr);
    }

    // 2. Fallback upload to Catbox (no CORS limitations in Node.js runtime)
    const catboxData = new FormData();
    catboxData.append('reqtype', 'fileupload');
    const blob = new Blob([buffer], { type: file.type || 'application/octet-stream' });
    catboxData.append('fileToUpload', blob, fileName);

    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: catboxData,
    });

    if (res.ok) {
      const url = (await res.text()).trim();
      if (url.startsWith('https://')) {
        return NextResponse.json({ url });
      }
    }

    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  } catch (error: any) {
    console.error('API Upload error:', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
