import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { AuthContext } from "./AuthContext";

// Only lecturers with an email on this domain may access the panel.
// Override by setting VITE_LECTURER_EMAIL_DOMAIN in your .env file.
const LECTURER_EMAIL_DOMAIN = (import.meta.env.VITE_LECTURER_EMAIL_DOMAIN || "st.atu.edu.gh")
    .trim()
    .toLowerCase();

function isAllowedLecturerEmail(email) {
    if (!email || typeof email !== "string") return false;
    return email.trim().toLowerCase().endsWith(`@${LECTURER_EMAIL_DOMAIN}`);
}

function friendlyError(err) {
    const code = err?.code || "";
    if (code.includes("permission-denied")) {
        return "You don\u2019t have permission to do that yet. Your Firestore security rules may be blocking the operation \u2014 ask the project owner to deploy the rules in `firestore.rules`.";
    }
    if (code.includes("network-request-failed") || /network/i.test(err?.message || "")) {
        return "Network error. Please check your internet connection and try again.";
    }
    if (
        code.includes("auth/popup-closed-by-user") ||
        code.includes("auth/cancelled-popup-request")
    ) {
        return "Google sign-in was cancelled. Please try again.";
    }
    if (code.includes("auth/popup-blocked")) {
        return "The Google sign-in popup was blocked by your browser. Please allow popups for this site and try again.";
    }
    if (code.includes("auth/account-exists-with-different-credential")) {
        return "This email is already linked to an email/password account from the old sign-in system. Please ask the project owner to migrate it before signing in with Google.";
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
    // Non-null when the last sign-in attempt was rejected (e.g. not an
    // @st.atu.edu.gh account). Shown on the login page.
    const [accessMessage, setAccessMessage] = useState(null);

    // Resolve a lecturer's profile. Newer builds store the profile in the
    // `lecturers` collection, older builds stored lecturers inside `users`
    // with role: "lecturer". This helper finds either one and best-effort
    // migrates legacy `users`-based accounts into the `lecturers` collection.
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
    }, []);

    // Called on every sign-in. Either resolves the existing lecturer profile
    // or auto-provisions a brand new one from the Google account - the same
    // behaviour the mobile app uses, but stored in the `lecturers` collection.
    const ensureLecturerProfile = useCallback(async (firebaseUser) => {
        const email = firebaseUser.email || "";
        if (!isAllowedLecturerEmail(email)) {
            const err = new Error(
                `Access denied. Only lecturers with an @${LECTURER_EMAIL_DOMAIN} email can access this panel.`
            );
            err.accessDenied = true;
            throw err;
        }

        const resolved = await resolveLecturer(firebaseUser.uid);
        if (resolved) {
            if (resolved.data.role !== "lecturer") {
                const err = new Error("Access denied. Only lecturers can access this panel.");
                err.accessDenied = true;
                throw err;
            }
            if (!resolved.data.emailVerified) {
                await updateDoc(resolved.docRef, { emailVerified: true });
            }
            return { ...resolved.data, emailVerified: true };
        }

        // No existing profile - auto-provision it from the Google account.
        const profile = {
            displayName: firebaseUser.displayName || email.split("@")[0] || "Lecturer",
            email,
            photoURL: firebaseUser.photoURL || "",
            emailVerified: true,
            role: "lecturer",
            course: "",
            lastActiveDate: "",
            createdAt: serverTimestamp(),
        };
        try {
            await setDoc(doc(db, "lecturers", firebaseUser.uid), profile);
        } catch (err) {
            // The Firestore write was rejected (rules not deployed yet?) -
            // surface a clear message to the login page.
            console.warn("Lecturer profile auto-provisioning failed:", err);
            throw new Error(
                "Signed in with Google, but your lecturer profile could not be created. " + friendlyError(err),
                { cause: err }
            );
        }
        return profile;
    }, [resolveLecturer]);

    useEffect(() => {
        let cancelled = false;
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                setLoading(true);
                try {
                    const data = await ensureLecturerProfile(firebaseUser);
                    if (!cancelled) {
                        setUserData(data);
                        setAccessMessage(null);
                    }
                } catch (err) {
                    if (!cancelled) {
                        console.warn("Lecturer access resolution failed:", err?.message || err);
                        setUserData(null);
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
                if (!cancelled) setLoading(false);
            }
        });
        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, [ensureLecturerProfile]);

    const signInWithGoogle = async () => {
        setIsChecking(true);
        setAccessMessage(null);
        try {
            const provider = new GoogleAuthProvider();
            // Always show the account chooser so a lecturer can pick the
            // correct institution account.
            provider.setCustomParameters({ prompt: "select_account" });
            await signInWithPopup(auth, provider);
            // Profile resolution/provisioning happens inside onAuthStateChanged.
        } catch (err) {
            throw new Error(friendlyError(err), { cause: err });
        } finally {
            setIsChecking(false);
        }
    };

    const logout = async () => {
        setAccessMessage(null);
        await signOut(auth);
        setUser(null);
        setUserData(null);
    };

    return (
        <AuthContext.Provider
            value={{ user, userData, loading, isChecking, accessMessage, signInWithGoogle, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
}