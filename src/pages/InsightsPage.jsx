import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Skeleton } from "../components/Skeleton";
import { LightBulbIcon, RobotIcon } from "../components/Icons";
import { validateCourseAccess, auditLog } from "../utils/security";
import { generateAIInsights } from "../utils/aiInsights";

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

      // Validate course access
      const accessCheck = validateCourseAccess(course, questionsCollection);
      if (!accessCheck.allowed) {
        setError(accessCheck.error);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        // Step 1: Fetch all docs from the incorrect questions collection, sorted by number_of_wrong descending
        const incorrectSnap = await getDocs(collection(db, incorrectCollection));
        const incorrectDocs = incorrectSnap.docs.map((d) => ({
          id: d.id,
          questionId: d.data().questionId,
          number_of_wrong: d.data().number_of_wrong || 0,
        }));

        // Step 2: Sort by number_of_wrong descending
        incorrectDocs.sort((a, b) => b.number_of_wrong - a.number_of_wrong);

        // Step 3: Fetch the actual question for each incorrect entry
        const results = [];
        for (const entry of incorrectDocs) {
          try {
            const questionSnap = await getDoc(doc(db, questionsCollection, entry.questionId));
            if (questionSnap.exists()) {
              const qData = questionSnap.data();
              results.push({
                id: entry.questionId,
                questionText: qData.questionText || "",
                options: qData.options || [],
                correctAnswer: qData.correctAnswer || "",
                explanation: qData.explanation || "",
                number_of_wrong: entry.number_of_wrong,
              });
            }
            // Skip if question was deleted (document no longer exists)
          } catch {
            // Skip individually if a question fetch fails
          }
        }

        setInsights(results);
      } catch (err) {
        console.error("Insights fetch error:", err);
        setError("Failed to load insights data.");
      }

      setLoading(false);
    };

    fetchInsights();
    setPage(1);
  }, [course]);

  const handleAIAnalysis = async () => {
    setShowAIModal(true);
    setAILoading(true);
    setAIAnalysis(null);

    try {
      const analysis = await generateAIInsights(insights, course);
      setAIAnalysis(analysis);

      auditLog("ai_insights_generated", {
        course: course,
        totalInsights: insights.length,
        analysisType: import.meta.env.VITE_DEEPSEEK_API_KEY ? "deepseek" : import.meta.env.VITE_OPENAI_API_KEY ? "openai" : "rule-based",
      });
    } catch (err) {
      console.error("AI analysis error:", err);
      setAIAnalysis({ error: "Failed to generate AI insights. Please try again." });
    }

    setAILoading(false);
  };

  if (!course || !questionsCollection) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-extrabold text-gray-900">Insights</h1>
        <p className="text-sm text-gray-500 mt-2">No course selected in your profile.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-extrabold text-gray-900">Insights</h1>
        <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg mt-4">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {loading ? (
        <>
          <div>
            <Skeleton className="w-38 h-7 mb-1" />
            <Skeleton className="w-64 h-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
                <Skeleton className="w-3/4 h-5 mb-3" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="w-20 h-7" />
                  <Skeleton className="w-20 h-7" />
                  <Skeleton className="w-20 h-7" />
                  <Skeleton className="w-20 h-7" />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : insights.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <LightBulbIcon className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-base font-semibold text-gray-500">No data yet</p>
            <p className="text-sm text-gray-400 mt-1 max-w-md">
              Insights will appear here once students start answering questions incorrectly. The system tracks which questions are most frequently
              missed.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Insights</h1>
            <p className="text-sm text-gray-500 mt-0.5">{COURSE_LABEL[course]} &mdash; Questions students often get wrong</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedInsights.map((item) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-5 relative hover:shadow-md transition-shadow">
                {/* Incorrect count badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-red-50 border border-red-200 rounded-full">
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-xs font-bold text-red-600">{item.number_of_wrong}</span>
                </div>

                {/* Question text */}
                <p className="text-base font-bold text-gray-900 leading-relaxed pr-20">{item.questionText}</p>

                {/* Options */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.options.map((opt, i) => {
                    const isCorrect = opt === item.correctAnswer || opt.startsWith(item.correctAnswer + ")");
                    return (
                      <span
                        key={i}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium border rounded-md ${
                          isCorrect ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-gray-50 text-gray-600 border-gray-200"
                        }`}>
                        {isCorrect && (
                          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                        {opt}
                      </span>
                    );
                  })}
                </div>

                {/* Explanation */}
                {item.explanation && <p className="mt-3 text-sm text-gray-400 italic">{item.explanation}</p>}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex items-center justify-between px-6 py-3 text-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-default rounded-md">
                Previous
              </button>
              <span className="text-xs text-gray-400">
                Page {page} of {pageCount}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
                className="px-3 py-1 border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-default rounded-md">
                Next
              </button>
            </div>
          )}

          {/* Summary footer */}
          <div className="text-center text-xs text-gray-400">
            Showing {paginatedInsights.length} of {insights.length} question{insights.length !== 1 ? "s" : ""} sorted by most frequently answered
            incorrectly.
          </div>
        </>
      )}

      {/* Floating AI Button */}
      {!loading && insights.length > 0 && (
        <button
          onClick={handleAIAnalysis}
          className="fixed bottom-6 right-6 flex items-center justify-center w-14 h-14 bg-black text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all z-40 group"
          title="Get AI Learning Insights">
          <RobotIcon className="w-7 h-7 group-hover:animate-pulse" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
        </button>
      )}

      {/* AI Analysis Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-xl shadow-xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black flex items-center justify-center rounded-lg">
                  <RobotIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">AI Learning Insights</h2>
              </div>
              <button onClick={() => setShowAIModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {aiLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-600">Analyzing student performance patterns...</p>
                  </div>
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="w-full h-20" />
                    ))}
                  </div>
                </div>
              ) : aiAnalysis?.error ? (
                <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
                  <p className="text-sm font-medium text-red-700">{aiAnalysis.error}</p>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">{aiAnalysis.summary?.totalQuestions || 0}</p>
                      <p className="text-xs text-gray-500">Total Questions</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-red-600">{aiAnalysis.summary?.totalWrongAnswers || 0}</p>
                      <p className="text-xs text-gray-500">Wrong Answers</p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-amber-600">{aiAnalysis.summary?.highPriorityCount || 0}</p>
                      <p className="text-xs text-gray-500">High Priority</p>
                    </div>
                  </div>

                  {/* Priority Topics */}
                  {aiAnalysis.priorityTopics && aiAnalysis.priorityTopics.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Priority Topics</h3>
                      <div className="space-y-2">
                        {aiAnalysis.priorityTopics.map((topic, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-800">{topic.topic}</span>
                            <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-full">{topic.count} misses</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Learning Pathways */}
                  {aiAnalysis.learningPathways && aiAnalysis.learningPathways.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Suggested Learning Pathways</h3>
                      <div className="space-y-3">
                        {aiAnalysis.learningPathways.map((pathway, i) => (
                          <div key={i} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-2 h-2 rounded-full mt-1.5 ${
                                  pathway.priority === "high" ? "bg-red-500" : pathway.priority === "medium" ? "bg-amber-500" : "bg-emerald-500"
                                }`}
                              />
                              <div className="flex-1">
                                <h4 className="text-sm font-bold text-gray-900">{pathway.title}</h4>
                                <p className="text-xs text-gray-500 mt-1">{pathway.description}</p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {pathway.topics?.map((t, j) => (
                                    <span key={j} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                                {pathway.recommendedFormat && <p className="text-xs text-gray-400 mt-2 italic">{pathway.recommendedFormat}</p>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Items */}
                  {aiAnalysis.actionItems && aiAnalysis.actionItems.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Action Items</h3>
                      <div className="space-y-3">
                        {aiAnalysis.actionItems.map((item, i) => (
                          <div key={i} className="border-l-4 border-blue-500 bg-gray-50 p-4 rounded-r-lg">
                            <div className="flex items-start gap-3">
                              <span className="text-lg">{item.icon}</span>
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                                <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                                {item.questions && (
                                  <ul className="mt-2 space-y-1">
                                    {item.questions.map((q, j) => (
                                      <li key={j} className="text-xs text-gray-600 pl-3 border-l border-gray-300">
                                        {q}...
                                      </li>
                                    ))}
                                  </ul>
                                )}
                                {item.topics && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {item.topics.map((t, j) => (
                                      <span key={j} className="px-2 py-0.5 text-xs bg-white border border-gray-200 rounded-full">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {item.recommendations && (
                                  <ul className="mt-2 space-y-1">
                                    {item.recommendations.map((r, j) => (
                                      <li key={j} className="text-xs text-gray-600 flex items-start gap-1">
                                        <span className="text-blue-500">•</span>
                                        <span>{r}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Student Study Plan */}
                  {aiAnalysis.studentStudyGuide && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <span>📖</span> {aiAnalysis.studentStudyGuide.title || "Student Study Plan"}
                      </h3>
                      {aiAnalysis.studentStudyGuide.summary && <p className="text-xs text-gray-500 mb-3">{aiAnalysis.studentStudyGuide.summary}</p>}
                      {aiAnalysis.studentStudyGuide.sections && aiAnalysis.studentStudyGuide.sections.length > 0 && (
                        <div className="space-y-2">
                          {aiAnalysis.studentStudyGuide.sections.map((section, i) => (
                            <div key={i} className="border border-gray-200 rounded-lg p-4 bg-white">
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-emerald-100 flex items-center justify-center rounded-full shrink-0 mt-0.5">
                                  <span className="text-xs font-bold text-emerald-700">{i + 1}</span>
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-sm font-bold text-gray-900">{section.focusArea}</h4>
                                  <p className="text-xs text-gray-500 mt-1">{section.whyImportant}</p>
                                  {section.studyTips && section.studyTips.length > 0 && (
                                    <ul className="mt-2 space-y-1">
                                      {section.studyTips.map((tip, j) => (
                                        <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                                          <span className="text-emerald-500 mt-0.5">✓</span>
                                          <span>{tip}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recommended Learning Materials */}
                  {aiAnalysis.learningMaterials && aiAnalysis.learningMaterials.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <span>📚</span> Recommended Learning Materials
                      </h3>
                      <p className="text-xs text-gray-500 mb-3">Share these resources with students to help them strengthen weak areas:</p>
                      <div className="space-y-2">
                        {aiAnalysis.learningMaterials.map((material, i) => (
                          <div
                            key={i}
                            className={`border rounded-lg p-3 ${
                              material.priority === "high" ? "border-blue-200 bg-blue-50/30" : "border-gray-200 bg-white"
                            }`}>
                            <div className="flex items-start gap-3">
                              <span className="text-base shrink-0 mt-0.5">{material.resourceType || "📄"}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-gray-900 truncate">{material.title}</h4>
                                  {material.priority === "high" && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded shrink-0">
                                      Recommended
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {material.topic && <span className="font-medium text-gray-600">[{material.topic}] </span>}
                                  {material.description}
                                </p>
                                {material.url && (
                                  <a
                                    href={material.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                                      />
                                    </svg>
                                    Open resource
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                    <div className="flex items-start gap-2.5">
                      <span className="text-lg shrink-0 mt-0.5">⚠️</span>
                      <div>
                        <p className="text-xs font-semibold text-amber-800">AI-Generated Content Notice</p>
                        <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                          The learning resources, study plans, and recommendations above are generated by an AI assistant and may occasionally contain
                          incorrect or outdated information. Please verify all resources and suggestions before sharing with students to ensure
                          accuracy and appropriateness.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setShowAIModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">
                Close
              </button>
              <button
                onClick={() => {
                  // Copy to clipboard functionality
                  const text = `AI Insights - ${COURSE_LABEL[course]}

Summary:
Total Wrong Answers: ${aiAnalysis?.summary?.totalWrongAnswers}
High Priority Topics: ${aiAnalysis?.priorityTopics?.map((t) => t.topic).join(", ")}

For Lecturer:
${aiAnalysis?.actionItems?.map((a) => `- ${a.title}: ${a.description}`).join("\n")}

For Students - Study Plan:
${aiAnalysis?.studentStudyGuide?.sections?.map((s) => `- ${s.focusArea}: ${s.whyImportant}`).join("\n") || "N/A"}

Learning Materials:
${aiAnalysis?.learningMaterials?.map((m) => `- ${m.resourceType}: ${m.title} (${m.description})`).join("\n") || "N/A"}`;
                  navigator.clipboard.writeText(text).then(() => {
                    alert("Insights copied to clipboard!");
                  });
                }}
                disabled={!aiAnalysis || aiLoading}
                className="px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50">
                Copy Insights
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
