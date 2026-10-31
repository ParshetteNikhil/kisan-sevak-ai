'use client';

import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/context/auth-provider';

export type Record = {
  id: string;
  userId?: string;
  crop: string;
  yield: number;
  date: string;
  notes: string;
  createdAt?: string;
};

const initialRecords: Record[] = [
  { id: 'REC001', crop: 'Potatoes', yield: 5200, date: '2023-10-15', notes: 'Slight blight issue mid-season, treated successfully.' },
  { id: 'REC002', crop: 'Wheat', yield: 4500, date: '2023-08-20', notes: 'Excellent quality, high protein content.' },
  { id: 'REC003', crop: 'Corn', yield: 7800, date: '2023-09-30', notes: 'Late-season pest damage reduced yield by ~5%.' },
  { id: 'REC004', crop: 'Barley', yield: 4100, date: '2023-08-25', notes: 'Sold for malting.' },
  { id: 'REC005', crop: 'Potatoes', yield: 5824, date: '2024-10-12', notes: 'Improved irrigation led to higher yield.' },
];

type RecordsContextType = {
  records: Record[];
  addRecord: (record: Omit<Record, 'id'>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  isLoading: boolean;
};

const RecordsContext = createContext<RecordsContextType | undefined>(undefined);

export function RecordsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [records, setRecords] = useState<Record[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      try {
        const savedRecords = localStorage.getItem('farmRecords');
        if (savedRecords) {
          setRecords(JSON.parse(savedRecords));
        } else {
          setRecords(initialRecords);
        }
      } catch (e) {
        setRecords(initialRecords);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    const recordsCol = collection(db, 'users', user.uid, 'records');
    const unsubscribe = onSnapshot(
      recordsCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: Record[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Record, 'id'>),
          }));
          loaded.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setRecords(loaded);
        } else {
          // Seed initial records for new user
          initialRecords.forEach(async (r) => {
            const recDocRef = doc(db, 'users', user.uid, 'records', r.id);
            await setDoc(recDocRef, { ...r, userId: user.uid, createdAt: new Date().toISOString() });
          });
          setRecords(initialRecords);
        }
        setIsLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/records`);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addRecord = async (newRecordData: Omit<Record, 'id'>) => {
    const id = `REC${Date.now().toString().slice(-6)}`;
    const newRecord: Record = {
      ...newRecordData,
      id,
      createdAt: new Date().toISOString(),
    };

    if (user) {
      try {
        const recDocRef = doc(db, 'users', user.uid, 'records', id);
        await setDoc(recDocRef, { ...newRecord, userId: user.uid });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/records/${id}`);
      }
    } else {
      setRecords((prevRecords) => {
        const updated = [newRecord, ...prevRecords];
        localStorage.setItem('farmRecords', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const deleteRecord = async (id: string) => {
    if (user) {
      try {
        const recDocRef = doc(db, 'users', user.uid, 'records', id);
        await deleteDoc(recDocRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/records/${id}`);
      }
    } else {
      setRecords((prev) => {
        const updated = prev.filter((r) => r.id !== id);
        localStorage.setItem('farmRecords', JSON.stringify(updated));
        return updated;
      });
    }
  };

  return (
    <RecordsContext.Provider value={{ records, addRecord, deleteRecord, isLoading }}>
      {children}
    </RecordsContext.Provider>
  );
}

export const useRecords = () => {
  const context = useContext(RecordsContext);
  if (!context) {
    throw new Error('useRecords must be used within a RecordsProvider');
  }
  return context;
};
