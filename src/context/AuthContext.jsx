import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, sendEmailVerification } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState(null);
  const [pendingPassword, setPendingPassword] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Block unverified emails from accessing the dashboard
        if (!firebaseUser.emailVerified) {
          await signOut(auth);
          setUser(null);
          setUserData(null);
          setLoading(false);
          return;
        }
        try {
          const docSnap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(data);
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
    const cred = await signInWithEmailAndPassword(auth, email, password);
    if (!cred.user.emailVerified) {
      await signOut(auth);
      throw new Error("Please verify your email before signing in. Check your inbox and click the verification link.");
    }
    const docSnap = await getDoc(doc(db, "users", cred.user.uid));
    if (!docSnap.exists() || docSnap.data().role !== "lecturer") {
      await signOut(auth);
      throw new Error("Access denied. Only lecturers can access this panel.");
    }
    setUserData(docSnap.data());
    return cred;
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const checkEmailVerified = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      return auth.currentUser.emailVerified;
    }
    return false;
  };

  const register = async ({ email, password, displayName, course }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await setDoc(doc(db, "users", cred.user.uid), {
      displayName,
      email,
      role: "lecturer",
      course,
      score: 0,
      computerArchitecturePoints: 0,
      caAnswered: 0,
      caCorrect: 0,
      computerNetworkingPoints: 0,
      cnAnswered: 0,
      cnCorrect: 0,
      softwareEngineeringPoints: 0,
      seAnswered: 0,
      seCorrect: 0,
      questionsCorrect: 0,
      questionsAnswered: 0,
      streakNumber: 0,
      lastActiveDate: "",
      badges: [],
      selectedBadges: [],
      createdAt: serverTimestamp(),
    });
    // Store pending verification state BEFORE sign out so LoginPage sees it instantly
    setPendingVerificationEmail(cred.user.email);
    setPendingPassword(password);
    // Send verification email
    await sendEmailVerification(cred.user);
    // Sign out immediately — they must verify email before accessing
    await signOut(auth);
  };

  const clearPendingVerification = () => {
    setPendingVerificationEmail(null);
    setPendingPassword(null);
  };

  const logout = async () => {
    await signOut(auth);
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, login, register, logout, resendVerification, checkEmailVerified, pendingVerificationEmail, pendingPassword, clearPendingVerification }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
