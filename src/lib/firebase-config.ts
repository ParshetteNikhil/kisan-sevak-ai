import appletConfig from '../../firebase-applet-config.json';

/**
 * Firebase web config. Set the NEXT_PUBLIC_FIREBASE_* variables (see .env.example)
 * to point the app at your own Firebase project. If they are not set, it falls
 * back to firebase-applet-config.json (the project Google AI Studio created).
 *
 * These values are public client identifiers, not secrets — access is controlled
 * by firestore.rules and by restricting the API key in Google Cloud Console.
 */
const env = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // Leave empty to use the project's "(default)" Firestore database.
  firestoreDatabaseId: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID,
};

const useEnv = Boolean(env.apiKey && env.projectId);
const fallback = appletConfig as typeof appletConfig & { firestoreDatabaseId?: string };

/**
 * On the deployed site, sign-in runs through our own domain (proxied to
 * Firebase by the /__/auth rewrite in next.config.ts). This keeps Google
 * sign-in working inside the Android app and in browsers that block
 * third-party storage. Locally we use the default firebaseapp.com domain.
 */
function resolveAuthDomain(defaultDomain: string): string {
  if (typeof window === 'undefined') return defaultDomain;
  const { hostname, host } = window.location;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local');
  return isLocal ? defaultDomain : host;
}

export const firebaseConfig = {
  apiKey: (useEnv ? env.apiKey : fallback.apiKey) as string,
  authDomain: resolveAuthDomain((useEnv ? env.authDomain : fallback.authDomain) as string),
  projectId: (useEnv ? env.projectId : fallback.projectId) as string,
  storageBucket: (useEnv ? env.storageBucket : fallback.storageBucket) as string | undefined,
  messagingSenderId: (useEnv ? env.messagingSenderId : fallback.messagingSenderId) as string | undefined,
  appId: (useEnv ? env.appId : fallback.appId) as string,
};

export const firestoreDatabaseId: string | undefined =
  (useEnv ? env.firestoreDatabaseId : fallback.firestoreDatabaseId) || undefined;
