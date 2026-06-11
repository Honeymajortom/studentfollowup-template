// src/pages/Leads.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Download, Plus, Eye, Edit, Trash2,
  MessageSquare, ChevronLeft, ChevronRight,
  Filter, UserCheck, X, CheckCircle,
} from "lucide-react";
import { SectionHead, Badge, Avatar, Modal, FormField } from "../components/shared";
import { Spinner, PageError, EmptyState } from "../components/shared/Spinner";
import leadsApi  from "../api/leads.api";
import coursesApi from "../api/courses.api";
import staffApi   from "../api/staff.api";
import { validateLeadForm, hasErrors } from "../utils/validate";

// ── Constants ────────────────────────────────────────────────
const LIMIT = 8;

const LEAD_STATUSES = [
  { value: "new",          label: "New",          color: "#60A5FA" },
  { value: "contacted",    label: "Contacted",    color: "#C084FC" },
  { value: "follow_up",   label: "Follow-up",    color: "#FB923C" },
  { value: "interested",   label: "Interested",   color: "#4ADE80" },
  { value: "hot_lead",     label: "Hot Lead",     color: "#F59E0B" },
  { value: "not_interested",label:"Not Interested",color: "#F87171" },
  { value: "converted",    label: "Converted",    color: "#4ADE80" },
  { value: "lost",         label: "Lost",         color: "#F87171" },
];

const LEAD_SOURCES = [
  "college_visit","walk_in","website","whatsapp",
  "facebook","referral","job_fair","home_visit","other",
];

// Maps backend status string → badge class
const STATUS_BADGE_MAP = {
  new:            "info",
  contacted:      "purple",
  follow_up:      "warning",
  interested:     "success",
  hot_lead:       "warning",
  not_interested: "danger",
  converted:      "success",
  lost:           "danger",
};

function statusLabel(s) {
  const found = LEAD_STATUSES.find(l => l.value === s);
  return found ? found.label : s;
}

// ── Add / Edit Lead Modal ────────────────────────────────────
const LEAD_INIT = {
  name: "", mobile: "", email: "", city: "", college: "",
  course_interest_id: "", source: "walk_in",
  assigned_to: "", next_followup: "", remarks: "",
};

function LeadFormModal({ open, onClose, lead, courses, counselors, onSaved }) {
  const [form,    setForm]    = useState(LEAD_INIT);
  const [saving,  setSaving]  = useState(false);
  const [apiErr,  setApiErr]  = useState("");
  const [errors,  setErrors]  = useState({});
  const set = k => e => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors(p => { const n = { ...p }; delete n[k]; return n; });
  };

  // Pre-fill when editing
  useEffect(() => {
    if (lead) {
      setForm({
        name:               lead.name               || "",
        mobile:             lead.mobile             || "",
        email:              lead.email              || "",
        city:               lead.city               || "",
        college:            lead.college            || "",
        course_interest_id: lead.course_interest_id || "",
        source:             lead.source             || "walk_in",
        assigned_to:        lead.assigned_to        || "",
        next_followup:      lead.next_followup
                              ? lead.next_followup.split("T")[0]
                              : "",
        remarks:            lead.remarks            || "",
      });
    } else {
      setForm(LEAD_INIT);
    }
    setApiErr("");
    setErrors({});
  }, [lead, open]);

  async function handleSave() {
    const errs = validateLeadForm(form);
    if (hasErrors(errs)) { setErrors(errs); return; }
    setSaving(true);
    setApiErr("");
    try {
      if (lead) {
        await leadsApi.update(lead.id, form);
      } else {
        await leadsApi.create(form);
      }
      onSaved();
      onClose();
    } catch (e) {
      setApiErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lead ? `Edit Lead — ${lead.name}` : "Add New Lead"}
      width={560}
    >
      {apiErr && (
        <div style={{ background: "#DC262618", border: "1px solid #DC262633", borderRadius: 9,
          padding: "9px 14px", marginBottom: 16, fontSize: 13, color: "#F87171" }}>
          ⚠️ {apiErr}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FormField label="Full Name" required col="1/-1" error={errors.name}>
          <input className="inp" value={form.name} onChange={set("name")} placeholder="e.g. Rahul Sharma" />
        </FormField>

        <FormField label="Mobile Number" required col="1" error={errors.mobile}>
          <input className="inp" value={form.mobile} onChange={set("mobile")} placeholder="9XXXXXXXXX" />
        </FormField>

        <FormField label="Email" col="2" error={errors.email}>
          <input className="inp" type="email" value={form.email} onChange={set("email")} placeholder="email@example.com" />
        </FormField>

        <FormField label="City" col="1">
          <input className="inp" value={form.city} onChange={set("city")} placeholder="e.g. Nagpur" />
        </FormField>

        <FormField label="College / School" col="2">
          <input className="inp" value={form.college} onChange={set("college")} placeholder="College name" />
        </FormField>

        <FormField label="Course Interested" col="1">
          <select className="inp" value={form.course_interest_id} onChange={set("course_interest_id")}>
            <option value="">Select course…</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Lead Source" col="2">
          <select className="inp" value={form.source} onChange={set("source")}>
            {LEAD_SOURCES.map(s => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Assigned Counselor" col="1">
          <select className="inp" value={form.assigned_to} onChange={set("assigned_to")}>
            <option value="">Select counselor…</option>
            {counselors.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Next Follow-up Date" col="2">
          <input className="inp" type="date" value={form.next_followup} onChange={set("next_followup")} />
        </FormField>

        <FormField label="Remarks" col="1/-1">
          <textarea
            className="inp"
            rows={3}
            value={form.remarks}
            onChange={set("remarks")}
            placeholder="Any notes about this lead…"
            style={{ resize: "none" }}
          />
        </FormField>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || hasErrors(errors)}>
          {saving ? "Saving…" : <><CheckCircle size={13} /> {lead ? "Update Lead" : "Add Lead"}</>}
        </button>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

// ── Convert to Student Modal ─────────────────────────────────
function ConvertModal({ open, onClose, lead, courses, onConverted }) {
  const [courseId,     setCourseId]     = useState("");
  const [batchTiming,  setBatchTiming]  = useState("");
  const [enrolledAt,   setEnrolledAt]   = useState(
    new Date().toISOString().split("T")[0]
  );
  const [converting, setConverting] = useState(false);
  const [apiErr,     setApiErr]     = useState("");

  useEffect(() => {
    if (lead) {
      setCourseId(lead.course_interest_id || "");
      setApiErr("");
    }
  }, [lead, open]);

  async function handleConvert() {
    setConverting(true);
    setApiErr("");
    try {
      await leadsApi.convert(lead.id, {
        course_id:    courseId || undefined,
        batch_timing: batchTiming || undefined,
        enrolled_at:  enrolledAt,
      });
      onConverted();
      onClose();
    } catch (e) {
      setApiErr(e.message);
    } finally {
      setConverting(false);
    }
  }

  if (!lead) return null;

  return (
    <Modal open={open} onClose={onClose} title="Convert Lead to Student" width={480}>
      {/* Lead summary */}
      <div style={{
        background: "#131D35", borderRadius: 10, padding: "14px 16px",
        border: "1px solid #1E2A45", marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={lead.name} size={40} fontSize={16} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>{lead.name}</p>
            <p style={{ fontSize: 12, color: "#94A3B8" }}>
              {lead.mobile} · {lead.course_name || "No course selected"}
            </p>
          </div>
        </div>
      </div>

      {apiErr && (
        <div style={{ background: "#DC262618", border: "1px solid #DC262633", borderRadius: 9,
          padding: "9px 14px", marginBottom: 14, fontSize: 13, color: "#F87171" }}>
          ⚠️ {apiErr}
        </div>
      )}

      {/* Info note */}
      <div style={{ background: "#2563EB0D", border: "1px solid #2563EB33", borderRadius: 9,
        padding: "10px 14px", marginBottom: 18, fontSize: 12.5, color: "#93C5FD", lineHeight: 1.6 }}>
        ℹ️ This will create a new Student record from this lead's data, then mark this
        lead as <b>Converted</b>. You can update fees and batch details after admission.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <FormField
          label="Confirm Course"
          hint={lead.course_name ? `Currently: ${lead.course_name}` : ""}
        >
          <select
            className="inp"
            value={courseId}
            onChange={e => setCourseId(e.target.value)}
          >
            <option value="">Keep existing course interest</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Batch Timing (optional)">
          <input
            className="inp"
            value={batchTiming}
            onChange={e => setBatchTiming(e.target.value)}
            placeholder="e.g. 9:00 AM – 11:00 AM"
          />
        </FormField>

        <FormField label="Admission Date">
          <input
            className="inp"
            type="date"
            value={enrolledAt}
            onChange={e => setEnrolledAt(e.target.value)}
          />
        </FormField>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button
          className="btn btn-primary"
          onClick={handleConvert}
          disabled={converting}
          style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}
        >
          {converting
            ? "Converting…"
            : <><UserCheck size={14} /> Convert to Student</>
          }
        </button>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function Leads() {
  const navigate = useNavigate();

  const [rows,     setRows]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [courses,  setCourses]  = useState([]);
  const [counselors, setCounselors] = useState([]);

  // Filters
  const [search,   setSearch]   = useState("");
  const [courseF,  setCourseF]  = useState("");
  const [statusF,  setStatusF]  = useState("");
  const [counselorF, setCounselorF] = useState("");
  const [page,     setPage]     = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals
  const [addModal,     setAddModal]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [convertTarget, setConvertTarget] = useState(null);

  // ── Load dropdown data once ─────────────────────────────
  useEffect(() => {
    coursesApi.list()
      .then(r => setCourses(r.data.data.courses || []))
      .catch(() => {});

    staffApi.list()
      .then(r => {
        const all = r.data.data.staff || [];
        setCounselors(all.filter(s =>
          s.role === "counselor" ||
          s.role === "admin"     ||
          s.role === "Senior Counselor"
        ));
      })
      .catch(() => {});
  }, []);

  // ── Fetch leads on filter / page change ─────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);

    leadsApi.list({
      search,
      course_interest_id: courseF   || undefined,
      status:             statusF   || undefined,
      assigned_to:        counselorF || undefined,
      page,
      limit: LIMIT,
    })
      .then(r => {
        const d = r.data.data;
        setRows(d.rows || []);
        setTotal(d.pagination?.total || 0);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [search, courseF, statusF, counselorF, page, refreshKey]);

  // ── Helpers ──────────────────────────────────────────────
  function resetFilters() {
    setSearch(""); setCourseF(""); setStatusF(""); setCounselorF(""); setPage(1);
  }

  function reload() {
    if (page === 1) {
      setRefreshKey(k => k + 1);
    } else {
      setPage(1);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete lead "${name}"? This cannot be undone.`)) return;
    try {
      await leadsApi.remove(id);
      setRows(prev => prev.filter(l => l.id !== id));
      setTotal(prev => prev - 1);
    } catch (e) {
      alert(e.message);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const hasFilters = search || courseF || statusF || counselorF;

  // ── Render ───────────────────────────────────────────────
  return (
    <div>
      <SectionHead title="Leads" sub={`${total} lead${total !== 1 ? "s" : ""} found`}>
        <button className="btn btn-ghost">
          <Download size={13} /> Export
        </button>
        <button className="btn btn-primary" onClick={() => setAddModal(true)}>
          <Plus size={13} /> Add Lead
        </button>
      </SectionHead>

      {/* ── Filter Bar ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search
            size={13}
            style={{
              position: "absolute", left: 11,
              top: "50%", transform: "translateY(-50%)",
              color: "#334155",
            }}
          />
          <input
            className="inp"
            style={{ paddingLeft: 34 }}
            placeholder="Search name, mobile, email, lead code…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Course filter */}
        <select
          className="inp"
          style={{ width: 200 }}
          value={courseF}
          onChange={e => { setCourseF(e.target.value); setPage(1); }}
        >
          <option value="">All Courses</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          className="inp"
          style={{ width: 160 }}
          value={statusF}
          onChange={e => { setStatusF(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          {LEAD_STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Counselor filter */}
        <select
          className="inp"
          style={{ width: 180 }}
          value={counselorF}
          onChange={e => { setCounselorF(e.target.value); setPage(1); }}
        >
          <option value="">All Counselors</option>
          {counselors.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button className="btn btn-ghost" onClick={resetFilters}>
            <Filter size={13} /> Clear
          </button>
        )}
      </div>

      {/* ── Table / States ── */}
      {error ? (
        <PageError message={error} onRetry={reload} />
      ) : loading ? (
        <Spinner text="Loading leads…" />
      ) : rows.length === 0 ? (
        <EmptyState
          emoji="🎯"
          title="No leads found"
          sub={hasFilters ? "Try adjusting your filters" : "Add your first lead to get started"}
          action={hasFilters ? undefined : { label: "+ Add Lead", onClick: () => setAddModal(true) }}
        />
      ) : (
        <>
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 14 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#080B14" }}>
                  {[
                    "Lead Code", "Name", "Mobile",
                    "Course Interested", "Counselor",
                    "Next Follow-up", "Status", "Actions",
                  ].map(h => (
                    <th key={h} style={{
                      padding: "12px 16px", textAlign: "left",
                      fontSize: 11, fontWeight: 700, color: "#334155",
                      textTransform: "uppercase", letterSpacing: ".05em",
                      whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(lead => (
                  <tr
                    key={lead.id}
                    className="tr-row"
                    style={{ borderTop: "1px solid #1E2A45" }}
                  >
                    {/* Lead Code */}
                    <td style={{ padding: "12px 16px" }}>
                      <span className="mono" style={{ fontSize: 12, color: "#60A5FA" }}>
                        {lead.lead_code}
                      </span>
                    </td>

                    {/* Name + email */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={lead.name} size={32} fontSize={13} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}>
                            {lead.name}
                          </p>
                          {lead.email && (
                            <p style={{ fontSize: 11, color: "#475569" }}>{lead.email}</p>
                          )}
                          {lead.city && (
                            <p style={{ fontSize: 11, color: "#475569" }}>{lead.city}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Mobile */}
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#94A3B8" }}>
                      {lead.mobile}
                    </td>

                    {/* Course Interested */}
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#C084FC" }}>
                      {lead.course_name || "—"}
                    </td>

                    {/* Counselor */}
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#60A5FA" }}>
                      {lead.assigned_to_name || "—"}
                    </td>

                    {/* Next Follow-up */}
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#64748B" }}>
                      {lead.next_followup
                        ? new Date(lead.next_followup).toLocaleDateString("en-IN")
                        : "—"}
                    </td>

                    {/* Status badge */}
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        className={`badge badge-${STATUS_BADGE_MAP[lead.status] || "gray"}`}
                      >
                        <span style={{
                          width: 5, height: 5, borderRadius: "50%",
                          background: "currentColor", display: "inline-block",
                        }} />
                        {statusLabel(lead.status)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        {/* View */}
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "4px 7px" }}
                          title="View"
                          onClick={() => navigate(`/lead-profile/${lead.id}`)}
                        >
                          <Eye size={12} />
                        </button>

                        {/* Edit */}
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "4px 7px" }}
                          title="Edit"
                          onClick={() => setEditTarget(lead)}
                        >
                          <Edit size={12} />
                        </button>

                        {/* WhatsApp */}
                        <button
                          className="btn btn-success"
                          style={{ padding: "4px 7px" }}
                          title="Send WhatsApp"
                        >
                          <MessageSquare size={12} />
                        </button>

                        {/* Convert to Student — hide if already converted */}
                        {lead.status !== "converted" && (
                          <button
                            className="btn"
                            style={{
                              padding: "4px 8px", fontSize: 11,
                              background: "#10B98118", color: "#4ADE80",
                              border: "1px solid #10B98133",
                            }}
                            title="Convert to Student"
                            onClick={() => setConvertTarget(lead)}
                          >
                            <UserCheck size={12} />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          className="btn btn-danger"
                          style={{ padding: "4px 7px" }}
                          title="Delete"
                          onClick={() => handleDelete(lead.id, lead.name)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 12, color: "#475569" }}>
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
            </p>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                className="btn btn-ghost"
                style={{ padding: "5px 10px" }}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  className="btn"
                  onClick={() => setPage(n)}
                  style={{
                    padding: "5px 12px",
                    background: page === n
                      ? "linear-gradient(135deg,#2563EB,#7C3AED)"
                      : "#131D35",
                    color: page === n ? "#fff" : "#64748B",
                    border: "1px solid #1E2A45",
                  }}
                >
                  {n}
                </button>
              ))}

              <button
                className="btn btn-ghost"
                style={{ padding: "5px 10px" }}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Add / Edit Modal ── */}
      <LeadFormModal
        open={addModal || !!editTarget}
        onClose={() => { setAddModal(false); setEditTarget(null); }}
        lead={editTarget}
        courses={courses}
        counselors={counselors}
        onSaved={reload}
      />

      {/* ── Convert to Student Modal ── */}
      <ConvertModal
        open={!!convertTarget}
        onClose={() => setConvertTarget(null)}
        lead={convertTarget}
        courses={courses}
        onConverted={() => {
          setConvertTarget(null);
          reload();
        }}
      />
    </div>
  );
}