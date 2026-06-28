import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { AuthProvider } from "./context/AuthProvider";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import Sidebar from "./components/Sidebar";
import LoadingSpinner from "./components/LoadingSpinner";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const StudentsPage = lazy(() => import("./pages/StudentsPage"));
const StudentDetailPage = lazy(() => import("./pages/StudentDetailPage"));
const QuestionsPage = lazy(() => import("./pages/QuestionsPage"));

function parseHash() {
  const hash = window.location.hash.replace("#", "");
  if (hash.startsWith("student/")) {
    return { page: "student", uid: hash.slice(8) };
  }
  return { page: hash || "dashboard", uid: null };
}

function AppContent() {
  const { user, loading, isChecking } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  if (loading || isChecking) return <LoadingSpinner text="Verifying authentication status..." />;
  if (!user || !user.emailVerified) {
    // Clear hash on logout/unverified state to avoid stale routes
    if (!user && window.location.hash) window.location.hash = "";
    return <LoginPage />;
  }

  const { page, uid } = route;

  return (
    <div className="flex h-screen bg-[#F4F6FB]">
      <Sidebar
        activePage={page === "student" ? "students" : page}
        onNavigate={navigate}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((p) => !p)}
      />
      <main className="flex-1 overflow-y-auto">
        <Suspense fallback={<div className="p-6"><LoadingSpinner text="Loading page..." /></div>}>
          {page === "dashboard" && <DashboardPage onNavigate={navigate} />}
          {page === "students" && <StudentsPage onNavigate={navigate} />}
          {page === "student" && (
            <StudentDetailPage uid={uid} onBack={goBack} />
          )}
          {page === "questions" && <QuestionsPage />}
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
