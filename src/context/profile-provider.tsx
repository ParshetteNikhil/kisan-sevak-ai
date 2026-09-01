
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRole } from '@/context/role-provider';
import en from '@/locales/en';

type Profile = {
  name: string;
  email: string;
  avatar: string;
  contact: string;
  bio: string;
};

type ProfileContextType = {
  profile: Profile;
  setProfile: (profile: Partial<Profile>) => void;
  isLoading: boolean;
  otherProfile: Profile | null;
};

export const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const defaultFarmerProfile: Profile = {
  name: en.farmer_name,
  email: en.farmer_email,
  avatar: `https://avatar.vercel.sh/farmer.png`,
  contact: '',
  bio: 'Experienced farmer specializing in organic wheat and corn.',
};

const defaultBuyerProfile: Profile = {
  name: en.buyer_name,
  email: en.buyer_email,
  avatar: `https://avatar.vercel.sh/buyer.png`,
  contact: '',
  bio: 'Procurement manager for a large chain of grocery stores.',
};

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { role } = useRole();
  const [profile, setProfileState] = useState<Profile>(defaultFarmerProfile);
  const [otherProfile, setOtherProfileState] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    if (role) {
        const otherRole = role === 'farmer' ? 'buyer' : 'farmer';

        // Load current user's profile
        const savedProfile = localStorage.getItem(`userProfile_${role}`);
        if (savedProfile) {
            try {
                setProfileState(JSON.parse(savedProfile));
            } catch (e) {
                console.error("Failed to parse profile from localStorage", e);
                setProfileState(role === 'farmer' ? defaultFarmerProfile : defaultBuyerProfile);
            }
        } else {
            setProfileState(role === 'farmer' ? defaultFarmerProfile : defaultBuyerProfile);
        }

        // Load other user's profile
        const savedOtherProfile = localStorage.getItem(`userProfile_${otherRole}`);
        const defaultOtherProfile = otherRole === 'farmer' ? defaultFarmerProfile : defaultBuyerProfile;
        if (savedOtherProfile) {
             try {
                setOtherProfileState(JSON.parse(savedOtherProfile));
            } catch (e) {
                console.error("Failed to parse other profile from localStorage", e);
                setOtherProfileState(defaultOtherProfile);
            }
        } else {
            setOtherProfileState(defaultOtherProfile);
        }
    }
    setIsLoading(false);
  }, [role]);

  const setProfile = (newProfileData: Partial<Profile>) => {
    if (role) {
      setProfileState(prevProfile => {
        const updatedProfile = { ...prevProfile, ...newProfileData };
        localStorage.setItem(`userProfile_${role}`, JSON.stringify(updatedProfile));
        return updatedProfile;
      });
    }
  };

  const value = { profile, setProfile, isLoading, otherProfile };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}
