"use client";

import { addOutboxItem, getOutboxItems, removeOutboxItem, OutboxItem } from '@/lib/storage/indexedDb';

export type OutboxStatusListener = (count: number) => void;
const listeners: Set<OutboxStatusListener> = new Set();

export function subscribeOutboxStatus(listener: OutboxStatusListener) {
  listeners.add(listener);
  updateOutboxCount();
  return () => {
    listeners.delete(listener);
  };
}

async function updateOutboxCount() {
  try {
    const items = await getOutboxItems();
    listeners.forEach((fn) => fn(items.length));
  } catch (e) {}
}

export async function enqueuePendingPost(
  mediaBlob: Blob,
  mediaType: 'photo' | 'video',
  caption: string,
  recipientIds: string[],
  audioOption?: 'mute' | 'original' | 'music',
  musicJson?: string
): Promise<OutboxItem> {
  const item: OutboxItem = {
    id: `outbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    mediaBlob,
    mediaType,
    caption,
    recipientIds,
    audioOption,
    musicJson,
    createdAt: Date.now(),
    status: 'pending',
    attempts: 0,
  };

  await addOutboxItem(item);
  await updateOutboxCount();
  return item;
}

let isProcessing = false;

export async function processOutboxQueue(
  uploadHandler: (
    mediaBlob: Blob,
    mediaType: 'photo' | 'video',
    caption: string,
    recipientIds: string[],
    audioOption?: 'mute' | 'original' | 'music',
    musicJson?: string
  ) => Promise<boolean>
): Promise<void> {
  if (isProcessing || typeof window === 'undefined' || !navigator.onLine) return;
  isProcessing = true;

  try {
    const items = await getOutboxItems();
    for (const item of items) {
      if (!navigator.onLine) break;
      try {
        item.attempts += 1;
        item.status = 'uploading';
        const success = await uploadHandler(
          item.mediaBlob,
          item.mediaType,
          item.caption,
          item.recipientIds,
          item.audioOption,
          item.musicJson
        );
        if (success) {
          await removeOutboxItem(item.id);
        }
      } catch (e) {
        console.warn('[OutboxQueue] Retry upload failed for item:', item.id, e);
      }
    }
  } finally {
    isProcessing = false;
    await updateOutboxCount();
  }
}
