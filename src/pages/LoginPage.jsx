import { useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

const HARDCODED_LECTURER_CODE = "LECTURER2024";

async function getLecturerCode() {
  try {
    const snap = await getDoc(doc(db, "adminSettings", "lecturerConfig"));
    if (snap.exists() && snap.data().lecturerCode) return snap.data().lecturerCode;
  } catch { /* fall through */ }
  return HARDCODED_LECTURER_CODE;
}

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lecturerCode, setLecturerCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password.");
      return;
    }

    if (isSignUp) {
      if (!displayName.trim()) {
        setError("Please enter your display name.");
        return;
      }
      if (!lecturerCode.trim()) {
        setError("Please enter the Lecturer Access Code.");
        return;
      }
      const validCode = await getLecturerCode();
      if (lecturerCode.trim() !== validCode) {
        setError("Invalid Lecturer Access Code. Please try again.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await register({ email: email.trim(), password, displayName: displayName.trim() });
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", "").split("(")[0].trim() || (isSignUp ? "Registration failed" : "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#111C4A] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Lecturer Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">
            {isSignUp ? "Create a lecturer account" : "Sign in to monitor student progress"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-8 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          {/* Display Name — only for sign up */}
          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Dr. Jane Smith"
                className="w-full px-4 py-2.5 border border-gray-300 text-sm focus:ring-2 focus:ring-[#111C4A]/20 focus:border-[#111C4A] outline-none transition-all"
                autoFocus
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="lecturer@example.com"
              className="w-full px-4 py-2.5 border border-gray-300 text-sm focus:ring-2 focus:ring-[#111C4A]/20 focus:border-[#111C4A] outline-none transition-all"
              autoFocus={!isSignUp}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-gray-300 text-sm focus:ring-2 focus:ring-[#111C4A]/20 focus:border-[#111C4A] outline-none transition-all"
            />
          </div>

          {/* Lecturer Code — only for sign up */}
          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lecturer Access Code</label>
              <input
                type="password"
                value={lecturerCode}
                onChange={(e) => setLecturerCode(e.target.value)}
                placeholder="Enter the secret lecturer code"
                className="w-full px-4 py-2.5 border border-gray-300 text-sm focus:ring-2 focus:ring-[#111C4A]/20 focus:border-[#111C4A] outline-none transition-all"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#111C4A] text-white font-bold hover:bg-[#1a2a6e] disabled:opacity-50 transition-all text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isSignUp ? "Creating account..." : "Signing in..."}
              </span>
            ) : (
              isSignUp ? "Create Lecturer Account" : "Sign In"
            )}
          </button>

          {/* Toggle sign in / sign up */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="text-sm font-medium text-[#111C4A] hover:underline"
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Register as Lecturer"}
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          {isSignUp
            ? "Use the lecturer access code provided by your institution."
            : "Only registered lecturers can access this panel."}
        </p>
      </div>
    </div>
  );
}
