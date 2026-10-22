import { ArrowLeft, Check, FilePlus2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api.js";
import { LoadingState, Notice, PageFrame, PageTitle } from "../components/AppLayout.jsx";

const emptyQuestion = {
  questionId: "",
  topic: "",
  difficulty: "intermediate",
  scenario: "",
  prompt: "",
  evidenceLabel: "Evidence",
  evidence: "",
  options: [{ id: "a", text: "" }, { id: "b", text: "" }, { id: "c", text: "" }, { id: "d", text: "" }],
  correctOptionId: "a",
  hint: "",
  explanation: "",
  commonWrongOptionId: "b",
  commonWrongExplanation: "",
  active: false,
};

function QuestionEditor({ question, onClose, onSave }) {
  const [form, setForm] = useState(question ?? emptyQuestion);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isNew = !question?._id;

  function update(field, value) {
    setForm((current) => {
      if (field === "correctOptionId" && value === current.commonWrongOptionId) {
        const nextWrongOption = current.options.find((option) => option.id !== value)?.id ?? "b";
        return { ...current, correctOptionId: value, commonWrongOptionId: nextWrongOption };
      }
      return { ...current, [field]: value };
    });
  }
  function updateOption(index, value) {
    setForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => optionIndex === index ? { ...option, text: value } : option),
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave(form, isNew);
      onClose();
    } catch (caught) {
      setError(caught.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="question-editor" role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <div className="question-editor-header">
          <div><p className="app-eyebrow">{isNew ? "New scenario" : "Question editor"}</p><h2 id="editor-title" className="mt-1 text-xl font-medium">{isNew ? "Add a question" : question.topic}</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close editor"><X size={17} /></button>
        </div>
        <form className="editor-form" onSubmit={submit}>
          <div className="question-editor-scroll">
            <section className="editor-section">
              <div className="editor-section-heading"><span>01</span><div><h3>Question basics</h3><p>Give this scenario a clear topic and a stable library ID.</p></div></div>
              <div className="editor-field-grid">
                {isNew && <label className="field-label editor-field-wide">Question ID<input className="field-input" value={form.questionId} required pattern="[a-z0-9-]{3,80}" onChange={(event) => update("questionId", event.target.value)} placeholder="api-retry-scenario" /><small>Use 3–80 lowercase letters, numbers, or hyphens.</small></label>}
                <label className="field-label">Topic<input className="field-input" value={form.topic} required maxLength={100} onChange={(event) => update("topic", event.target.value)} placeholder="HTTP methods & API behavior" /></label>
                <label className="field-label">Difficulty<select className="field-input" value={form.difficulty} onChange={(event) => update("difficulty", event.target.value)}><option value="foundational">Foundational</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
              </div>
            </section>

            <section className="editor-section">
              <div className="editor-section-heading"><span>02</span><div><h3>Set the scene</h3><p>Describe the situation, then ask one focused question.</p></div></div>
              <label className="field-label">Scenario<textarea className="field-input field-textarea" value={form.scenario} required maxLength={3000} onChange={(event) => update("scenario", event.target.value)} rows={3} placeholder="What is happening, and what should the student notice?" /></label>
              <label className="field-label">Question prompt<textarea className="field-input field-textarea" value={form.prompt} required maxLength={1000} onChange={(event) => update("prompt", event.target.value)} rows={2} placeholder="What should the student reason about?" /></label>
            </section>

            <section className="editor-section">
              <div className="editor-section-heading"><span>03</span><div><h3>Evidence or code <span className="editor-optional">Optional</span></h3><p>Add a request, trace, snippet, or other evidence to inspect.</p></div></div>
              <label className="field-label">Evidence label<input className="field-input" value={form.evidenceLabel} maxLength={100} onChange={(event) => update("evidenceLabel", event.target.value)} placeholder="Request trace" /></label>
              <label className="field-label">Evidence<textarea className="field-input field-textarea editor-code-field" value={form.evidence} maxLength={4000} onChange={(event) => update("evidence", event.target.value)} rows={4} placeholder={"Paste a short code sample or evidence here…"} /></label>
            </section>

            <section className="editor-section">
              <div className="editor-section-heading"><span>04</span><div><h3>Answer choices</h3><p>Write four distinct hypotheses, then choose the expected reasoning.</p></div></div>
              <fieldset className="editor-options-grid">
                <legend className="sr-only">Four answer choices</legend>
                {form.options.map((option, index) => (
                  <label className="editor-option-card" key={option.id}>
                    <span className="editor-option-heading"><span className="answer-letter">{option.id.toUpperCase()}</span> Choice {index + 1}</span>
                    <textarea className="field-input field-textarea" value={option.text} required maxLength={500} onChange={(event) => updateOption(index, event.target.value)} rows={3} placeholder={`Write choice ${option.id.toUpperCase()}…`} />
                  </label>
                ))}
              </fieldset>
              <div className="editor-field-grid editor-answer-selects">
                <label className="field-label">Expected reasoning<select className="field-input" value={form.correctOptionId} onChange={(event) => update("correctOptionId", event.target.value)}>{form.options.map((option) => <option key={option.id} value={option.id}>{option.id.toUpperCase()} — Choice {option.id.toUpperCase()}</option>)}</select></label>
                <label className="field-label">Common misconception<select className="field-input" value={form.commonWrongOptionId} onChange={(event) => update("commonWrongOptionId", event.target.value)}>{form.options.filter((option) => option.id !== form.correctOptionId).map((option) => <option key={option.id} value={option.id}>{option.id.toUpperCase()} — Choice {option.id.toUpperCase()}</option>)}</select></label>
              </div>
            </section>

            <section className="editor-section">
              <div className="editor-section-heading"><span>05</span><div><h3>Learning feedback</h3><p>Help students understand the idea, not just memorize a choice.</p></div></div>
              <label className="field-label">Hint<textarea className="field-input field-textarea" value={form.hint} required maxLength={500} onChange={(event) => update("hint", event.target.value)} rows={2} placeholder="Nudge the student toward the evidence." /></label>
              <label className="field-label">Why the expected reasoning works<textarea className="field-input field-textarea" value={form.explanation} required maxLength={1200} onChange={(event) => update("explanation", event.target.value)} rows={3} placeholder="Explain the underlying concept." /></label>
              <label className="field-label">Why the tempting misconception fails<textarea className="field-input field-textarea" value={form.commonWrongExplanation} required maxLength={800} onChange={(event) => update("commonWrongExplanation", event.target.value)} rows={2} placeholder="Address the misconception respectfully." /></label>
            </section>

            <label className="editor-publish-toggle"><input type="checkbox" checked={form.active} onChange={(event) => update("active", event.target.checked)} /><span><strong>Publish this question</strong><small>Available in the question library. The current assessment remains versioned.</small></span></label>
            <Notice>{error}</Notice>
          </div>
          <div className="question-editor-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving…" : isNew ? "Create question" : "Save changes"} <Check size={15} /></button></div>
        </form>
      </section>
    </div>
  );
}

export default function QuestionManager() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState(null);
  const [filter, setFilter] = useState("");

  async function refresh() {
    const { questions: next } = await api("/api/teacher/questions");
    setQuestions(next);
  }

  useEffect(() => {
    refresh().catch((caught) => setError(caught.message)).finally(() => setLoading(false));
  }, []);

  async function saveQuestion(form, isNew) {
    const body = { ...form };
    const questionId = body.questionId;
    delete body._id;
    delete body.__v;
    delete body.createdAt;
    delete body.updatedAt;
    delete body.questionId;
    if (isNew) {
      await api("/api/teacher/questions", { method: "POST", body: { ...body, questionId } });
    } else {
      await api(`/api/teacher/questions/${encodeURIComponent(questionId)}`, { method: "PUT", body });
    }
    await refresh();
  }

  async function setPublished(question, active) {
    setError("");
    try {
      await api(`/api/teacher/questions/${encodeURIComponent(question.questionId)}`, { method: "PUT", body: { active } });
      await refresh();
    } catch (caught) { setError(caught.message); }
  }

  async function archive(question) {
    if (!window.confirm(`Unpublish “${question.topic}”? It will remain available in historical attempts.`)) return;
    setError("");
    try {
      await api(`/api/teacher/questions/${encodeURIComponent(question.questionId)}`, { method: "DELETE" });
      await refresh();
    } catch (caught) { setError(caught.message); }
  }

  const visibleQuestions = questions.filter((question) =>
    `${question.topic} ${question.questionId} ${question.prompt}`.toLowerCase().includes(filter.toLowerCase()),
  );

  if (loading) return <PageFrame active="questions"><LoadingState>Loading the question library…</LoadingState></PageFrame>;
  return (
    <PageFrame active="questions">
      <PageTitle eyebrow="Teacher workspace · Question library" title="Shape the scenarios." description="Edit and publish questions. Unpublishing preserves historical attempt records." >
        <button type="button" className="primary-button" onClick={() => setEditor({ ...emptyQuestion })}><Plus size={16} /> New question</button>
      </PageTitle>
      <p className="mb-4 text-xs leading-5 text-white/40">The current student assessment is versioned to its original 10 scenarios. New questions are stored in the library for future assessment versions and do not change an in-progress assessment.</p>
      <Notice>{error}</Notice>
      <div className="panel overflow-hidden">
        <div className="question-manager-top">
          <div><h2 className="font-medium">Question bank</h2><p className="mt-1 text-xs text-white/40">{questions.length} stored · {questions.filter((q) => q.active).length} published</p></div>
          <label className="search-field"><Search size={15} /><span className="sr-only">Filter questions</span><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter questions" /></label>
        </div>
        {visibleQuestions.length ? visibleQuestions.map((question, index) => (
          <article className="question-admin-row" key={question._id}>
            <span className="question-admin-index">{String(index + 1).padStart(2, "0")}</span>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="topic-pill">{question.topic}</span><span className={`publish-state ${question.active ? "published" : ""}`}>{question.active ? "Published" : "Unpublished"}</span></div><h3 className="mt-2 truncate text-sm font-medium">{question.prompt}</h3><p className="mt-1 text-xs text-white/35">{question.questionId} · {question.difficulty}</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="icon-button" onClick={() => setEditor({ ...question })} aria-label={`Edit ${question.topic}`}><Pencil size={15} /></button>
              <button type="button" className="secondary-button compact" onClick={() => setPublished(question, !question.active)}>{question.active ? <X size={14} /> : <Check size={14} />}{question.active ? "Unpublish" : "Publish"}</button>
              <button type="button" className="icon-button destructive" onClick={() => archive(question)} aria-label={`Unpublish ${question.topic}`} title="Unpublish"><Trash2 size={15} /></button>
            </div>
          </article>
        )) : <div className="empty-state"><FilePlus2 size={19} /><p>No matching questions.</p><span>Adjust the search or add a new scenario.</span></div>}
      </div>
      {editor && <QuestionEditor question={editor._id ? editor : null} onClose={() => setEditor(null)} onSave={saveQuestion} />}
    </PageFrame>
  );
}
