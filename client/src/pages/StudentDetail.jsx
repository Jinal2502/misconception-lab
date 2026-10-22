import { ArrowLeft, Check, ChevronDown, Clock3, ClipboardCheck, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, formatDate } from "../api.js";
import { LoadingState, Notice, PageFrame, PageTitle } from "../components/AppLayout.jsx";

function QuestionReview({ result }) {
  return (
    <div className="teacher-question-list">
      {result.results.map((item, index) => (
        <details className={`teacher-question ${item.isCorrect ? "is-correct" : "is-incorrect"}`} key={item.questionId}>
          <summary>
            <span className={`result-check ${item.isCorrect ? "is-correct" : "is-missed"}`}>
              {item.isCorrect ? <Check size={14} /> : <X size={14} />}
            </span>
            <span className="teacher-question-summary">
              <small>QUESTION {String(index + 1).padStart(2, "0")} <span>· {item.topic}</span></small>
              <strong>{item.prompt}</strong>
              <span className="teacher-question-outcome">{item.isCorrect ? "Understood" : "Needs another look"}</span>
            </span>
            <ChevronDown className="result-chevron" size={16} />
          </summary>
          <div className="teacher-question-body">
            <p className="teacher-scenario">{item.scenario}</p>
            {item.evidence && (
              <div className="teacher-evidence">
                <span>{item.evidenceLabel || "Evidence"}</span>
                <pre>{item.evidence}</pre>
              </div>
            )}
            <div className="teacher-options" aria-label="Answer choices">
              {item.options.map((option) => {
                const correct = option.id === item.correctOptionId;
                const selected = option.id === item.selectedOptionId;
                return (
                  <div
                    className={`result-option ${correct ? "is-answer" : ""} ${selected && !correct ? "is-selected-wrong" : ""}`}
                    key={option.id}
                  >
                    <span>{option.id.toUpperCase()}</span>
                    <p>{option.text}</p>
                    <small>{correct ? "Expected reasoning" : selected ? "Student selected" : ""}</small>
                  </div>
                );
              })}
            </div>
            <div className="explanation-box mt-4">
              <strong>Reasoning</strong>
              <p>{item.explanation}</p>
            </div>
            {item.commonWrongExplanation && (
              <div className="explanation-box common-wrong mt-3">
                <strong>A common misconception</strong>
                <p>{item.commonWrongExplanation}</p>
              </div>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}

function InProgressReview({ attempt }) {
  return (
    <div className="teacher-question-list">
      <div className="teacher-progress-note">
        <Clock3 size={15} />
        <span>{attempt.answeredCount} of {attempt.total} answers saved. Correct answers are not shown before submission.</span>
      </div>
      {attempt.questions?.map((question, index) => (
        <article className="teacher-open-question" key={question.questionId}>
          <div className="teacher-open-question-top">
            <span>QUESTION {String(index + 1).padStart(2, "0")} · {question.topic}</span>
            <span className={question.selectedOptionId ? "saved-answer" : "empty-answer"}>
              {question.selectedOptionId ? `Saved · ${question.selectedOptionId.toUpperCase()}` : "Not answered"}
            </span>
          </div>
          <p>{question.prompt}</p>
          {question.selectedOptionText && <div className="teacher-selected-answer">{question.selectedOptionText}</div>}
        </article>
      ))}
    </div>
  );
}

export default function StudentDetail() {
  const { studentId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api(`/api/teacher/students/${studentId}`)
      .then((result) => { if (active) setData(result); })
      .catch((caught) => { if (active) setError(caught.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [studentId]);

  if (loading) return <PageFrame active="teacher"><LoadingState>Loading student history…</LoadingState></PageFrame>;
  if (error || !data) {
    return (
      <PageFrame active="teacher">
        <Notice>{error || "Student not found."}</Notice>
        <Link to="/teacher" className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-200">
          <ArrowLeft size={15} /> Back to overview
        </Link>
      </PageFrame>
    );
  }

  const completed = data.attempts.filter((attempt) => attempt.status === "completed");
  const average = completed.length ? completed.reduce((sum, attempt) => sum + attempt.score, 0) / completed.length : null;
  const activeAttempts = data.attempts.filter((attempt) => attempt.status === "in_progress");

  return (
    <PageFrame active="teacher">
      <Link to="/teacher" className="back-link"><ArrowLeft size={15} /> Class overview</Link>
      <PageTitle
        eyebrow="Student record"
        title={data.student.name}
        description={`${data.student.email} · Joined ${formatDate(data.student.registeredAt)}`}
      />

      <section className="student-detail-stats" aria-label="Student assessment summary">
        <article className="student-detail-stat">
          <span className="student-detail-stat-icon"><ClipboardCheck size={17} /></span>
          <div><span>Completed</span><strong>{completed.length}</strong><small>{data.attempts.length} total attempts</small></div>
        </article>
        <article className="student-detail-stat">
          <span className="student-detail-stat-icon"><Check size={17} /></span>
          <div><span>Average score</span><strong>{average == null ? "—" : `${average.toFixed(2)} / 10`}</strong><small>{average == null ? "No submitted results yet" : "Across submitted attempts"}</small></div>
        </article>
        <article className="student-detail-stat">
          <span className="student-detail-stat-icon"><Clock3 size={17} /></span>
          <div><span>In progress</span><strong>{activeAttempts.length}</strong><small>{activeAttempts.length ? `${activeAttempts.reduce((sum, item) => sum + (item.answeredCount ?? 0), 0)} answers saved` : "No active assessments"}</small></div>
        </article>
      </section>

      <section className="mt-10" aria-labelledby="attempts-title">
        <div className="teacher-attempt-heading">
          <div><p className="app-eyebrow">Student activity</p><h2 id="attempts-title">Assessment attempts</h2></div>
          <span>{data.attempts.length} {data.attempts.length === 1 ? "attempt" : "attempts"}</span>
        </div>
        {data.attempts.length ? (
          <div className="teacher-attempt-list">
            {data.attempts.map((attempt, index) => {
              const isCompleted = attempt.status === "completed";
              return (
                <details className={`teacher-attempt ${isCompleted ? "completed" : "in-progress"}`} key={attempt.id} open={index === 0}>
                  <summary>
                    <span className={`teacher-attempt-icon ${isCompleted ? "completed" : ""}`}>
                      {isCompleted ? <Check size={17} /> : <Clock3 size={17} />}
                    </span>
                    <span className="teacher-attempt-main">
                      <span className="teacher-attempt-kicker">ATTEMPT {String(data.attempts.length - index).padStart(2, "0")}</span>
                      <strong>{isCompleted ? `${attempt.score} / ${attempt.total} correct` : "Assessment in progress"}</strong>
                      <small>{isCompleted ? `Submitted ${formatDate(attempt.submittedAt)}` : `Started ${formatDate(attempt.startedAt)}`}</small>
                    </span>
                    <span className={`teacher-attempt-badge ${isCompleted ? "completed" : ""}`}>
                      {isCompleted ? `${attempt.percentage}%` : `${attempt.answeredCount ?? 0} / ${attempt.total ?? 10} saved`}
                    </span>
                    <ChevronDown className="result-chevron" size={17} />
                  </summary>
                  <div className="teacher-attempt-content">
                    {isCompleted
                      ? attempt.results && <QuestionReview result={attempt.results} />
                      : <InProgressReview attempt={attempt} />}
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          <div className="empty-state panel">
            <ClipboardCheck size={20} />
            <p>No assessment attempts yet</p>
            <span>When this student starts an assessment, their progress will appear here.</span>
          </div>
        )}
      </section>
    </PageFrame>
  );
}
