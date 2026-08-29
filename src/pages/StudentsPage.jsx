import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Skeleton, StudentRowSkeleton } from "../components/Skeleton";
import { SearchIcon, FireIcon } from "../components/Icons";
import { useAuth } from "../context/AuthContext";
import { auditLog } from "../utils/security";

export default function StudentsPage({ onNavigate }) {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("score");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { userData } = useAuth();
  const course = userData?.course || null;

  const COURSE_CONFIG = {
    computer_architecture: {
      ptsField: "computerArchitecturePoints",
      label: "CA",
    },
    computer_networking: {
      ptsField: "computerNetworkingPoints",
      label: "CN",
    },
    software_engineering: {
      ptsField: "softwareEngineeringPoints",
      label: "SE",
    },
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const all = snap.docs.map((d) => ({ uid: d.id, ...d.data() })).filter((u) => u.role !== "lecturer");

        // If lecturer has a course, filter students to only those with data in that course
        const cfg = COURSE_CONFIG[course];
        const filtered = cfg ? all.filter((u) => (u[cfg.ptsField] || 0) > 0 || (u.questionsAnswered || 0) > 0) : all;

        setStudents(filtered);

        auditLog("students_list_viewed", {
          course: course,
          totalStudents: filtered.length,
        });
      } catch (err) {
        console.error("Students fetch error:", err);
        setError(
          err?.message?.includes("permission-denied") || err?.code === "permission-denied"
            ? "Permission denied while loading students. Your Firestore security rules likely need updating \u2014 deploy the rules from `firestore.rules`."
            : "Failed to load students. Please check your connection and try again."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [course]);

  const ptsField = course ? COURSE_CONFIG[course]?.ptsField : "score";
  const otherSortKeys = ["streakNumber", "questionsAnswered", "totalTime", "lastActiveDate"];

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (s.displayName || "").toLowerCase().includes(q) || (s.email || "").toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === "score") return (b[ptsField] || 0) - (a[ptsField] || 0);
    if (sortKey === "streakNumber") return (b.streakNumber || 0) - (a.streakNumber || 0);
    if (sortKey === "questionsAnswered") return (b.questionsAnswered || 0) - (a.questionsAnswered || 0);
    if (sortKey === "lastActiveDate") {
      const aDate = a.lastActiveDate ? new Date(a.lastActiveDate) : new Date(0);
      const bDate = b.lastActiveDate ? new Date(b.lastActiveDate) : new Date(0);
      return bDate - aDate;
    }
    return 0;
  });

  const getSortLabel = (key) => {
    const labels = {
      score: course ? `${COURSE_CONFIG[course]?.label || "Score"} Pts` : "Score Pts",
      streakNumber: "Streak",
      questionsAnswered: "Answered",
      lastActiveDate: "Last Active",
    };
    return labels[key] || key;
  };

  // Generate CSV export
  const handleExport = () => {
    const headers = ["Name", "Email", "Score", "Streak", "Answered", "Last Active"];
    const rows = sorted.map((s) => [
      s.displayName || "Unknown",
      s.email || "",
      s[ptsField] || 0,
      s.streakNumber || 0,
      s.questionsAnswered || 0,
      s.lastActiveDate || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <Skeleton className="w-40 h-7 mb-1" />
          <Skeleton className="w-52 h-4" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-60 h-10" />
          <Skeleton className="w-24 h-10" />
        </div>
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border-light">
              {Array.from({ length: 5 }).map((_, i) => (
                <StudentRowSkeleton key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">Students</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {course ? `Viewing students in your ${COURSE_CONFIG[course]?.label || ""} course` : "Viewing all students"}
          </p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-primary text-white font-semibold hover:bg-primary-dark transition-all text-sm rounded-lg shrink-0">
          Export CSV
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3 rounded-lg">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all rounded-lg"
          />
        </div>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
          className="w-full sm:w-72 px-4 py-2.5 border border-border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-surface rounded-lg">
          <option value="score">{course ? `${COURSE_CONFIG[course]?.label || "Score"} Pts` : "Score Pts"}</option>
          {otherSortKeys.map((key) => (
            <option key={key} value={key}>
              {getSortLabel(key)}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border-light">
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">{getSortLabel("score")}</th>
                <th className="px-6 py-3">Streak</th>
                <th className="px-6 py-3">Answered</th>
                <th className="px-6 py-3">Total Time</th>
                <th className="px-6 py-3">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {sorted.map((s) => (
                <tr key={s.uid} className="hover:bg-bg-base/50 cursor-pointer transition-colors" onClick={() => onNavigate("student", s.uid)}>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 rounded-lg">
                        {(s.displayName || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary text-sm">{s.displayName || "Unknown"}</p>
                        <p className="text-xs text-text-muted truncate max-w-48">{s.email || ""}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 font-bold text-text-primary">{s[ptsField] || 0}</td>
                  <td className="px-6 py-3.5">
                    {s.streakNumber > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 rounded-md text-xs font-semibold">
                        <FireIcon className="w-3.5 h-3.5" /> {s.streakNumber}
                      </span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-text-secondary">{s.questionsAnswered || 0}</td>
                  <td className="px-6 py-3.5 text-text-secondary">
                    {s.totalTime ? `${Math.floor(s.totalTime / 60)}h ${Math.round(s.totalTime % 60)}m` : "—"}
                  </td>
                  <td className="px-6 py-3.5 text-text-muted text-xs">
                    {s.lastActiveDate
                      ? new Date(s.lastActiveDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="text-text-muted text-sm mb-1">No students found</div>
                    <p className="text-xs text-text-muted">Try adjusting your search or filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-border-light text-xs text-text-muted">
          Showing {sorted.length} of {students.length} students
        </div>
      </div>
    </div>
  );
}
