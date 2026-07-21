import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { AuthProvider } from "./context/AuthProvider";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import TopNav from "./components/TopNav";
import ProgressBar from "./components/ProgressBar";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const StudentsPage = lazy(() => import("./pages/StudentsPage"));
const StudentDetailPage = lazy(() => import("./pages/StudentDetailPage"));
const QuestionsPage = lazy(() => import("./pages/QuestionsPage"));
const InsightsPage = lazy(() => import("./pages/InsightsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

function parseHash() {
  const hash = window.location.hash.replace("#", "");
  if (hash.startsWith("student/")) {
    return { page: "student", uid: hash.slice(8) };
  }
  return { page: hash || "dashboard", uid: null };
}

function AppContent() {
  const { user, loading, isChecking } = useAuth();

  const [route, setRoute] = useState(() => parseHash());

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useCallback((target, uid) => {
    if (target === "student" && uid) {
      window.location.hash = `student/${uid}`;
    } else {
      window.location.hash = target;
    }
  }, []);

  const goBack = useCallback(() => {
    window.location.hash = "students";
  }, []);

  if (loading || isChecking) return <ProgressBar isLoading={true} />;
  if (!user || !user.emailVerified) {
    if (!user && window.location.hash) window.location.hash = "";
    return <LoginPage />;
  }

  const { page, uid } = route;

  return (
    <div className="flex flex-col h-screen bg-bg-base">
      <ProgressBar isLoading={loading || isChecking} />
      <TopNav activePage={page === "student" ? "students" : page} onNavigate={navigate} />
      <main className="flex-1 overflow-y-auto">
        <Suspense fallback={<div className="p-6">{null}</div>}>
          {page === "dashboard" && <DashboardPage onNavigate={navigate} />}
          {page === "students" && <StudentsPage onNavigate={navigate} />}
          {page === "student" && <StudentDetailPage uid={uid} onBack={goBack} />}
          {page === "questions" && <QuestionsPage />}
          {page === "insights" && <InsightsPage />}
          {page === "settings" && <SettingsPage />}
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
