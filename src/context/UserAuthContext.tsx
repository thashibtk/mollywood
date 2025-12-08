"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface UserAuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (redirectTo?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check current session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        
        // Check if user is admin
        if (session?.user) {
          const role = session.user.user_metadata?.role;
          setIsAdmin(role === "admin");
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const role = session.user.user_metadata?.role;
        setIsAdmin(role === "admin");
      } else {
        setIsAdmin(false);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const register = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || "",
          role: "user", // Default role is user
        },
      },
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      setUser(data.user);
      setIsAdmin(false);
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      setUser(data.user);
      const role = data.user.user_metadata?.role;
      setIsAdmin(role === "admin");
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (redirectTo: string = "/shop") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (error) {
      throw error;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    router.push("/");
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw error;
    }
  };

  return (
    <UserAuthContext.Provider
      value={{ user, isLoading, isAdmin, register, login, loginWithGoogle, logout, resetPassword }}
    >
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const context = useContext(UserAuthContext);
  if (context === undefined) {
    throw new Error("useUserAuth must be used within UserAuthProvider");
  }
  return context;
}

