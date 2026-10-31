'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export type UserProfileData = {
  id: string;
  displayName: string;
  email: string;
  photoURL: string;
  role: 'farmer' | 'buyer';
  contact?: string;
  bio?: string;
  updatedAt?: string;
};

interface AuthContextType {
  user: User | null;
  profile: UserProfileData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfileData>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  updateUserProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfileData);
          } else {
            // Initialize new user profile document
            const newProfile: UserProfileData = {
              id: currentUser.uid,
              displayName: currentUser.displayName || 'Farmer',
              email: currentUser.email || '',
              photoURL: currentUser.photoURL || `https://avatar.vercel.sh/${currentUser.uid}.png`,
              role: 'farmer',
              contact: '',
              bio: 'Active farmer on Kisaan Sevak',
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      toast({
        title: 'Signed in successfully',
        description: 'Welcome to Kisaan Sevak!',
      });
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: error?.message || 'Could not complete Google Sign-In',
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
      toast({
        title: 'Signed out',
        description: 'You have been securely signed out.',
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
    }
  };

  const updateUserProfile = async (data: Partial<UserProfileData>) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const updated = {
        ...profile,
        ...data,
        id: user.uid,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, updated, { merge: true });
      setProfile(updated as UserProfileData);
      toast({
        title: 'Profile Updated',
        description: 'Your profile changes have been saved to Firestore.',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update profile.',
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signOut,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
