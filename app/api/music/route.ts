import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get('term') || '';
  const chart = searchParams.get('chart') || '';

  // If chart=trending or term is empty, fetch Real-Time Daily Apple Music Top Songs Chart for Vietnam
  if (chart === 'trending' || !term.trim()) {
    try {
      const chartUrl = `https://itunes.apple.com/vn/rss/topsongs/limit=30/json`;
      const res = await fetch(chartUrl, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 3600 }, // Cache 1 hour for daily freshness
      });

      if (res.ok) {
        const data = await res.json();
        const entries = data?.feed?.entry || [];

        const results = entries.map((entry: any, index: number) => {
          const trackId = entry?.id?.attributes?.['im:id'] || `trending-${index}`;
          const title = entry?.['im:name']?.label || 'Unknown Track';
          const artist = entry?.['im:artist']?.label || 'Unknown Artist';
          const cover_url = entry?.['im:image']?.[2]?.label || entry?.['im:image']?.[0]?.label;
          const preview_url = entry?.link?.[1]?.attributes?.href || entry?.link?.[0]?.attributes?.href;

          return {
            trackId,
            trackName: title,
            artistName: artist,
            artworkUrl100: cover_url,
            previewUrl: preview_url,
            isTrending: true,
            rank: index + 1,
          };
        }).filter((item: any) => item.previewUrl || item.artworkUrl100);

        if (results.length > 0) {
          return NextResponse.json({ results }, {
            headers: {
              'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
            },
          });
        }
      }
    } catch (err) {
      console.warn('Chart fetch failed, falling back to search:', err);
    }
  }

  // Live iTunes Search when user types query
  try {
    const searchTerm = term.trim() || 'vpop hot trending';
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
      searchTerm
    )}&country=VN&media=music&entity=song&limit=50`;

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
