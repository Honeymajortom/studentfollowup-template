// src/pages/LeadProfile.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft, Phone, Mail, MapPin, BookOpen,
  User, Calendar, Edit, UserCheck, Trash2, Clock,
} from "lucide-react";
import { Avatar, Badge, Modal, FormField } from "../components/shared";
import { Spinner, PageError } from "../components/shared/Spinner";
import { useApi } from "../hooks/useApi";
import leadsApi from "../api/leads.api";
import coursesApi from "../api/courses.api";

const LEAD_STATUSES = [
  { value: "new",            label: "New",            color: "#60A5FA" },
  { value: "contacted",      label: "Contacted",      color: "#C084FC" },
  { value: "follow_up",      label: "Follow-up",      color: "#FB923C" },
  { value: "interested",     label: "Interested",     color: "#4ADE80" },
  { value: "hot_lead",       label: "Hot Lead",       color: "#F59E0B" },
  { value: "not_interested", label: "Not Interested", color: "#F87171" },
  { value: "converted",      label: "Converted",      color: "#4ADE80" },
  { value: "lost",           label: "Lost",           color: "#F87171" },
];

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
  return LEAD_STATUSES.find(l => l.value === s)?.label ?? s;
}

function InfoRow({ Icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #1E2A45" }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "#131D35", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={13} color="#60A5FA" />
      </div>
      <div>
        <p style={{ fontSize: 10, color: "#334155", fontWeight: 700, textTransform: "uppercase" }}>{label}</p>
        <p style={{ fontSize: 12.5, color: "#CBD5E1", fontWeight: 600 }}>{value || "—"}</p>
      </div>
    </div>
  );
}

// ── Status Update Modal ──────────────────────────────────────────────────────
function StatusModal({ open, onClose, lead, onSaved }) {
  const [status,  setStatus]  = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [apiErr,  setApiErr]  = useState("");

  useEffect(() => {
    if (lead) { setStatus(lead.status || "new"); setRemarks(""); }
    setApiErr("");
  }, [lead, open]);

  async function handleSave() {
    setSaving(true);
    setApiErr("");
    try {
      await leadsApi.update(lead.id, { status, remarks: remarks || undefined });
      onSaved();
      onClose();
    } catch (e) {
      setApiErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Update Lead Status" width={420}>
      {apiErr && (
        <div style={{ background: "#DC262618", border: "1px solid #DC262633", borderRadius: 9, padding: "9px 14px", marginBottom: 14, fontSize: 13, color: "#F87171" }}>
          ⚠️ {apiErr}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <FormField label="New Status" required>
          <select className="inp" value={status} onChange={e => setStatus(e.target.value)}>
            {LEAD_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Remarks (optional)">
          <textarea
            className="inp"
            rows={3}
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            placeholder="Add a note about this status change…"
            style={{ resize: "none" }}
          />
        </FormField>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Update Status"}
        </button>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

// ── Convert Modal (inline, reused from Leads.jsx pattern) ───────────────────
function ConvertModal({ open, onClose, lead, courses, onConverted }) {
  const [courseId,    setCourseId]    = useState("");
  const [batchTiming, setBatchTiming] = useState("");
  const [enrolledAt,  setEnrolledAt]  = useState(new Date().toISOString().split("T")[0]);
  const [converting,  setConverting]  = useState(false);
  const [apiErr,      setApiErr]      = useState("");

  useEffect(() => {
    if (lead) { setCourseId(lead.course_interest_id || ""); setApiErr(""); }
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
      <div style={{ background: "#131D35", borderRadius: 10, padding: "14px 16px", border: "1px solid #1E2A45", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={lead.name} size={40} fontSize={16} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>{lead.name}</p>
            <p style={{ fontSize: 12, color: "#94A3B8" }}>{lead.mobile} · {lead.course_name || "No course selected"}</p>
          </div>
        </div>
      </div>
      {apiErr && (
        <div style={{ background: "#DC262618", border: "1px solid #DC262633", borderRadius: 9, padding: "9px 14px", marginBottom: 14, fontSize: 13, color: "#F87171" }}>
          ⚠️ {apiErr}
        </div>
      )}
      <div style={{ background: "#2563EB0D", border: "1px solid #2563EB33", borderRadius: 9, padding: "10px 14px", marginBottom: 18, fontSize: 12.5, color: "#93C5FD", lineHeight: 1.6 }}>
        ℹ️ This will create a new Student record from this lead's data, then mark this lead as <b>Converted</b>.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <FormField label="Confirm Course" hint={lead.course_name ? `Currently: ${lead.course_name}` : ""}>
          <select className="inp" value={courseId} onChange={e => setCourseId(e.target.value)}>
            <option value="">Keep existing course interest</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>
        <FormField label="Batch Timing (optional)">
          <input className="inp" value={batchTiming} onChange={e => setBatchTiming(e.target.value)} placeholder="e.g. 9:00 AM – 11:00 AM" />
        </FormField>
        <FormField label="Admission Date">
          <input className="inp" type="date" value={enrolledAt} onChange={e => setEnrolledAt(e.target.value)} />
        </FormField>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button
          className="btn btn-primary"
          onClick={handleConvert}
          disabled={converting}
          style={{ background: "linear-gradient(135deg,#10B981,#059669)" }}
        >
          {converting ? "Converting…" : <><UserCheck size={14} /> Convert to Student</>}
        </button>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
      </div>
    </Modal>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function LeadProfile() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [statusModal,  setStatusModal]  = useState(false);
  const [convertModal, setConvertModal] = useState(false);
  const [courses,      setCourses]      = useState([]);

  const { data, loading, error, refetch } = useApi(() => leadsApi.getOne(id), [id]);
  const { data: tlData, loading: tlLoad } = useApi(() => leadsApi.timeline(id), [id]);

  useEffect(() => {
    coursesApi.list()
      .then(r => setCourses(r.data.data.courses || []))
      .catch(() => {});
  }, []);

  if (loading) return <Spinner text="Loading lead profile…" />;
  if (error)   return <PageError message={error} onRetry={refetch} />;

  const lead     = data?.lead || data?.data?.lead || data;
  const timeline = tlData?.timeline || tlData?.data?.timeline || [];

  if (!lead) return <PageError message="Lead not found" />;

  async function handleDelete() {
    if (!window.confirm(`Delete lead "${lead.name}"? This cannot be undone.`)) return;
    try {
      await leadsApi.remove(id);
      navigate("/leads");
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div>
      <button className="btn btn-ghost" style={{ marginBottom: 18 }} onClick={() => navigate("/leads")}>
        <ChevronLeft size={14} /> Back to Leads
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "270px 1fr", gap: 18 }}>
        {/* ── Left Panel ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Identity card */}
          <div className="card" style={{ padding: 22, textAlign: "center" }}>
            <Avatar name={lead.name} size={72} fontSize={28} />
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#F1F5F9", marginTop: 12, marginBottom: 3 }}>
              {lead.name}
            </h3>
            {lead.lead_code && (
              <p className="mono" style={{ fontSize: 11, color: "#475569", marginBottom: 10 }}>
                {lead.lead_code}
              </p>
            )}
            <span className={`badge badge-${STATUS_BADGE_MAP[lead.status] || "gray"}`}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
              {statusLabel(lead.status)}
            </span>

            {/* Quick actions */}
            <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setStatusModal(true)}>
                <Edit size={12} /> Status
              </button>
              {lead.status !== "converted" && (
                <button
                  className="btn"
                  style={{ fontSize: 12, background: "#10B98118", color: "#4ADE80", border: "1px solid #10B98133" }}
                  onClick={() => setConvertModal(true)}
                >
                  <UserCheck size={12} /> Convert
                </button>
              )}
              <button className="btn btn-danger" style={{ fontSize: 12 }} onClick={handleDelete}>
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>

          {/* Info rows */}
          <div className="card" style={{ padding: "14px 18px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#334155", textTransform: "uppercase", marginBottom: 6 }}>Contact</p>
            <InfoRow Icon={Phone}   label="Mobile"  value={lead.mobile} />
            <InfoRow Icon={Mail}    label="Email"   value={lead.email} />
            <InfoRow Icon={MapPin}  label="City"    value={lead.city} />
          </div>

          <div className="card" style={{ padding: "14px 18px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#334155", textTransform: "uppercase", marginBottom: 6 }}>Lead Details</p>
            <InfoRow Icon={BookOpen}  label="Course Interest"  value={lead.course_name} />
            <InfoRow Icon={User}      label="Assigned To"      value={lead.assigned_to_name} />
            <InfoRow Icon={Calendar}  label="Next Follow-up"   value={lead.next_followup ? new Date(lead.next_followup).toLocaleDateString("en-IN") : null} />
            <InfoRow Icon={Clock}     label="Source"           value={lead.source?.replace(/_/g, " ")} />
            {lead.college && <InfoRow Icon={BookOpen} label="College / School" value={lead.college} />}
          </div>

          {lead.remarks && (
            <div className="card" style={{ padding: "14px 18px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#334155", textTransform: "uppercase", marginBottom: 8 }}>Remarks</p>
              <p style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.6 }}>{lead.remarks}</p>
            </div>
          )}
        </div>

        {/* ── Right Panel — Timeline ── */}
        <div className="card" style={{ padding: 22 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 18 }}>Activity Timeline</p>

          {tlLoad ? (
            <Spinner text="Loading timeline…" />
          ) : timeline.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#334155" }}>
              <Clock size={32} style={{ marginBottom: 10, opacity: 0.4 }} />
              <p style={{ fontSize: 13 }}>No activity recorded yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {timeline.map((item, idx) => (
                <div key={idx} style={{ display: "flex", gap: 14, position: "relative" }}>
                  {/* Vertical line */}
                  {idx < timeline.length - 1 && (
                    <div style={{ position: "absolute", left: 15, top: 32, bottom: 0, width: 1, background: "#1E2A45" }} />
                  )}
                  {/* Dot */}
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#131D35", border: "2px solid #2563EB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <Clock size={12} color="#60A5FA" />
                  </div>
                  {/* Content */}
                  <div style={{ paddingBottom: 22, flex: 1 }}>
                    <p style={{ fontSize: 13, color: "#E2E8F0", fontWeight: 600 }}>{item.action || item.type || item.description}</p>
                    {item.notes && <p style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>{item.notes}</p>}
                    <p style={{ fontSize: 11, color: "#334155", marginTop: 4 }}>
                      {item.created_at ? new Date(item.created_at).toLocaleString("en-IN") : ""}
                      {item.actor_name ? ` · ${item.actor_name}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <StatusModal
        open={statusModal}
        onClose={() => setStatusModal(false)}
        lead={lead}
        onSaved={refetch}
      />
      <ConvertModal
        open={convertModal}
        onClose={() => setConvertModal(false)}
        lead={lead}
        courses={courses}
        onConverted={() => navigate("/leads")}
      />
    </div>
  );
}
