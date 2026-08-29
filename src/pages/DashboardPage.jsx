import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import StatCard from "../components/StatCard";
import { Skeleton, StatCardSkeleton, LeaderboardSkeleton, ChartSkeleton } from "../components/Skeleton";
import { UsersIcon, DocumentTextIcon, StarIcon, FireIcon, ChartBarIcon } from "../components/Icons";
import { useAuth } from "../context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { auditLog } from "../utils/security";

const COURSE_CONFIG = {
  computer_architecture: {
    label: "Computer Architecture",
    ptsField: "computerArchitecturePoints",
    ansField: "caAnswered",
    corField: "caCorrect",
    color: "#1E40AF",
    short: "CA",
  },
  computer_networking: {
    label: "Computer Networking",
    ptsField: "computerNetworkingPoints",
    ansField: "cnAnswered",
    corField: "cnCorrect",
    color: "#0091EA",
    short: "CN",
  },
  software_engineering: {
    label: "Software Engineering",
    ptsField: "softwareEngineeringPoints",
    ansField: "seAnswered",
    corField: "seCorrect",
    color: "#37474F",
    short: "SE",
  },
};

// A student belongs to a course when they have any engagement with that
// course content (points earned, questions answered, or correct answers).
function hasCourseData(student, cfg) {
  return (
    (student[cfg.ptsField] || 0) > 0 ||
    (student[cfg.ansField] || 0) > 0 ||
    (student[cfg.corField] || 0) > 0
  );
}

export default function DashboardPage({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  const { userData } = useAuth();
  const course = userData?.course || null;
  const cfg = COURSE_CONFIG[course];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const users = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
        const onlyStudents = users.filter((u) => u.role !== "lecturer");

        // No course assigned -> nothing course-scoped to show yet.
        if (!cfg) {
          setStats(null);
          setStudents([]);
          setCategoryData([]);
          auditLog("dashboard_viewed", { course, totalStudents: 0 });
          return;
        }

        // Scope every metric to the lecturer's own course: only students who
        // have engaged with that course are included anywhere on this page.
        const courseStudents = onlyStudents.filter((u) => hasCourseData(u, cfg));
        const total = courseStudents.length;

        let courseTotal = 0,
          courseAnswered = 0,
          courseCorrect = 0;

        for (const u of courseStudents) {
          courseTotal += u[cfg.ptsField] || 0;
          courseAnswered += u[cfg.ansField] || 0;
          courseCorrect += u[cfg.corField] || 0;
        }

        setStats({
          totalStudents: total,
          totalQuizzes: Math.round(courseAnswered / 10),
          averageScore: total > 0 ? Math.round(courseTotal / total) : 0,
          courseTotal,
          courseAnswered,
          courseCorrect,
          courseAccuracy: courseAnswered > 0 ? ((courseCorrect / courseAnswered) * 100).toFixed(1) : 0,
        });

        setCategoryData(
          courseTotal > 0 ? [{ name: cfg.label, points: courseTotal, color: cfg.color }] : []
        );

        const sorted = [...courseStudents].sort((a, b) => (b[cfg.ptsField] || 0) - (a[cfg.ptsField] || 0));
        setStudents(sorted.slice(0, 10));

        auditLog("dashboard_viewed", {
          course,
          totalStudents: total,
          courseTotal,
          courseAnswered,
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError(
          err?.message?.includes("permission-denied") || err?.code === "permission-denied"
            ? "Permission denied while loading analytics. Your Firestore security rules likely need updating \u2014 deploy the rules from `firestore.rules`."
            : "Failed to load analytics. Please check your connection and try again."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [course, cfg]);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <Skeleton className="w-32 h-7 mb-1" />
          <Skeleton className="w-48 h-4" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <LeaderboardSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {cfg
            ? `Overview of student activity and progress in ${cfg.label}`
            : "Overview of student activity and progress"}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3 rounded-lg">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-red-700">{error}</p>
            <p className="text-xs text-red-500 mt-1">
              Note: if you just created this lecturer account, make sure your email was verified and that the Firestore security rules in `firestore.rules` are deployed to your project.
            </p>
          </div>
        </div>
      )}

      {!cfg ? (
        <div className="bg-surface border border-border rounded-xl p-10 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-primary/10 flex items-center justify-center rounded-lg">
            <ChartBarIcon className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-text-primary">No Course Selected</h2>
          <p className="text-sm text-text-secondary max-w-md">
            Your dashboard only shows analytics for the course you teach. Choose your course in
            Settings to start tracking student activity and performance.
          </p>
          <button
            onClick={() => onNavigate("settings")}
            className="mt-1 px-5 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-lg transition-colors">
            Go to Settings
          </button>
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              icon={UsersIcon}
              label="Total Students"
              value={stats.totalStudents}
              sub={`In ${cfg.label}`}
              color="blue"
            />
            <StatCard
              icon={DocumentTextIcon}
              label="Quizzes Taken"
              value={stats.totalQuizzes}
              sub={`In ${cfg.label}`}
              color="emerald"
            />
            <StatCard
              icon={StarIcon}
              label="Avg Points"
              value={stats.averageScore}
              sub="Per student in course"
              color="amber"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface border border-border p-6 rounded-xl">
              <h2 className="text-base font-bold text-text-primary mb-4">{cfg.label} Points</h2>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={categoryData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7A8A" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#6B7A8A" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 4, border: "1px solid #B8CDCD", fontSize: 13 }}
                      formatter={(v) => [v.toLocaleString(), "Points"]}
                    />
                    <Bar dataKey="points" radius={[4, 4, 0, 0]} barSize={48}>
                      {categoryData.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-52 text-text-muted text-sm">
                  No student data available yet.
                </div>
              )}
            </div>

            <div className="bg-surface border border-border p-6 rounded-xl">
              <h2 className="text-base font-bold text-text-primary mb-4">{cfg.label} Performance</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border-light pb-3">
                  <span className="text-sm text-text-secondary">Total Points</span>
                  <span className="text-xl font-extrabold text-text-primary">{stats.courseTotal?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border-light pb-3">
                  <span className="text-sm text-text-secondary">Questions Answered</span>
                  <span className="text-xl font-extrabold text-text-primary">{stats.courseAnswered || 0}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border-light pb-3">
                  <span className="text-sm text-text-secondary">Correct</span>
                  <span className="text-xl font-extrabold text-emerald-600">{stats.courseCorrect || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Accuracy</span>
                  <span className="text-xl font-extrabold text-text-primary">{stats.courseAccuracy || 0}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
              <h2 className="text-base font-bold text-text-primary">Top Students</h2>
              <button onClick={() => onNavigate("students")} className="text-xs font-semibold text-primary hover:underline">
                View All →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border-light">
                    <th className="px-6 py-3">#</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">{cfg.short} Pts</th>
                    <th className="px-6 py-3">Streak</th>
                    <th className="px-6 py-3">Questions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {students.map((s, i) => (
                    <tr
                      key={s.uid}
                      className="hover:bg-bg-base/50 cursor-pointer transition-colors"
                      onClick={() => onNavigate("student", s.uid)}>
                      <td className="px-6 py-3 font-bold text-text-muted text-xs">{i + 1}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 rounded-lg">
                            {(s.displayName || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary text-sm">{s.displayName || "Unknown"}</p>
                            <p className="text-xs text-text-muted truncate max-w-40">{s.email || ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 font-bold text-text-primary">{s[cfg.ptsField] ?? 0}</td>
                      <td className="px-6 py-3">
                        {(s.streakNumber || 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 rounded-md text-xs font-semibold">
                            <FireIcon className="w-3.5 h-3.5" /> {s.streakNumber}
                          </span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-text-secondary">{s[cfg.ansField] || 0}</td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-text-muted text-sm">
                        No students have taken {cfg.label} questions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}