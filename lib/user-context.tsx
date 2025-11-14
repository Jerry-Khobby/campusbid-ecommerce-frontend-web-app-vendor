"use client";

import type React from "react";
import { createContext, useContext, useState } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  profileImage?: string;
  joinDate: string;
  userType: "buyer" | "vendor";
  stats: {
    orders: number;
    bidsWon: number;
    rating: number;
  };
  savedItems: number[];
}

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoggedIn: boolean;
  login: (email: string, password: string, name: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  toggleSaveItem: (itemId: number) => void;
  updateProfileImage: (imageUrl: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const defaultUser: User = {
  id: "user-001",
  name: "Alex Student",
  email: "alex@university.edu",
  phone: "+1 (555) 123-4567",
  avatar: "AS",
  profileImage: undefined,
  joinDate: "January 2024",
  userType: "buyer",
  stats: {
    orders: 12,
    bidsWon: 8,
    rating: 4.8,
  },
  savedItems: [],
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const login = (email: string, password: string, name: string) => {
    if (email && password && name) {
      setUser({ ...defaultUser, email, name });
      setIsLoggedIn(true);
    }
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const toggleSaveItem = (itemId: number) => {
    if (user) {
      const savedItems = user.savedItems.includes(itemId)
        ? user.savedItems.filter((id) => id !== itemId)
        : [...user.savedItems, itemId];
      setUser({ ...user, savedItems });
    }
  };

  const updateProfileImage = (imageUrl: string) => {
    if (user) {
      setUser({ ...user, profileImage: imageUrl });
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        isLoggedIn,
        login,
        logout,
        updateProfile,
        toggleSaveItem,
        updateProfileImage,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
