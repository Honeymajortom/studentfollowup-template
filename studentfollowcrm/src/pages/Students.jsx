// src/pages/Students.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Upload, Plus, Eye, Edit, Trash2,
  MessageSquare, ChevronLeft, ChevronRight, Filter, UserCheck, X,
} from "lucide-react";
import { SectionHead, Badge, Avatar, Modal, FormField, ExportMenu } from "../components/shared";
import { Spinner, PageError, EmptyState } from "../components/shared/Spinner";
import studentsApi from "../api/students.api";
import coursesApi  from "../api/courses.api";
import staffApi    from "../api/staff.api";
import { useIsMobile } from "../hooks/useIsMobile";

const LIMIT = 8;

function feesLabel(s) {
  if (!s.fees_status) return "—";
  return s.fees_status.charAt(0).toUpperCase() + s.fees_status.slice(1);
}

// Checkbox styled for the dark theme
function Checkbox({ checked, onChange, indeterminate = false }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={el => el && (el.indeterminate = indeterminate)}
      onChange={onChange}
      style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#2563EB", flexShrink: 0 }}
    />
  );
}

function StudentCard({ s, selected, onToggle, onView, onEdit, onDelete }) {
  return (
    <div className="card" style={{ padding: "14px 16px", background: selected ? "#131D3580" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <Checkbox checked={selected} onChange={onToggle} />
        <Avatar name={s.full_name} size={38} fontSize={15} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: "#E2E8F0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.full_name}</p>
          <p style={{ fontSize: 11, color: "#475569" }}>{s.student_code} · {s.mobile}</p>
        </div>
        <Badge status={s.status} />
      </div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 10 }}>
        {s.course_name && (
          <span style={{ fontSize: 11.5, color: "#C084FC", background: "#7C3AED11", padding: "2px 9px", borderRadius: 20, border: "1px solid #7C3AED22" }}>{s.course_name}</span>
        )}
        <Badge status={feesLabel(s)} />
        {s.total_fees && (
          <span style={{ fontSize: 11, color: "#475569" }}>₹{Number(s.paid || 0).toLocaleString()} / ₹{Number(s.total_fees).toLocaleString()}</span>
        )}
        {s.counselor_name && (
          <span style={{ fontSize: 11, color: "#60A5FA" }}>👤 {s.counselor_name}</span>
        )}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 10px", flex: 1, justifyContent: "center" }} onClick={onView}><Eye size={12} /> View</button>
        <button className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 10px", flex: 1, justifyContent: "center" }} onClick={onEdit}><Edit size={12} /> Edit</button>
        <button className="btn btn-danger" style={{ fontSize: 12, padding: "5px 8px" }} onClick={onDelete}><Trash2 size={12} /></button>
      </div>
    </div>
  );
}

export default function Students() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [rows,    setRows]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [courses, setCourses] = useState([]);
  const [counselors, setCounselors] = useState([]);

  // Filters
  const [search,  setSearch]  = useState("");
  const [courseF, setCourseF] = useState("");
  const [statusF, setStatusF] = useState("");
  const [feesF,   setFeesF]   = useState("");
  const [page,    setPage]    = useState(1);

  // Bulk selection
  const [selected,     setSelected]     = useState(new Set());
  const [assignModal,  setAssignModal]  = useState(false);
  const [assignTarget, setAssignTarget] = useState("");
  const [assigning,    setAssigning]    = useState(false);
  const [assignMsg,    setAssignMsg]    = useState("");

  useEffect(() => {
    coursesApi.list().then(r => setCourses(r.data.data.courses || [])).catch(() => {});
    staffApi.list().then(r => {
      const all = r.data.data.staff || [];
      setCounselors(all.filter(s => s.role === "counselor" || s.role === "admin"));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSelected(new Set()); // clear selection on filter/page change
    studentsApi.list({ search, course_id: courseF, status: statusF, fees_status: feesF, page, limit: LIMIT })
      .then(r => {
        const d = r.data.data;
        setRows(d.rows || []);
        setTotal(d.pagination?.total || 0);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, courseF, statusF, feesF, page]);

  // ── Selection helpers ──────────────────────────────────────
  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(prev =>
      prev.size === rows.length ? new Set() : new Set(rows.map(r => r.id))
    );
  }

  const allSelected   = rows.length > 0 && selected.size === rows.length;
  const someSelected  = selected.size > 0 && selected.size < rows.length;

  // ── Export ─────────────────────────────────────────────────
  const [exporting, setExporting] = useState(false);
  async function handleExport(format) {
    setExporting(true);
    try {
      const res = await studentsApi.export({ format, search, course_id: courseF, status: statusF, fees_status: feesF });
      const mime = format === "pdf" ? "application/pdf" : "text/csv";
      const url  = URL.createObjectURL(new Blob([res.data], { type: mime }));
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `students-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (e) { alert("Export failed: " + e.message); }
    finally { setExporting(false); }
  }

  // ── Bulk assign ────────────────────────────────────────────
  async function handleBulkAssign() {
    if (!assignTarget) return;
    setAssigning(true);
    setAssignMsg("");
    try {
      const res = await studentsApi.bulkAssign({
        student_ids:  Array.from(selected),
        counselor_id: assignTarget,
      });
      setAssignMsg(res.data.message);
      setSelected(new Set());
      // Refresh list
      studentsApi.list({ search, course_id: courseF, status: statusF, fees_status: feesF, page, limit: LIMIT })
        .then(r => setRows(r.data.data.rows || []));
      setTimeout(() => { setAssignModal(false); setAssignMsg(""); setAssignTarget(""); }, 1500);
    } catch (e) {
      setAssignMsg("Error: " + e.message);
    } finally {
      setAssigning(false);
    }
  }

  // ── Delete ─────────────────────────────────────────────────
  async function handleDelete(id, name) {
    if (!window.confirm(`Delete student "${name}"? This cannot be undone.`)) return;
    try {
      await studentsApi.remove(id);
      setRows(prev => prev.filter(s => s.id !== id));
      setTotal(prev => prev - 1);
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    } catch (e) { alert(e.message); }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div>
      <SectionHead title="Student Management" sub={`${total} students found`}>
        <button className="btn btn-ghost"><Upload size={13} /> Import Excel</button>
        <ExportMenu onExport={handleExport} loading={exporting} />
        <button className="btn btn-primary" onClick={() => navigate("/add-student")}><Plus size={13} /> Add Student</button>
      </SectionHead>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
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

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#131D35", border: "1px solid #2563EB44", borderRadius: 10, padding: "9px 16px", marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: "#60A5FA", fontWeight: 700 }}>
            {selected.size} student{selected.size !== 1 ? "s" : ""} selected
          </span>
          <div style={{ width: 1, height: 18, background: "#1E2A45" }} />
          <button
            className="btn btn-primary"
            style={{ fontSize: 12, padding: "5px 12px" }}
            onClick={() => { setAssignTarget(""); setAssignMsg(""); setAssignModal(true); }}
          >
            <UserCheck size={13} /> Assign Counselor
          </button>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: "5px 10px", marginLeft: "auto" }}
            onClick={() => setSelected(new Set())}
          >
            <X size={13} /> Clear
          </button>
        </div>
      )}

      {/* Table */}
      {error ? <PageError message={error} onRetry={() => setPage(p => p)} /> :
       loading ? <Spinner text="Loading students…" /> :
       rows.length === 0 ? (
        search || courseF || statusF || feesF
          ? <EmptyState emoji="🔍" title="No students match your filters"
              sub="Try adjusting your search or filters"
              action={{ label: "Clear Filters", onClick: () => { setSearch(""); setCourseF(""); setStatusF(""); setFeesF(""); setPage(1); } }} />
          : <EmptyState emoji="👤" title="No students yet"
              sub="Add your first student to get started"
              action={{ label: "+ Add Student", onClick: () => navigate("/add-student") }} />
       ) : (
        <>
          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
              {rows.map(s => (
                <StudentCard key={s.id} s={s}
                  selected={selected.has(s.id)}
                  onToggle={() => toggleSelect(s.id)}
                  onView={() => navigate(`/student-profile/${s.id}`)}
                  onEdit={() => navigate(`/edit-student/${s.id}`)}
                  onDelete={() => handleDelete(s.id, s.full_name)}
                />
              ))}
            </div>
          ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 14 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#080B14" }}>
                  <th style={{ padding: "12px 14px", width: 40 }}>
                    <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
                  </th>
                  {["#","Student","Mobile","Course","Fees","Counselor","Follow-up","Status","Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: ".05em", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(s => (
                  <tr
                    key={s.id}
                    className="tr-row"
                    style={{ borderTop: "1px solid #1E2A45", background: selected.has(s.id) ? "#131D3580" : undefined }}
                  >
                    <td style={{ padding: "12px 14px" }}>
                      <Checkbox checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} />
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 11, color: "#334155", fontFamily: "monospace" }}>{s.student_code}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={s.full_name} size={32} fontSize={13} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}>{s.full_name}</p>
                          <p style={{ fontSize: 11, color: "#475569" }}>{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#94A3B8" }}>{s.mobile}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#C084FC" }}>{s.course_name || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge status={feesLabel(s)} />
                      {s.total_fees && (
                        <p style={{ fontSize: 11, color: "#334155", marginTop: 3 }}>
                          ₹{Number(s.paid||0).toLocaleString()} / ₹{Number(s.total_fees).toLocaleString()}
                        </p>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#60A5FA" }}>{s.counselor_name || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748B" }}>{s.next_followup ? new Date(s.next_followup).toLocaleDateString("en-IN") : "—"}</td>
                    <td style={{ padding: "12px 16px" }}><Badge status={s.status} /></td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button className="btn btn-ghost" style={{ padding: "4px 7px" }} onClick={() => navigate(`/student-profile/${s.id}`)} title="View"><Eye size={12} /></button>
                        <button className="btn btn-ghost" style={{ padding: "4px 7px" }} onClick={() => navigate(`/edit-student/${s.id}`)} title="Edit"><Edit size={12} /></button>
                        <button className="btn btn-success" style={{ padding: "4px 7px" }} title="WhatsApp"><MessageSquare size={12} /></button>
                        <button className="btn btn-danger" style={{ padding: "4px 7px" }} onClick={() => handleDelete(s.id, s.full_name)} title="Delete"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}

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

      {/* Assign Counselor Modal */}
      <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Assign Counselor" width={420}>
        <p style={{ fontSize: 13, color: "#64748B", marginBottom: 18 }}>
          Assign <b style={{ color: "#60A5FA" }}>{selected.size} student{selected.size !== 1 ? "s" : ""}</b> to a counselor.
        </p>
        <FormField label="Select Counselor" required>
          <select className="inp" value={assignTarget} onChange={e => setAssignTarget(e.target.value)}>
            <option value="">Choose counselor…</option>
            {counselors.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
            ))}
          </select>
        </FormField>
        {assignMsg && (
          <p style={{ marginTop: 12, fontSize: 13, color: assignMsg.startsWith("Error") ? "#F87171" : "#4ADE80" }}>
            {assignMsg.startsWith("Error") ? "⚠" : "✓"} {assignMsg}
          </p>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            className="btn btn-primary"
            onClick={handleBulkAssign}
            disabled={!assignTarget || assigning}
          >
            {assigning ? "Assigning…" : <><UserCheck size={13} /> Assign</>}
          </button>
          <button className="btn btn-ghost" onClick={() => setAssignModal(false)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
