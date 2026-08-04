import { Moment } from './types';

const STORE_URL = 'https://jsonblob.com/api/jsonBlob/019fcc1e-0de5-7e25-bd85-bd9756144094';

export interface CloudProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

interface StoreData {
  profiles: CloudProfile[];
  moments: Moment[];
}

/**
 * Uploads a photo blob to Catbox CDN to get a permanent public direct image URL.
 */
export async function uploadPhotoToCDN(blob: Blob): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', blob, `photo_${Date.now()}.jpg`);

    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const url = await res.text();
      if (url && url.startsWith('https://')) {
        return url.trim();
      }
    }
    return null;
  } catch (e) {
    console.error('Catbox upload error:', e);
    return null;
  }
}

/**
 * Fetches current store contents from JSONBlob.
 */
async function getStore(): Promise<StoreData> {
  try {
    const res = await fetch(STORE_URL, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return { profiles: [], moments: [] };
    const data = await res.json();
    return {
      profiles: Array.isArray(data?.profiles) ? data.profiles : [],
      moments: Array.isArray(data?.moments) ? data.moments : [],
    };
  } catch (e) {
    return { profiles: [], moments: [] };
  }
}

/**
 * Saves store contents to JSONBlob.
 */
async function saveStore(data: StoreData): Promise<boolean> {
  try {
    const res = await fetch(STORE_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

/**
 * Registers a user profile to the Global Cloud Store.
 */
export async function pushProfileToGlobalCloud(profile: CloudProfile): Promise<boolean> {
  try {
    if (!profile.id || !profile.username) return false;
    const store = await getStore();

    // Check if profile exists
    const existingIndex = store.profiles.findIndex(
      (p) => p.id === profile.id || p.username === profile.username
    );

    if (existingIndex >= 0) {
      store.profiles[existingIndex] = {
        ...store.profiles[existingIndex],
        ...profile,
      };
    } else {
      store.profiles.push(profile);
    }

    return await saveStore(store);
  } catch (e) {
    return false;
  }
}

/**
 * Fetches all registered user profiles from the Global Cloud Store.
 */
export async function fetchGlobalCloudProfiles(): Promise<CloudProfile[]> {
  const store = await getStore();
  return store.profiles;
}

/**
 * Pushes a newly posted moment to the Global Cloud Store.
 */
export async function pushMomentToGlobalCloud(moment: Moment): Promise<boolean> {
  try {
    if (!moment.id || !moment.media_url) return false;
    const store = await getStore();

    // Avoid duplicate moment ID
    const exists = store.moments.some((m) => m.id === moment.id);
    if (!exists) {
      // Unshift to place latest first
      store.moments.unshift(moment);
      // Keep max 60 most recent moments in cloud store
      if (store.moments.length > 60) {
        store.moments = store.moments.slice(0, 60);
      }
      return await saveStore(store);
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Fetches all moments posted across accounts from the Global Cloud Store.
 */
export async function fetchGlobalCloudMoments(): Promise<Moment[]> {
  const store = await getStore();
  return store.moments;
}
