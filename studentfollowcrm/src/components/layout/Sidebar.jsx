// src/components/layout/Sidebar.jsx
import {
  LayoutDashboard, Users, Star, CalendarCheck, MessageSquare,
  DollarSign, BookOpen, ClipboardList, BarChart2, Settings,
  Briefcase, LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { PAGE_ROLES } from "../../utils/permissions";

const NAV = [
  { id: "dashboard",  label: "Dashboard",         Icon: LayoutDashboard },
  { id: "students",   label: "Students",           Icon: Users           },
  { id: "leads",      label: "Leads",              Icon: Star            },
  { id: "followups",  label: "Follow-ups",         Icon: CalendarCheck   },
  { id: "whatsapp",   label: "WhatsApp Reminders", Icon: MessageSquare   },
  { id: "fees",       label: "Fees Management",    Icon: DollarSign      },
  { id: "courses",    label: "Courses",            Icon: BookOpen        },
  { id: "attendance", label: "Attendance",         Icon: ClipboardList   },
  { id: "reports",    label: "Reports",            Icon: BarChart2       },
  { id: "staff",      label: "Staff Management",   Icon: Briefcase       },
  { id: "settings",   label: "Settings",           Icon: Settings        },
];

const STUDENT_PAGES = ["students", "add-student", "edit-student", "student-profile"];

export default function Sidebar({ page, onNav, collapsed, mobile = false, mobileOpen = false }) {
  const { user } = useAuth();
  const visibleNav = NAV.filter(({ id }) => PAGE_ROLES[id]?.includes(user?.role));

  // On mobile: fixed overlay drawer; on desktop: inline collapsed/expanded
  const sidebarStyle = mobile ? {
    position:        "fixed",
    top:             0,
    left:            0,
    height:          "100%",
    width:           240,
    background:      "#080B14",
    borderRight:     "1px solid #1E2A45",
    display:         "flex",
    flexDirection:   "column",
    zIndex:          40,
    transform:       mobileOpen ? "translateX(0)" : "translateX(-100%)",
    transition:      "transform .25s ease",
    overflowY:       "auto",
  } : {
    width:           collapsed ? 64 : 238,
    background:      "#080B14",
    borderRight:     "1px solid #1E2A45",
    display:         "flex",
    flexDirection:   "column",
    transition:      "width .2s ease",
    flexShrink:      0,
    zIndex:          10,
  };

  const showLabel = mobile || !collapsed;

  return (
    <aside style={sidebarStyle}>
      {/* Logo */}
      <div style={{ padding: "18px 12px 14px", display: "flex", alignItems: "center", gap: 11, borderBottom: "1px solid #1E2A45", flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#2563EB,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>
          🎓
        </div>
        {showLabel && (
          <div>
            <p className="gradient-text" style={{ fontSize: 15, fontWeight: 800 }}>EduFollow</p>
            <p style={{ fontSize: 10.5, color: "#334155" }}>CRM v1.0</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
        {visibleNav.map(({ id, label, Icon }) => {
          const active = page === id || (id === "students" && STUDENT_PAGES.includes(page));
          return (
            <div
              key={id}
              className={`sidebar-item ${active ? "active" : ""}`}
              onClick={() => onNav(id)}
              title={!showLabel ? label : ""}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              {showLabel && <span>{label}</span>}
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "10px 8px", borderTop: "1px solid #1E2A45", flexShrink: 0 }}>
        <div className="sidebar-item" onClick={() => onNav("logout")} title={!showLabel ? "Logout" : ""}>
          <LogOut size={17} style={{ flexShrink: 0 }} />
          {showLabel && <span>Logout</span>}
        </div>
      </div>
    </aside>
  );
}
