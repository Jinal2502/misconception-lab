import { ArrowLeft, Check, ChevronDown, RotateCcw, X } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { api, formatDate } from "../api.js";
import { LoadingState, Notice, PageFrame, PageTitle } from "../components/AppLayout.jsx";

export default function ResultsPage() {
  const { attemptId } = useParams();
  const location = useLocation();
  const [result, setResult] = useState(location.state?.result ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api(`/api/assessment/${attemptId}/results`)
      .then((data) => { if (active) setResult(data); })
      .catch((caught) => { if (active) setError(caught.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attemptId]);

  const topicsToReview = useMemo(() => {
    if (!result?.results) return [];
    const misses = new Map();
    result.results.filter((item) => !item.isCorrect).forEach((item) => misses.set(item.topic, (misses.get(item.topic) ?? 0) + 1));
    return [...misses.entries()].sort((a, b) => b[1] - a[1]);
  }, [result]);

  if (loading) return <PageFrame><LoadingState>Gathering your debrief…</LoadingState></PageFrame>;
  if (error || !result) return <PageFrame><Notice>{error || "Results are unavailable."}</Notice><Link className="mt-4 inline-flex text-sm text-emerald-200" to="/student"><ArrowLeft size={15} /> Back to assessment</Link></PageFrame>;

  return (
    <PageFrame>
      <PageTitle
        eyebrow="Assessment debrief"
        title="What you understand now."
        description={`Submitted ${formatDate(result.submittedAt)} · A careful look at the reasoning behind each scenario.`}
      >
        <Link to="/student" className="secondary-button"><RotateCcw size={15} /> Return to the lab</Link>
      </PageTitle>

      <section className="results-summary" aria-label="Assessment score">
        <div className="score-ring" style={{ "--score-angle": `${result.percentage * 3.6}deg` }}><strong>{result.score}<span>/10</span></strong></div>
        <div className="min-w-0">
          <p className="app-eyebrow">Your score</p>
          <h2 className="mt-2 text-3xl font-medium tracking-tight">{result.percentage}%</h2>
          <p className="mt-2 text-sm text-white/55">{result.correctCount} clear {result.correctCount === 1 ? "insight" : "insights"} · {result.incorrectCount} {result.incorrectCount === 1 ? "idea" : "ideas"} to revisit</p>
        </div>
        <div className="results-message">
          <p className="text-sm leading-6 text-white/65">
            {result.score === 10
              ? "Every scenario, thoughtfully reasoned through. Keep asking what the evidence really tells you."
              : result.score >= 7
                ? "Strong reasoning across the lab. The questions below show a few ideas worth revisiting."
                : "A useful first pass. Every missed question is a chance to find the assumption that changes the story."}
          </p>
        </div>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="panel p-5 sm:p-6">
          <p className="app-eyebrow">A place to revisit</p>
          <h2 className="mt-2 text-lg font-medium">Ideas worth another look</h2>
          {topicsToReview.length ? (
            <div className="mt-5 space-y-3">
              {topicsToReview.map(([topic, count]) => (
                <div className="topic-review" key={topic}><span>{topic}</span><span>{count} to revisit</span></div>
              ))}
            </div>
          ) : <p className="mt-4 text-sm text-white/50">No missed questions this time. Keep testing your assumptions.</p>}
        </div>
        <div className="panel p-5 sm:p-6">
          <p className="app-eyebrow">The debrief</p>
          <h2 className="mt-2 text-lg font-medium">Correct versus still-in-progress</h2>
          <div className="mt-5 flex items-center gap-4">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-rose-300/20"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${result.percentage}%` }} /></div>
            <span className="text-sm font-medium text-emerald-200">{result.correctCount}<span className="text-white/35"> / {result.total}</span></span>
          </div>
          <p className="mt-3 text-xs text-white/40">Each scenario is worth one point. Your answer and the reasoning are shown below.</p>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4">
          <p className="app-eyebrow">Question by question</p>
          <h2 className="mt-2 text-xl font-medium">Your reasoning, revisited</h2>
        </div>
        <div className="space-y-3">
          {result.results.map((item, index) => (
            <details className={`result-question ${item.isCorrect ? "result-correct" : "result-missed"}`} key={item.questionId}>
              <summary>
                <span className={`result-check ${item.isCorrect ? "is-correct" : "is-missed"}`}>{item.isCorrect ? <Check size={15} /> : <X size={15} />}</span>
                <span className="result-question-title"><small>{String(index + 1).padStart(2, "0")} · {item.topic}</small><strong>{item.prompt}</strong></span>
                <ChevronDown className="result-chevron" size={16} />
              </summary>
              <div className="result-detail">
                <p className="text-sm leading-6 text-white/55">{item.scenario}</p>
                {item.evidence && <pre className="result-evidence"><code>{item.evidence}</code></pre>}
                <div className="mt-4 space-y-2">
                  {item.options.map((option) => {
                    const selected = option.id === item.selectedOptionId;
                    const correct = option.id === item.correctOptionId;
                    return (
                      <div key={option.id} className={`result-option ${correct ? "is-answer" : ""} ${selected && !correct ? "is-selected-wrong" : ""}`}>
                        <span>{option.id.toUpperCase()}</span><p>{option.text}</p>
                        {correct && <small>Correct reasoning</small>}
                        {selected && !correct && <small>Your selection</small>}
                      </div>
                    );
                  })}
                </div>
                <div className="explanation-box mt-4"><strong>Why this holds</strong><p>{item.explanation}</p></div>
                <div className="explanation-box common-wrong mt-3"><strong>The tempting turn</strong><p>{item.commonWrongExplanation}</p></div>
              </div>
            </details>
          ))}
        </div>
      </section>
    </PageFrame>
  );
}
