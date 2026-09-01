
'use client';

import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';

type Task = {
  id: string;
  activity: 'Planting' | 'Fertilizing' | 'Harvesting' | 'Weeding' | 'Pest Control' | 'Irrigation';
  crop: string;
  date: string;
  status: 'Upcoming' | 'Done' | 'Delayed';
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
  addGeneratedTasks: (newTasks: Omit<Task, 'id' | 'status'>[]) => void;
  isLoading: boolean;
};

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem('farmTasks');
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      } else {
        // Generate initial tasks on the client to avoid hydration mismatch
        setTasks(getInitialTasks());
      }
    } catch (e) {
      console.error("Failed to parse tasks from localStorage", e);
      setTasks(getInitialTasks());
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateTasks = (newTasks: Task[]) => {
      const sortedTasks = newTasks.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      localStorage.setItem('farmTasks', JSON.stringify(sortedTasks));
      setTasks(sortedTasks);
  }

  const addTask = (newTaskData: Omit<Task, 'id' | 'status'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: `TSK${Date.now()}`,
      status: 'Upcoming',
    };
    updateTasks([newTask, ...tasks]);
  };
  
  const addGeneratedTasks = (newTasksData: Omit<Task, 'id' | 'status'>[]) => {
     const formattedTasks: Task[] = newTasksData.map((task, index) => ({
        ...task,
        id: `TSK-AI-${Date.now()}-${index}`,
        status: 'Upcoming',
    }));
    updateTasks([...tasks, ...formattedTasks]);
  };

  const value = { tasks, addTask, addGeneratedTasks, isLoading };

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
}
