'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/context/auth-provider';
import { farmerStrings, CROPS } from '@/locales/farmer';

const EN = farmerStrings.en;
const label = (prefix: string, key?: string) => (key ? EN[`${prefix}_${key}`] || key : undefined);

export type SoilCard = {
  n?: number; p?: number; k?: number; s?: number;
  zn?: number; fe?: number; cu?: number; mn?: number; b?: number;
  ph?: number; ec?: number; oc?: number;
  testDate?: string;
};

export type FarmProfile = {
  district?: string;
  state?: string;
  lat?: number;
  lon?: number;
  landArea?: number;
  areaUnit?: 'acre' | 'bigha' | 'hectare';
  soilType?: string;
  waterSource?: string;
  mainCrop?: string;
  season?: string;
  soilCard?: SoilCard;
  updatedAt?: string;
};

/** The signed-in farmer's farm profile, kept in users/{uid}/farm/main. */
export function useFarmProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<FarmProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const ref = doc(db, 'users', user.uid, 'farm', 'main');
    return onSnapshot(
      ref,
      (snap) => {
        setProfile((snap.data() as FarmProfile) || {});
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}/farm/main`);
        setLoading(false);
      }
    );
  }, [user]);

  const save = async (changes: Partial<FarmProfile>) => {
    if (!user) throw new Error('Please sign in');
    const clean = JSON.parse(JSON.stringify({ ...changes, updatedAt: new Date().toISOString() }));
    await setDoc(doc(db, 'users', user.uid, 'farm', 'main'), clean, { merge: true });
  };

  return { profile, loading, save };
}

/** One short paragraph the AI can use as context about this farm. */
export function farmContext(p?: FarmProfile | null): string {
  if (!p) return '';
  const parts: string[] = [];
  if (p.district || p.state) parts.push(`Location: ${[p.district, p.state].filter(Boolean).join(', ')}`);
  if (p.landArea) parts.push(`Land: ${p.landArea} ${p.areaUnit || 'acre'}`);
  if (p.soilType && p.soilType !== 'unknown') parts.push(`Soil type (farmer says): ${label('soil', p.soilType)}`);
  if (p.waterSource) parts.push(`Water source: ${label('water', p.waterSource)}`);
  if (p.mainCrop) parts.push(`Main crop: ${CROPS.find((c) => c.key === p.mainCrop)?.en || p.mainCrop}`);
  if (p.season) parts.push(`Season: ${label('season', p.season)}`);
  const c = p.soilCard;
  if (c && Object.values(c).some((v) => v !== undefined && v !== '')) {
    const vals = Object.entries(c)
      .filter(([k, v]) => k !== 'testDate' && v !== undefined && v !== null)
      .map(([k, v]) => `${k.toUpperCase()}=${v}`)
      .join(', ');
    parts.push(`Government Soil Health Card${c.testDate ? ` (tested ${c.testDate})` : ''}: ${vals}`);
  }
  return parts.join('. ').slice(0, 1500);
}
