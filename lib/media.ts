import { Moment } from './types';

export function isSampleMoment(moment: Moment): boolean {
  return moment.id.startsWith('m-photo-v5-');
}

export function isSystemMoment(moment: Moment | any): boolean {
  if (!moment) return false;
  const senderId = String(moment.sender_id || moment.sender?.id || '');
  const id = String(moment.id || '');
  return (
    senderId === 'user-dm' ||
    senderId === 'user-system32' ||
    senderId === 'user-admin' ||
    senderId.startsWith('user-') ||
    id.startsWith('m-photo-v5-')
  );
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
  return (
    moment.media_type === 'video' ||
    moment.id.includes('video') ||
    moment.media_url.startsWith('data:video/')
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

