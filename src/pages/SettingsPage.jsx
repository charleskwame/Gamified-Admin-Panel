import { useState } from "react";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { CogIcon, ShieldCheckIcon, AcademicCapIcon } from "../components/Icons";

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
      setUsernameMsg({ type: "error", text: err.message || "Failed to update username." });
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
    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    setPasswordSaving(true);
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMsg({ type: "success", text: "Password updated successfully!" });
    } catch (err) {
      const code = err.code || "";
      let msg = err.message || "Failed to update password.";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        msg = "Current password is incorrect.";
      } else if (code === "auth/weak-password") {
        msg = "New password is too weak. Use at least 6 characters.";
      } else if (code === "auth/requires-recent-login") {
        msg = "Please log out and log back in before changing your password.";
      }
      setPasswordMsg({ type: "error", text: msg });
    } finally {
      setPasswordSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#111C4A]/20 focus:border-[#111C4A] transition-colors";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
          <CogIcon className="w-6 h-6" />
          Account Settings
        </h1>
        <p className="text-sm text-gray-400 mt-1">Manage your account credentials</p>
      </div>

      <div className="space-y-8">
        {/* ---------- Change Username ---------- */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <AcademicCapIcon className="w-5 h-5 text-[#111C4A]" />
            <h2 className="text-base font-bold text-gray-800">Change Username</h2>
          </div>
          <form onSubmit={handleUsernameSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                Current Email
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                New Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter new username"
                className={inputClass}
                maxLength={50}
              />
            </div>

            {usernameMsg && (
              <div
                className={`px-4 py-2.5 text-sm font-medium ${
                  usernameMsg.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {usernameMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={usernameSaving}
              className="px-5 py-2 bg-[#111C4A] text-white text-sm font-semibold hover:bg-[#1a2a6e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {usernameSaving ? "Saving..." : "Update Username"}
            </button>
          </form>
        </div>

        {/* ---------- Change Password ---------- */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2.5">
            <ShieldCheckIcon className="w-5 h-5 text-[#111C4A]" />
            <h2 className="text-base font-bold text-gray-800">Change Password</h2>
          </div>
          <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className={inputClass}
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 6 characters)"
                className={inputClass}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className={inputClass}
                autoComplete="new-password"
              />
            </div>

            {passwordMsg && (
              <div
                className={`px-4 py-2.5 text-sm font-medium ${
                  passwordMsg.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {passwordMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={passwordSaving}
              className="px-5 py-2 bg-[#111C4A] text-white text-sm font-semibold hover:bg-[#1a2a6e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {passwordSaving ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}



