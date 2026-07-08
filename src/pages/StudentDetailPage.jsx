import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import LoadingSpinner from "../components/LoadingSpinner";
import { FireIcon } from "../components/Icons";
import { useAuth } from "../context/AuthContext";
import { auditLog } from "../utils/security";

export default function StudentDetailPage({ uid, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const { userData } = useAuth();
  const lecturerCourse = userData?.course;

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          const studentData = { uid, ...snap.data() };

          // Authorization check: only allow viewing students if no course filter,
          // or if the student has data in the lecturer's course
          if (lecturerCourse) {
            const coursePointsField = {
              computer_architecture: "computerArchitecturePoints",
              computer_networking: "computerNetworkingPoints",
              software_engineering: "softwareEngineeringPoints",
            }[lecturerCourse];

            const studentHasCourseData = coursePointsField
              ? (studentData[coursePointsField] || 0) > 0 || (studentData.questionsAnswered || 0) > 0
              : true;

            if (!studentHasCourseData) {
              setAccessDenied(true);
              auditLog("student_access_denied", {
                lecturerCourse: lecturerCourse,
                targetUid: uid,
                reason: "Student has no data in lecturer's course",
              });
              setLoading(false);
              return;
            }
          }

          setData(studentData);

          auditLog("student_detail_viewed", {
            lecturerCourse: lecturerCourse,
            targetUid: uid,
          });
        }
      } catch (err) {
        console.error("Student fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (uid) fetchStudent();
  }, [uid, lecturerCourse]);

  if (loading) return <LoadingSpinner text="Loading student details..." />;

  if (accessDenied) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button onClick={onBack} className="text-sm font-semibold text-[#111C4A] hover:underline mb-4 inline-flex items-center gap-1">
          ← Back
        </button>
        <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
          <p className="text-sm font-medium text-red-700">Access denied. You can only view students enrolled in your course.</p>
        </div>
      </div>
    );
  }

  if (!data)
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button onClick={onBack} className="text-sm font-semibold text-[#111C4A] hover:underline mb-4 inline-flex items-center gap-1">
          ← Back
        </button>
        <p className="text-gray-500">Student not found.</p>
      </div>
    );

  const total = data.questionsAnswered || 0;
  const correct = data.questionsCorrect || 0;
  const incorrect = total - correct;
  const accuracyPct = total > 0 ? ((correct / total) * 100).toFixed(1) : 0;

  const subjectStats = [
    { name: "Architecture", pts: data.computerArchitecturePoints || 0, ans: data.caAnswered || 0, cor: data.caCorrect || 0, color: "#8C52FF" },
    { name: "Networking", pts: data.computerNetworkingPoints || 0, ans: data.cnAnswered || 0, cor: data.cnCorrect || 0, color: "#0091EA" },
    { name: "Software Eng", pts: data.softwareEngineeringPoints || 0, ans: data.seAnswered || 0, cor: data.seCorrect || 0, color: "#37474F" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <button onClick={onBack} className="text-sm font-semibold text-[#111C4A] hover:underline inline-flex items-center gap-1">
        ← Back to Students
      </button>

      {/* Profile Card */}
      <div className="bg-white border border-gray-200 p-6 rounded-xl">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-[#111C4A] flex items-center justify-center text-2xl font-extrabold text-white shrink-0 rounded-xl">
            {(data.displayName || "?").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold text-gray-900">{data.displayName || "Unknown"}</h1>
            <p className="text-sm text-gray-500">{data.email || "No email"}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2.5 py-0.5 bg-[#111C4A]/10 text-[#111C4A] text-xs font-semibold rounded-md">Student</span>
              {(data.streakNumber || 0) > 0 && (
                <span className="px-2.5 py-0.5 bg-orange-50 text-orange-600 text-xs font-semibold inline-flex items-center gap-1 rounded-md">
                  <FireIcon className="w-3.5 h-3.5" /> {data.streakNumber} day streak
                </span>
              )}
              <span className="px-2.5 py-0.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded-md">
                Joined {data.createdAt?.toDate?.()?.toLocaleDateString() || data.lastActiveDate || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 p-5 text-center rounded-xl">
          <p className="text-3xl font-extrabold text-gray-900">{data.score ?? 0}</p>
          <p className="text-xs font-semibold text-gray-500 mt-1 uppercase">Total Score</p>
        </div>
        <div className="bg-white border border-gray-200 p-5 text-center rounded-xl">
          <p className="text-3xl font-extrabold text-gray-900">{total}</p>
          <p className="text-xs font-semibold text-gray-500 mt-1 uppercase">Questions Answered</p>
        </div>
        <div className="bg-white border border-gray-200 p-5 text-center rounded-xl">
          <p className="text-3xl font-extrabold text-gray-900">{accuracyPct}%</p>
          <p className="text-xs font-semibold text-gray-500 mt-1 uppercase">Accuracy</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 p-6 rounded-xl">
          <h2 className="text-base font-bold text-gray-800 mb-4">Accuracy Breakdown</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={[
                  { name: "Correct", value: Math.max(correct, 0) },
                  { name: "Incorrect", value: Math.max(incorrect, 0) },
                ]}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value">
                <Cell fill="#10B981" />
                <Cell fill="#EF4444" />
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 4, border: "1px solid #E5E7EB", fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500" />
              <span className="text-xs text-gray-500">{correct} Correct</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500" />
              <span className="text-xs text-gray-500">{incorrect} Incorrect</span>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-6 rounded-xl">
          <h2 className="text-base font-bold text-gray-800 mb-4">Points by Subject</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={subjectStats} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 4, border: "1px solid #E5E7EB", fontSize: 13 }} />
              <Bar dataKey="pts" barSize={40}>
                {subjectStats.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Subject Details */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">Subject Performance</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {subjectStats.map((sub) => (
            <div key={sub.name} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3" style={{ backgroundColor: sub.color }} />
                <span className="text-sm font-semibold text-gray-700">{sub.name}</span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-gray-500">{sub.ans} answered</span>
                <span className="text-emerald-600 font-semibold">{sub.cor} correct</span>
                <span className="text-red-500 font-semibold">{sub.ans - sub.cor} wrong</span>
                <span className="text-gray-900 font-bold">{sub.pts} pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      {data.badges && data.badges.length > 0 && (
        <div className="bg-white border border-gray-200 p-6 rounded-xl">
          <h2 className="text-base font-bold text-gray-800 mb-3">Unlocked Badges ({data.badges.length})</h2>
          <div className="flex flex-wrap gap-2">
            {data.badges.map((badge) => (
              <span key={badge} className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200 rounded-md">
                {badge.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
