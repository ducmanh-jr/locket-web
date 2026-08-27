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

export function hasRenderableMedia(moment: Moment): boolean {
  if (!moment?.id || !moment.media_url) return false;
  const url = moment.media_url;

  return (
    url.startsWith('https://') ||
    url.startsWith('http://') ||
    url.startsWith('/') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  );
}

export function sanitizeMoments(moments: Moment[]): Moment[] {
  const filtered = moments.filter(hasRenderableMedia);
  return sortMoments(filtered) as Moment[];
}

const blobUrlCache = new Map<string, string>();

export function getSafeMediaUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('data:video/')) {
    if (blobUrlCache.has(url)) return blobUrlCache.get(url)!;
    try {
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

