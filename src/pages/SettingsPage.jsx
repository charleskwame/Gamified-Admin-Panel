import { useState } from "react";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { CogIcon, ShieldCheckIcon, AcademicCapIcon } from "../components/Icons";
import ProgressBar from "../components/ProgressBar";

export default function SettingsPage() {
  const { userData, user } = useAuth();

  // -------- Username State --------
  const [username, setUsername] = useState(userData?.displayName || "");
  const [usernameMsg, setUsernameMsg] = useState(null);
  const [usernameSaving, setUsernameSaving] = useState(false);

  // -------- Password State --------
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const inputClass =
    "w-full px-3 py-2 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors rounded-lg";

  // -------- Username Handler --------
  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    setUsernameMsg(null);

    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameMsg({ type: "error", text: "Username cannot be empty." });
      return;
    }
    if (trimmed === (userData?.displayName || "")) {
      setUsernameMsg({ type: "error", text: "New username is the same as the current one." });
      return;
    }

    setUsernameSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: trimmed });
      const docRef = doc(db, "lecturers", auth.currentUser.uid);
      await updateDoc(docRef, { displayName: trimmed });
      userData.displayName = trimmed;
      setUsernameMsg({ type: "success", text: "Username updated successfully!" });
    } catch (err) {
      // Use generic error message to avoid leaking internal details
      setUsernameMsg({ type: "error", text: "Failed to update username." });
    } finally {
      setUsernameSaving(false);
    }
  };

  // -------- Password Handler --------
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!currentPassword) {
      setPasswordMsg({ type: "error", text: "Current password is required." });
      return;
    }
    if (!newPassword) {
      setPasswordMsg({ type: "error", text: "New password is required." });
      return;
    }
    // Enforce consistent password policy matching registration requirements
    if (newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "New password must be at least 8 characters." });
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPasswordMsg({ type: "error", text: "New password must contain at least one uppercase letter." });
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setPasswordMsg({ type: "error", text: "New password must contain at least one number." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordMsg({ type: "error", text: "New password must be different from current password." });
      return;
    }

    setPasswordSaving(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setPasswordMsg({ type: "success", text: "Password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const code = err?.code || "";
      if (code.includes("auth/wrong-password") || code.includes("auth/invalid-credential")) {
        setPasswordMsg({ type: "error", text: "Current password is incorrect." });
      } else if (code.includes("auth/weak-password")) {
        setPasswordMsg({ type: "error", text: "New password is too weak." });
      } else if (code.includes("auth/too-many-requests")) {
        setPasswordMsg({ type: "error", text: "Too many attempts. Try again later." });
      } else {
        setPasswordMsg({ type: "error", text: "Failed to update password." });
      }
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary mt-0.5">Manage your account preferences</p>
      </div>

      {/* Username Section */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border-light">
          <div className="w-9 h-9 bg-primary/10 flex items-center justify-center rounded-lg">
            <AcademicCapIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">Display Name</h2>
            <p className="text-xs text-text-muted">Update how your name appears in the panel</p>
          </div>
        </div>
        <form onSubmit={handleUsernameSubmit} className="px-6 py-5 space-y-4">
          {usernameMsg && (
            <div
              className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
                usernameMsg.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
              }`}>
              {usernameMsg.type === "success" ? (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {usernameMsg.text}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Display Name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
              placeholder="Your display name"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={usernameSaving}
              className="px-5 py-2 bg-primary text-white font-bold hover:bg-primary-dark disabled:opacity-50 transition-all text-sm rounded-lg">
              {usernameSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>

      {/* Password Section */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border-light">
          <div className="w-9 h-9 bg-primary/10 flex items-center justify-center rounded-lg">
            <ShieldCheckIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">Password</h2>
            <p className="text-xs text-text-muted">Update your login password</p>
          </div>
        </div>
        <form onSubmit={handlePasswordSubmit} className="px-6 py-5 space-y-4">
          {passwordMsg && (
            <div
              className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
                passwordMsg.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
              }`}>
              {passwordMsg.type === "success" ? (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {passwordMsg.text}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
              placeholder="Confirm new password"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordSaving}
              className="px-5 py-2 bg-primary text-white font-bold hover:bg-primary-dark disabled:opacity-50 transition-all text-sm rounded-lg">
              {passwordSaving ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      {/* Account Info Section (read-only) */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border-light">
          <div className="w-9 h-9 bg-primary/10 flex items-center justify-center rounded-lg">
            <CogIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">Account</h2>
            <p className="text-xs text-text-muted">Your account details</p>
          </div>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border-light">
            <span className="text-sm text-text-secondary">Email</span>
            <span className="text-sm font-semibold text-text-primary">{user?.email || "—"}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border-light">
            <span className="text-sm text-text-secondary">Course</span>
            <span className="text-sm font-semibold text-text-primary">
              {userData?.course === "computer_architecture" && "Computer Architecture"}
              {userData?.course === "computer_networking" && "Computer Networking"}
              {userData?.course === "software_engineering" && "Software Engineering"}
              {!userData?.course && "—"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-text-secondary">Email Verified</span>
            <span className={`text-sm font-semibold ${user?.emailVerified ? "text-emerald-600" : "text-red-500"}`}>
              {user?.emailVerified ? "Yes" : "No"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
