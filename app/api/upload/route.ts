import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload server-to-server to Catbox (no CORS limitations in Node.js runtime)
    const catboxData = new FormData();
    catboxData.append('reqtype', 'fileupload');
    const blob = new Blob([buffer], { type: file.type || 'image/jpeg' });
    catboxData.append('fileToUpload', blob, `photo_${Date.now()}.jpg`);

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

    return NextResponse.json({ error: 'Catbox upload failed' }, { status: 500 });
  } catch (error: any) {
    console.error('API Upload error:', error);
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
