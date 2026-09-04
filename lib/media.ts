import { Moment } from './types';

export function isSampleMoment(moment: Moment): boolean {
  return moment.id.startsWith('m-photo-v5-');
}

export function isSystemMoment(moment: Moment | any): boolean {
  if (!moment) return false;
  return false;
}

export function sortMoments(moments: Moment[] | any[]): Moment[] | any[] {
  return [...moments].sort((a, b) => {
    const isSysA = isSystemMoment(a);
    const isSysB = isSystemMoment(b);

    // 1. Primary rule: Real users first, System demo users at the very bottom
    if (isSysA && !isSysB) return 1;
    if (!isSysA && isSysB) return -1;

    // 2. Secondary rule: Within same category, newest timestamp FIRST (descending)
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeB - timeA;
  });
}

export function isVideoMoment(moment: Moment): boolean {
  if (!moment) return false;
  const mediaUrl = (moment.media_url || '').toLowerCase();
  return (
    moment.media_type === 'video' ||
    (moment.id || '').includes('video') ||
    mediaUrl.startsWith('data:video/') ||
    mediaUrl.endsWith('.mp4') ||
    mediaUrl.endsWith('.webm') ||
    mediaUrl.endsWith('.mov')
  );
}

export function hasLocalOnlyMediaUrl(url?: string): boolean {
  return !url || url.startsWith('blob:');
}

export function isDeletedMoment(moment: any): boolean {
  if (!moment || !moment.id) return true;
  const id = String(moment.id);
  const caption = String(moment.caption || '');
  const mediaUrl = String(moment.media_url || '');

  return (
    caption === '__DELETED_MOMENT__' ||
    id.startsWith('del_moment_') ||
    mediaUrl.includes('deleted.invalid') ||
    mediaUrl.includes('https://deleted.invalid')
  );
}

export function hasRenderableMedia(moment: Moment): boolean {
  if (!moment?.id) return false;
  if (isDeletedMoment(moment)) return false;
  const url = moment.media_url || moment.thumbnail_url;
  if (!url || typeof url !== 'string' || url.trim().length === 0) return false;

  return (
    url.startsWith('https://') ||
    url.startsWith('http://') ||
    url.startsWith('/') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  );
}

export function sanitizeMoments(moments: Moment[]): Moment[] {
  const filtered = (moments || [])
    .filter((m) => m && m.id && !isDeletedMoment(m))
    .filter(hasRenderableMedia);
  return sortMoments(filtered) as Moment[];
}

const blobUrlCache = new Map<string, string>();
const MAX_BLOB_CACHE_SIZE = 40;

export function getSafeMediaUrl(url?: string): string {
  if (!url || url.length === 0) {
    return 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80';
  }
  if (url.startsWith('data:video/')) {
    if (blobUrlCache.has(url)) return blobUrlCache.get(url)!;
    try {
      if (blobUrlCache.size >= MAX_BLOB_CACHE_SIZE) {
        const firstKey = blobUrlCache.keys().next().value;
        if (firstKey) {
          const oldObjectUrl = blobUrlCache.get(firstKey);
          if (oldObjectUrl && oldObjectUrl.startsWith('blob:')) {
            try { URL.revokeObjectURL(oldObjectUrl); } catch (e) {}
          }
          blobUrlCache.delete(firstKey);
        }
      }

      const parts = url.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'video/mp4';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const objectUrl = URL.createObjectURL(blob);
      blobUrlCache.set(url, objectUrl);
      return objectUrl;
    } catch (e) {
      return url;
    }
  }
  return url;
}

