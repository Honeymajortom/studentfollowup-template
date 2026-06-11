// src/components/layout/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { Menu, Search, Bell, MessageSquare, ChevronDown, X, LogOut, Phone, Clock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../hooks/useNotifications";

const TYPE_ICON = { call: "📞", whatsapp: "💬", walk_in: "🚶", video_call: "📹", email: "✉️" };

function timeLabel(scheduledAt) {
  const d    = new Date(scheduledAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d < today) {
    const days = Math.floor((today - d) / 86400000);
    return days === 1 ? "Yesterday" : `${days}d overdue`;
  }
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function isOverdue(scheduledAt) {
  return new Date(scheduledAt) < new Date(new Date().setHours(0, 0, 0, 0));
}

export default function Navbar({ onToggleSidebar }) {
  const { user, logout }   = useAuth();
  const navigate           = useNavigate();
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef   = useRef(null);
  const profileRef = useRef(null);

  const { items, count, refetch } = useNotifications();

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e) {
      if (notifRef.current   && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleLogout() { logout(); navigate("/login"); }

  function goToFollowups() { setNotifOpen(false); navigate("/followups"); }

  return (
    <header style={{ height: 58, background: "#080B14", borderBottom: "1px solid #1E2A45", display: "flex", alignItems: "center", padding: "0 18px", gap: 14, flexShrink: 0, position: "relative", zIndex: 20 }}>
      <button className="btn btn-ghost" style={{ padding: "5px 7px" }} onClick={onToggleSidebar}>
        <Menu size={17} />
      </button>

      <div style={{ position: "relative", flex: 1, maxWidth: 340 }}>
        <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#334155" }} />
        <input className="inp" placeholder="Search students, follow-ups…" style={{ paddingLeft: 34, height: 34, fontSize: 12.5 }} />
      </div>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>

        {/* ── Notification Bell ── */}
        <div style={{ position: "relative" }} ref={notifRef}>
          <button
            className="btn btn-ghost"
            style={{ padding: "5px 7px", position: "relative" }}
            onClick={() => { setNotifOpen(p => !p); if (!notifOpen) refetch(); }}
          >
            <Bell size={17} />
            {count > 0 && (
              <span style={{
                position: "absolute", top: 2, right: 2,
                minWidth: 16, height: 16, padding: "0 4px",
                background: "#EF4444", borderRadius: 8,
                border: "2px solid #080B14",
                fontSize: 9, fontWeight: 800, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                lineHeight: 1,
              }}>
                {count > 99 ? "99+" : count}
              </span>
            )}
            {count === 0 && (
              <span style={{ position: "absolute", top: 3, right: 3, width: 7, height: 7, background: "#334155", borderRadius: "50%", border: "2px solid #080B14" }} />
            )}
          </button>

          {notifOpen && (
            <div style={{ position: "absolute", right: 0, top: 46, width: 320, background: "#0E1525", border: "1px solid #1E2A45", borderRadius: 14, zIndex: 100, overflow: "hidden", boxShadow: "0 20px 60px #00000080" }}>

              {/* Header */}
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #1E2A45", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Follow-up Reminders</span>
                  {count > 0 && (
                    <span style={{ background: "#EF444418", color: "#F87171", border: "1px solid #EF444433", borderRadius: 6, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>
                      {count} due
                    </span>
                  )}
                </div>
                <button className="btn btn-ghost" style={{ padding: "2px 6px" }} onClick={() => setNotifOpen(false)}>
                  <X size={13} />
                </button>
              </div>

              {/* Items */}
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {items.length === 0 ? (
                  <div style={{ padding: "24px 16px", color: "#475569", fontSize: 13, textAlign: "center" }}>
                    <Clock size={28} style={{ margin: "0 auto 8px", opacity: 0.3, display: "block" }} />
                    No pending follow-ups
                  </div>
                ) : (
                  items.map(item => (
                    <div
                      key={item.id}
                      onClick={goToFollowups}
                      style={{
                        padding: "11px 16px", borderBottom: "1px solid #1E2A4560",
                        cursor: "pointer", transition: "background .15s",
                        display: "flex", gap: 12, alignItems: "flex-start",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#131D35"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {/* Icon */}
                      <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                        background: isOverdue(item.scheduled_at) ? "#EF444418" : "#2563EB18",
                        border: `1px solid ${isOverdue(item.scheduled_at) ? "#EF444433" : "#2563EB33"}`,
                      }}>
                        {TYPE_ICON[item.type] || "📞"}
                      </div>

                      {/* Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.student_name}
                          </p>
                          <span style={{ fontSize: 11, fontWeight: 700, flexShrink: 0, marginLeft: 8,
                            color: isOverdue(item.scheduled_at) ? "#F87171" : "#60A5FA",
                          }}>
                            {timeLabel(item.scheduled_at)}
                          </span>
                        </div>
                        <p style={{ fontSize: 11.5, color: "#7C3AED", marginBottom: 2 }}>
                          {item.course_name || "—"}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 10.5, color: "#475569" }}>
                            {item.type.replace(/_/g, " ")}
                          </span>
                          {isOverdue(item.scheduled_at) && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#F87171", background: "#EF444418", border: "1px solid #EF444433", borderRadius: 4, padding: "1px 5px" }}>
                              OVERDUE
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: "10px 16px", borderTop: "1px solid #1E2A45" }}>
                <button
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center", fontSize: 12, padding: "7px" }}
                  onClick={goToFollowups}
                >
                  <Phone size={12} /> View all follow-ups
                </button>
              </div>
            </div>
          )}
        </div>

        <button className="btn btn-ghost" style={{ padding: "5px 7px" }}>
          <MessageSquare size={17} color="#22C55E" />
        </button>

        {/* ── Profile dropdown ── */}
        <div style={{ position: "relative" }} ref={profileRef}>
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, background: "#0E1525", border: "1px solid #1E2A45", borderRadius: 10, padding: "4px 12px", cursor: "pointer" }}
            onClick={() => setProfileOpen(p => !p)}
          >
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#2563EB,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>
              {user?.name?.[0] || "A"}
            </div>
            <div style={{ fontSize: 12 }}>
              <p style={{ fontWeight: 700, color: "#E2E8F0", lineHeight: 1.2 }}>{user?.name || "Admin"}</p>
              <p style={{ color: "#475569", fontSize: 10 }}>{user?.role || "admin"}</p>
            </div>
            <ChevronDown size={11} color="#475569" />
          </div>

          {profileOpen && (
            <div style={{ position: "absolute", right: 0, top: 46, width: 180, background: "#0E1525", border: "1px solid #1E2A45", borderRadius: 12, zIndex: 100, overflow: "hidden", boxShadow: "0 10px 40px #00000080" }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid #1E2A45" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>{user?.name}</p>
                <p style={{ fontSize: 11, color: "#475569" }}>{user?.email}</p>
              </div>
              <button
                className="btn btn-ghost"
                style={{ width: "100%", justifyContent: "flex-start", borderRadius: 0, padding: "10px 14px", fontSize: 13, color: "#F87171", border: "none" }}
                onClick={handleLogout}
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
