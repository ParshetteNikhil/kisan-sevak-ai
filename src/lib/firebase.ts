import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from 'firebase/firestore';
import { firebaseConfig, firestoreDatabaseId } from './firebase-config';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// On phones, keep a local copy of the farmer's data so saved farm details, tasks and
// listings still show on a weak or missing signal (writes sync when back online).
function makeDb(): Firestore {
  const settings =
    typeof window !== 'undefined' ? { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) } : {};
  try {
    return firestoreDatabaseId ? initializeFirestore(app, settings, firestoreDatabaseId) : initializeFirestore(app, settings);
  } catch {
    return firestoreDatabaseId ? getFirestore(app, firestoreDatabaseId) : getFirestore(app);
  }
}
export const db = makeDb();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Returns a fresh Firebase ID token for the signed-in user, to send to the
 * server with AI requests. Throws a friendly error if nobody is signed in.
 */
export async function getIdTokenOrThrow(): Promise<string> {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in with Google to use the AI features.');
  return user.getIdToken();
}

export default app;
