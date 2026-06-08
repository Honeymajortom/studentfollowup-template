// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import authApi from "../api/auth.api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem("crm_user")); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);  // true while verifying token on mount

  // On mount: verify the stored token is still valid
  useEffect(() => {
    const token = localStorage.getItem("crm_token");
    if (!token) { setLoading(false); return; }

    authApi.getMe()
      .then(res => setUser(res.data.data.user))
      .catch(() => {
        localStorage.removeItem("crm_token");
        localStorage.removeItem("crm_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Login: call API, store token + user
  const login = useCallback(async (email, password) => {
    const res  = await authApi.login(email, password);
    const { token, user } = res.data.data;
    localStorage.setItem("crm_token", token);
    localStorage.setItem("crm_user",  JSON.stringify(user));
    setUser(user);
    return user;
  }, []);

  // Logout: clear everything
  const logout = useCallback(() => {
    localStorage.removeItem("crm_token");
    localStorage.removeItem("crm_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Convenience hook
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
