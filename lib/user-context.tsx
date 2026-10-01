"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { loginVendor, logoutVendor, registerVendor, type RegisterInput } from "./api/auth";
import { fetchProfile } from "./api/profile";
import { getAccessToken } from "./api/token-storage";
import type { SafeVendor } from "./api/types";

export interface User {
  id: string;
  email: string;
  name: string; // the vendor's business name — displayed in the sidebar
}

interface UserContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  /** Hydrates the session from the backend when tokens exist but no login/register
   * response is available to read the vendor from — used after Google OAuth. */
  refetchUser: () => Promise<void>;
  /** Lets Settings refresh the sidebar's display name after a successful business-info save,
   * without needing a full profile refetch just to update one cached field. */
  setDisplayName: (name: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = "campusbid-vendor-user";

function toUser(vendor: SafeVendor): User {
  return { id: vendor._id, email: vendor.email, name: vendor.profile.businessName };
}

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(readStoredUser());
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { vendor } = await loginVendor({ email, password });
    const nextUser = toUser(vendor);
    setUser(nextUser);
    writeStoredUser(nextUser);
  };

  // Registration does not sign the vendor in: the account stays pending until
  // an admin approves it, and only then can the vendor log in.
  const register = async (input: RegisterInput) => {
    await registerVendor(input);
  };

  const logout = async () => {
    try {
      await logoutVendor();
    } catch {
      // The server call can fail (e.g. an already-expired access token) —
      // the local session still clears below regardless, since that's what
      // actually matters for "am I logged out" from the user's side.
    } finally {
      setUser(null);
      writeStoredUser(null);
    }
  };

  const refetchUser = async () => {
    if (!getAccessToken()) return;
    const vendor = await fetchProfile();
    const nextUser = toUser(vendor);
    setUser(nextUser);
    writeStoredUser(nextUser);
  };

  const setDisplayName = (name: string) => {
    if (!user) return;
    const nextUser = { ...user, name };
    setUser(nextUser);
    writeStoredUser(nextUser);
  };

  return (
    <UserContext.Provider
      value={{ user, isLoggedIn: user !== null, isLoading, login, register, logout, refetchUser, setDisplayName }}
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
