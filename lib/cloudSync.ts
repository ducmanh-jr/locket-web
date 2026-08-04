import { Moment } from './types';

const GLOBAL_SYNC_ENDPOINT = 'https://api.restful-api.dev/objects';
const SYNC_TAG = 'locket_v5_global_moment';

/**
 * Uploads a newly posted moment to the Global Public Cloud Store so all accounts & devices can see it.
 */
export async function pushMomentToGlobalCloud(moment: Moment): Promise<boolean> {
  try {
    const payload = {
      name: SYNC_TAG,
      data: {
        id: moment.id,
        sender_id: moment.sender_id,
        sender: moment.sender,
        media_url: moment.media_url,
        caption: moment.caption,
        created_at: moment.created_at,
        reactions: moment.reactions || [],
      },
    };

    const res = await fetch(GLOBAL_SYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch (e) {
    console.error('Error pushing moment to global cloud:', e);
    return false;
  }
}

/**
 * Fetches all user-posted moments from the Global Cloud Store.
 */
export async function fetchGlobalCloudMoments(): Promise<Moment[]> {
  try {
    const res = await fetch(`${GLOBAL_SYNC_ENDPOINT}?name=${SYNC_TAG}`, {
      cache: 'no-store',
    });

    if (!res.ok) return [];

    const list = await res.json();
    if (!Array.isArray(list)) return [];

    const cloudMoments: Moment[] = list
      .map((item: any) => {
        if (!item?.data || !item.data.id || !item.data.media_url) return null;
        return {
          id: item.data.id,
          sender_id: item.data.sender_id,
          sender: item.data.sender,
          media_url: item.data.media_url,
          caption: item.data.caption || '',
          created_at: item.data.created_at || new Date().toISOString(),
          reactions: item.data.reactions || [],
        } as Moment;
      })
      .filter((m): m is Moment => m !== null);

    return cloudMoments;
  } catch (e) {
    console.error('Error fetching global cloud moments:', e);
    return [];
  }
}
