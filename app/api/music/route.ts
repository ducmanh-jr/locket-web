import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get('term') || '';
  const chart = searchParams.get('chart') || '';
  const limit = Math.min(Number(searchParams.get('limit')) || 100, 200);

  // If chart=trending or term is empty, fetch Gentle & Chill V-Pop Songs
  if (chart === 'trending' || !term.trim()) {
    try {
      // Query iTunes for top V-Pop Lofi Chill Acoustic tracks
      const chillTerms = ['vpop lofi chill', 'nhac nhe nhang acoustic viet', 'vpop hot chill lofi'];
      const randomTerm = chillTerms[Math.floor(Math.random() * chillTerms.length)];

      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
        randomTerm
      )}&country=VN&media=music&entity=song&limit=${limit}`;

      const res = await fetch(itunesUrl, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 1800 },
      });

      if (res.ok) {
        const data = await res.json();
        const results = (data?.results || [])
          .filter((item: any) => item.previewUrl)
          .map((item: any, index: number) => ({
            trackId: item.trackId,
            trackName: item.trackName,
            artistName: item.artistName,
            artworkUrl100: item.artworkUrl100 || item.artworkUrl60,
            previewUrl: item.previewUrl,
            isChill: true,
          }));

        if (results.length > 0) {
          return NextResponse.json({ results }, {
            headers: {
              'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
            },
          });
        }
      }
    } catch (err) {
      console.warn('Chill chart fetch failed:', err);
    }
  }

  // Live iTunes Search focused on V-Pop / Chill
  try {
    const searchTerm = term.trim() || 'vpop lofi chill nhe nhang';
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
      searchTerm
    )}&country=VN&media=music&entity=song&limit=${limit}`;

    const res = await fetch(itunesUrl, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 300 },
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
