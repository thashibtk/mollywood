"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StarsBackground from "@/components/StarsBackground";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScorpioLoader from "@/components/ScorpioLoader";

import { Suspense } from "react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    // Get token and email from query params
    const token = searchParams.get("token");
    const emailParam = searchParams.get("email");

    if (!token || !emailParam) {
      setIsValidating(false);
      setIsValidToken(false);
      setError("Invalid or expired reset link. Please request a new password reset from the login page.");
      return;
    }

    setResetToken(token);
    setEmail(emailParam);
    setIsValidToken(true);
    setIsValidating(false);
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!resetToken || !email) {
      setError("Invalid reset token. Please request a new password reset.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          resetToken,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login?message=Password reset successful. Please sign in with your new password.");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please try again.");
      setLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="relative min-h-screen bg-black text-white overflow-hidden">
        <StarsBackground />
        <Header />
        <ScorpioLoader />
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <StarsBackground />
      <Header />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="border border-white/20 bg-black/50 backdrop-blur-md rounded-xl p-8 shadow-2xl">
            <h1 className="text-3xl font-bold mb-2 text-center uppercase tracking-wider">
              Reset Password
            </h1>
            <p className="text-gray-400 text-sm text-center mb-8">
              Enter your new password below
            </p>

            {success ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-400 text-sm text-center">
                  Password reset successful! Redirecting to login...
                </div>
              </div>
            ) : !isValidToken ? (
              <div className="space-y-4">
                {error && (
                  <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}
                <div className="text-center space-y-3">
                  <p className="text-sm text-gray-400">
                    The password reset link has expired or is invalid. You can request a new one from the login page.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => router.push("/login")}
                      className="px-6 py-3 bg-white text-black font-semibold uppercase tracking-wider rounded-lg hover:bg-gray-200 transition"
                    >
                      Back to Login
                    </button>
                    <button
                      onClick={() => router.push("/login?forgot=true")}
                      className="px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold uppercase tracking-wider rounded-lg hover:bg-white/20 transition"
                    >
                      Request New Link
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/50 transition"
                    placeholder="Enter new password (min. 6 characters)"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/50 transition"
                    placeholder="Confirm new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-white text-black font-semibold uppercase tracking-wider rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Resetting Password..." : "Reset Password"}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="text-sm text-gray-400 hover:text-white transition underline"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ScorpioLoader />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

