'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Building } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Skeleton } from '@/components/ui/skeleton';

type Role = 'farmer' | 'buyer';

type RoleContextType = {
  role: Role | null;
  setRole: (role: Role | null) => void;
  isLoading: boolean;
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole') as Role | null;
    if (savedRole) {
      setRoleState(savedRole);
    }
    setIsLoading(false);
  }, []);

  const setRole = (newRole: Role | null) => {
    if (newRole) {
      localStorage.setItem('userRole', newRole);
    } else {
      localStorage.removeItem('userRole');
    }
    setRoleState(newRole);
  };
  
  if (isLoading) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-lg space-y-4">
                <Skeleton className="h-10 w-48 mx-auto" />
                <Skeleton className="h-8 w-72 mx-auto" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        </div>
    );
  }

  if (!role) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="absolute top-8 left-8">
            <Logo />
        </div>
        <Card className="w-full max-w-lg text-center shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Welcome!</CardTitle>
            <CardDescription>Please select your role to get started.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6">
            <div 
              className="p-6 border rounded-lg cursor-pointer hover:bg-accent hover:border-primary/80 transition-all flex flex-col items-center gap-4 transform hover:-translate-y-1"
              onClick={() => setRole('farmer')}
            >
              <div className="p-3 bg-primary/10 rounded-full">
                <User className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Farmer</h3>
              <p className="text-sm text-muted-foreground">Manage your crops, schedule tasks, and sell your produce.</p>
            </div>
             <div 
              className="p-6 border rounded-lg cursor-pointer hover:bg-accent hover:border-primary/80 transition-all flex flex-col items-center gap-4 transform hover:-translate-y-1"
              onClick={() => setRole('buyer')}
            >
              <div className="p-3 bg-primary/10 rounded-full">
                <Building className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Buyer / Business</h3>
              <p className="text-sm text-muted-foreground">View market prices, find available stock, and connect with farmers.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <RoleContext.Provider value={{ role, setRole, isLoading }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
