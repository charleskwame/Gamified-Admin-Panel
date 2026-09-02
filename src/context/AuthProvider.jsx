import { useCallback, useEffect, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { AuthContext } from "./AuthContext";
import {
  EMAIL_OTP_LIFETIME_MS,
  MAX_OTP_ATTEMPTS,
  generateOtp,
  hashOtp,
  isOtpValid,
} from "../utils/otp";
import { EMAILJS_CONFIGURED, sendOtpEmail } from "../utils/email";
import { auditLog } from "../utils/security";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COURSE_CODE_PATTERN = /^[A-Z0-9]{1,12}$/;

/**
 * Course codes are admin-issued invite codes (e.g. "CA001") stored in the
 * `course_codes` collection as { code, course }. They are normalized before
 * lookup: trimmed, whitespace removed, uppercased — so "ca 001" and "CA001"
 * both match the same document.
 */
function normalizeCourseCode(code) {
  return (code || "").trim().replace(/\s+/g, "").toUpperCase();
}

function friendlyError(err) {
  const code = err?.code || "";
  if (code.includes("permission-denied")) {
    return "You don't have permission to do that yet. Your Firestore security rules may be blocking the operation — ask the project owner to deploy the rules in `firestore.rules`.";
  }
  if (code.includes("network-request-failed") || /network/i.test(err?.message || "")) {
    return "Network error. Please check your internet connection and try again.";
  }
  if (code.includes("auth/email-already-in-use")) {
    return "An account with this email already exists. Please sign in instead.";
  }
  if (code.includes("auth/invalid-email")) {
    return "Please enter a valid email address.";
  }
  if (code.includes("auth/weak-password")) {
    return "Password is too weak. Please use at least 6 characters.";
  }
  if (
    code.includes("auth/user-not-found") ||
    code.includes("auth/wrong-password") ||
    code.includes("auth/invalid-credential")
  ) {
    return "Incorrect email or password.";
  }
  if (code.includes("auth/too-many-requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (code.includes("auth/popup-closed-by-user") || code.includes("auth/cancelled-popup-request")) {
    return "Google sign-in was cancelled. Please try again.";
  }
  if (code.includes("auth/popup-blocked")) {
    return "The Google sign-in popup was blocked by your browser. Please allow popups for this site and try again.";
  }
  if (err?.message) {
    return err.message.replace("Firebase: ", "").replace("FirebaseError: ", "").split("(")[0].trim();
  }

  if (err && err.text) {
    return `Email service error: ${err.text}`;
  }

  if (err && typeof err === 'object') {
    try {
      return `Unexpected error: ${JSON.stringify(err, Object.getOwnPropertyNames(err))}`;
    } catch (e) {
      return "An unexpected error has occurred. Please try again.";
    }
  }

  return `An unexpected error occurred: ${String(err)}`;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessMessage, setAccessMessage] = useState(null);
  // True while a brand-new lecturer has signed up but has not yet entered the
  // OTP emailed to them. While true the login page renders the OTP screen.
  const [needsVerification, setNeedsVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  // When EmailJS is not configured (local dev) the generated OTP is surfaced
  // here so the flow remains testable without sending a real email.
  const [devOtp, setDevOtp] = useState(null);

  // Ref to track if we are currently signing up, to avoid race conditions
  // in onAuthStateChanged when the user is created but Firestore docs aren't yet.
  const isSigningUpRef = useRef(false);
  const signupEmailRef = useRef("");
  // Ref to track an in-progress email+password sign-in. Like the sign-up ref it
  // stops onAuthStateChanged from resolving an existing lecturer profile straight
  // to the dashboard before the login OTP document has been persisted. Without it
  // users could skip (or briefly see) the dashboard and only be bounced back to
  // the OTP screen once a later auth event re-checks and finds the document.
  const isSigningInRef = useRef(false);

  // Resolve a lecturer's profile. Newer builds store the profile in the
  // `lecturers` collection, older builds stored lecturers inside `users` with
  // role: "lecturer". This helper finds either one and best-effort migrates
  // legacy `users`-based accounts into the `lecturers` collection.
  const resolveLecturer = useCallback(async (uid) => {
    const lecturersRef = doc(db, "lecturers", uid);
    const lecturersSnap = await getDoc(lecturersRef);
    if (lecturersSnap.exists() && lecturersSnap.data().role === "lecturer") {
      return { docRef: lecturersRef, data: lecturersSnap.data(), migrated: false };
    }
    // Legacy fallback: look in the `users` collection (stored by older builds).
    try {
      const usersRef = doc(db, "users", uid);
      const usersSnap = await getDoc(usersRef);
      if (usersSnap.exists() && usersSnap.data().role === "lecturer") {
        const legacy = usersSnap.data();
        try {
          // Best-effort migration into the canonical location.
          await setDoc(lecturersRef, {
            displayName: legacy.displayName || legacy.username || legacy.fullName || "Lecturer",
            email: legacy.email || "",
            emailVerified: true,
            role: "lecturer",
            course: legacy.course || "",
            createdAt: serverTimestamp(),
          });
        } catch (migrateErr) {
          console.warn("Could not migrate legacy lecturer profile:", migrateErr);
        }
        return { docRef: lecturersRef, data: legacy, migrated: true };
      }
    } catch (legacyErr) {
      // If rules block the read, just report the lecturer as unresolved.
      console.warn("Legacy lecturer lookup failed:", legacyErr);
    }
    return null;
  }, []);

  // Resolve a signed-in user's lecturer profile. Called on every auth state
  // change:
  //  - existing verified lecturer -> returns the profile data
  //  - brand-new sign-up mid-OTP   -> returns { needsVerification: true }
  //  - otherwise (no profile)      -> access denied (must complete sign-up)
  const ensureLecturerProfile = useCallback(
    async (firebaseUser) => {
      if (isSigningUpRef.current || isSigningInRef.current) {
        return {
          needsVerification: true,
          pendingEmail: signupEmailRef.current || firebaseUser.email || "",
        };
      }

      // Check for pending verification (both signup and login) FIRST
      try {
        const verifDocRef = doc(db, "lecturer_verifications", firebaseUser.uid);
        const verifSnap = await getDoc(verifDocRef);
        if (verifSnap.exists()) {
          return {
            needsVerification: true,
            pendingEmail: verifSnap.data().email || firebaseUser.email || "",
          };
        }
      } catch (verifErr) {
        console.warn("Pending verification lookup failed:", verifErr);
      }

      const resolved = await resolveLecturer(firebaseUser.uid);
      if (resolved) {
        if (resolved.data.role !== "lecturer") {
          const err = new Error("Access denied. Only lecturers can access this panel. If this is an error, contact the school IT administrators.");
          err.accessDenied = true;
          throw err;
        }
        // Safety net: soft-deleted accounts must never sign back in (e.g. if
        // the Firebase Auth deletion did not complete or the login was
        // recreated by an administrator).
        if (resolved.data.deleted) {
          const err = new Error("This account has been deleted. If you believe this is a mistake, contact the school IT administrators.");
          err.accessDenied = true;
          throw err;
        }
        if (!resolved.data.emailVerified) {
          await updateDoc(resolved.docRef, { emailVerified: true });
        }
        return { ...resolved.data, emailVerified: true };
      }

      const err = new Error(
        "Your account is not set up yet. Please complete sign-up with your email and course code."
      );
      err.accessDenied = true;
      throw err;
    },
    [resolveLecturer]
  );

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setLoading(true);
        try {
          const data = await ensureLecturerProfile(firebaseUser);
          if (!cancelled) {
            if (data.needsVerification) {
              setUserData(null);
              setNeedsVerification(true);
              setPendingEmail(data.pendingEmail);
              setAccessMessage(null);
            } else {
              setUserData(data);
              setNeedsVerification(false);
              setAccessMessage(null);
            }
          }
        } catch (err) {
          if (!cancelled) {
            console.warn("Lecturer access resolution failed:", err?.message || err);
            setUserData(null);
            setNeedsVerification(false);
            setAccessMessage(err?.accessDenied ? err.message : friendlyError(err));
          }
          try {
            await signOut(auth);
          } catch (signOutErr) {
            console.warn("Sign out after access denial failed:", signOutErr);
          }
          if (!cancelled) setUser(null);
        } finally {
          if (!cancelled) setLoading(false);
        }
      } else {
        setUserData(null);
        setNeedsVerification(false);
        setPendingEmail("");
        setDevOtp(null);
        if (!cancelled) setLoading(false);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [ensureLecturerProfile]);

  /**
   * Look up a course code in the `course_codes` collection. Accessible without
   * auth because it runs before the Firebase account exists. Once a code is
   * used for a sign-up it is marked `claimedBy` so it cannot be reused.
   */
  const findCourseCode = useCallback(async (normalizedCode) => {
    const q = query(collection(db, "course_codes"), where("code", "==", normalizedCode));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { docRef: snap.docs[0].ref, data: snap.docs[0].data() };
  }, []);

  /** Sign-up step 1: create the account, reserve the code, email the OTP. */
  const signUpLecturer = useCallback(
    async ({ displayName, email, password, courseCode }) => {
      const name = (displayName || "").trim();
      const mail = (email || "").trim().toLowerCase();
      const codeRaw = normalizeCourseCode(courseCode);

      if (!name) throw new Error("Please enter your full name.");
      if (!EMAIL_PATTERN.test(mail)) throw new Error("Please enter a valid email address.");
      if (!password || password.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }
      if (!codeRaw) throw new Error("Please enter your course code.");
      if (!COURSE_CODE_PATTERN.test(codeRaw)) {
        throw new Error("Course code format is invalid.");
      }

      const match = await findCourseCode(codeRaw);
      if (!match) {
        throw new Error("Invalid course code. Please check the code provided to you.");
      }
      if (match.data.claimedBy) {
        throw new Error("This course code has already been used.");
      }

      setAccessMessage(null);

      isSigningUpRef.current = true;
      signupEmailRef.current = mail;
      let cred;
      try {
        cred = await createUserWithEmailAndPassword(auth, mail, password);
      } catch (err) {
        isSigningUpRef.current = false;
        throw new Error(friendlyError(err), { cause: err });
      }

      const uid = cred.user.uid;

      try {
        // Reserve the code so another lecturer cannot claim it at the same time.
        await setDoc(
          match.docRef,
          { ...match.data, claimedBy: uid, claimedAt: serverTimestamp() },
          { merge: true }
        );

        const otp = generateOtp();
        const otpHash = await hashOtp(otp);
        await setDoc(doc(db, "lecturer_verifications", uid), {
          email: mail,
          displayName: name,
          otpHash,
          expiresAt: Date.now() + EMAIL_OTP_LIFETIME_MS,
          attempts: 0,
          course: match.data.course || "",
          courseCode: codeRaw,
          createdAt: serverTimestamp(),
        });

        await sendOtpEmail({ toEmail: mail, toName: name, otpCode: otp });

        setPendingEmail(mail);
        setDevOtp(EMAILJS_CONFIGURED ? null : otp);
        setNeedsVerification(true);
      } catch (err) {
        // Roll back the partial sign-up so the lecturer can retry cleanly.
        try {
          await deleteDoc(doc(db, "lecturer_verifications", uid));
        } catch (cleanupErr) {
          console.warn("Verification cleanup failed:", cleanupErr);
        }
        try {
          await updateDoc(match.docRef, { claimedBy: null, claimedAt: null });
        } catch (cleanupErr) {
          console.warn("Course code unclaim failed:", cleanupErr);
        }
        try {
          await auth.currentUser?.delete();
        } catch (cleanupErr) {
          console.warn("Auth user cleanup failed:", cleanupErr);
        }
        const friendly = friendlyError(err);
        setAccessMessage(friendly);
        throw new Error(friendly, { cause: err });
      } finally {
        isSigningUpRef.current = false;
      }
    },
    [findCourseCode]
  );

  /** Sign-up step 2: check the OTP and create the lecturer profile. */
  const verifyOtp = useCallback(
    async (input) => {
      if (!user) throw new Error("You must sign in first.");
      const uid = user.uid;
      const verifDoc = doc(db, "lecturer_verifications", uid);
      const verifSnap = await getDoc(verifDoc);
      if (!verifSnap.exists()) {
        throw new Error("No pending verification found. Please sign up again.");
      }
      const rec = verifSnap.data();

      if ((rec.attempts || 0) >= MAX_OTP_ATTEMPTS) {
        throw new Error("Too many failed attempts. Please request a new code.");
      }
      if (!rec.expiresAt || Date.now() > rec.expiresAt) {
        throw new Error("This code has expired. Please request a new one.");
      }

      const ok = await isOtpValid(input, rec.otpHash);
      if (!ok) {
        await updateDoc(verifDoc, { attempts: (rec.attempts || 0) + 1 });
        throw new Error("Incorrect verification code. Please try again.");
      }

      await deleteDoc(verifDoc);

      if (rec.type === "login") {
        // If it's a login verification, just fetch the existing profile
        const resolved = await resolveLecturer(uid);
        if (!resolved) {
          throw new Error("Lecturer profile not found.");
        }
        setNeedsVerification(false);
        setPendingEmail("");
        setDevOtp(null);
        setUserData(resolved.data);
        return resolved.data;
      }

      // OTP correct — create the lecturer profile with the course mapped from
      // the course code recorded on the verification document.
      const profile = {
        displayName: rec.displayName || rec.email?.split("@")[0] || "Lecturer",
        email: rec.email || user.email || "",
        photoURL: "",
        emailVerified: true,
        role: "lecturer",
        course: rec.course || "",
        claimedCourseCode: rec.courseCode || "",
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, "lecturers", uid), profile);

      setNeedsVerification(false);
      setPendingEmail("");
      setDevOtp(null);
      setUserData(profile);
      return profile;
    },
    [user, resolveLecturer]
  );

  /** Send the lecturer a fresh OTP (also resets the attempts counter). */
  const resendOtp = useCallback(async () => {
    if (!user) throw new Error("You must sign in first.");
    const uid = user.uid;
    const verifDoc = doc(db, "lecturer_verifications", uid);
    const verifSnap = await getDoc(verifDoc);
    if (!verifSnap.exists()) {
      throw new Error("No pending verification found. Please sign up again.");
    }
    const rec = verifSnap.data();

    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    await updateDoc(verifDoc, {
      otpHash,
      expiresAt: Date.now() + EMAIL_OTP_LIFETIME_MS,
      attempts: 0,
      createdAt: serverTimestamp(),
    });
    await sendOtpEmail({
      toEmail: rec.email,
      toName: rec.displayName || rec.email?.split("@")[0],
      otpCode: otp,
    });
    setDevOtp(EMAILJS_CONFIGURED ? null : otp);
  }, [user]);

  /** Sign in with email + password for existing lecturer accounts. */
  const signInWithEmail = useCallback(async (email, password) => {
    setAccessMessage(null);
    const mail = (email || "").trim().toLowerCase();

    // Flag the login-OTP flow as in-progress BEFORE Firebase resolves so the
    // auth-state listener (ensureLecturerProfile) never resolves an existing
    // lecturer profile to the dashboard ahead of the OTP document being written.
    isSigningInRef.current = true;
    try {
      const cred = await signInWithEmailAndPassword(auth, mail, password);
      const uid = cred.user.uid;

      // Look up the existing lecturer to personalise the email (best-effort).
      const resolved = await resolveLecturer(uid);
      const displayName = resolved?.data?.displayName || mail?.split("@")[0] || "Lecturer";

      const otp = generateOtp();
      const otpHash = await hashOtp(otp);

      // Persist the login verification document as early as possible so that
      // even if onAuthStateChanged re-runs after the in-flight flag is cleared,
      // it still sees the pending verification and keeps the OTP screen up.
      await setDoc(doc(db, "lecturer_verifications", uid), {
        email: mail,
        displayName,
        otpHash,
        expiresAt: Date.now() + EMAIL_OTP_LIFETIME_MS,
        attempts: 0,
        type: "login",
        createdAt: serverTimestamp(),
      });

      // Route to the OTP screen as soon as the document is in place; do not
      // wait for the email to send before updating the UI.
      setPendingEmail(mail);
      setDevOtp(EMAILJS_CONFIGURED ? null : otp);
      setNeedsVerification(true);

      // Best-effort delivery. If it fails the user stays on the OTP screen and
      // can still use "Resend code".
      try {
        await sendOtpEmail({
          toEmail: mail,
          toName: displayName,
          otpCode: otp,
        });
      } catch (emailErr) {
        setAccessMessage(friendlyError(emailErr));
      }
    } catch (err) {
      throw new Error(friendlyError(err), { cause: err });
    } finally {
      isSigningInRef.current = false;
    }
  }, [resolveLecturer]);

  const logout = useCallback(async () => {
    setAccessMessage(null);
    setNeedsVerification(false);
    setPendingEmail("");
    setDevOtp(null);
    await signOut(auth);
    setUser(null);
    setUserData(null);
  }, []);

  /**
   * Soft-delete the signed-in lecturer's account:
   *  1. Re-authenticate (Firebase requires a recent login before deletion,
   *     and the password doubles as confirmation of intent).
   *  2. Mark the Firestore profile `deleted: true` so the record is preserved
   *     for audit/recovery instead of being removed.
   *  3. Delete the Firebase Auth user so the login can no longer be used.
   * Afterwards the auth state listener clears the session and the app falls
   * back to the login page.
   */
  const deleteAccount = useCallback(async (password) => {
    const current = auth.currentUser;
    if (!current || !current.email) {
      throw new Error("You must be signed in to delete your account.");
    }
    if (!password) {
      throw new Error("Please enter your password to confirm account deletion.");
    }

    // 1. Re-authenticate. A stale session is the most common failure mode.
    try {
      const credential = EmailAuthProvider.credential(current.email, password);
      await reauthenticateWithCredential(current, credential);
    } catch (err) {
      if (err?.code?.includes("requires-recent-login")) {
        throw new Error("Your session is too old. Please log out and log back in before deleting your account.", {
          cause: err,
        });
      }
      throw new Error(friendlyError(err), { cause: err });
    }

    // 2. Soft-delete the lecturer profile in Firestore.
    try {
      await updateDoc(doc(db, "lecturers", current.uid), {
        deleted: true,
        deletedAt: serverTimestamp(),
      });
    } catch (err) {
      throw new Error(friendlyError(err), { cause: err });
    }

    // 3. Best-effort cleanup of any stale pending-verification document.
    try {
      await deleteDoc(doc(db, "lecturer_verifications", current.uid));
    } catch (cleanupErr) {
      console.warn("Verification cleanup failed:", cleanupErr);
    }

    auditLog("account_deleted", { uid: current.uid, email: current.email });

    // 4. Remove the Firebase Auth account. After this onAuthStateChanged
    // fires with a null user and the app returns to the login page.
    try {
      await deleteUser(current);
    } catch (err) {
      // The profile is already soft-deleted, so the account is safe even if
      // the auth deletion fails — surface a clear message and let the
      // deleted-profile guard block any further sign-ins.
      throw new Error(
        "Your account has been deactivated, but the final login removal failed. Please contact support.",
        { cause: err }
      );
    }

    setAccessMessage(null);
    setNeedsVerification(false);
    setPendingEmail("");
    setDevOtp(null);
    setUser(null);
    setUserData(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        accessMessage,
        needsVerification,
        pendingEmail,
        devOtp,
        signUpLecturer,
        signInWithEmail,
        verifyOtp,
        resendOtp,
        logout,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}