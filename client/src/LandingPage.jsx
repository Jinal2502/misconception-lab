import { ArrowDown, ArrowRight, ArrowUpRight, Brain, Check, CircleHelp, FlaskConical, Layers3, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext.jsx";

const steps = [
  { number: "01", title: "Meet a convincing mistake", description: "Start with an answer that sounds right—but has one important idea hiding in plain sight.", icon: CircleHelp },
  { number: "02", title: "Find where it goes wrong", description: "Question each step, test your assumptions, and pinpoint the misconception.", icon: Brain },
  { number: "03", title: "Make the idea yours", description: "Correct the reasoning and leave with an understanding built to stick.", icon: Check },
];

export default function LandingPage() {
  const [apiStatus, setApiStatus] = useState("checking");
  const { user } = useAuth();
  const destination = user?.role === "teacher" ? "/teacher" : user ? "/student" : "/auth?mode=register";

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/health", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("API unavailable");
        return response.json();
      })
      .then(() => setApiStatus("online"))
      .catch(() => {
        if (!controller.signal.aborted) setApiStatus("offline");
      });
    return () => controller.abort();
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#080c0b] text-[#f1f5f2]">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-10 lg:px-12">
        <Link to="/" className="flex items-center gap-3" aria-label="Misconception Lab home">
          <span className="brand-mark"><FlaskConical size={19} strokeWidth={1.8} /></span>
          <span className="text-sm font-semibold tracking-[-0.02em] sm:text-base">misconception<span className="text-emerald-400">lab</span></span>
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-8 text-sm text-white/55 sm:flex">
          <a className="transition hover:text-white" href="#method">The method</a>
          <a className="transition hover:text-white" href="#why">Why it works</a>
        </nav>
        <div className="flex items-center gap-3">
          {!user && <Link to="/auth" className="text-sm text-white/60 transition hover:text-white">Sign in</Link>}
          <Link to={destination} className="nav-cta">{user ? "Open your lab" : "Explore the lab"} <ArrowUpRight size={15} /></Link>
        </div>
      </header>

      <section className="hero relative z-10 mx-auto grid w-full max-w-7xl items-center gap-16 px-6 pb-24 pt-14 sm:px-10 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:pb-32 lg:pt-24">
        <div className="relative">
          <div className="eyebrow"><span className="eyebrow-dot" /> A different way to understand</div>
          <h1 className="mt-7 max-w-3xl text-[3.5rem] font-medium leading-[0.98] tracking-[-0.065em] sm:text-7xl lg:text-[5.45rem]">
            The best way to learn is to <span className="serif-accent">get it wrong.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-[#a1aaa4] sm:text-lg sm:leading-8">
            Real understanding starts when you can spot a mistake. Misconception Lab turns deliberately incorrect answers into your next breakthrough.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Link to={destination} className="primary-button">Start learning <ArrowRight size={17} /></Link>
            <span className="text-sm text-white/45">Curiosity first. Answers second.</span>
          </div>
          <div className="mt-12 flex items-center gap-3 text-xs text-white/45" role="status" aria-live="polite">
            <span className={`status-dot ${apiStatus}`} />
            {apiStatus === "checking" && "Checking lab connection…"}
            {apiStatus === "online" && "Lab systems connected"}
            {apiStatus === "offline" && "Lab API is currently unreachable"}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg lg:ml-auto">
          <div className="orbit orbit-outer" aria-hidden="true" />
          <div className="orbit orbit-inner" aria-hidden="true" />
          <div className="concept-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/45"><Sparkles size={14} className="text-emerald-400" /> A thought experiment</div>
              <span className="card-index">01 / 03</span>
            </div>
            <div className="mt-10">
              <div className="text-xs font-medium uppercase tracking-[0.15em] text-emerald-400/80">Full-stack development</div>
              <h2 className="mt-4 text-2xl font-medium leading-snug tracking-[-0.035em] text-white sm:text-[1.7rem]">“The API returned 200, so the database must be correct.”</h2>
              <p className="mt-4 text-sm leading-6 text-white/45">Take a closer look. What assumption is hiding in this answer?</p>
            </div>
            <div className="mt-8 border-t border-white/[0.08] pt-5">
              <div className="flex items-center justify-between text-xs text-white/45"><span>Notice · Question · Correct</span><ArrowDown size={15} /></div>
            </div>
          </div>
          <div className="floating-note"><span className="note-icon"><Layers3 size={15} /></span><span><strong>Think deeper</strong><small>One idea at a time</small></span></div>
          <div className="visual-caption"><span className="caption-line" /> Your next “aha” moment starts here</div>
        </div>
      </section>

      <section id="why" className="relative z-10 border-y border-white/[0.07] bg-white/[0.018]">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 sm:grid-cols-3 sm:px-10 lg:px-12">
          <div className="principle"><span className="principle-number">A</span><p>Active learning over passive reading</p></div>
          <div className="principle"><span className="principle-number">B</span><p>Reasoning over memorizing</p></div>
          <div className="principle"><span className="principle-number">C</span><p>Curiosity over fear of mistakes</p></div>
        </div>
      </section>

      <section id="method" className="relative z-10 mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:px-12 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div>
            <div className="eyebrow"><span className="eyebrow-dot" /> How the lab works</div>
            <h2 className="mt-6 max-w-md text-4xl font-medium leading-tight tracking-[-0.055em] sm:text-5xl">Mistakes are not the opposite of learning.<span className="serif-accent"> They’re the material.</span></h2>
            <p className="mt-5 max-w-md leading-7 text-[#929c95]">We give you a safe space to challenge flawed reasoning. Your job isn’t to guess the right answer—it’s to understand why it’s right.</p>
          </div>
          <div className="steps-list">
            {steps.map(({ number, title, description, icon: Icon }) => (
              <article className="step-row" key={number}>
                <span className="step-number">{number}</span>
                <span className="step-icon"><Icon size={18} strokeWidth={1.7} /></span>
                <div><h3 className="font-medium tracking-[-0.02em] text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-[#929c95]">{description}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-7 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-12">
          <span>© 2026 Misconception Lab</span><span>Learn to question. Learn to understand.</span>
        </div>
      </footer>
    </main>
  );
}
