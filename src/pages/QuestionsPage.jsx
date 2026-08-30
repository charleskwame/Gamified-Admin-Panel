import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { QuestionSkeleton, Skeleton } from "../components/Skeleton";
import { sanitizeObject, validateCourseAccess, auditLog } from "../utils/security";

const COURSE_COLLECTION = {
  computer_architecture: "computer_architecture_questions",
  computer_networking: "computer_networking_questions",
  software_engineering: "software_engineering_questions",
};
const COURSE_LABEL = {
  computer_architecture: "Computer Architecture",
  computer_networking: "Computer Networking",
  software_engineering: "Software Engineering",
};

// Render the text for an option in either supported shape:
//   - DB schema: q.options = ["a) ...", "b) ...", "c) ...", "d) ..."]
//   - Older/legacy shape: q.optionA .. q.optionD
// A leading letter prefix (e.g. "b)", "A.", "c:") is stripped so chips
// display cleanly next to the A/B/C/D badge.
const OPTION_LETTERS = ["A", "B", "C", "D"];
function optionText(q, letter) {
  if (Array.isArray(q.options)) {
    const idx = OPTION_LETTERS.indexOf(letter.toUpperCase());
    const raw = q.options[idx];
    if (raw == null) return "";
    return raw.replace(/^\s*[a-dA-D][.)\]:-]?\s*/, "").trim();
  }
  return q[`option${letter.toUpperCase()}`] || "";
}

export default function QuestionsPage() {
  const { user, userData } = useAuth();
  const course = userData?.course;
  const collectionName = COURSE_COLLECTION[course];
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(questions.length / pageSize));
  const paginatedQuestions = questions.slice((page - 1) * pageSize, page * pageSize);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "",
    explanation: "",
  });

  const fetchQuestions = async () => {
    if (!collectionName) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, collectionName));
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      all.sort((a, b) => {
        const aDate = a.createdAt?.toMillis?.() || a.createdAt || 0;
        const bDate = b.createdAt?.toMillis?.() || b.createdAt || 0;
        return bDate - aDate;
      });
      setQuestions(all);
    } catch (err) {
      console.error("Error fetching questions:", err);
      setError("Failed to load questions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [collectionName]);

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      questionText: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "",
      explanation: "",
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    const { questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation } = form;
    if (!questionText.trim()) return setError("Question text is required.");
    if (!optionA.trim()) return setError("Option A is required.");
    if (!optionB.trim()) return setError("Option B is required.");
    if (!optionC.trim()) return setError("Option C is required.");
    if (!optionD.trim()) return setError("Option D is required.");
    if (!correctAnswer) return setError("Please select the correct answer.");
    if (!explanation.trim()) return setError("Explanation is required.");

    if (!collectionName) return setError("No course selected. Please set your course in settings.");

    setSaving(true);
    try {
      const payload = sanitizeObject({
        questionText: questionText.trim(),
        options: [`a) ${optionA.trim()}`, `b) ${optionB.trim()}`, `c) ${optionC.trim()}`, `d) ${optionD.trim()}`],
        correctAnswer: correctAnswer.toLowerCase(),
        category: COURSE_LABEL[course],
        explanation: explanation.trim(),
        createdBy: user?.uid || "unknown",
        createdAt: serverTimestamp(),
        course,
      });

      await addDoc(collection(db, collectionName), payload);

      auditLog("question_added", { course, questionText: questionText.trim().slice(0, 50) });

      setSuccess("Question added successfully!");
      resetForm();
      setShowForm(false);
      fetchQuestions();
    } catch (err) {
      console.error("Error adding question:", err);
      setError("Failed to add question. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (questionId) => {
    if (!collectionName) return;
    setSaving(true);
    setError("");
    try {
      await deleteDoc(doc(db, collectionName, questionId));

      auditLog("question_deleted", { course, questionId });

      setDeleteConfirm(null);
      setSuccess("Question deleted successfully!");
      fetchQuestions();
    } catch (err) {
      console.error("Error deleting question:", err);
      setError("Failed to delete question. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!course || !collectionName) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-surface border border-border p-12 rounded-xl text-center">
          <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mx-auto mb-4 rounded-full">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-1">No Course Selected</h2>
          <p className="text-sm text-text-secondary">Please set your course in settings to manage questions.</p>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full px-4 py-2.5 border border-border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all rounded-lg";
  const labelClass = "block text-sm font-semibold text-text-primary mb-1.5";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">Questions</h1>
          <p className="text-sm text-text-secondary mt-0.5">Managing questions for {COURSE_LABEL[course] || course}</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-4 py-2 bg-primary text-white font-semibold hover:bg-primary-dark transition-all text-sm rounded-lg shrink-0">
            + Add Question
          </button>
        )}
      </div>

      {/* Success / Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 px-4 py-3 rounded-lg flex items-center gap-2">
          <svg className="w-4 h-4 text-green-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-medium text-green-700">{success}</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg flex items-center gap-2">
          <svg className="w-4 h-4 text-red-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* Add Question Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface border border-border p-6 rounded-xl space-y-5">
          <h2 className="text-base font-bold text-text-primary">New Question</h2>

          <div>
            <label className={labelClass}>Question Text</label>
            <textarea
              value={form.questionText}
              onChange={(e) => handleInputChange("questionText", e.target.value)}
              rows={3}
              placeholder="Enter the question..."
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Option A</label>
              <input
                type="text"
                value={form.optionA}
                onChange={(e) => handleInputChange("optionA", e.target.value)}
                placeholder="Option A"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Option B</label>
              <input
                type="text"
                value={form.optionB}
                onChange={(e) => handleInputChange("optionB", e.target.value)}
                placeholder="Option B"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Option C</label>
              <input
                type="text"
                value={form.optionC}
                onChange={(e) => handleInputChange("optionC", e.target.value)}
                placeholder="Option C"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Option D</label>
              <input
                type="text"
                value={form.optionD}
                onChange={(e) => handleInputChange("optionD", e.target.value)}
                placeholder="Option D"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Correct Answer</label>
              <select
                value={form.correctAnswer}
                onChange={(e) => handleInputChange("correctAnswer", e.target.value)}
                className={`${inputClass} bg-surface`}>
                <option value="">Select correct answer</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Explanation</label>
            <textarea
              value={form.explanation}
              onChange={(e) => handleInputChange("explanation", e.target.value)}
              rows={2}
              placeholder="Explain why this answer is correct..."
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-primary text-white font-bold hover:bg-primary-dark disabled:opacity-50 transition-all text-sm rounded-lg">
              {saving ? "Saving..." : "Save Question"}
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="px-5 py-2 border border-border text-sm font-semibold text-text-primary hover:bg-bg-base transition-all rounded-lg">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Questions List */}
      {loading ? (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border-light">
            <Skeleton className="w-32 h-5" />
          </div>
          <div className="divide-y divide-border-light">
            {Array.from({ length: 4 }).map((_, i) => (
              <QuestionSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-surface border border-border p-12 rounded-xl text-center">
          <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mx-auto mb-4 rounded-full">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-1">No Questions Yet</h2>
          <p className="text-sm text-text-secondary">Add your first question to get started.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
            <h2 className="text-base font-bold text-text-primary">All Questions ({questions.length})</h2>
          </div>
          <div className="divide-y divide-border-light">
            {paginatedQuestions.map((q, idx) => (
              <div key={q.id} className="px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary mb-2">
                      <span className="text-text-muted mr-1">{(page - 1) * pageSize + idx + 1}.</span>
                      {q.questionText}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {OPTION_LETTERS.map((opt) => (
                        <span
                          key={opt}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
                            (q.correctAnswer || "").toLowerCase() === opt.toLowerCase()
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-gray-50 text-text-secondary border border-border"
                          }`}>
                          {opt}: {optionText(q, opt) || ""}
                        </span>
                      ))}
                    </div>
                    {q.explanation && (
                      <p className="text-xs text-text-muted mt-1">
                        <span className="font-semibold text-text-secondary">Explanation:</span> {q.explanation}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setDeleteConfirm(deleteConfirm === q.id ? null : q.id)}
                    className="shrink-0 p-1.5 text-text-muted hover:text-red-500 transition-colors rounded-md hover:bg-red-50"
                    title="Delete question">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
                {deleteConfirm === q.id && (
                  <div className="mt-3 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs font-medium text-red-700 flex-1">Delete this question? This action cannot be undone.</p>
                    <button
                      onClick={() => handleDelete(q.id)}
                      disabled={saving}
                      className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50 transition-all rounded-md">
                      {saving ? "Deleting..." : "Delete"}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1.5 border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 transition-all rounded-md">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-border-light">
              <p className="text-xs text-text-muted">
                Page {page} of {pageCount}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-xs font-semibold text-text-primary hover:bg-bg-base disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-md">
                  Previous
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === pageCount || (p >= page - 1 && p <= page + 1))
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && arr[i - 1] !== p - 1) {
                      acc.push(
                        <span key={`ellipsis-${p}`} className="w-7 h-7 flex items-center justify-center text-xs text-text-muted">
                          ...
                        </span>
                      );
                    }
                    acc.push(
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-7 h-7 text-xs font-semibold rounded-md transition-all ${
                          p === page ? "bg-primary text-white" : "text-text-muted hover:bg-bg-base"
                        }`}>
                        {p}
                      </button>
                    );
                    return acc;
                  }, [])}
                <button
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={page === pageCount}
                  className="px-3 py-1 text-xs font-semibold text-text-primary hover:bg-bg-base disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-md">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
