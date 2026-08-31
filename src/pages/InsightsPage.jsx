import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Skeleton } from "../components/Skeleton";
import { LightBulbIcon, RobotIcon, BookOpenIcon, BoltIcon, MapPinIcon, ExclamationTriangleIcon, ChartBarIcon } from "../components/Icons";
import { auditLog } from "../utils/security";
import { generateAIInsights } from "../utils/aiInsights";
import { exportLearningResourcesPdf } from "../utils/exportLearningResourcesPdf";

const COURSE_COLLECTION = {
  computer_architecture: "computer_architecture_questions",
  computer_networking: "computer_networking_questions",
  software_engineering: "software_engineering_questions",
};

const COURSE_INCORRECT_COLLECTION = {
  computer_architecture: "computer_architecture_questions_gotten_incorrectly",
  computer_networking: "computer_networking_questions_gotten_incorrectly",
  software_engineering: "software_engineering_questions_gotten_incorrectly",
};

const COURSE_LABEL = {
  computer_architecture: "Computer Architecture",
  computer_networking: "Computer Networking",
  software_engineering: "Software Engineering",
};

export default function InsightsPage() {
  const { userData } = useAuth();
  const course = userData?.course;
  const questionsCollection = COURSE_COLLECTION[course];
  const incorrectCollection = COURSE_INCORRECT_COLLECTION[course];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [insights, setInsights] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(insights.length / pageSize));
  const paginatedInsights = insights.slice((page - 1) * pageSize, page * pageSize);

  // AI Modal state
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiLoading, setAILoading] = useState(false);
  const [aiAnalysis, setAIAnalysis] = useState(null);

  useEffect(() => {
    const fetchInsights = async () => {
      if (!course || !incorrectCollection) {
        setLoading(false);
        return;
      }
      try {
        // Fetch document counts: total questions and incorrectly answered questions
        const questionsSnap = await getDocs(collection(db, questionsCollection));
        const incorrectSnap = await getDocs(collection(db, incorrectCollection));
        const totalQ = questionsSnap.size;
        const incorrectDocs = incorrectSnap.docs;
        const totalIncorrect = incorrectDocs.length;

        // Build a map: questionId -> question text
        const questionMap = {};
        for (const doc of questionsSnap.docs) {
          const data = doc.data();
          const qId = data.id || doc.id;
          questionMap[qId] = data.questionText || "Unknown Question";
        }

        // Build a map: questionId -> count of students who got it wrong
        const incorrectMap = {};
        for (const doc of incorrectDocs) {
          const data = doc.data();
          const qId = data.questionId || data.id || doc.id;
          incorrectMap[qId] = (incorrectMap[qId] || 0) + 1;
        }

        // Sort questions by most incorrect
        const sorted = Object.entries(incorrectMap)
          .map(([qId, count]) => ({ qId, count }))
          .filter((item) => item.count > 0)
          .sort((a, b) => b.count - a.count);

        const generated = sorted.map((item, index) => ({
          id: `${item.qId}-${index}`,
          questionId: item.qId,
          questionText: questionMap[item.qId] || `Question ID: ${item.qId}`,
          studentCount: item.count,
          description: `${item.count} student${item.count > 1 ? "s" : ""} answered this question incorrectly.`,
          type: "high_incorrect",
        }));

        setInsights(generated);

        auditLog("insights_viewed", {
          course: course,
          totalIncorrect: totalIncorrect,
          totalQuestions: totalQ,
          badgesGenerated: generated.length,
        });
      } catch (err) {
        console.error("Insights fetch error:", err);
        setError("Failed to load insights. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [course, questionsCollection, incorrectCollection]);

  const handleAIAnalysis = async () => {
    if (!course) return;
    setShowAIModal(true);
    setAILoading(true);
    setAIAnalysis(null);

    try {
      const questionsSnap = await getDocs(collection(db, questionsCollection));
      const incorrectSnap = await getDocs(collection(db, incorrectCollection));

      const allQuestions = questionsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const incorrectEntries = incorrectSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Build question map for text lookup
      const questionMap = {};
      for (const q of allQuestions) {
        const qId = q.id || q.questionId;
        questionMap[qId] = q.questionText || q.correctAnswer || "";
      }

      // Aggregate wrong counts per question
      const wrongCountMap = {};
      for (const entry of incorrectEntries) {
        const qId = entry.questionId || entry.id;
        wrongCountMap[qId] = (wrongCountMap[qId] || 0) + 1;
      }

      // Build insights array expected by generateAIInsights(insights, course)
      const insightsData = Object.entries(wrongCountMap).map(([qId, count]) => ({
        questionId: qId,
        questionText: questionMap[qId] || `Question ID: ${qId}`,
        number_of_wrong: count,
      })).sort((a, b) => b.number_of_wrong - a.number_of_wrong);

      const analysis = await generateAIInsights(insightsData, course);
      setAIAnalysis(analysis);
    } catch (err) {
      console.error("AI analysis error:", err);
      setAIAnalysis(null);
    } finally {
      setAILoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <Skeleton className="w-40 h-7 mb-1" />
          <Skeleton className="w-52 h-4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border p-6 rounded-xl">
              <Skeleton className="w-full h-5 mb-3" />
              <Skeleton className="w-3/4 h-4 mb-2" />
              <Skeleton className="w-1/2 h-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-surface border border-border p-12 rounded-xl text-center">
          <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mx-auto mb-4 rounded-full">
            <LightBulbIcon className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-1">No Course Selected</h2>
          <p className="text-sm text-text-secondary">Please set your course in settings to view insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">Insights</h1>
          <p className="text-sm text-text-secondary mt-0.5">Analyzing performance for {COURSE_LABEL[course] || course}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAIAnalysis}
            className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-white font-semibold hover:bg-primary-dark transition-all text-sm rounded-lg">
            <RobotIcon />
            AI Analysis
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* No Insights State */}
      {insights.length === 0 && !error && (
        <div className="bg-surface border border-border p-12 rounded-xl text-center">
          <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mx-auto mb-4 rounded-full">
            <LightBulbIcon className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-1">No Insights Available</h2>
          <p className="text-sm text-text-secondary">Students haven't answered enough questions yet to generate meaningful insights.</p>
        </div>
      )}

      {/* Insights Grid */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedInsights.map((insight) => (
            <div key={insight.id} className="bg-surface border border-border p-6 rounded-xl">
              <div className="flex items-start justify-between mb-2">
                <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs font-semibold">
                  {insight.type === "high_incorrect" ? "High Incorrect Rate" : "Insight"}
                </span>
                <span className="text-xs text-text-muted">{insight.studentCount} students</span>
              </div>
              <p className="text-sm font-medium text-text-primary mb-1 line-clamp-2">{insight.questionText}</p>
              <p className="text-xs text-text-secondary">{insight.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm font-semibold text-text-primary hover:bg-bg-base disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-lg">
            Previous
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === pageCount || (p >= page - 1 && p <= page + 1))
            .reduce((acc, p, i, arr) => {
              if (i > 0 && arr[i - 1] !== p - 1) {
                acc.push(
                  <span key={`ellipsis-${p}`} className="w-8 h-8 flex items-center justify-center text-sm text-text-muted">
                    ...
                  </span>
                );
              }
              acc.push(
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-sm font-semibold rounded-lg transition-all ${p === page ? "bg-primary text-white" : "text-text-muted hover:bg-bg-base"
                    }`}>
                  {p}
                </button>
              );
              return acc;
            }, [])}
          <button
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page === pageCount}
            className="px-3 py-1.5 text-sm font-semibold text-text-primary hover:bg-bg-base disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-lg">
            Next
          </button>
        </div>
      )}

      {/* AI Analysis Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <RobotIcon className="w-6 h-6" />
                <h2 className="text-lg font-bold text-text-primary">AI Analysis</h2>
              </div>
              <button
                onClick={() => setShowAIModal(false)}
                className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary transition-all rounded-lg hover:bg-bg-base">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {aiLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-text-secondary">Analyzing course data...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                  <span className="text-xs font-semibold text-emerald-600">Analysis Complete</span>
                </div>

                {/* Summary Stats */}
                {aiAnalysis.summary && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Total Questions", value: aiAnalysis.summary.totalQuestions },
                      { label: "Total Wrong Answers", value: aiAnalysis.summary.totalWrongAnswers },
                      { label: "Avg Wrong / Question", value: aiAnalysis.summary.averageWrongPerQuestion },
                      { label: "High Priority", value: aiAnalysis.summary.highPriorityCount },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-bg-base border border-border rounded-lg p-3">
                        <p className="text-xs text-text-muted mb-0.5">{label}</p>
                        <p className="text-lg font-bold text-text-primary">{value ?? "—"}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Priority Topics */}
                {aiAnalysis.priorityTopics?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-text-primary mb-2 flex items-center gap-1.5">
                      <MapPinIcon className="w-4 h-4 text-primary" />
                      Priority Topics
                    </h3>
                    <div className="space-y-2">
                      {aiAnalysis.priorityTopics.map((t, i) => (
                        <div key={i} className="flex items-center justify-between bg-bg-base border border-border rounded-lg px-3 py-2">
                          <span className="text-sm text-text-primary font-medium">{t.topic}</span>
                          <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">{t.count} wrong</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Items */}
                {aiAnalysis.actionItems?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-text-primary mb-2 flex items-center gap-1.5">
                      <BoltIcon className="w-4 h-4 text-primary" />
                      Action Items
                    </h3>
                    <div className="space-y-3">
                      {aiAnalysis.actionItems.map((item, i) => (
                        <div key={i} className="bg-bg-base border border-border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            {item.type === "immediate" ? (
                              <ExclamationTriangleIcon className="w-4 h-4 text-red-500 shrink-0" />
                            ) : item.type === "focus_area" ? (
                              <ChartBarIcon className="w-4 h-4 text-amber-500 shrink-0" />
                            ) : item.type === "misconception" ? (
                              <ExclamationTriangleIcon className="w-4 h-4 text-orange-500 shrink-0" />
                            ) : (
                              <BoltIcon className="w-4 h-4 text-primary shrink-0" />
                            )}
                            <span className="text-sm font-semibold text-text-primary">{item.title}</span>
                            {item.type && (
                              <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
                                {item.type.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary mb-2">{item.description}</p>
                          {item.recommendations?.length > 0 && (
                            <ul className="space-y-1">
                              {item.recommendations.map((rec, j) => (
                                <li key={j} className="text-xs text-text-muted flex gap-1.5 items-start">
                                  <svg className="w-3 h-3 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                  </svg>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Learning Materials */}
                {aiAnalysis.learningMaterials?.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                        <BookOpenIcon className="w-4 h-4 text-primary" />
                        Learning Resources
                      </h3>
                      <button
                        onClick={() =>
                          exportLearningResourcesPdf(
                            aiAnalysis.learningMaterials,
                            course,
                            userData?.displayName || "Lecturer"
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-primary border border-primary/30 bg-primary/5 rounded-lg hover:bg-primary/10 transition-all">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Export PDF
                      </button>
                    </div>
                    <div className="space-y-2">
                      {aiAnalysis.learningMaterials.map((mat, i) => (
                        <a
                          key={i}
                          href={mat.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-bg-base border border-border rounded-lg p-3 hover:border-primary/40 transition-all group">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">{mat.title}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${mat.priority === "high" ? "bg-red-50 text-red-600" :
                              mat.priority === "medium" ? "bg-amber-50 text-amber-600" :
                                "bg-emerald-50 text-emerald-600"
                              }`}>{mat.priority}</span>
                          </div>
                          <p className="text-xs text-text-muted mb-1">{mat.topic} · {mat.resourceType}</p>
                          <p className="text-xs text-text-secondary">{mat.description}</p>
                        </a>
                      ))}
                    </div>

                    <div className="mt-4 bg-amber-50 border border-amber-100 rounded-lg p-3">
                      <p className="text-xs text-amber-900"><strong>Disclaimer:</strong> The Learning Resources are AI generated and may not be accurate. Please verify the resources before sharing them with the students.</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-text-secondary">Failed to generate AI analysis. Please try again.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
