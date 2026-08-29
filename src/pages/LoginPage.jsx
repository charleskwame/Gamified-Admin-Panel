import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { EMAILJS_CONFIGURED } from "../utils/email";

function GoogleIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3 rounded-lg">
      <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-sm font-medium text-red-700">{message}</p>
    </div>
  );
}

function BrandHeader() {
  return (
    <div className="text-center mb-8">
      <div className="w-16 h-16 bg-primary flex items-center justify-center mx-auto mb-4 rounded-xl">
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-extrabold text-text-primary">Lecturer Dashboard</h1>
      <p className="text-sm text-text-muted mt-1">Sign in to monitor student progress</p>
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 border border-border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors rounded-lg";

export default function LoginPage() {
  const {
    accessMessage,
    needsVerification,
    pendingEmail,
    devOtp,
    signUpLecturer,
    signInWithEmail,
    signInWithGoogle,
    verifyOtp,
    resendOtp,
  } = useAuth();

  const [authMode, setAuthMode] = useState("signin"); // "signin" | "signup"
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Sign-in fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sign-up fields
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [courseCode, setCourseCode] = useState("");

  // OTP fields
  const [otp, setOtp] = useState("");
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (needsVerification) {
      setError("");
      setOtp("");
      setResendIn(30);
    }
  }, [needsVerification]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const displayError = accessMessage || error;

  const switchMode = (mode) => {
    setAuthMode(mode);
    setError("");
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      setError(err?.message || "Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await signUpLecturer({ displayName: name, email, password, courseCode });
    } catch (err) {
      setError(err?.message || "Unable to create your account. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setBusy(true);
    try {
      await verifyOtp(otp);
    } catch (err) {
      setError(err?.message || "Unable to verify the code. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setBusy(true);
    try {
      await resendOtp();
      setOtp("");
      setResendIn(30);
    } catch (err) {
      setError(err?.message || "Unable to resend the code. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err?.message || "Unable to sign in with Google. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // ---------------------------------------------------------------------------
  // OTP verification step (shown after a lecturer signs up / while in-flight)
  // ---------------------------------------------------------------------------
  if (needsVerification) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <BrandHeader />
          <div className="bg-surface border border-border p-8 space-y-5 rounded-xl">
            {displayError && <ErrorBanner message={displayError} />}

            {devOtp && !EMAILJS_CONFIGURED && (
              <div className="bg-amber-50 border border-amber-200 px-4 py-3 rounded-lg text-sm text-amber-800">
                <p className="font-semibold">Development mode</p>
                <p className="mt-1">
                  EmailJS is not configured, so the code is shown here instead of being emailed.
                  Your code is <strong className="font-mono tracking-widest">{devOtp}</strong>.
                </p>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-primary/10 flex items-center justify-center rounded-lg shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-text-primary">Verify your email</h2>
                <p className="text-xs text-text-muted leading-relaxed mt-0.5">
                  We emailed a 6-digit code to{" "}
                  <strong className="text-text-secondary">{pendingEmail || "your email"}</strong>.
                  Enter it below to activate your lecturer account.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1.5">
                  Verification code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••••"
                  className={`${inputClass} text-center text-xl font-bold tracking-[0.5em]`}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full bg-primary text-white text-sm font-bold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {busy ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  "Verify & access dashboard"
                )}
              </button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={busy || resendIn > 0}
                className="text-sm font-semibold text-primary disabled:opacity-50 disabled:cursor-not-allowed">
                {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Sign in / Sign up
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <BrandHeader />

        <div className="bg-surface border border-border p-8 space-y-5 rounded-xl">
          <div className="grid grid-cols-2 gap-1 bg-bg-base p-1 rounded-lg">
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className={`py-2 text-sm font-bold rounded-md transition-colors ${
                authMode === "signin" ? "bg-surface text-text-primary shadow-sm" : "text-text-muted"
              }`}>
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`py-2 text-sm font-bold rounded-md transition-colors ${
                authMode === "signup" ? "bg-surface text-text-primary shadow-sm" : "text-text-muted"
              }`}>
              Sign Up
            </button>
          </div>

          {displayError && <ErrorBanner message={displayError} />}

          {authMode === "signin" ? (
            /* ---------------------------------- Sign In ---------------------------------- */
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-primary text-white text-sm font-bold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {busy ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          ) : (
            /* --------------------------------- Sign Up --------------------------------- */
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Jane Doe"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1.5">
                  Course code
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  autoCapitalize="characters"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g. CA001"
                  className={`${inputClass} font-mono uppercase tracking-widest`}
                />
                <p className="text-xs text-text-muted mt-1.5">
                  Enter the unique course code provided to you. It links your account to the
                  course you teach.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1.5">
                  Confirm password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-primary text-white text-sm font-bold py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {busy ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  "Create Account & Send Code"
                )}
              </button>
            </form>
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-border-light" />
            <span className="text-xs text-text-muted">or</span>
            <div className="flex-1 border-t border-border-light" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 py-2.5 border border-border bg-white text-sm font-bold text-text-primary hover:bg-gray-50 disabled:opacity-50 transition-all rounded-lg">
            <GoogleIcon className="w-5 h-5" />
            Sign in with Google (existing accounts)
          </button>

          <p className="text-xs text-text-muted leading-relaxed text-center">
            New lecturers: sign up with any email address and the course code provided to you.
            After signing up you will receive a verification code to activate your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}