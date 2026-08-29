import { useState } from "react";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { CogIcon, AcademicCapIcon, TrashIcon } from "../components/Icons";

export default function SettingsPage() {
  const { userData, user, deleteAccount } = useAuth();

  // -------- Username State --------
  const [username, setUsername] = useState(userData?.displayName || "");
  const [usernameMsg, setUsernameMsg] = useState(null);
  const [usernameSaving, setUsernameSaving] = useState(false);

  // -------- Delete Account State --------
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteMsg, setDeleteMsg] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
      setUsernameMsg({ type: "success", text: "Username updated successfully!" });
    } catch {
      // Use generic error message to avoid leaking internal details
      setUsernameMsg({ type: "error", text: "Failed to update username." });
    } finally {
      setUsernameSaving(false);
    }
  };

  // -------- Delete Account Handler --------
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteMsg(null);
    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      // On success the AuthProvider clears the session and the app returns
      // to the login screen, so no further navigation is needed here.
    } catch (err) {
      setDeleteMsg({ type: "error", text: err?.message || "Failed to delete your account." });
      setDeleting(false);
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
        </div>
      </div>

      {/* Danger Zone Section */}
      <div className="bg-surface border border-red-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-red-100">
          <div className="w-9 h-9 bg-red-50 flex items-center justify-center rounded-lg">
            <TrashIcon className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">Danger Zone</h2>
            <p className="text-xs text-text-muted">Permanently delete your account</p>
          </div>
        </div>
        <div className="px-6 py-5 space-y-4">
          {deleteMsg && (
            <div className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 bg-red-50 border border-red-200 text-red-700">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              {deleteMsg.text}
            </div>
          )}
          {!confirmingDelete ? (
            <>
              <p className="text-sm text-text-secondary">
                Deleting your account will permanently revoke your access to this panel. Your profile will be
                archived and this action cannot be undone.
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingDelete(true);
                    setDeletePassword("");
                    setDeleteMsg(null);
                  }}
                  className="px-5 py-2 bg-red-600 text-white font-bold hover:bg-red-700 transition-all text-sm rounded-lg">
                  Delete Account
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                Are you absolutely sure? Enter your password to permanently delete your account
                {user?.email ? ` (${user.email})` : ""}.
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-1.5">Password</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className={inputClass}
                  placeholder="Confirm your password"
                  autoComplete="current-password"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingDelete(false);
                    setDeletePassword("");
                    setDeleteMsg(null);
                  }}
                  disabled={deleting}
                  className="px-5 py-2 border border-border text-text-secondary hover:bg-gray-50 disabled:opacity-50 transition-all text-sm font-bold rounded-lg">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleting || !deletePassword}
                  className="px-5 py-2 bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 transition-all text-sm rounded-lg">
                  {deleting ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
