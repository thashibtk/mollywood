"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined
);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if admin is logged in
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Check if user has admin role
          const role = session.user.user_metadata?.role;
          const isAdminUser = role === "admin";
          setIsAuthenticated(isAdminUser);
          
          // If user is logged in but not admin, redirect them
          if (!isAdminUser && session.user) {
            await supabase.auth.signOut();
            router.push("/");
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Check if user has admin role
        const role = session.user.user_metadata?.role;
        const isAdminUser = role === "admin";
        setIsAuthenticated(isAdminUser);
        
        // If user is logged in but not admin, sign them out
        if (!isAdminUser) {
          await supabase.auth.signOut();
          router.push("/");
        }
      } else {
        setIsAuthenticated(false);
        router.push("/admin/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.session?.user) {
      // Check if user has admin role
      const role = data.user.user_metadata?.role;
      if (role !== "admin") {
        await supabase.auth.signOut();
        throw new Error("Access denied. Admin privileges required.");
      }
      setIsAuthenticated(true);
      router.push("/admin");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    router.push("/admin/login");
  };

  return (
    <AdminAuthContext.Provider
      value={{ isAuthenticated, isLoading, login, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}

