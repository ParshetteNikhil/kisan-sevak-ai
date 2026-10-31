'use client';

import { collection, deleteDoc, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { deleteUser, reauthenticateWithPopup, type User } from 'firebase/auth';
import { db, googleProvider } from '@/lib/firebase';

const USER_SUBCOLLECTIONS = ['tasks', 'records', 'inventory', 'chat_messages', 'bioscience_queries'];

async function deleteDocsInBatches(refs: { path: string }[]) {
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(db);
    for (const ref of refs.slice(i, i + 400)) batch.delete(doc(db, ref.path));
    await batch.commit();
  }
}

/**
 * Permanently deletes the signed-in user's data (profile, farm data,
 * marketplace listings) and then their Firebase Auth account.
 */
export async function deleteAccountAndData(user: User): Promise<void> {
  const uid = user.uid;

  // Firebase requires a recent sign-in to delete an account; confirm identity first.
  await reauthenticateWithPopup(user, googleProvider);

  const listings = await getDocs(query(collection(db, 'listings'), where('farmerId', '==', uid)));
  await deleteDocsInBatches(listings.docs.map((d) => d.ref));

  for (const name of USER_SUBCOLLECTIONS) {
    const snap = await getDocs(collection(db, 'users', uid, name));
    await deleteDocsInBatches(snap.docs.map((d) => d.ref));
  }

  await deleteDoc(doc(db, 'users', uid));

  try {
    localStorage.clear();
  } catch {}

  await deleteUser(user);
}
