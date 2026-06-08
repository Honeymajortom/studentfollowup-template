// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login }    = useAuth();
  const navigate     = useNavigate();

  const [email,    setEmail]    = useState("admin@eduspark.in");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) { setError("Email and password are required"); return; }
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#080B14" }}>
      {/* Left illustration panel */}
      <div style={{ flex: 1, background: "linear-gradient(145deg,#0A0F1E,#111827)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 60, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, background: "radial-gradient(circle,#2563EB18,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -60,  left:  -60, width: 300, height: 300, background: "radial-gradient(circle,#7C3AED18,transparent 70%)" }} />
        <div style={{ zIndex: 1, textAlign: "center", maxWidth: 420 }}>
          <div style={{ fontSize: 64, marginBottom: 22 }}>🎓</div>
          <h1 style={{ fontSize: 38, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-.03em", marginBottom: 12 }}>
            EduFollow{" "}
            <span style={{ background: "linear-gradient(135deg,#2563EB,#7C3AED)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>CRM</span>
          </h1>
          <p style={{ fontSize: 15.5, color: "#64748B", lineHeight: 1.7, marginBottom: 36 }}>
            Complete student follow-up & WhatsApp reminder system for modern institutes.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {["📲 WhatsApp Automation", "💰 Fee Tracking", "📊 Analytics", "🗓 Follow-up Scheduler", "📋 Attendance", "🏆 Staff Performance"].map(f => (
              <span key={f} style={{ background: "#131D35", border: "1px solid #1E2A45", padding: "5px 14px", borderRadius: 20, fontSize: 12, color: "#94A3B8" }}>{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right login card */}
      <div style={{ width: 460, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ width: "100%", maxWidth: 370 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#F1F5F9", marginBottom: 6 }}>Sign in</h2>
          <p style={{ fontSize: 13.5, color: "#475569", marginBottom: 28 }}>Access your institute dashboard</p>

          {/* Error banner */}
          {error && (
            <div style={{ background: "#DC262618", border: "1px solid #DC262633", borderRadius: 10, padding: "10px 14px", marginBottom: 18, fontSize: 13, color: "#F87171" }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Email */}
            <div>
              <label className="field-label">EMAIL ADDRESS</label>
              <input
                className="inp"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@eduspark.in"
                autoComplete="email"
                style={{ padding: "10px 14px" }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="field-label">PASSWORD</label>
              <div style={{ position: "relative" }}>
                <input
                  className="inp"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ padding: "10px 40px 10px 14px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#475569", display: "flex" }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ padding: "11px", justifyContent: "center", fontSize: 14.5, marginTop: 4, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Signing in…" : <> Sign In <ArrowRight size={15} /> </>}
            </button>
          </form>

          <div style={{ marginTop: 24, textAlign: "center", fontSize: 12, color: "#334155", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Lock size={12} /> Secured with JWT Authentication
          </div>
        </div>
      </div>
    </div>
  );
}
