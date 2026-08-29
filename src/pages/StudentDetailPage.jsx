import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import { Skeleton } from "../components/Skeleton";
import { FireIcon } from "../components/Icons";
import { useAuth } from "../context/AuthContext";
import { auditLog } from "../utils/security";

const COURSE_CONFIG = {
  computer_architecture: {
    label: "Computer Architecture",
    ptsField: "computerArchitecturePoints",
    ansField: "caAnswered",
    corField: "caCorrect",
    color: "#1E40AF",
  },
  computer_networking: {
    label: "Computer Networking",
    ptsField: "computerNetworkingPoints",
    ansField: "cnAnswered",
    corField: "cnCorrect",
    color: "#0091EA",
  },
  software_engineering: {
    label: "Software Engineering",
    ptsField: "softwareEngineeringPoints",
    ansField: "seAnswered",
    corField: "seCorrect",
    color: "#37474F",
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

export default function StudentDetailPage({ uid, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const { userData } = useAuth();
  const lecturerCourse = userData?.course;
  const cfg = COURSE_CONFIG[lecturerCourse];

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          const studentData = { uid, ...snap.data() };

          // Authorization check: only allow viewing students if no course
          // filter, or if the student has data in the lecturer's course.
          if (cfg) {
            if (!hasCourseData(studentData, cfg)) {
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
  }, [uid, lecturerCourse, cfg]);

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
    totalTime,
    lastActiveDate,
  } = data;

  if (!cfg) {
    // No course filter: show the existing global breakdown.
    const questionsAnswered = data.questionsAnswered || 0;
    const computerArchitecturePoints = data.computerArchitecturePoints || 0;
    const computerNetworkingPoints = data.computerNetworkingPoints || 0;
    const softwareEngineeringPoints = data.softwareEngineeringPoints || 0;
    const computerArchitectureCorrect = data.computerArchitectureCorrect || 0;
    const computerNetworkingCorrect = data.computerNetworkingCorrect || 0;
    const softwareEngineeringCorrect = data.softwareEngineeringCorrect || 0;
    const coursePoints = [
      { name: "Computer Architecture", value: computerArchitecturePoints, color: "#1E40AF" },
      { name: "Computer Networking", value: computerNetworkingPoints, color: "#0091EA" },
      { name: "Software Engineering", value: softwareEngineeringPoints, color: "#37474F" },
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
              <p className="text-xs text-text-muted mt-1">All courses</p>
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
          <div className="bg-surface border border-border p-4 rounded-xl">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Total Score</p>
            <p className="text-2xl font-extrabold text-text-primary mt-1">{score || 0}</p>
          </div>
          <div className="bg-surface border border-border p-4 rounded-xl">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Streak</p>
            <p className="text-2xl font-extrabold text-text-primary mt-1">{streakNumber || 0}</p>
          </div>
          <div className="bg-surface border border-border p-4 rounded-xl">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Answered</p>
            <p className="text-2xl font-extrabold text-text-primary mt-1">{questionsAnswered || 0}</p>
          </div>
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
                        ? computerArchitectureCorrect
                        : c.name === "Computer Networking"
                          ? computerNetworkingCorrect
                          : softwareEngineeringCorrect,
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

  // Course-scoped view: only this lecturer's course metrics.
  const coursePoints = data[cfg.ptsField] || 0;
  const courseAnswered = data[cfg.ansField] || 0;
  const courseCorrect = data[cfg.corField] || 0;
  const courseAccuracy = courseAnswered > 0 ? Math.round((courseCorrect / courseAnswered) * 100) : 0;

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
            <p className="text-xs text-text-muted mt-1">
              {cfg.label} — enrolled student
            </p>
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
        <div className="bg-surface border border-border p-4 rounded-xl">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Total Score</p>
          <p className="text-2xl font-extrabold text-text-primary mt-1">{score || 0}</p>
        </div>
        <div className="bg-surface border border-border p-4 rounded-xl">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Streak</p>
          <p className="text-2xl font-extrabold text-text-primary mt-1">{streakNumber || 0}</p>
        </div>
        <div className="bg-surface border border-border p-4 rounded-xl">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Answered</p>
          <p className="text-2xl font-extrabold text-text-primary mt-1">{courseAnswered || 0}</p>
        </div>
      </div>

      {/* Course Scoped Performance */}
      <div className="bg-surface border border-border p-6 rounded-xl">
        <h2 className="text-base font-bold text-text-primary mb-4">{cfg.label} Performance</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border-light">
            <span className="text-sm text-text-secondary">Points Earned</span>
            <span className="text-sm font-semibold text-text-primary">{coursePoints || 0}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border-light">
            <span className="text-sm text-text-secondary">Questions Answered</span>
            <span className="text-sm font-semibold text-text-primary">{courseAnswered || 0}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border-light">
            <span className="text-sm text-text-secondary">Correct</span>
            <span className="text-sm font-semibold text-emerald-600">{courseCorrect || 0}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-text-secondary">Accuracy</span>
            <span className="text-sm font-semibold text-text-primary">{courseAccuracy}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}