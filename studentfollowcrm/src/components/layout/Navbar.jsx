// src/components/layout/Navbar.jsx
import { useState } from "react";
import { Menu, Search, Bell, MessageSquare, ChevronDown, X, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  function handleLogout() { logout(); navigate("/login"); }

  return (
    <header style={{ height:58, background:"#080B14", borderBottom:"1px solid #1E2A45", display:"flex", alignItems:"center", padding:"0 18px", gap:14, flexShrink:0, position:"relative", zIndex:20 }}>
      <button className="btn btn-ghost" style={{ padding:"5px 7px" }} onClick={onToggleSidebar}><Menu size={17}/></button>

      <div style={{ position:"relative", flex:1, maxWidth:340 }}>
        <Search size={13} style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:"#334155" }}/>
        <input className="inp" placeholder="Search students, follow-ups…" style={{ paddingLeft:34, height:34, fontSize:12.5 }}/>
      </div>

      <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
        {/* Notifications */}
        <div style={{ position:"relative" }}>
          <button className="btn btn-ghost" style={{ padding:"5px 7px", position:"relative" }} onClick={()=>setNotifOpen(p=>!p)}>
            <Bell size={17}/>
            <span style={{ position:"absolute", top:3, right:3, width:7, height:7, background:"#EF4444", borderRadius:"50%", border:"2px solid #080B14" }}/>
          </button>
          {notifOpen && (
            <div style={{ position:"absolute", right:0, top:46, width:280, background:"#0E1525", border:"1px solid #1E2A45", borderRadius:14, zIndex:100, overflow:"hidden", boxShadow:"0 20px 60px #00000080" }}>
              <div style={{ padding:"12px 16px", borderBottom:"1px solid #1E2A45", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>Notifications</span>
                <button className="btn btn-ghost" style={{ padding:"2px 6px" }} onClick={()=>setNotifOpen(false)}><X size={13}/></button>
              </div>
              <div style={{ padding:"12px 16px", color:"#475569", fontSize:13, textAlign:"center" }}>
                No new notifications
              </div>
            </div>
          )}
        </div>

        <button className="btn btn-ghost" style={{ padding:"5px 7px" }}><MessageSquare size={17} color="#22C55E"/></button>

        {/* Profile dropdown */}
        <div style={{ position:"relative" }}>
          <div
            style={{ display:"flex", alignItems:"center", gap:8, background:"#0E1525", border:"1px solid #1E2A45", borderRadius:10, padding:"4px 12px", cursor:"pointer" }}
            onClick={()=>setProfileOpen(p=>!p)}
          >
            <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#2563EB,#7C3AED)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#fff" }}>
              {user?.name?.[0] || "A"}
            </div>
            <div style={{ fontSize:12 }}>
              <p style={{ fontWeight:700, color:"#E2E8F0", lineHeight:1.2 }}>{user?.name || "Admin"}</p>
              <p style={{ color:"#475569", fontSize:10 }}>{user?.role || "admin"}</p>
            </div>
            <ChevronDown size={11} color="#475569"/>
          </div>

          {profileOpen && (
            <div style={{ position:"absolute", right:0, top:46, width:180, background:"#0E1525", border:"1px solid #1E2A45", borderRadius:12, zIndex:100, overflow:"hidden", boxShadow:"0 10px 40px #00000080" }}>
              <div style={{ padding:"10px 14px", borderBottom:"1px solid #1E2A45" }}>
                <p style={{ fontSize:13, fontWeight:700, color:"#F1F5F9" }}>{user?.name}</p>
                <p style={{ fontSize:11, color:"#475569" }}>{user?.email}</p>
              </div>
              <button
                className="btn btn-ghost"
                style={{ width:"100%", justifyContent:"flex-start", borderRadius:0, padding:"10px 14px", fontSize:13, color:"#F87171", border:"none" }}
                onClick={handleLogout}
              >
                <LogOut size={14}/> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
