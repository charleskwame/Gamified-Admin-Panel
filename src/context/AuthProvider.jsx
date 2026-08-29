import { useEffect, useState } from "react";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, sendEmailVerification, deleteUser } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { AuthContext } from "./AuthContext";

function friendlyError(err) {
  const code = err?.code || "";
  if (code.includes("permission-denied")) {
    return "You don\u2019t have permission to do that yet. Your Firestore security rules may be blocking the operation \u2014 ask the project owner to deploy the rules in `firestore.rules`.";
  }
  if (code.includes("network-request-failed") || /network/i.test(err?.message || "")) {
    return "Network error. Please check your internet connection and try again.";
  }
  if (code.includes("email-already-in-use")) {
    return "This email is already registered. Please sign in instead.";
  }
  if (err?.message) {
    return err.message.replace("Firebase: ", "").replace("FirebaseError: ", "").split("(")[0].trim();
  }
  return "An unexpected error occurred. Please try again.";
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isChecking, setIsChecking] = useState(false);

    // Resolve a lecturer's profile. Newer builds store the profile in the
    // `lecturers` collection, older builds stored lecturers inside `users`
    // with role: "lecturer". This helper finds either one and best-effort
    // migrates legacy `users`-based accounts into the `lecturers` collection.
    const resolveLecturer = async (uid) => {
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
                        lastActiveDate: legacy.lastActiveDate || "",
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
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                if (!firebaseUser.emailVerified) {
                    // Keep user, but don't fetch userData yet as they are unverified
                    setUserData(null);
                    setLoading(false);
                    return;
                }
                try {
                    const resolved = await resolveLecturer(firebaseUser.uid);
                    if (resolved) {
                        setUserData(resolved.data);
                        if (!resolved.data.emailVerified) {
                            await updateDoc(resolved.docRef, { emailVerified: true });
                        }
                        if (resolved.data.role !== "lecturer") {
                            await signOut(auth);
                            setUser(null);
                            setUserData(null);
                        }
                    } else {
                        setUserData(null);
                        await signOut(auth);
                        setUser(null);
                    }
                } catch {
                    setUserData(null);
                }
            } else {
                setUserData(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        setIsChecking(true);
        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            setUser(cred.user);
            if (!cred.user.emailVerified) {
                setUserData(null);
                return cred;
            }
            const resolved = await resolveLecturer(cred.user.uid);
            if (!resolved) {
                await signOut(auth);
                setUser(null);
                setUserData(null);
                throw new Error("Access denied. Only lecturers can access this panel.");
            }
            if (!resolved.data.emailVerified) {
                await updateDoc(resolved.docRef, { emailVerified: true });
            }
            setUserData({ ...resolved.data, emailVerified: true });
            return cred;
        } finally {
            setIsChecking(false);
        }
    };

    const resendVerification = async () => {
        if (auth.currentUser) {
            await sendEmailVerification(auth.currentUser);
        }
    };

    const checkEmailVerified = async () => {
        if (auth.currentUser) {
            setIsChecking(true);
            try {
                await auth.currentUser.reload();
                const verified = auth.currentUser.emailVerified;
                if (verified) {
                    // Update the user state to reflect verified: true
                    setUser({ ...auth.currentUser });
                    const resolved = await resolveLecturer(auth.currentUser.uid);
                    if (!resolved) {
                        await signOut(auth);
                        setUser(null);
                        setUserData(null);
                        throw new Error("User record not found.");
                    }
                    if (resolved.data.role !== "lecturer") {
                        await signOut(auth);
                        setUser(null);
                        setUserData(null);
                        throw new Error("Access denied. Only lecturers can access this panel.");
                    }
                    await updateDoc(resolved.docRef, { emailVerified: true });
                    setUserData({ ...resolved.data, emailVerified: true });
                }
                return verified;
            } finally {
                setIsChecking(false);
            }
        }
        return false;
    };

    const register = async ({ email, password, displayName, course }) => {
        setIsChecking(true);
        let cred = null;
        try {
            cred = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(cred.user, { displayName });
            // Create the lecturer profile doc in Firestore. If this write is denied
            // (e.g. deployed security rules are out of date), we must clean up the
            // freshly-created Auth account so it does not become an orphaned,
            // unusable login that also blocks re-registration of that email.
            await setDoc(doc(db, "lecturers", cred.user.uid), {
                displayName,
                email,
                emailVerified: cred.user.emailVerified,
                role: "lecturer",
                course,
                lastActiveDate: "",
                createdAt: serverTimestamp(),
            });
            setUser(cred.user);
            setUserData(null);
            // Send the verification email AFTER the account is fully usable.
            // sendEmailVerification failures should not leave the user stuck on
            // an unusable dashboard - the verification gate in App.jsx will show
            // the "Verify Your Email" screen with a resend button regardless.
            try {
                await sendEmailVerification(cred.user);
            } catch (verifyErr) {
                console.warn("Verification email could not be sent:", friendlyError(verifyErr));
            }
            return cred;
        } catch (err) {
            // Only delete the Auth account if the Firestore profile write is what
            // failed (cred exists) - otherwise rethrow the original error so the
            // LoginPage can display a meaningful message.
            if (cred && cred.user) {
                try {
                    await deleteUser(cred.user);
                    await signOut(auth);
                } catch (cleanupErr) {
                    console.error("Failed to clean up orphaned auth account:", cleanupErr);
                }
                setUser(null);
                setUserData(null);
                const msg = friendlyError(err);
                const wrapped = new Error(
                    "Account created but your lecturer profile could not be saved. " +
                    (msg.includes("permission") ? msg : "Please try again with a different email, or contact support.")
                );
                wrapped.original = err;
                throw wrapped;
            }
            throw err;
        } finally {
            setIsChecking(false);
        }
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setUserData(null);
    };

    return (
        <AuthContext.Provider value={{ user, userData, loading, isChecking, login, register, logout, resendVerification, checkEmailVerified }}>
            {children}
        </AuthContext.Provider>
    );
}