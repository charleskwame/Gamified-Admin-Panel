import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import StatCard from "../components/StatCard";
import { Skeleton, StatCardSkeleton, LeaderboardSkeleton, ChartSkeleton } from "../components/Skeleton";
import { UsersIcon, DocumentTextIcon, StarIcon, FireIcon } from "../components/Icons";
import { useAuth } from "../context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { auditLog } from "../utils/security";

const PIE_COLORS = ["#003F91", "#2563EB", "#10B981", "#F59E0B", "#EF4444"];

export default function DashboardPage({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [scoreDist, setScoreDist] = useState([]);

  const { userData } = useAuth();
  const course = userData?.course || null;

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const users = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
        const onlyStudents = users.filter((u) => u.role !== "lecturer");
        const total = onlyStudents.length;
        let totalScore = 0,
          totalAnswered = 0;
        let courseTotal = 0,
          courseAnswered = 0,
          courseCorrect = 0;
        const cfg = COURSE_CONFIG[course];

        for (const u of onlyStudents) {
          const s = u.score || 0;
          totalScore += s;
          totalAnswered += u.questionsAnswered || 0;
          if (cfg) {
            courseTotal += u[cfg.ptsField] || 0;
            courseAnswered += u[cfg.ansField] || 0;
            courseCorrect += u[cfg.corField] || 0;
          }
        }

        setStats({
          totalStudents: total,
          totalQuizzes: Math.round(totalAnswered / 10),
          averageScore: total > 0 ? Math.round(totalScore / total) : 0,
          courseTotal,
          courseAnswered,
          courseCorrect,
          courseAccuracy: courseAnswered > 0 ? ((courseCorrect / courseAnswered) * 100).toFixed(1) : 0,
        });

        if (cfg) {
          setCategoryData([{ name: cfg.label, points: courseTotal, color: cfg.color }]);
        }

        setScoreDist([]);

        const sorted = [...onlyStudents].sort((a, b) => {
          if (cfg) return (b[cfg.ptsField] || 0) - (a[cfg.ptsField] || 0);
          return (b.score || 0) - (a.score || 0);
        });
        setStudents(sorted.slice(0, 10));

        auditLog("dashboard_viewed", {
          course: course,
          totalStudents: total,
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [course]);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <Skeleton className="w-32 h-7 mb-1" />
          <Skeleton className="w-48 h-4" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton />
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
        <p className="text-sm text-text-secondary mt-0.5">Overview of student activity and progress</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={UsersIcon} label="Total Students" value={stats?.totalStudents ?? 0} sub="Registered learners" color="blue" />
        <StatCard icon={DocumentTextIcon} label="Quizzes Taken" value={stats?.totalQuizzes ?? 0} sub="Across all subjects" color="emerald" />
        <StatCard icon={StarIcon} label="Avg Score" value={stats?.averageScore ?? 0} sub="Per student" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border p-6 rounded-xl">
          <h2 className="text-base font-bold text-text-primary mb-4">Total Points by Subject</h2>
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
        </div>
        <div className="bg-surface border border-border p-6 rounded-xl">
          <h2 className="text-base font-bold text-text-primary mb-4">{COURSE_CONFIG[course]?.label || "Course"} Performance</h2>
          {course && stats ? (
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
          ) : (
            <div className="flex items-center justify-center h-52 text-text-muted text-sm">
              {course ? "No student data available yet." : "No course selected in your profile."}
            </div>
          )}
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
                <th className="px-6 py-3">{COURSE_CONFIG[course]?.short || "Score"} Pts</th>
                <th className="px-6 py-3">Streak</th>
                <th className="px-6 py-3">Questions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {students.map((s, i) => (
                <tr key={s.uid} className="hover:bg-bg-base/50 cursor-pointer transition-colors" onClick={() => onNavigate("student", s.uid)}>
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
                  <td className="px-6 py-3 font-bold text-text-primary">{course ? (s[COURSE_CONFIG[course]?.ptsField] ?? 0) : (s.score ?? 0)}</td>
                  <td className="px-6 py-3">
                    {(s.streakNumber || 0) > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 rounded-md text-xs font-semibold">
                        <FireIcon className="w-3.5 h-3.5" /> {s.streakNumber}
                      </span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-text-secondary">{s.questionsAnswered || 0}</td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted text-sm">
                    No students found.
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
