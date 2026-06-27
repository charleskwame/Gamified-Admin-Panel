import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, register, pendingVerificationEmail, pendingPassword, clearPendingVerification } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [course, setCourse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Show verification screen if we have a pending email from a recent sign-up
  const showVerification = !!pendingVerificationEmail;

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      // Need to sign in briefly to resend verification email
      const cred = await signInWithEmailAndPassword(auth, pendingVerificationEmail, pendingPassword);
      await sendEmailVerification(cred.user);
      await auth.signOut();
    } catch (err) {
      setError("Could not resend. Try signing in and it will prompt you.");
    }
    setResending(false);
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    setError("");
    try {
      // If email is verified, login will succeed. If not, it throws.
      await login(pendingVerificationEmail, pendingPassword);
      clearPendingVerification();
    } catch (err) {
      setError(err.message.replace("Firebase: ", "").split("(")[0].trim() || "Email not verified yet");
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) { setError("Please enter email and password."); return; }
    if (isSignUp) {
      if (!displayName.trim()) { setError("Please enter your display name."); return; }
      if (!course) { setError("Please select the course you teach."); return; }
    }
    setLoading(true);
    try {
      if (isSignUp) {
        await register({ email: email.trim(), password, displayName: displayName.trim(), course });
        // register sets pendingVerificationEmail in context — component re-renders with verification screen
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", "").split("(")[0].trim() || (isSignUp ? "Registration failed" : "Login failed"));
    } finally { setLoading(false); }
  };

  // Verification sent screen
  if (showVerification) {
    return (
      <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.98l7.5-4.04a2.25 2.25 0 012.134 0l7.5 4.04a2.25 2.25 0 011.183 1.98V19.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900">Verify Your Email</h1>
            <p className="text-sm text-gray-500 mt-3 leading-relaxed">
              We sent a verification email to <strong className="text-gray-800">{pendingVerificationEmail}</strong>.
              Click the link in the email to activate your account, then sign in.
            </p>
          </div>
          <div className="bg-white border border-gray-200 p-8 space-y-4">
            {error && <div className="bg-red-50 border border-red-200 px-4 py-3"><p className="text-sm font-medium text-red-700">{error}</p></div>}
            <button onClick={handleCheckVerification} disabled={loading}
              className="w-full py-2.5 bg-[#111C4A] text-white font-bold hover:bg-[#1a2a6e] disabled:opacity-50 transition-all text-sm">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...
                </span>
              ) : "I\u2019ve verified \u2014 Sign In"}
            </button>
            <button onClick={handleResend} disabled={resending}
              className="w-full py-2.5 border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all">
              {resending ? "Resending..." : "Resend verification email"}
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">Can't find the email? Check your spam folder.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#111C4A] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Lecturer Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">{isSignUp ? "Create a lecturer account" : "Sign in to monitor student progress"}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-8 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Display Name</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Dr. Jane Smith" autoFocus
                className="w-full px-4 py-2.5 border border-gray-300 text-sm focus:ring-2 focus:ring-[#111C4A]/20 focus:border-[#111C4A] outline-none transition-all" />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="lecturer@example.com" autoFocus={!isSignUp}
              className="w-full px-4 py-2.5 border border-gray-300 text-sm focus:ring-2 focus:ring-[#111C4A]/20 focus:border-[#111C4A] outline-none transition-all" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-2.5 border border-gray-300 text-sm focus:ring-2 focus:ring-[#111C4A]/20 focus:border-[#111C4A] outline-none transition-all" />
          </div>

          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Course You Teach</label>
              <select value={course} onChange={(e) => setCourse(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 text-sm focus:ring-2 focus:ring-[#111C4A]/20 focus:border-[#111C4A] outline-none transition-all bg-white">
                <option value="">Select a course...</option>
                <option value="computer_architecture">Computer Architecture</option>
                <option value="computer_networking">Computer Networking</option>
                <option value="software_engineering">Software Engineering</option>
              </select>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-[#111C4A] text-white font-bold hover:bg-[#1a2a6e] disabled:opacity-50 transition-all text-sm">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isSignUp ? "Creating account..." : "Signing in..."}
              </span>
            ) : (isSignUp ? "Create Lecturer Account" : "Sign In")}
          </button>

          <div className="text-center pt-1">
            <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
              className="text-sm font-medium text-[#111C4A] hover:underline">
              {isSignUp ? "Already have an account? Sign In" : "Don\u2019t have an account? Register as Lecturer"}
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          {isSignUp ? "You will need to verify your email after registration." : "Only registered lecturers can access this panel."}
        </p>
      </div>
    </div>
  );
}