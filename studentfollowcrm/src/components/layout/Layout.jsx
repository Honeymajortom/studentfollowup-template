// src/components/layout/Layout.jsx
import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar  from "./Navbar";

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const page      = location.pathname.split("/")[1] || "dashboard";

  function handleNav(id) {
    navigate(`/${id}`);
  }

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden" }}>
      <Sidebar page={page} onNav={handleNav} collapsed={collapsed}/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <Navbar onToggleSidebar={()=>setCollapsed(p=>!p)} collapsed={collapsed}/>
        <main style={{ flex:1, overflowY:"auto", padding:"26px 28px" }}>
          <Outlet/>
        </main>
      </div>
    </div>
  );
}
