
'use client';

import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';

type Record = {
  id: string;
  crop: string;
  yield: number;
  date: string;
  notes: string;
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
  addRecord: (record: Omit<Record, 'id'>) => void;
  isLoading: boolean;
};

const RecordsContext = createContext<RecordsContextType | undefined>(undefined);

export function RecordsProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<Record[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedRecords = localStorage.getItem('farmRecords');
      if (savedRecords) {
        setRecords(JSON.parse(savedRecords));
      } else {
        setRecords(initialRecords);
      }
    } catch (e) {
      console.error("Failed to parse records from localStorage", e);
      setRecords(initialRecords);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addRecord = (newRecordData: Omit<Record, 'id'>) => {
    setRecords(prevRecords => {
      const newRecord = {
        ...newRecordData,
        id: `REC${String(prevRecords.length + 1).padStart(3, '0')}`,
      };
      const updatedRecords = [newRecord, ...prevRecords];
      localStorage.setItem('farmRecords', JSON.stringify(updatedRecords));
      return updatedRecords;
    });
  };

  const value = { records, addRecord, isLoading };

  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
}

export function useRecords() {
  const context = useContext(RecordsContext);
  if (context === undefined) {
    throw new Error('useRecords must be used within a RecordsProvider');
  }
  return context;
}
