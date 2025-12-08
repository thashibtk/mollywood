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

    const handleAuthCallback = async () => {
      try {
        // First, check if user is already authenticated (session might already exist)
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession) {
          // User is already logged in, redirect immediately
          const redirectTo = searchParams.get("redirect") || "/shop";
          setStatus("Sign in successful! Redirecting...");
          setTimeout(() => {
            window.location.href = redirectTo;
          }, 500);
          return;
        }

        // Get the code from URL
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (error) {
          setStatus("Authentication failed");
          redirectTimeout = setTimeout(() => {
            router.push("/login?error=oauth_error");
          }, 1500);
          return;
        }

        if (code) {
          setStatus("Exchanging code for session...");
          
          // Exchange code for session
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error("Error exchanging code for session:", exchangeError);
            setStatus("Authentication failed");
            redirectTimeout = setTimeout(() => {
              router.push("/login?error=oauth_error");
            }, 1500);
            return;
          }

          // Verify session was created
          if (!data.session) {
            console.error("No session created");
            setStatus("Authentication failed");
            redirectTimeout = setTimeout(() => {
              router.push("/login?error=oauth_error");
            }, 1500);
            return;
          }

          setStatus("Sign in successful! Redirecting...");

          // Wait a moment for session to be fully established and context to update
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Verify session is still valid
          const { data: { session: verifySession } } = await supabase.auth.getSession();
          
          if (!verifySession) {
            console.error("Session verification failed");
            setStatus("Session verification failed");
            redirectTimeout = setTimeout(() => {
              router.push("/login?error=oauth_error");
            }, 1500);
            return;
          }

          // Get redirect destination
          const redirectTo = searchParams.get("redirect") || "/shop";
          
          // Use window.location for more reliable redirect after OAuth
          window.location.href = redirectTo;
        } else {
          // No code, but check if session exists (might have been set by Supabase automatically)
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: { session: checkSession } } = await supabase.auth.getSession();
          
          if (checkSession) {
            // Session exists, redirect
            const redirectTo = searchParams.get("redirect") || "/shop";
            setStatus("Sign in successful! Redirecting...");
            setTimeout(() => {
              window.location.href = redirectTo;
            }, 500);
          } else {
            // No code and no session, redirect to login
            setStatus("No authorization code found");
            redirectTimeout = setTimeout(() => {
              router.push("/login");
            }, 1500);
          }
        }
      } catch (err) {
        console.error("Error in auth callback:", err);
        setStatus("Authentication failed");
        redirectTimeout = setTimeout(() => {
          router.push("/login?error=oauth_error");
        }, 1500);
      }
    };

    handleAuthCallback();

    // Cleanup
    return () => {
      if (redirectTimeout) clearTimeout(redirectTimeout);
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

