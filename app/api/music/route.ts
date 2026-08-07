import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get('term') || '';

  if (!term.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
      term
    )}&media=music&entity=song&limit=50`;

    const res = await fetch(itunesUrl, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }, // Cache 5 minutes
    });

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'iTunes search error' }, { status: 500 });
  }
}
