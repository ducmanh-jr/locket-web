import { Moment } from './types';

export function isSampleMoment(moment: Moment): boolean {
  return moment.id.startsWith('m-photo-v5-');
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
  if (hasLocalOnlyMediaUrl(moment.media_url)) return false;

  if (isVideoMoment(moment)) {
    return (
      moment.media_url.startsWith('https://') ||
      moment.media_url.startsWith('http://') ||
      moment.media_url.startsWith('/') ||
      moment.media_url.startsWith('data:video/')
    );
  }

  return (
    moment.media_url.startsWith('https://') ||
    moment.media_url.startsWith('http://') ||
    moment.media_url.startsWith('/') ||
    moment.media_url.startsWith('data:image/')
  );
}

export function sanitizeMoments(moments: Moment[]): Moment[] {
  return moments.filter(hasRenderableMedia);
}

