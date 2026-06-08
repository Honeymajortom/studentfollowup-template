// src/pages/Students.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Upload, Download, Plus, Eye, Edit, Trash2, MessageSquare, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { SectionHead, Badge, Avatar } from "../components/shared";
import { Spinner, PageError, EmptyState } from "../components/shared/Spinner";
import studentsApi from "../api/students.api";
import coursesApi  from "../api/courses.api";

function feesLabel(s) {
  if (!s.fees_status) return "—";
  return s.fees_status.charAt(0).toUpperCase() + s.fees_status.slice(1);
}

export default function Students() {
  const navigate = useNavigate();

  const [rows,    setRows]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [courses, setCourses] = useState([]);

  // Filters
  const [search,   setSearch]   = useState("");
  const [courseF,  setCourseF]  = useState("");
  const [statusF,  setStatusF]  = useState("");
  const [feesF,    setFeesF]    = useState("");
  const [page,     setPage]     = useState(1);
  const LIMIT = 8;

  // Load courses for filter dropdown (once)
  useEffect(() => {
    coursesApi.list().then(r => setCourses(r.data.data.courses || [])).catch(() => {});
  }, []);

  // Fetch students whenever filters/page change
  useEffect(() => {
    setLoading(true);
    setError(null);
    studentsApi.list({ search, course_id: courseF, status: statusF, fees_status: feesF, page, limit: LIMIT })
      .then(r => {
        const d = r.data.data;
        setRows(d.rows || []);
        setTotal(d.pagination?.total || 0);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, courseF, statusF, feesF, page]);

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete student "${name}"? This cannot be undone.`)) return;
    try {
      await studentsApi.remove(id);
      setRows(prev => prev.filter(s => s.id !== id));
      setTotal(prev => prev - 1);
    } catch (e) { alert(e.message); }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div>
      <SectionHead title="Student Management" sub={`${total} students found`}>
        <button className="btn btn-ghost"><Upload size={13} /> Import Excel</button>
        <button className="btn btn-ghost"><Download size={13} /> Export</button>
        <button className="btn btn-primary" onClick={() => navigate("/add-student")}><Plus size={13} /> Add Student</button>
      </SectionHead>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#334155" }} />
          <input className="inp" style={{ paddingLeft: 34 }} placeholder="Search name, mobile, ID…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="inp" style={{ width: 180 }} value={courseF} onChange={e => { setCourseF(e.target.value); setPage(1); }}>
          <option value="">All Courses</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="inp" style={{ width: 140 }} value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          {["active","new_lead","follow_up","inactive"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="inp" style={{ width: 130 }} value={feesF} onChange={e => { setFeesF(e.target.value); setPage(1); }}>
          <option value="">All Fees</option>
          {["paid","pending","overdue","partial"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || courseF || statusF || feesF) && (
          <button className="btn btn-ghost" onClick={() => { setSearch(""); setCourseF(""); setStatusF(""); setFeesF(""); setPage(1); }}>
            <Filter size={13} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      {error   ? <PageError message={error} onRetry={() => setPage(p => p)} /> :
       loading  ? <Spinner text="Loading students…" /> :
       rows.length === 0 ? <EmptyState emoji="👤" title="No students found" sub="Try adjusting your filters" /> : (
        <>
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 14 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#080B14" }}>
                  {["#","Student","Mobile","Course","Fees","Counselor","Follow-up","Status","Actions"].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map(s => (
                  <tr key={s.id} className="tr-row" style={{ borderTop: "1px solid #1E2A45" }}>
                    <td className="mono" style={{ fontSize: 11, color: "#334155" }}>{s.student_code}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={s.full_name} size={32} fontSize={13} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}>{s.full_name}</p>
                          <p style={{ fontSize: 11, color: "#475569" }}>{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12.5, color: "#94A3B8" }}>{s.mobile}</td>
                    <td style={{ fontSize: 12.5, color: "#C084FC" }}>{s.course_name || "—"}</td>
                    <td>
                      <Badge status={feesLabel(s)} />
                      {s.total_fees && (
                        <p style={{ fontSize: 11, color: "#334155", marginTop: 3 }}>
                          ₹{Number(s.paid||0).toLocaleString()} / ₹{Number(s.total_fees).toLocaleString()}
                        </p>
                      )}
                    </td>
                    <td style={{ fontSize: 12.5, color: "#60A5FA" }}>{s.counselor_name || "—"}</td>
                    <td style={{ fontSize: 12, color: "#64748B" }}>{s.next_followup ? new Date(s.next_followup).toLocaleDateString("en-IN") : "—"}</td>
                    <td><Badge status={s.status} /></td>
                    <td>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button className="btn btn-ghost"   style={{ padding: "4px 7px" }} onClick={() => navigate(`/student-profile/${s.id}`)} title="View"><Eye size={12} /></button>
                        <button className="btn btn-ghost"   style={{ padding: "4px 7px" }} onClick={() => navigate(`/edit-student/${s.id}`)} title="Edit"><Edit size={12} /></button>
                        <button className="btn btn-success" style={{ padding: "4px 7px" }} title="WhatsApp"><MessageSquare size={12} /></button>
                        <button className="btn btn-danger"  style={{ padding: "4px 7px" }} onClick={() => handleDelete(s.id, s.full_name)} title="Delete"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 12, color: "#475569" }}>
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
            </p>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn btn-ghost" style={{ padding: "5px 10px" }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={14} /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                <button key={n} className="btn" onClick={() => setPage(n)}
                  style={{ padding: "5px 12px", background: page === n ? "linear-gradient(135deg,#2563EB,#7C3AED)" : "#131D35", color: page === n ? "#fff" : "#64748B", border: "1px solid #1E2A45" }}>
                  {n}
                </button>
              ))}
              <button className="btn btn-ghost" style={{ padding: "5px 10px" }} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight size={14} /></button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
