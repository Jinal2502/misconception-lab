import { FlaskConical, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../AuthContext.jsx";

export function AppHeader({ active = "student" }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  async function handleSignOut() {
    setError("");
    try {
      await signOut();
      navigate("/");
    } catch (caught) {
      setError(caught.message);
    }
  }

  return (
    <header className="app-header">
      <Link to="/" className="flex items-center gap-3" aria-label="Misconception Lab home">
        <span className="brand-mark"><FlaskConical size={18} /></span>
        <span className="text-sm font-semibold tracking-tight">misconception<span className="text-emerald-400">lab</span></span>
      </Link>
      <nav className="flex items-center gap-2 sm:gap-4" aria-label="Workspace navigation">
        {user?.role === "teacher" ? (
          <>
            <Link className={`workspace-nav ${active === "teacher" ? "active" : ""}`} to="/teacher">Overview</Link>
            <Link className={`workspace-nav ${active === "questions" ? "active" : ""}`} to="/teacher/questions">Questions</Link>
          </>
        ) : (
          <Link className={`workspace-nav ${active === "student" ? "active" : ""}`} to="/student">My assessment</Link>
        )}
        <span className="hidden text-xs text-white/40 sm:inline">{user?.name}</span>
        <button className="icon-button" type="button" onClick={handleSignOut} aria-label="Sign out" title="Sign out"><LogOut size={16} /></button>
      </nav>
      {error && <p className="absolute right-6 top-full z-20 rounded-lg border border-rose-400/30 bg-[#1b1214] px-3 py-2 text-xs text-rose-200">{error}</p>}
    </header>
  );
}

export function PageFrame({ children, active }) {
  return (
    <main className="page-shell min-h-screen">
      <AppHeader active={active} />
      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12">{children}</div>
    </main>
  );
}

export function PageTitle({ eyebrow, title, description, children }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        {eyebrow && <p className="app-eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl font-medium tracking-[-0.045em] text-white sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function Notice({ children, tone = "error" }) {
  if (!children) return null;
  return <div className={`notice notice-${tone}`} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}

export function LoadingState({ children = "Loading your lab…" }) {
  return <div className="panel p-8 text-sm text-white/50" role="status">{children}</div>;
}
