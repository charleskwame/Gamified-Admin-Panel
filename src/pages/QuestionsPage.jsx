import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

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
    questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "", explanation: "",
  });

  const fetchQuestions = async () => {
    if (!collectionName) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, collectionName));
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      all.sort((a, b) => {
        const ta = a.createdAt?.toDate?.()?.getTime?.() ?? 0;
        const tb = b.createdAt?.toDate?.()?.getTime?.() ?? 0;
        return tb - ta;
      });
      setQuestions(all);
    } catch (err) { setError("Failed to load questions."); }
    setLoading(false);
  };
  useEffect(() => { fetchQuestions(); setPage(1); }, [course]);

  const handleAdd = async (e) => {
    e.preventDefault(); setError(""); setSuccess("");
    if (!form.questionText.trim()) { setError("Question text is required."); return; }
    const opts = [form.optionA.trim(), form.optionB.trim(), form.optionC.trim(), form.optionD.trim()];
    if (opts.some((o) => !o)) { setError("All four options are required."); return; }
    if (!form.correctAnswer.trim()) { setError("Correct answer is required."); return; }
    if (!opts.includes(form.correctAnswer.trim())) { setError("Correct answer must match one option."); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, collectionName), {
        questionText: form.questionText.trim(), options: opts,
        correctAnswer: form.correctAnswer.trim(), explanation: form.explanation.trim(),
        category: COURSE_LABEL[course], addedBy: user.uid, createdAt: serverTimestamp(),
      });
      setSuccess("Question added!");
      setForm({ questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "", explanation: "" });
      setShowForm(false); fetchQuestions();
    } catch (err) { setError("Failed to add."); }
    setSaving(false);
  };

  const handleDelete = async (qid) => {
    setError(""); setSuccess("");
    try {
      await deleteDoc(doc(db, collectionName, qid));
      setSuccess("Question deleted.");
      setDeleteConfirm(null);
      setQuestions((prev) => prev.filter((q) => q.id !== qid));
    } catch (err) { setError("Failed to delete."); }
  };

  if (!course || !collectionName) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-extrabold text-gray-900">Questions</h1>
        <p className="text-sm text-gray-500 mt-2">No course selected in your profile.</p>
      </div>
    );
  }

  const paginationBar = pageCount > 1 ? (
    <div className="flex items-center justify-between px-6 py-3 text-sm">
      <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
        className="px-3 py-1 border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-default">Previous</button>
      <span className="text-xs text-gray-400">Page {page} of {pageCount}</span>
      <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount}
        className="px-3 py-1 border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-default">Next</button>
    </div>
  ) : null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Questions</h1>
          <p className="text-sm text-gray-500 mt-0.5">{COURSE_LABEL[course]} &bull; {questions.length} question{questions.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setError(""); setSuccess(""); }}
          className="px-4 py-2 bg-[#111C4A] text-white text-sm font-bold hover:bg-[#1a2a6e] whitespace-nowrap">
          {showForm ? "Cancel" : "+ Add Question"}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 px-4 py-3"><p className="text-sm font-medium text-red-700">{error}</p></div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 px-4 py-3"><p className="text-sm font-medium text-emerald-700">{success}</p></div>}

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white border border-gray-200 p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-800">New Question</h2>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Question Text</label>
            <textarea value={form.questionText} onChange={(e) => setForm({ ...form, questionText: e.target.value })}
              rows={2} placeholder="Enter the question..."
              className="w-full px-3 py-2 border border-gray-300 text-sm outline-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {["A", "B", "C", "D"].map((l) => (
              <div key={l}>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Option {l}</label>
                <input value={form[`option${l}`]} onChange={(e) => setForm({ ...form, [`option${l}`]: e.target.value })}
                  placeholder={`Option ${l}`}
                  className="w-full px-3 py-2 border border-gray-300 text-sm outline-none" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Correct Answer</label>
              <input value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                placeholder="Must match one option"
                className="w-full px-3 py-2 border border-gray-300 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Explanation</label>
              <input value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                placeholder="Why is this correct?"
                className="w-full px-3 py-2 border border-gray-300 text-sm outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-6 py-2 bg-[#111C4A] text-white text-sm font-bold hover:bg-[#1a2a6e] disabled:opacity-50">
              {saving ? "Saving..." : "Save Question"}
            </button>
          </div>
        </form>
      )}

      {/* Delete modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 w-full max-w-sm mx-4 border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 mb-2">Delete Question?</h3>
            <p className="text-sm text-gray-500 mb-1">This will permanently remove this question.</p>
            <p className="text-xs text-gray-400 mb-5 line-clamp-2">{deleteConfirm.text}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => { handleDelete(deleteConfirm.id); }}
                className="px-4 py-2 bg-red-600 text-white text-sm font-bold hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <LoadingSpinner text="Loading questions..." /> : (
        <div className="bg-white border border-gray-200 overflow-hidden">
          {questions.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">No questions in this course yet.</div>
          ) : (
            <>
              {paginationBar}
            <div className="divide-y divide-gray-100">
              {paginatedQuestions.map((q) => (
                <div key={q.id} className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-gray-900 leading-relaxed">{q.questionText}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {q.options?.map((opt, i) => (
                          <span key={i}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium border ${
                              opt === q.correctAnswer || opt.startsWith(q.correctAnswer + ")")
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : "bg-gray-50 text-gray-600 border-gray-200"
                            }`}>
                            {(opt === q.correctAnswer || opt.startsWith(q.correctAnswer + ")")) && (
                              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            )}
                            {opt}
                          </span>
                        ))}
                      </div>
                      {q.explanation && <p className="mt-2 text-sm text-gray-400 italic">{q.explanation}</p>}
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                        {q.addedBy && <span>Added by lecturer</span>}
                        {q.addedBy === user?.uid && <span className="text-[#111C4A] font-semibold">(you)</span>}
                        {q.createdAt?.toDate && <span>{q.createdAt.toDate().toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="shrink-0 pt-0.5">
                      <button onClick={() => { setDeleteConfirm({ id: q.id, text: q.questionText }); }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                        title="Delete question">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {paginationBar}
            </>
          )}
        </div>
      )}
    </div>
  );
}