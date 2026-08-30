import { useState } from "react";
import { useAuth } from "../context/AuthContext";



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
      <img src="/app_icon.png" alt="App logo" className="w-16 h-16 rounded-xl object-cover mx-auto mb-4" />
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
    signUpLecturer,
    signInWithEmail,

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
              className={`py-2 text-sm font-bold rounded-md transition-colors ${authMode === "signin" ? "bg-surface text-text-primary shadow-sm" : "text-text-muted"
                }`}>
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`py-2 text-sm font-bold rounded-md transition-colors ${authMode === "signup" ? "bg-surface text-text-primary shadow-sm" : "text-text-muted"
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
                  <span className="flex items-center justify-center gap-1.5">
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
                  <span className="flex flex-col items-center justify-center gap-1.5">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  "Create Account & Send Code"
                )}
              </button>
            </form>
          )}

          <p className="text-xs text-text-muted leading-relaxed text-center">
            New lecturers: sign up with any email address and the course code provided to you.
            After signing up you will receive a verification code to activate your dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}