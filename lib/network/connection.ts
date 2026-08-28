"use client";

export interface NetworkStatus {
  isOnline: boolean;
  saveData: boolean;
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
  isSlowConnection: boolean;
}

export function getNetworkStatus(): NetworkStatus {
  if (typeof window === 'undefined') {
    return {
      isOnline: true,
      saveData: false,
      effectiveType: '4g',
      isSlowConnection: false,
    };
  }

  const nav = navigator as any;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

  const isOnline = navigator.onLine !== false;
  const saveData = conn?.saveData === true;
  const effectiveType = conn?.effectiveType || 'unknown';

  const isSlowConnection =
    saveData || effectiveType === '2g' || effectiveType === 'slow-2g' || effectiveType === '3g';

  return {
    isOnline,
    saveData,
    effectiveType,
    isSlowConnection,
  };
}

export function subscribeNetworkStatus(callback: (status: NetworkStatus) => void) {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = () => {
    callback(getNetworkStatus());
  };

  window.addEventListener('online', handleUpdate);
  window.addEventListener('offline', handleUpdate);

  const nav = navigator as any;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
  if (conn) {
    conn.addEventListener('change', handleUpdate);
  }

  // Initial call
  callback(getNetworkStatus());

  return () => {
    window.removeEventListener('online', handleUpdate);
    window.removeEventListener('offline', handleUpdate);
    if (conn) {
      conn.removeEventListener('change', handleUpdate);
    }
  };
}
