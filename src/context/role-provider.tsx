'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useAuth } from '@/context/auth-provider';
import { Onboarding } from '@/components/farmer/onboarding';

type Role = 'farmer' | 'buyer';

type RoleContextType = {
  role: Role | null;
  setRole: (role: Role | null) => void;
  isLoading: boolean;
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role | null>('farmer');
  const [isLoading, setIsLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const { user, profile, updateUserProfile } = useAuth();

  // For signed-in users the role saved in their Firestore profile is the source of truth.
  useEffect(() => {
    if (profile?.role) {
      setRoleState(profile.role);
      try {
        localStorage.setItem('userRole', profile.role);
      } catch {}
    }
  }, [profile?.role]);

  useEffect(() => {
    try {
      const savedRole = localStorage.getItem('userRole') as Role | null;
      if (savedRole) {
        setRoleState(savedRole);
      }
      setOnboarded(localStorage.getItem('onboarded') === '1' || Boolean(savedRole));
    } catch (e) {
      console.error('Failed to read userRole from localStorage', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setRole = (newRole: Role | null) => {
    if (newRole) {
      try {
        localStorage.setItem('userRole', newRole);
      } catch {}
    } else {
      try {
        localStorage.removeItem('userRole');
      } catch {}
    }
    setRoleState(newRole);
    if (newRole && user && profile && profile.role !== newRole) {
      void updateUserProfile({ role: newRole });
    }
  };

  const finishOnboarding = (picked: Role) => {
    try {
      localStorage.setItem('onboarded', '1');
    } catch {}
    setOnboarded(true);
    setRole(picked);
  };

  return (
    <RoleContext.Provider value={{ role, setRole, isLoading }}>
      {isLoading ? (
        <div className="min-h-screen bg-background" />
      ) : onboarded && role ? (
        children
      ) : (
        <Onboarding onDone={finishOnboarding} />
      )}
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
