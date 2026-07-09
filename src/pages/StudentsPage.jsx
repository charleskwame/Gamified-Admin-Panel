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
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [course]);

  const sorted = [...students].sort((a, b) => {
    if (sortKey === "name") return (a.displayName || "").localeCompare(b.displayName || "");
    if (sortKey === "streak") return (b.streakNumber || 0) - (a.streakNumber || 0);
    if (sortKey === "questions") return (b.questionsAnswered || 0) - (a.questionsAnswered || 0);
    return (b.score || 0) - (a.score || 0);
  });

  const filtered = search.trim()
    ? sorted.filter(
        (s) => (s.displayName || "").toLowerCase().includes(search.toLowerCase()) || (s.email || "").toLowerCase().includes(search.toLowerCase()),
      )
    : sorted;

  const SortButton = ({ label, field }) => (
    <button
      onClick={() => setSortKey(field)}
      className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
        sortKey === field ? "text-[#111C4A]" : "text-gray-500 hover:text-gray-600"
      }`}>
      {label} {sortKey === field && "↓"}
    </button>
  );

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="w-24 h-7 mb-1" />
            <Skeleton className="w-32 h-4" />
          </div>
          <Skeleton className="w-full sm:w-72 h-10" />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {Array.from({ length: 8 }).map((_, i) => (
                  <StudentRowSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-0.5">{students.length} registered students</p>
        </div>
        <div className="relative w-full sm:w-72">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-[#111C4A]/20 focus:border-[#111C4A] outline-none transition-all rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="px-6 py-3">
                  <SortButton label="Student" field="name" />
                </th>
                <th className="px-6 py-3">
                  <SortButton label="Score" field="score" />
                </th>
                <th className="px-6 py-3">
                  <SortButton label="Streak" field="streak" />
                </th>
                <th className="px-6 py-3">
                  <SortButton label="Questions" field="questions" />
                </th>
                <th className="px-6 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">CA Pts</span>
                </th>
                <th className="px-6 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">CN Pts</span>
                </th>
                <th className="px-6 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">SE Pts</span>
                </th>
                <th className="px-6 py-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Last Active</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((s) => (
                <tr key={s.uid} className="hover:bg-gray-50/50 cursor-pointer transition-colors" onClick={() => onNavigate("student", s.uid)}>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-[#111C4A]/10 flex items-center justify-center text-xs font-bold text-[#111C4A] shrink-0 rounded-lg">
                        {(s.displayName || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{s.displayName || "Unknown"}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">{s.email || ""}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 font-bold text-gray-900">{s.score ?? 0}</td>
                  <td className="px-6 py-3.5">
                    {(s.streakNumber || 0) > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 text-xs font-semibold rounded-md">
                        <FireIcon className="w-3.5 h-3.5" /> {s.streakNumber}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-gray-600">{s.questionsAnswered || 0}</td>
                  <td className="px-6 py-3.5 text-gray-600 font-medium">{s.computerArchitecturePoints || 0}</td>
                  <td className="px-6 py-3.5 text-gray-600 font-medium">{s.computerNetworkingPoints || 0}</td>
                  <td className="px-6 py-3.5 text-gray-600 font-medium">{s.softwareEngineeringPoints || 0}</td>
                  <td className="px-6 py-3.5 text-xs text-gray-400">{s.lastActiveDate || "Never"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm">
                    {search.trim() ? "No students match your search." : "No students registered yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
