import { useEffect, useState } from "react";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, sendEmailVerification } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isChecking, setIsChecking] = useState(false);

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
                    const docRef = doc(db, "lecturers", firebaseUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUserData(data);
                        if (!data.emailVerified) {
                            await updateDoc(docRef, { emailVerified: true });
                        }
                        if (data.role !== "lecturer") {
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
            const docRef = doc(db, "lecturers", cred.user.uid);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists() || docSnap.data().role !== "lecturer") {
                await signOut(auth);
                setUser(null);
                setUserData(null);
                throw new Error("Access denied. Only lecturers can access this panel.");
            }
            if (!docSnap.data().emailVerified) {
                await updateDoc(docRef, { emailVerified: true });
            }
            setUserData({ ...docSnap.data(), emailVerified: true });
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
                    const docRef = doc(db, "lecturers", auth.currentUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.role !== "lecturer") {
                            await signOut(auth);
                            setUser(null);
                            setUserData(null);
                            throw new Error("Access denied. Only lecturers can access this panel.");
                        }
                        await updateDoc(docRef, { emailVerified: true });
                        setUserData({ ...data, emailVerified: true });
                    } else {
                        await signOut(auth);
                        setUser(null);
                        setUserData(null);
                        throw new Error("User record not found.");
                    }
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
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(cred.user, { displayName });
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
            // Send verification email
            await sendEmailVerification(cred.user);
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