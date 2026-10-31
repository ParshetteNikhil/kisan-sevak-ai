'use client';

import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/context/auth-provider';

export type Task = {
  id: string;
  userId?: string;
  activity: 'Planting' | 'Fertilizing' | 'Harvesting' | 'Weeding' | 'Pest Control' | 'Irrigation';
  crop: string;
  date: string;
  status: 'Upcoming' | 'Done' | 'Delayed';
  createdAt?: string;
};

const getInitialTasks = (): Task[] => {
  const getToday = () => new Date().toISOString().split('T')[0];
  const getFutureDate = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return [
    { id: 'TSK001', activity: 'Planting', crop: 'Spring Wheat (Field A)', date: '2024-04-20', status: 'Done' },
    { id: 'TSK002', activity: 'Fertilizing', crop: 'Corn (Field B)', date: '2024-05-10', status: 'Done' },
    { id: 'TSK003', activity: 'Harvesting', crop: 'Winter Barley (Field C)', date: getToday(), status: 'Upcoming' },
    { id: 'TSK004', activity: 'Planting', crop: 'Soybeans (Field D)', date: '2024-05-15', status: 'Delayed' },
    { id: 'TSK005', activity: 'Fertilizing', crop: 'Spring Wheat (Field A)', date: getFutureDate(2), status: 'Upcoming' },
  ];
};

type TasksContextType = {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'status'>) => void;
  updateTaskStatus: (taskId: string, status: Task['status']) => void;
  deleteTask: (taskId: string) => void;
  addGeneratedTasks: (newTasks: Omit<Task, 'id' | 'status'>[]) => void;
  isLoading: boolean;
};

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      // Local storage fallback for guests
      try {
        const savedTasks = localStorage.getItem('farmTasks');
        if (savedTasks) {
          setTasks(JSON.parse(savedTasks));
        } else {
          setTasks(getInitialTasks());
        }
      } catch (e) {
        setTasks(getInitialTasks());
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Authenticated user: real-time Firestore sync
    setIsLoading(true);
    const tasksCollectionRef = collection(db, 'users', user.uid, 'tasks');
    const unsubscribe = onSnapshot(
      tasksCollectionRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: Task[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Task, 'id'>),
          }));
          loaded.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setTasks(loaded);
        } else {
          // Seed initial tasks if user has no tasks yet
          const initials = getInitialTasks();
          initials.forEach(async (t) => {
            const taskDocRef = doc(db, 'users', user.uid, 'tasks', t.id);
            await setDoc(taskDocRef, { ...t, userId: user.uid, createdAt: new Date().toISOString() });
          });
          setTasks(initials);
        }
        setIsLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/tasks`);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addTask = async (newTaskData: Omit<Task, 'id' | 'status'>) => {
    const id = `TSK${Date.now().toString().slice(-6)}`;
    const newTask: Task = {
      ...newTaskData,
      id,
      status: 'Upcoming',
      createdAt: new Date().toISOString(),
    };

    if (user) {
      try {
        const taskDocRef = doc(db, 'users', user.uid, 'tasks', id);
        await setDoc(taskDocRef, { ...newTask, userId: user.uid });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/tasks/${id}`);
      }
    } else {
      setTasks((prev) => {
        const updated = [...prev, newTask].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        localStorage.setItem('farmTasks', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    if (user) {
      try {
        const taskDocRef = doc(db, 'users', user.uid, 'tasks', taskId);
        await setDoc(taskDocRef, { status }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/tasks/${taskId}`);
      }
    } else {
      setTasks((prev) => {
        const updated = prev.map((t) => (t.id === taskId ? { ...t, status } : t));
        localStorage.setItem('farmTasks', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    if (user) {
      try {
        const taskDocRef = doc(db, 'users', user.uid, 'tasks', taskId);
        await deleteDoc(taskDocRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/tasks/${taskId}`);
      }
    } else {
      setTasks((prev) => {
        const updated = prev.filter((t) => t.id !== taskId);
        localStorage.setItem('farmTasks', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const addGeneratedTasks = async (newTasksData: Omit<Task, 'id' | 'status'>[]) => {
    for (const item of newTasksData) {
      await addTask(item);
    }
  };

  return (
    <TasksContext.Provider
      value={{
        tasks,
        addTask,
        updateTaskStatus,
        deleteTask,
        addGeneratedTasks,
        isLoading,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export const useTasks = () => {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
};
