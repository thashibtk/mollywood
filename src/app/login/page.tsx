"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserAuth } from "@/context/UserAuthContext";
import StarsBackground from "@/components/StarsBackground";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { Suspense } from "react";
import ScorpioLoader from "@/components/ScorpioLoader";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, resetPassword } = useUserAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [otpStep, setOtpStep] = useState<
    "email" | "otp" | "verified"
  >("email");
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpSentMessage, setOtpSentMessage] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    // Check for OAuth error in URL
    const errorParam = searchParams.get("error");
    if (errorParam === "oauth_error") {
      setError("Failed to sign in with Google. Please try again.");
      setSuccessMessage(null);
    }

    // Check for success message from password reset
    const message = searchParams.get("message");
    if (message) {
      setSuccessMessage(message);
      setError(null);
    }

    // Check if user was redirected from expired reset link
    const forgot = searchParams.get("forgot");
    if (forgot === "true") {
      setShowForgotPassword(true);
      setError(null);
      setSuccessMessage(null);
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      // Redirect to the specified page or default to shop
      const redirectTo = searchParams.get("redirect") || "/shop";
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || "Failed to login");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      const redirectTo = searchParams.get("redirect") || "/shop";
      await loginWithGoogle(redirectTo);
      // OAuth redirect will handle the navigation
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetSuccess(false);

    if (!resetEmail.trim()) {
      setError("Please enter your email address");
      return;
    }

    setResetLoading(true);
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      // OTP sent successfully
      setOtpStep("otp");
      setOtpSentMessage("OTP sent to your email. Please check your spam folder as well.");
      setResendTimer(30);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp.trim() || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setOtpLoading(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify OTP");
      }

      setResetToken(data.resetToken);
      setOtpStep("verified");
      setError(null);

      // Redirect to reset password page with token
      setTimeout(() => {
        router.push(
          `/reset-password?token=${data.resetToken}&email=${encodeURIComponent(
            resetEmail
          )}`
        );
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to verify OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setOtp("");
    setOtpLoading(true);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend OTP");
      }

      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <StarsBackground />
      <Header />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="border border-white/20 bg-black/50 backdrop-blur-md rounded-xl p-8 shadow-2xl">
            <h1 className="text-3xl font-bold mb-2 text-center uppercase tracking-wider">
              Sign In
            </h1>
            <p className="text-gray-400 text-sm text-center mb-8">
              Welcome back to Mollywood
            </p>

            {successMessage && (
              <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-400 text-sm">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/50 transition"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setResetEmail(email);
                      setError(null);
                      setResetSuccess(false);
                    }}
                    className="text-xs text-gray-400 hover:text-white transition underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/50 transition"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-3 bg-white text-black font-semibold uppercase tracking-wider rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex-1 h-px bg-white/20"></div>
              <span className="text-sm text-gray-400 uppercase tracking-wider">
                Or
              </span>
              <div className="flex-1 h-px bg-white/20"></div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="w-full mt-6 py-3 bg-white/10 border border-white/20 text-white font-semibold uppercase tracking-wider rounded-lg hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {googleLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Signing in with Google...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            <div className="mt-6 text-center text-sm text-gray-400">
              Don't have an account?{" "}
              <button
                onClick={() => router.push("/register")}
                className="text-white hover:underline font-medium"
              >
                Create Account
              </button>
            </div>
          </div>

          {/* Forgot Password Modal */}
          {showForgotPassword && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
              <div className="border border-white/20 bg-black/90 backdrop-blur-md rounded-xl p-8 shadow-2xl max-w-md w-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold uppercase tracking-wider">
                    Reset Password
                  </h2>
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail("");
                      setOtp("");
                      setError(null);
                      setResetSuccess(false);
                      setOtpStep("email");
                      setResetToken(null);
                      setResendTimer(0);
                      setOtpSentMessage(null);
                    }}
                    className="text-gray-400 hover:text-white transition text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>

                {otpStep === "verified" ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-400 text-sm">
                      OTP verified successfully! Redirecting to password reset
                      page...
                    </div>
                  </div>
                ) : otpStep === "otp" ? (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <p className="text-gray-400 text-sm mb-4">
                      Enter the 6-digit OTP sent to your email.
                    </p>

                    {otpSentMessage && (
                      <div className="p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-400 text-sm">
                        {otpSentMessage}
                      </div>
                    )}

                    {error && (
                      <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        OTP <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        required
                        maxLength={6}
                        className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/50 transition text-center text-2xl tracking-widest"
                        placeholder="000000"
                        autoFocus
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep("email");
                          setOtp("");
                          setError(null);
                        }}
                        className="flex-1 py-3 bg-white/10 border border-white/20 text-white font-semibold uppercase tracking-wider rounded-lg hover:bg-white/20 transition"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={otpLoading || otp.length !== 6}
                        className="flex-1 py-3 bg-white text-black font-semibold uppercase tracking-wider rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {otpLoading ? "Verifying..." : "Verify OTP"}
                      </button>
                    </div>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={otpLoading || resendTimer > 0}
                        className="text-sm text-gray-400 hover:text-white transition underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resendTimer > 0
                          ? `Resend OTP in ${resendTimer}s`
                          : "Resend OTP"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <p className="text-gray-400 text-sm mb-4">
                      Enter your email address and we'll send you an OTP to reset your password.
                    </p>

                    {error && (
                      <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/50 transition"
                        placeholder="your@email.com"
                        autoFocus
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setResetEmail("");
                          setOtp("");
                          setError(null);
                          setOtpStep("email");
                        }}
                        className="flex-1 py-3 bg-white/10 border border-white/20 text-white font-semibold uppercase tracking-wider rounded-lg hover:bg-white/20 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={resetLoading}
                        className="flex-1 py-3 bg-white text-black font-semibold uppercase tracking-wider rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resetLoading ? "Sending..." : "Send OTP"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<ScorpioLoader />}>
      <LoginContent />
    </Suspense>
  );
}
