"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

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
  isLoading: boolean;
  login: (email: string, password: string, name: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  toggleSaveItem: (itemId: number) => void;
  updateProfileImage: (imageUrl: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = "campusbid-vendor-user";

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

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function writeStoredUser(user: User | null): void {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage can be unavailable (private browsing, disabled storage) — the
    // session simply won't persist across reloads in that case.
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = readStoredUser();
    if (storedUser) {
      setUser(storedUser);
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string, name: string) => {
    if (email && password && name) {
      const nextUser = { ...defaultUser, email, name };
      setUser(nextUser);
      setIsLoggedIn(true);
      writeStoredUser(nextUser);
    }
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    writeStoredUser(null);
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      const nextUser = { ...user, ...updates };
      setUser(nextUser);
      writeStoredUser(nextUser);
    }
  };

  const toggleSaveItem = (itemId: number) => {
    if (user) {
      const savedItems = user.savedItems.includes(itemId)
        ? user.savedItems.filter((id) => id !== itemId)
        : [...user.savedItems, itemId];
      const nextUser = { ...user, savedItems };
      setUser(nextUser);
      writeStoredUser(nextUser);
    }
  };

  const updateProfileImage = (imageUrl: string) => {
    if (user) {
      const nextUser = { ...user, profileImage: imageUrl };
      setUser(nextUser);
      writeStoredUser(nextUser);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        isLoggedIn,
        isLoading,
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
