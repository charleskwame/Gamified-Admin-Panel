import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import Sidebar from "./components/Sidebar";
import DashboardPage from "./pages/DashboardPage";
import StudentsPage from "./pages/StudentsPage";
import StudentDetailPage from "./pages/StudentDetailPage";
import LoadingSpinner from "./components/LoadingSpinner";

function AppContent() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState("dashboard");
  const [selectedUid, setSelectedUid] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) return <LoadingSpinner text="Checking authentication..." />;
  if (!user) return <LoginPage />;

  const navigate = (target, uid) => {
    if (target === "student" && uid) {
      setSelectedUid(uid);
      setPage("student");
    } else {
      setPage(target);
    }
  };

  return (
    <div className="flex h-screen bg-[#F4F6FB]">
      <Sidebar
        activePage={page === "student" ? "students" : page}
        onNavigate={navigate}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((p) => !p)}
      />
      <main className="flex-1 overflow-y-auto">
        {page === "dashboard" && <DashboardPage onNavigate={navigate} />}
        {page === "students" && <StudentsPage onNavigate={navigate} />}
        {page === "student" && (
          <StudentDetailPage uid={selectedUid} onBack={() => setPage("students")} />
        )}
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
