/**
 * Utility functions for camera capture, square 1:1 cropping, and video recording.
 */

export interface CapturedImage {
  dataUrl: string;
  blob: Blob;
  type?: 'photo' | 'video';
}

export interface CapturedMedia {
  type: 'photo' | 'video';
  dataUrl: string;
  blob: Blob;
}

/**
 * Converts a Video Element snapshot into a compressed 1:1 square image Blob & DataURL.
 * Supports isFrontCamera mirroring fix so captured photos match camera preview!
 */
export async function captureSquarePhoto(
  videoElement: HTMLVideoElement,
  quality: number = 0.82,
  maxDimension: number = 1080,
  isFrontCamera: boolean = true
): Promise<CapturedMedia> {
  const canvas = document.createElement('canvas');
  const videoWidth = videoElement.videoWidth || 640;
  const videoHeight = videoElement.videoHeight || 480;

  // Determine square dimensions
  const minDimension = Math.min(videoWidth, videoHeight);
  const startX = (videoWidth - minDimension) / 2;
  const startY = (videoHeight - minDimension) / 2;

  // Output target size (e.g., max 1080x1080)
  const targetSize = Math.min(minDimension, maxDimension);
  canvas.width = targetSize;
  canvas.height = targetSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2d context from canvas');
  }

  // Fix Front Camera Inversion: Flip canvas horizontally if front camera
  if (isFrontCamera) {
    ctx.translate(targetSize, 0);
    ctx.scale(-1, 1);
  }

  // Draw square crop from center of video stream
  ctx.drawImage(
    videoElement,
    startX,
    startY,
    minDimension,
    minDimension,
    0,
    0,
    targetSize,
    targetSize
  );

  const dataUrl = canvas.toDataURL('image/jpeg', quality);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve({ type: 'photo', dataUrl, blob });
        } else {
          reject(new Error('Failed to compress image canvas to blob'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Helper to record a video clip from MediaStream up to maxDurationMs (5000ms max).
 */
export function createVideoRecorder(stream: MediaStream): {
  start: () => void;
  stop: () => Promise<CapturedMedia>;
} {
  let mediaRecorder: MediaRecorder | null = null;
  const chunks: Blob[] = [];

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : MediaRecorder.isTypeSupported('video/webm')
    ? 'video/webm'
    : MediaRecorder.isTypeSupported('video/mp4')
    ? 'video/mp4'
    : '';

  try {
    mediaRecorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);
  } catch (e) {
    mediaRecorder = new MediaRecorder(stream);
  }

  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  return {
    start: () => {
      chunks.length = 0;
      if (mediaRecorder && mediaRecorder.state === 'inactive') {
        mediaRecorder.start(100);
      }
    },
    stop: (): Promise<CapturedMedia> => {
      return new Promise((resolve, reject) => {
        if (!mediaRecorder) return reject(new Error('No MediaRecorder available'));

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: mediaRecorder?.mimeType || 'video/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            resolve({ type: 'video', dataUrl, blob });
          };
          reader.onerror = () => reject(new Error('Failed to read video blob'));
          reader.readAsDataURL(blob);
        };

        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      });
    },
  };
}
