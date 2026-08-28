"use client";

import { Moment } from '@/lib/types';

const DB_NAME = 'LocketWebDB';
const DB_VERSION = 1;

export interface OutboxItem {
  id: string;
  mediaBlob: Blob;
  mediaType: 'photo' | 'video';
  caption: string;
  recipientIds: string[];
  audioOption?: 'mute' | 'original' | 'music';
  musicJson?: string;
  createdAt: number;
  status: 'pending' | 'uploading' | 'failed';
  attempts: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('moments')) {
        db.createObjectStore('moments', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('media_blobs')) {
        db.createObjectStore('media_blobs');
      }
      if (!db.objectStoreNames.contains('outbox_queue')) {
        db.createObjectStore('outbox_queue', { keyPath: 'id' });
      }
    };
  });
}

/**
 * Saves all moments to IndexedDB for instant 0ms offline access.
 */
export async function saveMomentsToIDB(moments: Moment[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('moments', 'readwrite');
    const store = tx.objectStore('moments');
    store.clear();
    for (const moment of moments) {
      store.put(moment);
    }
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (e) {
    console.warn('[IndexedDB] Save moments failed:', e);
  }
}

/**
 * Retrieves cached moments from IndexedDB.
 */
export async function getMomentsFromIDB(): Promise<Moment[]> {
  try {
    const db = await openDB();
    const tx = db.transaction('moments', 'readonly');
    const store = tx.objectStore('moments');
    const request = store.getAll();
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const res = request.result as Moment[];
        resolve(res || []);
      };
      request.onerror = () => resolve([]);
    });
  } catch (e) {
    console.warn('[IndexedDB] Get moments failed:', e);
    return [];
  }
}

/**
 * Outbox Queue helper for offline upload retry
 */
export async function addOutboxItem(item: OutboxItem): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('outbox_queue', 'readwrite');
    const store = tx.objectStore('outbox_queue');
    store.put(item);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (e) {
    console.warn('[IndexedDB] Add outbox item failed:', e);
  }
}

export async function getOutboxItems(): Promise<OutboxItem[]> {
  try {
    const db = await openDB();
    const tx = db.transaction('outbox_queue', 'readonly');
    const store = tx.objectStore('outbox_queue');
    const request = store.getAll();
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch (e) {
    return [];
  }
}

export async function removeOutboxItem(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('outbox_queue', 'readwrite');
    const store = tx.objectStore('outbox_queue');
    store.delete(id);
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (e) {}
}
