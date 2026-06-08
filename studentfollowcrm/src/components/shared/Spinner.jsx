// src/components/shared/Spinner.jsx
// Reusable loading, error, and empty state components

export function Spinner({ size = 36, text = "Loading…" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, gap: 14 }}>
      <div style={{
        width: size, height: size,
        border: `3px solid #1E2A45`,
        borderTopColor: "#2563EB",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ fontSize: 13, color: "#475569" }}>{text}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function PageError({ message, onRetry }) {
  return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <div style={{ fontSize: 42, marginBottom: 12 }}>⚠️</div>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#F87171", marginBottom: 8 }}>Something went wrong</p>
      <p style={{ fontSize: 13, color: "#475569", marginBottom: 20 }}>{message}</p>
      {onRetry && (
        <button className="btn btn-ghost" onClick={onRetry}>Try again</button>
      )}
    </div>
  );
}

export function EmptyState({ emoji = "📭", title = "Nothing here yet", sub = "" }) {
  return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <div style={{ fontSize: 42, marginBottom: 12 }}>{emoji}</div>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>{title}</p>
      {sub && <p style={{ fontSize: 13, color: "#334155" }}>{sub}</p>}
    </div>
  );
}
