// src/components/shared/index.jsx
import { useState, useRef, useEffect } from "react";
import { X, Download } from "lucide-react";
import { ArrowUp, ArrowDown } from "lucide-react";

/* ── Avatar ─────────────────────────────────────── */
const GRAD = [
  ["#2563EB","#3B82F6"], ["#7C3AED","#9333EA"],
  ["#0EA5E9","#38BDF8"], ["#10B981","#34D399"],
  ["#F59E0B","#FBBF24"],
];
export function Avatar({ name = "?", size = 34, fontSize = 14 }) {
  const [a, b] = GRAD[name.charCodeAt(0) % GRAD.length];
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, fontSize, background: `linear-gradient(135deg,${a},${b})` }}
    >
      {name[0]}
    </div>
  );
}

/* ── Badge ──────────────────────────────────────── */
const BADGE_MAP = {
  Active:"success", Paid:"success", Scheduled:"success", Delivered:"success",
  Enrolled:"success", Present:"success", Completed:"success",
  Pending:"warning", Interested:"warning", "On Leave":"warning", "Demo Scheduled":"warning",
  Overdue:"danger", Failed:"danger", Absent:"danger", Inactive:"danger", "Not Interested":"danger",
  New:"info", "New Lead":"info",
  "Follow-up":"purple", Trainer:"purple",
  Admin:"gray", "Senior Counselor":"info", Counselor:"info",
};
export function Badge({ status }) {
  const type = BADGE_MAP[status] || "gray";
  return (
    <span className={`badge badge-${type}`}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
      {status}
    </span>
  );
}

/* ── StatCard ───────────────────────────────────── */
export function StatCard({ icon: Icon, label, value, color, change, sub }) {
  return (
    <div className="card card-hover" style={{ padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ background: color + "18", borderRadius: 10, padding: 9, border: `1px solid ${color}22` }}>
          <Icon size={20} color={color} />
        </div>
        {change != null && (
          <span style={{ fontSize: 11, fontWeight: 700, color: change >= 0 ? "#4ADE80" : "#F87171", display: "flex", alignItems: "center", gap: 3 }}>
            {change >= 0 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p style={{ fontSize: 27, fontWeight: 800, color: "#F1F5F9", letterSpacing: "-.02em" }}>{value}</p>
      <p style={{ fontSize: 12, color: "#475569", marginTop: 4, fontWeight: 500 }}>{label}</p>
      {sub && <p style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

/* ── SectionHead ────────────────────────────────── */
export function SectionHead({ title, sub, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
      <div>
        <h2 className="sec-title">{title}</h2>
        {sub && <p style={{ fontSize: 13, color: "#475569", marginTop: 3 }}>{sub}</p>}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{children}</div>
    </div>
  );
}

/* ── Modal ──────────────────────────────────────── */
export function Modal({ open, onClose, title, width = 520, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: width }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "#F1F5F9" }}>{title}</h3>
          <button className="btn btn-ghost" style={{ padding: "5px 8px" }} onClick={onClose}><X size={15} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── FormField ──────────────────────────────────── */
export function FormField({ label, required, hint, error, col = "1/-1", children }) {
  return (
    <div style={{ gridColumn: col }}>
      <label className="field-label">
        {label}
        {required && <span style={{ color: "#F87171", marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error
        ? <p style={{ fontSize: 11, color: "#F87171", marginTop: 4 }}>⚠ {error}</p>
        : hint && <p style={{ fontSize: 11, color: "#334155", marginTop: 4 }}>{hint}</p>
      }
    </div>
  );
}

/* ── Custom Recharts Tooltip ────────────────────── */
export function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0E1525", border: "1px solid #1E2A45", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#CBD5E1", fontFamily: "var(--font)" }}>
      <p style={{ fontWeight: 700, marginBottom: 6, color: "#F1F5F9" }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <b>{p.value}</b></p>
      ))}
    </div>
  );
}

/* ── Toggle ─────────────────────────────────────── */
/* ── ExportMenu ─────────────────────────────────────── */
// onExport(format) is called with "csv" or "pdf"
export function ExportMenu({ onExport, loading = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function pick(fmt) { setOpen(false); onExport(fmt); }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="btn btn-ghost"
        onClick={() => setOpen(p => !p)}
        disabled={loading}
      >
        <Download size={13} /> {loading ? "Exporting…" : "Export"}{!loading && " ▾"}
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0,
          background: "#0E1525", border: "1px solid #1E2A45",
          borderRadius: 10, overflow: "hidden", zIndex: 200, minWidth: 150,
          boxShadow: "0 8px 30px #00000060",
        }}>
          {[["csv","📄","Export CSV"],["pdf","📑","Export PDF"]].map(([fmt, emoji, label]) => (
            <button
              key={fmt}
              onClick={() => pick(fmt)}
              style={{
                display: "block", width: "100%", padding: "10px 16px",
                background: "none", border: "none", color: "#E2E8F0",
                fontSize: 13, textAlign: "left", cursor: "pointer",
                fontFamily: "inherit",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#131D35"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              {emoji} {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Toggle({ value, onChange }) {
  return (
    <button
      className="toggle"
      style={{ background: value ? "linear-gradient(135deg,#2563EB,#7C3AED)" : "#1E2A45" }}
      onClick={() => onChange(!value)}
    >
      <div className="toggle-thumb" style={{ left: value ? 22 : 3 }} />
    </button>
  );
}
