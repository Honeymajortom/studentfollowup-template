// src/App.jsx
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Layout          from "./components/layout/Layout";
import Login           from "./pages/Login";
import Dashboard       from "./pages/Dashboard";
import Students        from "./pages/Students";
import StudentProfile  from "./pages/StudentProfile";
import AddStudent      from "./pages/AddStudent";
import Followups       from "./pages/Followups";
import WhatsApp        from "./pages/WhatsApp";
import Fees            from "./pages/Fees";
import CoursesPage     from "./pages/Courses";
import Attendance      from "./pages/Attendance";
import Reports         from "./pages/Reports";
import StaffManagement from "./pages/StaffManagement";
import Settings        from "./pages/Settings";

// ── Protected wrapper — redirects to /login if not authenticated ──────────────
function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:"#080B14", display:"flex", alignItems:"center", justifyContent:"center", color:"#475569", fontSize:14 }}>
        <div style={{ textAlign:"center", gap:12, display:"flex", flexDirection:"column", alignItems:"center" }}>
          <div style={{ width:36, height:36, border:"3px solid #1E2A45", borderTopColor:"#2563EB", borderRadius:"50%", animation:"spin .8s linear infinite" }}/>
          <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
          <p>Verifying session…</p>
        </div>
      </div>
    );
  }

  return user ? <Outlet/> : <Navigate to="/login" replace/>;
}

// ── Redirect /login → /dashboard if already logged in ────────────────────────
function GuestOnly() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace/> : <Outlet/>;
}

// ── Placeholder for unbuilt modules ──────────────────────────────────────────
function Soon({ title }) {
  return (
    <div style={{ textAlign:"center", padding:80, color:"#334155" }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🚧</div>
      <p style={{ fontSize:18, fontWeight:700, color:"#475569" }}>{title}</p>
      <p style={{ fontSize:13, marginTop:8, color:"#334155" }}>This module is under development.</p>
    </div>
  );
}

const router = createBrowserRouter([
  // ── Public routes ──────────────────────────────────────────────────────────
  {
    element: <GuestOnly/>,
    children: [
      { path: "/login", element: <Login/> },
    ],
  },

  // ── Protected routes — all wrapped inside Layout ───────────────────────────
  {
    element: <RequireAuth/>,
    children: [
      {
        path: "/",
        element: <Layout/>,
        children: [
          { index: true,                           element: <Navigate to="/dashboard" replace/> },
          { path: "dashboard",                     element: <Dashboard/> },
          { path: "students",                      element: <Students/> },
          { path: "student-profile/:id",           element: <StudentProfile/> },
          { path: "add-student",                   element: <AddStudent/> },
          { path: "edit-student/:id",              element: <AddStudent/> },
          { path: "leads",                         element: <Soon title="Leads Management"/> },
          { path: "followups",                     element: <Followups/> },
          { path: "whatsapp",                      element: <WhatsApp/> },
          { path: "fees",                          element: <Fees/> },
          { path: "courses",                       element: <CoursesPage/> },
          { path: "attendance",                    element: <Attendance/> },
          { path: "reports",                       element: <Reports/> },
          { path: "staff",                         element: <StaffManagement/> },
          { path: "settings",                      element: <Settings/> },
          { path: "*",                             element: <Navigate to="/dashboard" replace/> },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router}/>;
}
