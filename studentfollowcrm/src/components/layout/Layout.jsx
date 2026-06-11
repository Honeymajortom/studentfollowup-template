// src/components/layout/Layout.jsx
import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar  from "./Navbar";
import { useIsMobile } from "../../hooks/useIsMobile";

export default function Layout() {
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate  = useNavigate();
  const location  = useLocation();
  const page      = location.pathname.split("/")[1] || "dashboard";

  function handleNav(id) {
    navigate(`/${id}`);
    if (isMobile) setMobileOpen(false);
  }

  function handleToggleSidebar() {
    if (isMobile) setMobileOpen(p => !p);
    else setCollapsed(p => !p);
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Mobile backdrop — closes drawer on click */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "#00000085",
            backdropFilter: "blur(2px)",
            zIndex: 39,
          }}
        />
      )}

      <Sidebar
        page={page}
        onNav={handleNav}
        collapsed={isMobile ? false : collapsed}
        mobile={isMobile}
        mobileOpen={mobileOpen}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Navbar
          onToggleSidebar={handleToggleSidebar}
          collapsed={isMobile ? !mobileOpen : collapsed}
        />
        <main style={{
          flex: 1,
          overflowY: "auto",
          padding: isMobile ? "14px 14px 24px" : "26px 28px",
        }}>
          <Outlet/>
        </main>
      </div>
    </div>
  );
}
