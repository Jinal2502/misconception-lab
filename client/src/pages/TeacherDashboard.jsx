import { ArrowRight, Award, BookOpenCheck, Search, Users, ChartNoAxesCombined } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { api, formatDate } from "../api.js";
import { LoadingState, Notice, PageFrame, PageTitle } from "../components/AppLayout.jsx";

function StatCard({ icon: Icon, label, value, detail }) {
  return (
    <article className="stat-card">
      <span className="stat-icon"><Icon size={17} /></span>
      <div><p className="text-xs text-white/45">{label}</p><strong>{value}</strong><p className="text-[11px] text-white/35">{detail}</p></div>
    </article>
  );
}

export default function TeacherDashboard() {
  const [overview, setOverview] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const skipInitialSearch = useRef(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      api("/api/teacher/overview"),
      api("/api/teacher/leaderboard"),
      api("/api/teacher/students"),
    ])
      .then(([stats, leaders, roster]) => {
        if (!active) return;
        setOverview(stats);
        setLeaderboard(leaders.students);
        setStudents(roster.students);
      })
      .catch((caught) => { if (active) setError(caught.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (skipInitialSearch.current) {
      skipInitialSearch.current = false;
      return undefined;
    }
    const timer = setTimeout(() => {
      api(`/api/teacher/students?search=${encodeURIComponent(search)}`)
        .then(({ students: next }) => setStudents(next))
        .catch((caught) => setError(caught.message));
    }, 180);
    return () => clearTimeout(timer);
  }, [search]);

  if (loading) return <PageFrame active="teacher"><LoadingState>Gathering current class data…</LoadingState></PageFrame>;

  return (
    <PageFrame active="teacher">
      <PageTitle eyebrow="Teacher workspace" title="A clearer view of learning." description="Class performance from completed, persisted assessment attempts. The leaderboard uses average score, then attempt count, then the earlier most recent completion." />
      <Notice>{error}</Notice>

      <section aria-labelledby="leaders-title">
        <div className="section-heading"><div><p className="app-eyebrow">The class, as it stands</p><h2 id="leaders-title" className="mt-1 text-xl font-medium">Leading thinkers</h2></div><span className="text-xs text-white/35">Ranked from completed work</span></div>
        <div className="leaderboard-grid">
          {[0, 1, 2].map((rank) => {
            const student = leaderboard[rank];
            return (
              <article className={`leader-card rank-${rank + 1}`} key={student?.id ?? `empty-${rank}`}>
                <div className="leader-top"><span className="rank-medal"><Award size={16} /></span><span>0{rank + 1} / RANK</span></div>
                {student ? (
                  <>
                    <h3>{student.name}</h3>
                    <p>{student.averageScore.toFixed(2)} <span>/ 10 average</span></p>
                    <div className="leader-meta"><span>{student.completedAttempts} completed</span><span>Latest {formatDate(student.mostRecentCompletion)}</span></div>
                  </>
                ) : (
                  <div className="leader-empty"><h3>Room to rise</h3><p>Awaiting a completed assessment.</p></div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="stats-grid mt-7" aria-label="Class statistics">
        <StatCard icon={Users} label="Registered students" value={overview?.totalStudents ?? 0} detail="Student accounts" />
        <StatCard icon={BookOpenCheck} label="Completed assessments" value={overview?.completedAssessments ?? 0} detail="Submitted and graded" />
        <StatCard icon={ChartNoAxesCombined} label="Average student score" value={overview?.averageScore == null ? "—" : `${overview.averageScore.toFixed(1)}/10`} detail={overview?.averageScore == null ? "No completed attempts yet" : "Across completed attempts"} />
      </section>

      <section className="mt-10" aria-labelledby="students-title">
        <div className="section-heading">
          <div><p className="app-eyebrow">Individual progress</p><h2 id="students-title" className="mt-1 text-xl font-medium">Student performance</h2></div>
          <label className="search-field"><Search size={15} /><span className="sr-only">Search students</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or email" maxLength={80} /></label>
        </div>
        <div className="panel overflow-hidden">
          <div className="student-table-head"><span>Student</span><span>Average</span><span>Completed</span><span>Most recent</span><span /></div>
          {students.length ? students.map((student) => (
            <Link className="student-table-row" key={student.id} to={`/teacher/students/${student.id}`}>
              <span><strong>{student.name}</strong><small>{student.email}</small></span>
              <span>{student.averageScore == null ? "—" : `${student.averageScore.toFixed(2)} / 10`}</span>
              <span>{student.completedAttempts}</span>
              <span>{formatDate(student.mostRecentCompletion)}</span>
              <ArrowRight size={15} className="text-white/30" />
            </Link>
          )) : (
            <div className="empty-state"><Users size={18} /><p>{search ? "No students match this search." : "No student accounts yet."}</p><span>Student records and results will appear here when available.</span></div>
          )}
        </div>
      </section>
    </PageFrame>
  );
}
