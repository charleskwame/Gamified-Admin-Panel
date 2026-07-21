import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import { Skeleton } from "../components/Skeleton";
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
        } else {
          setAccessDenied(true);
        }
      } catch (err) {
        console.error("StudentDetail fetch error:", err);
        setAccessDenied(true);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [uid, lecturerCourse]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="w-24 h-5 mb-6" />
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div>
            <Skeleton className="w-40 h-6 mb-1" />
            <Skeleton className="w-56 h-4" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface border border-border p-6 rounded-xl h-64">
            <Skeleton className="w-32 h-5 mb-4" />
            <Skeleton className="w-full h-52" />
          </div>
          <div className="bg-surface border border-border p-6 rounded-xl h-64">
            <Skeleton className="w-32 h-5 mb-4" />
            <Skeleton className="w-full h-52" />
          </div>
        </div>
      </div>
    );
  }

  if (accessDenied || !data) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Students
        </button>
        <div className="bg-surface border border-border p-12 rounded-xl text-center">
          <div className="w-16 h-16 bg-red-100 flex items-center justify-center mx-auto mb-4 rounded-full">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-1">Access Denied</h2>
          <p className="text-sm text-text-secondary">
            {lecturerCourse ? "This student does not have any data in your course." : "Student not found."}
          </p>
        </div>
      </div>
    );
  }

  const {
    displayName,
    email,
    score,
    streakNumber,
    questionsAnswered,
    totalTime,
    lastActiveDate,
    computerArchitecturePoints,
    computerNetworkingPoints,
    softwareEngineeringPoints,
    computerArchitectureCorrect,
    computerNetworkingCorrect,
    softwareEngineeringCorrect,
  } = data;

  // Prepare stats for cards
  const statCards = [
    { label: "Total Score", value: score || 0, color: "from-blue-500 to-blue-600" },
    { label: "Streak", value: streakNumber || 0, color: "from-orange-500 to-orange-600" },
    { label: "Answered", value: questionsAnswered || 0, color: "from-emerald-500 to-emerald-600" },
  ];

  // Pie data for course breakdown
  const coursePoints = [
    { name: "Computer Architecture", value: computerArchitecturePoints || 0, color: "#1E40AF" },
    { name: "Computer Networking", value: computerNetworkingPoints || 0, color: "#0091EA" },
    { name: "Software Engineering", value: softwareEngineeringPoints || 0, color: "#37474F" },
  ].filter((c) => c.value > 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to Students
      </button>

      {/* Student Info Header */}
      <div className="bg-surface border border-border p-6 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 flex items-center justify-center text-xl font-bold text-primary rounded-xl shrink-0">
            {(displayName || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-text-primary">{displayName || "Unknown"}</h1>
            <p className="text-sm text-text-secondary">{email || "No email"}</p>
            {lastActiveDate && (
              <p className="text-xs text-text-muted mt-0.5">
                Last active:{" "}
                {new Date(lastActiveDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-surface border border-border p-4 rounded-xl">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{card.label}</p>
            <p className="text-2xl font-extrabold text-text-primary mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {coursePoints.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface border border-border p-6 rounded-xl">
            <h2 className="text-base font-bold text-text-primary mb-4">Points by Course</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={coursePoints} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={40}>
                  {coursePoints.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 4, border: "1px solid #B8CDCD", fontSize: 13 }} formatter={(v) => [v, "Points"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {coursePoints.map((e, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }} />
                  {e.name}: {e.value}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-border p-6 rounded-xl">
            <h2 className="text-base font-bold text-text-primary mb-4">Correct Answers by Course</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={coursePoints.map((c) => ({
                  name: c.name,
                  correct:
                    c.name === "Computer Architecture"
                      ? computerArchitectureCorrect || 0
                      : c.name === "Computer Networking"
                        ? computerNetworkingCorrect || 0
                        : softwareEngineeringCorrect || 0,
                  color: c.color,
                }))}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7A8A" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7A8A" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 4, border: "1px solid #B8CDCD", fontSize: 13 }} formatter={(v) => [v, "Correct"]} />
                <Bar dataKey="correct" radius={[4, 4, 0, 0]} barSize={48}>
                  {coursePoints.map((e, i) => (
                    <Cell key={i} fill={e.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Additional Stats */}
      <div className="bg-surface border border-border p-6 rounded-xl">
        <h2 className="text-base font-bold text-text-primary mb-4">Activity Details</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border-light">
            <span className="text-sm text-text-secondary">Total Time</span>
            <span className="text-sm font-semibold text-text-primary">
              {totalTime ? `${Math.floor(totalTime / 60)}h ${Math.round(totalTime % 60)}m` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border-light">
            <span className="text-sm text-text-secondary">Questions Answered</span>
            <span className="text-sm font-semibold text-text-primary">{questionsAnswered || 0}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-text-secondary">Current Streak</span>
            <span className="text-sm font-semibold text-text-primary flex items-center gap-1">
              {streakNumber > 0 ? (
                <>
                  <FireIcon className="w-4 h-4 text-orange-500" /> {streakNumber} days
                </>
              ) : (
                "—"
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
