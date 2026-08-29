import { useState } from "react";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { CogIcon, AcademicCapIcon } from "../components/Icons";

export default function SettingsPage() {
  const { userData, user } = useAuth();

  // -------- Username State --------
  const [username, setUsername] = useState(userData?.displayName || "");
  const [usernameMsg, setUsernameMsg] = useState(null);
  const [usernameSaving, setUsernameSaving] = useState(false);

  // -------- Course State --------
  const [course, setCourse] = useState(userData?.course || "");
  const [courseMsg, setCourseMsg] = useState(null);
  const [courseSaving, setCourseSaving] = useState(false);

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

  // -------- Course Handler --------
  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    setCourseMsg(null);

    if (!course) {
      setCourseMsg({ type: "error", text: "Please select the course you teach." });
      return;
    }
    if (course === (userData?.course || "")) {
      setCourseMsg({ type: "error", text: "This course is already selected." });
      return;
    }

    setCourseSaving(true);
    try {
      const docRef = doc(db, "lecturers", auth.currentUser.uid);
      await updateDoc(docRef, { course });
      setCourseMsg({ type: "success", text: "Course updated successfully!" });
    } catch {
      // Use generic error message to avoid leaking internal details
      setCourseMsg({ type: "error", text: "Failed to update course." });
    } finally {
      setCourseSaving(false);
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

      {/* Course Section */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border-light">
          <div className="w-9 h-9 bg-primary/10 flex items-center justify-center rounded-lg">
            <CogIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary">Course</h2>
            <p className="text-xs text-text-muted">Select the course you teach</p>
          </div>
        </div>
        <form onSubmit={handleCourseSubmit} className="px-6 py-5 space-y-4">
          {courseMsg && (
            <div
              className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
                courseMsg.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
              }`}>
              {courseMsg.type === "success" ? (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {courseMsg.text}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1.5">Course You Teach</label>
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full px-3 py-2 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors rounded-lg bg-surface">
              <option value="">Select a course...</option>
              <option value="computer_architecture">Computer Architecture</option>
              <option value="computer_networking">Computer Networking</option>
              <option value="software_engineering">Software Engineering</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={courseSaving}
              className="px-5 py-2 bg-primary text-white font-bold hover:bg-primary-dark disabled:opacity-50 transition-all text-sm rounded-lg">
              {courseSaving ? "Saving..." : "Save"}
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
