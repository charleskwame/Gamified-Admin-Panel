import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import StatCard from "../components/StatCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { UsersIcon, DocumentTextIcon, StarIcon, FireIcon } from "../components/Icons";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const PIE_COLORS = ["#111C4A", "#4F46E5", "#10B981", "#F59E0B", "#EF4444"];

export default function DashboardPage({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [scoreDist, setScoreDist] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const users = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
        const onlyStudents = users.filter((u) => u.role !== "lecturer");
        const total = onlyStudents.length;
        let totalScore = 0, totalAnswered = 0, activeToday = 0;
        let caTotal = 0, cnTotal = 0, seTotal = 0;
        const brackets = { "0-99": 0, "100-499": 0, "500-999": 0, "1000+": 0 };
        const today = todayStr();

        for (const u of onlyStudents) {
          const s = u.score || 0;
          totalScore += s;
          totalAnswered += u.questionsAnswered || 0;
          if ((u.lastActiveDate || "") === today) activeToday++;
          caTotal += u.computerArchitecturePoints || 0;
          cnTotal += u.computerNetworkingPoints || 0;
          seTotal += u.softwareEngineeringPoints || 0;
          if (s < 100) brackets["0-99"]++;
          else if (s < 500) brackets["100-499"]++;
          else if (s < 1000) brackets["500-999"]++;
          else brackets["1000+"]++;
        }

        setStats({
          totalStudents: total,
          totalQuizzes: Math.round(totalAnswered / 10),
          averageScore: total > 0 ? Math.round(totalScore / total) : 0,
          activeToday,
        });

        setCategoryData([
          { name: "Computer Architecture", points: caTotal, color: "#8C52FF" },
          { name: "Computer Networking", points: cnTotal, color: "#0091EA" },
          { name: "Software Engineering", points: seTotal, color: "#37474F" },
        ]);

        setScoreDist(Object.entries(brackets).map(([n, v]) => ({ name: n, value: v })));

        setStudents(
          onlyStudents.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10)
        );
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of student activity and progress</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={UsersIcon} label="Total Students" value={stats?.totalStudents ?? 0} sub="Registered learners" color="indigo" />
        <StatCard icon={DocumentTextIcon} label="Quizzes Taken" value={stats?.totalQuizzes ?? 0} sub="Across all subjects" color="emerald" />
        <StatCard icon={StarIcon} label="Avg Score" value={stats?.averageScore ?? 0} sub="Per student" color="amber" />
        <StatCard icon={FireIcon} label="Active Today" value={stats?.activeToday ?? 0} sub={stats ? `${((stats.activeToday / stats.totalStudents) * 100).toFixed(0)}% of students` : ""} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-800 mb-4">Total Points by Subject</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 4, border: "1px solid #E5E7EB", fontSize: 13 }} formatter={(v) => [v.toLocaleString(), "Points"]} />
              <Bar dataKey="points" radius={[4, 4, 0, 0]} barSize={48}>
                {categoryData.map((e, i) => (<Cell key={i} fill={e.color} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-800 mb-4">Score Distribution</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={scoreDist} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                {scoreDist.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 4, border: "1px solid #E5E7EB", fontSize: 13 }} />
              <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-500">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">Top Students</h2>
          <button onClick={() => onNavigate("students")} className="text-xs font-semibold text-[#111C4A] hover:underline">View All →</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Score</th>
                <th className="px-6 py-3">Streak</th>
                <th className="px-6 py-3">Questions</th>
                <th className="px-6 py-3">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((s, i) => (
                <tr key={s.uid} className="hover:bg-gray-50/50 cursor-pointer transition-colors" onClick={() => onNavigate("student", s.uid)}>
                  <td className="px-6 py-3 font-bold text-gray-300 text-xs">{i + 1}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-[#111C4A]/10 flex items-center justify-center text-xs font-bold text-[#111C4A] shrink-0">
                        {(s.displayName || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{s.displayName || "Unknown"}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[160px]">{s.email || ""}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 font-bold text-gray-900">{s.score ?? 0}</td>
                  <td className="px-6 py-3">
                    {(s.streakNumber || 0) > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-xs font-semibold">
                        <FireIcon className="w-3.5 h-3.5" /> {s.streakNumber}
                      </span>
                    ) : (<span className="text-gray-300">—</span>)}
                  </td>
                  <td className="px-6 py-3 text-gray-600">{s.questionsAnswered || 0}</td>
                  <td className="px-6 py-3 text-xs text-gray-400">{s.lastActiveDate || "Never"}</td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">No students found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
