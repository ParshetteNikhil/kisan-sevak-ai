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

const initialRecords: Record[] = [];

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
          setRecords([]);
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
