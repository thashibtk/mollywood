"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

import { Suspense } from "react";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    let redirectTimeout: NodeJS.Timeout;
    
    const redirectTo = searchParams.get("redirect") || "/shop";
    const error = searchParams.get("error");

    if (error) {
      setStatus("Authentication failed");
      redirectTimeout = setTimeout(() => {
        router.push("/login?error=oauth_error");
      }, 1500);
      return;
    }

    // Check if we already have a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus("Sign in successful! Redirecting...");
        window.location.href = redirectTo;
      }
    });

    // Listen for auth state changes (which Supabase JS triggers automatically when it exchanges the code)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setStatus("Sign in successful! Redirecting...");
        window.location.href = redirectTo;
      }
    });
    
    // Set a timeout just in case it takes too long
    const timeout = setTimeout(() => {
      setStatus("Authentication timed out or no code found");
      router.push("/login?error=oauth_error");
    }, 5000);

    // Cleanup
    return () => {
      if (redirectTimeout) clearTimeout(redirectTimeout);
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [router, searchParams]);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-sm text-gray-400">{status}</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

