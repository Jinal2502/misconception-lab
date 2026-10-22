import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api("/api/auth/me")
      .then(({ user: currentUser }) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    signIn: async (credentials) => {
      const { user: signedIn } = await api("/api/auth/login", {
        method: "POST",
        body: credentials,
      });
      setUser(signedIn);
      return signedIn;
    },
    signUp: async (details) => {
      const { user: created } = await api("/api/auth/register", {
        method: "POST",
        body: details,
      });
      setUser(created);
      return created;
    },
    signOut: async () => {
      await api("/api/auth/logout", { method: "POST" });
      setUser(null);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
