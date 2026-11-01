'use client';

import { getAnalytics, isSupported, logEvent, type Analytics } from 'firebase/analytics';
import app from '@/lib/firebase';

let analytics: Analytics | null | undefined;

async function getInstance() {
  if (analytics !== undefined) return analytics;
  try {
    analytics = (await isSupported()) ? getAnalytics(app) : null;
  } catch {
    analytics = null;
  }
  return analytics;
}

/** Logs a usage event to Firebase Analytics (no personal data). */
export function track(name: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return;
  void getInstance().then((a) => {
    if (a) logEvent(a, name, params);
  });
}
