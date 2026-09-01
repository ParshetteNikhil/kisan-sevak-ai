'use client';

import { createContext, ReactNode, useContext } from 'react';

// This provider is no longer in use as authentication has been removed.
export const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export const useAuth = () => {
    return useContext(AuthContext);
};
