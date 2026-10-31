'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/context/auth-provider';

export type ListingUnit = 'kg' | 'quintal' | 'tonnes';

export type Listing = {
  id: string;
  farmerId: string;
  farmerName: string;
  contact: string;
  crop: string;
  quantity: number;
  unit: ListingUnit;
  askingPrice: number; // ₹ per unit
  location: string;
  status: 'active' | 'sold';
  createdAt: string; // ISO timestamp
};

export type NewListing = Pick<Listing, 'crop' | 'quantity' | 'unit' | 'askingPrice' | 'location'>;

export const UNIT_TO_KG: Record<ListingUnit, number> = { kg: 1, quintal: 100, tonnes: 1000 };

/** Quantity of a listing in quintals (the unit Indian mandis quote in). */
export const toQuintals = (l: Pick<Listing, 'quantity' | 'unit'>) => (l.quantity * UNIT_TO_KG[l.unit]) / 100;
export const listingValue = (l: Pick<Listing, 'quantity' | 'askingPrice'>) => l.quantity * l.askingPrice;

/**
 * Live marketplace listings from Firestore.
 *  - scope "mine": the signed-in farmer's own listings (any status)
 *  - scope "market": everyone's active listings, newest first
 */
export function useListings(scope: 'mine' | 'market') {
  const { user, profile } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setListings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const col = collection(db, 'listings');
    // Filter-only queries avoid needing composite indexes; we sort client-side.
    const q =
      scope === 'mine'
        ? query(col, where('farmerId', '==', user.uid))
        : query(col, where('status', '==', 'active'), limit(500));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => d.data() as Listing);
        rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setListings(rows);
        setError(null);
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'listings');
        setError('Could not load marketplace listings.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user, scope]);

  const addListing = async (input: NewListing) => {
    if (!user) throw new Error('Please sign in to list produce.');
    const id = doc(collection(db, 'listings')).id;
    const listing: Listing = {
      id,
      farmerId: user.uid,
      farmerName: (profile?.displayName || user.displayName || 'Farmer').slice(0, 100),
      contact: (profile?.contact || '').slice(0, 30),
      crop: input.crop.trim().slice(0, 100),
      quantity: input.quantity,
      unit: input.unit,
      askingPrice: input.askingPrice,
      location: input.location.trim().slice(0, 150),
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'listings', id), listing);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `listings/${id}`);
      throw new Error('Could not save your listing. Please try again.');
    }
  };

  const setListingStatus = async (listing: Listing, status: Listing['status']) => {
    try {
      await setDoc(doc(db, 'listings', listing.id), { ...listing, status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `listings/${listing.id}`);
      throw new Error('Could not update the listing.');
    }
  };

  const deleteListing = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'listings', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `listings/${id}`);
      throw new Error('Could not delete the listing.');
    }
  };

  return { listings, loading, error, addListing, setListingStatus, deleteListing };
}
