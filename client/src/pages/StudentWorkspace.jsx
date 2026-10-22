import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, CircleHelp, FlaskConical, Lightbulb, MessageCircle, Send, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { LoadingState, Notice, PageFrame } from "../components/AppLayout.jsx";
import SageDrawer from "../components/SageDrawer.jsx";

function EvidenceBlock({ question }) {
  if (!question.evidence) return null;
  return (
    <figure className="evidence-block">
      <figcaption>{question.evidenceLabel}</figcaption>
      <pre><code>{question.evidence}</code></pre>
    </figure>
  );
}

function SubmissionReview({ questions, answers, busy, onClose, onSubmit }) {
  const unanswered = questions.filter((question) => !answers[question.questionId]);
  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-title">
        <div className="flex items-start justify-between gap-4">
          <div><p className="app-eyebrow">Final review</p><h2 id="review-title" className="mt-2 text-2xl font-medium tracking-tight">Ready to submit?</h2></div>
          <button autoFocus type="button" className="icon-button" onClick={onClose} aria-label="Close review"><span aria-hidden="true">×</span></button>
        </div>
        <p className="mt-3 text-sm leading-6 text-white/55">
          Your saved answers will be graded once. After submission, you can review the reasoning behind each answer.
        </p>
        <div className={`review-summary mt-5 ${unanswered.length ? "incomplete" : "complete"}`}>
          <span className="text-sm font-medium">{questions.length - unanswered.length} of {questions.length} answered</span>
          {unanswered.length > 0 && <span className="text-xs text-amber-200">{unanswered.length} still need an answer</span>}
        </div>
        <div className="review-grid mt-4" aria-label="Answer overview">
          {questions.map((question, index) => (
            <div key={question.questionId} className={`review-item ${answers[question.questionId] ? "answered" : "unanswered"}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span>{answers[question.questionId] ? "Saved" : "Open"}</span>
            </div>
          ))}
        </div>
        {unanswered.length > 0 && <p className="mt-4 text-xs leading-5 text-amber-100/75">Complete every question before submitting. Your answers remain saved while you go back.</p>}
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="secondary-button" onClick={onClose}>Keep thinking</button>
          <button type="button" className="primary-button justify-center disabled:opacity-45" disabled={busy || unanswered.length > 0} onClick={onSubmit}>
            {busy ? "Submitting…" : "Submit assessment"} <Send size={15} />
          </button>
        </div>
      </section>
    </div>
  );
}

export default function StudentWorkspace() {
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState("");
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState(() => new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [sageOpen, setSageOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const sageTriggerRef = useRef(null);
  const navigate = useNavigate();
  const closeSage = useCallback(() => {
    setSageOpen(false);
    requestAnimationFrame(() => sageTriggerRef.current?.focus());
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(new DOMException("The assessment request timed out.", "TimeoutError")),
      20000,
    );
    setLoading(true);
    setError("");
    api("/api/assessment/start", { method: "POST", body: {}, signal: controller.signal })
      .then((attempt) => {
        if (!active) return;
        setQuestions(attempt.questions);
        setAttemptId(attempt.attemptId);
        setAnswers(Object.fromEntries(attempt.answers.map(({ questionId, optionId }) => [questionId, optionId])));
      })
      .catch((caught) => {
        if (!active) return;
        setError(caught.name === "TimeoutError"
          ? "The assessment request timed out. Check your connection and try again."
          : caught.message);
      })
      .finally(() => {
        clearTimeout(timeout);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [loadAttempt]);

  const question = questions[currentIndex];
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const isRevealed = question ? revealed.has(question.questionId) : false;

  const goTo = useCallback((nextIndex) => {
    if (nextIndex < 0 || nextIndex >= questions.length) return;
    setCurrentIndex(nextIndex);
    setHintVisible(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [questions.length]);

  async function chooseAnswer(optionId) {
    if (!question || saving) return;
    setSaving(true);
    setError("");
    try {
      await api(`/api/assessment/${attemptId}/answers`, {
        method: "PUT",
        body: { questionId: question.questionId, optionId },
      });
      setAnswers((current) => ({ ...current, [question.questionId]: optionId }));
    } catch (caught) {
      setError(caught.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitAssessment() {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await api(`/api/assessment/${attemptId}/submit`, { method: "POST", body: {} });
      setShowReview(false);
      navigate(`/student/results/${result.attemptId}`, { state: { result } });
    } catch (caught) {
      setError(caught.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageFrame><LoadingState>Preparing your assessment…</LoadingState></PageFrame>;
  if (error && !questions.length) {
    return (
      <PageFrame>
        <Notice>{error}</Notice>
        <button
          type="button"
          className="secondary-button mt-4"
          onClick={() => setLoadAttempt((attempt) => attempt + 1)}
        >
          Try loading the assessment again
        </button>
      </PageFrame>
    );
  }
  if (!question) return <PageFrame><LoadingState>No assessment questions are available.</LoadingState></PageFrame>;

  return (
    <PageFrame>
      <div className="assessment-heading">
        <div>
          <p className="app-eyebrow"><FlaskConical size={14} /> Full-stack development · Assessment</p>
          <h1 className="mt-2 text-2xl font-medium tracking-[-0.04em] sm:text-3xl">Find the idea hiding in the bug.</h1>
          <p className="mt-2 text-sm text-white/45">Ten scenarios. No clock. Take the time you need.</p>
        </div>
        <div className="assessment-progress-card">
          <span className="text-xs text-white/45">Progress</span>
          <strong>{answeredCount}<span> / 10</span></strong>
          <div className="progress-track"><span style={{ width: `${answeredCount * 10}%` }} /></div>
        </div>
      </div>

      <div className="assessment-layout mt-8">
        <aside className="question-rail" aria-label="Question navigation">
          <div className="rail-label">Your path <span>{answeredCount} saved</span></div>
          <div className="rail-items">
            {questions.map((item, index) => (
              <button
                type="button"
                key={item.questionId}
                className={`rail-item ${index === currentIndex ? "current" : ""} ${answers[item.questionId] ? "done" : ""}`}
                onClick={() => goTo(index)}
                aria-current={index === currentIndex ? "step" : undefined}
                aria-label={`Question ${index + 1}${answers[item.questionId] ? ", answered" : ", unanswered"}`}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span>{answers[item.questionId] ? <Check size={14} /> : <span className="rail-unanswered" />}</span>
              </button>
            ))}
          </div>
          <div className="rail-note"><Sparkles size={14} /><span>Understanding is built one question at a time.</span></div>
        </aside>

        <section className="question-scene" aria-labelledby="question-title">
          <div className="question-topline">
            <span className="question-count">QUESTION {String(currentIndex + 1).padStart(2, "0")} <span>/ 10</span></span>
            <span className="difficulty-label">{question.difficulty}</span>
          </div>
          <div className="topic-pill">{question.topic}</div>
          <h2 id="question-title" className="mt-4 text-xl font-medium leading-snug tracking-[-0.03em] text-white sm:text-2xl">{question.prompt}</h2>
          <p className="scenario-copy">{question.scenario}</p>
          <EvidenceBlock question={question} />

          {!isRevealed ? (
            <div className="reveal-panel">
              <span className="reveal-icon"><CircleHelp size={18} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">What do you think is happening?</p>
                <p className="mt-1 text-xs leading-5 text-white/45">Pause on the evidence before you inspect the hypotheses.</p>
              </div>
              <button type="button" className="secondary-button shrink-0" onClick={() => setRevealed((current) => new Set(current).add(question.questionId))}>Inspect hypotheses <ArrowRight size={14} /></button>
            </div>
          ) : (
            <fieldset className="mt-6" disabled={saving}>
              <legend className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-white/45">Choose the reasoning you trust</legend>
              <div className="space-y-2.5">
                {question.options.map((option) => {
                  const selected = answers[question.questionId] === option.id;
                  return (
                    <button
                      type="button"
                      key={option.id}
                      onClick={() => chooseAnswer(option.id)}
                      className={`answer-option ${selected ? "selected" : ""}`}
                      aria-pressed={selected}
                    >
                      <span className="answer-letter">{option.id.toUpperCase()}</span>
                      <span>{option.text}</span>
                      {selected && <Check className="ml-auto shrink-0 text-emerald-300" size={17} />}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 min-h-4 text-xs text-emerald-200/70" role="status">{saving ? "Saving your choice…" : answers[question.questionId] ? "Answer saved. You can change it before you submit." : ""}</p>
            </fieldset>
          )}

          <div className="question-tools">
            <button type="button" className="text-action" onClick={() => setHintVisible((visible) => !visible)} aria-expanded={hintVisible}>
              <Lightbulb size={15} /> {hintVisible ? "Hide hint" : "Show a small hint"}
            </button>
            <button ref={sageTriggerRef} type="button" className="text-action sage-trigger" onClick={() => setSageOpen(true)} aria-haspopup="dialog">
              <MessageCircle size={15} /> Think with SAGE
            </button>
          </div>
          {hintVisible && <div className="hint-panel"><Lightbulb size={15} /><p>{question.hint}</p></div>}
          <Notice>{error && questions.length ? error : ""}</Notice>

          <div className="question-navigation">
            <button type="button" className="secondary-button" disabled={currentIndex === 0} onClick={() => goTo(currentIndex - 1)}><ChevronLeft size={16} /> Previous</button>
            <span className="text-xs text-white/35">{answers[question.questionId] ? "Answer saved" : "No answer saved yet"}</span>
            {currentIndex < questions.length - 1 ? (
              <button type="button" className="secondary-button" onClick={() => goTo(currentIndex + 1)}>Next <ChevronRight size={16} /></button>
            ) : (
              <button type="button" className="primary-button" onClick={() => setShowReview(true)}>Review & submit <ArrowRight size={15} /></button>
            )}
          </div>
          {currentIndex < questions.length - 1 && (
            <div className="mt-5 flex justify-end">
              <button type="button" className="text-action text-white/45" onClick={() => setShowReview(true)}>Review all answers <ArrowRight size={14} /></button>
            </div>
          )}
        </section>
      </div>
      {showReview && <SubmissionReview questions={questions} answers={answers} busy={submitting} onClose={() => setShowReview(false)} onSubmit={submitAssessment} />}
      {sageOpen && <SageDrawer attemptId={attemptId} question={question} onClose={closeSage} />}
    </PageFrame>
  );
}
