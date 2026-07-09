import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Skeleton } from "../components/Skeleton";
import { LightBulbIcon } from "../components/Icons";
import { validateCourseAccess } from "../utils/security";

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
    </div>
  );
}
