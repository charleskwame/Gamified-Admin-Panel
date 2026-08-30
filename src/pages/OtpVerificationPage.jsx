import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { EMAILJS_CONFIGURED } from "../utils/email";

function BrandHeader() {
  return (
    <div className="text-center mb-8">
      <img src="/app_icon.png" alt="App logo" className="w-16 h-16 rounded-xl object-cover mx-auto mb-4" />
      <h1 className="text-2xl font-extrabold text-text-primary">Lecturer Dashboard</h1>
      <p className="text-sm text-text-muted mt-1">Sign in to monitor student progress</p>
    </div>
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

const inputClass =
  "w-full px-3 py-2 border border-border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors rounded-lg";

export default function OtpVerificationPage() {
  const { accessMessage, pendingEmail, devOtp, verifyOtp, resendOtp } = useAuth();

  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resendIn, setResendIn] = useState(30);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const displayError = accessMessage || error;

  const handleVerify = async (e) => {
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
                EmailJS is not configured, so the code is shown here instead of being emailed. Your
                code is <strong className="font-mono tracking-widest">{devOtp}</strong>.
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

          <form onSubmit={handleVerify} className="space-y-4">
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
                <span className="flex items-center justify-center gap-1.5">
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