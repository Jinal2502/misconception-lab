import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import LandingPage from "./LandingPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import StudentWorkspace from "./pages/StudentWorkspace.jsx";
import ResultsPage from "./pages/ResultsPage.jsx";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";
import QuestionManager from "./pages/QuestionManager.jsx";
import StudentDetail from "./pages/StudentDetail.jsx";

function BusyScreen() {
  return <div className="page-shell grid min-h-screen place-items-center text-sm text-white/55">Opening your lab…</div>;
}

function RoleRoute({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <BusyScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== role) return <Navigate to={user.role === "teacher" ? "/teacher" : "/student"} replace />;
  return children;
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return <BusyScreen />;
  if (user) return <Navigate to={user.role === "teacher" ? "/teacher" : "/student"} replace />;
  return <AuthPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthRoute />} />
      <Route path="/student" element={<RoleRoute role="student"><StudentWorkspace /></RoleRoute>} />
      <Route path="/student/assessment" element={<RoleRoute role="student"><StudentWorkspace /></RoleRoute>} />
      <Route path="/student/results/:attemptId" element={<RoleRoute role="student"><ResultsPage /></RoleRoute>} />
      <Route path="/teacher" element={<RoleRoute role="teacher"><TeacherDashboard /></RoleRoute>} />
      <Route path="/teacher/questions" element={<RoleRoute role="teacher"><QuestionManager /></RoleRoute>} />
      <Route path="/teacher/students/:studentId" element={<RoleRoute role="teacher"><StudentDetail /></RoleRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <BrowserRouter><AuthProvider><AppRoutes /></AuthProvider></BrowserRouter>;
}
