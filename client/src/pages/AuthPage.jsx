import { ArrowLeft, FlaskConical } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import { Notice } from "../components/AppLayout.jsx";

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const initialMode = new URLSearchParams(location.search).get("mode") === "register" ? "register" : "login";
  const [role, setRole] = useState("student");
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function chooseRole(nextRole) {
    setRole(nextRole);
    setError("");
    if (nextRole === "teacher") setMode("login");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = mode === "register"
        ? await signUp({ name, email, password })
        : await signIn({ email, password, role });
      navigate(user.role === "teacher" ? "/teacher" : "/student", { replace: true });
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="auth-card">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-white">
          <ArrowLeft size={14} /> Back to Misconception Lab
        </Link>
        <div className="flex items-center gap-3">
          <span className="brand-mark"><FlaskConical size={19} /></span>
          <span className="text-sm font-semibold">misconception<span className="text-emerald-400">lab</span></span>
        </div>
        <h1 className="mt-8 text-3xl font-medium tracking-[-0.05em]">{mode === "register" ? "Start with a question." : "Welcome back."}</h1>
        <p className="mt-2 text-sm leading-6 text-white/50">
          {role === "teacher" ? "Sign in to guide the learning in your lab." : mode === "register" ? "Create a student account and learn by challenging ideas." : "Sign in to pick up where your thinking left off."}
        </p>

        <div className="role-switch mt-7" role="tablist" aria-label="Account type">
          <button type="button" role="tab" aria-selected={role === "student"} className={role === "student" ? "selected" : ""} onClick={() => chooseRole("student")}>Student</button>
          <button type="button" role="tab" aria-selected={role === "teacher"} className={role === "teacher" ? "selected" : ""} onClick={() => chooseRole("teacher")}>Teacher</button>
        </div>

        <Notice>{error}</Notice>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {mode === "register" && role === "student" && (
            <label className="field-label">Your name
              <input autoComplete="name" maxLength={80} minLength={2} required value={name} onChange={(event) => setName(event.target.value)} className="field-input" placeholder="How should we call you?" />
            </label>
          )}
          <label className="field-label">Email address
            <input autoComplete="email" type="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} className="field-input" placeholder="you@example.com" />
          </label>
          <label className="field-label">Password
            <input autoComplete={mode === "register" ? "new-password" : "current-password"} type="password" minLength={mode === "register" ? 12 : undefined} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} className="field-input" placeholder={mode === "register" ? "At least 12 characters" : "Your password"} />
          </label>
          <button type="submit" disabled={busy} className="primary-button w-full justify-center disabled:cursor-not-allowed disabled:opacity-55">
            {busy ? "One moment…" : mode === "register" ? "Create student account" : `Sign in as ${role}`}
          </button>
        </form>
        {role === "student" && (
          <p className="mt-6 text-center text-sm text-white/45">
            {mode === "register" ? "Already have an account?" : "New to the lab?"}{" "}
            <button type="button" className="font-medium text-emerald-300 hover:text-emerald-200" onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); }}>
              {mode === "register" ? "Sign in" : "Create an account"}
            </button>
          </p>
        )}
        {role === "teacher" && <p className="mt-6 text-center text-xs leading-5 text-white/35">Teacher accounts are provisioned privately by the lab administrator.</p>}
      </div>
      <p className="relative mt-6 text-xs text-white/30">Understanding begins when you learn to recognize why an answer is wrong.</p>
    </main>
  );
}
