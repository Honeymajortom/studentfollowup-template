// src/pages/Followups.jsx
import { useState } from "react";
import { Plus, Phone, MessageSquare, RefreshCw, CheckCircle } from "lucide-react";
import { SectionHead, Badge, Avatar, Modal, FormField } from "../components/shared";
import { Spinner, PageError, EmptyState } from "../components/shared/Spinner";
import { useApi, useMutation } from "../hooks/useApi";
import followupsApi from "../api/followups.api";
import studentsApi  from "../api/students.api";
import { validateFollowupForm, validateCompleteForm, hasErrors } from "../utils/validate";

const FILTERS = ["All", "scheduled", "pending", "overdue", "new"];
const OUTCOMES = ["Enrolled", "Interested — follow up again", "Not Interested", "Not Reachable", "Demo Scheduled", "Payment Received"];

export default function Followups() {
  const [filterTab, setFilterTab] = useState("All");
  const [modal, setModal] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFollowup, setNewFollowup] = useState({
    student_id: "", type: "call", scheduled_at: "", notes: "", next_date: "",
  });
  const [addErrors,  setAddErrors]  = useState({});
  const [popup,      setPopup]      = useState({ outcome: "", notes: "", next_date: "", status: "completed" });
  const [popupErrors, setPopupErrors] = useState({});

  const today = new Date().toISOString().split("T")[0];
  const { data: summaryData } = useApi(() => followupsApi.todaySummary());

  const { data, loading, error, refetch } = useApi(
    () => followupsApi.list({ date: today, status: filterTab === "All" ? undefined : filterTab, limit: 20 }),
    [filterTab]
  );
  const { data: studentsData } = useApi(() => studentsApi.list({ limit: 200 }));
  const { mutate: completeFollow, loading: completing } = useMutation((d) => followupsApi.complete(modal?.id, d));
  const { mutate: createFollowup, loading: creating   } = useMutation((d) => followupsApi.create(d));

  const allStudents = studentsData?.rows || [];

  const followups = data?.rows || [];
  const summary = summaryData?.summary || {};

  async function handleComplete() {
    const errs = validateCompleteForm(popup);
    if (hasErrors(errs)) { setPopupErrors(errs); return; }
    try {
      await completeFollow(popup);
      setModal(null);
      setPopupErrors({});
      refetch();
    } catch (e) { alert(e.message); }
  }

  async function handleAddFollowup() {
    const errs = validateFollowupForm(newFollowup);
    if (hasErrors(errs)) { setAddErrors(errs); return; }
    try {
      await createFollowup(newFollowup);
      setShowAddModal(false);
      setNewFollowup({ student_id: "", type: "call", scheduled_at: "", notes: "", next_date: "" });
      setAddErrors({});
      refetch();
    } catch (e) { alert(e.message); }
  }

  const setNew = k => e => {
    setNewFollowup(p => ({ ...p, [k]: e.target.value }));
    if (addErrors[k]) setAddErrors(p => { const n = { ...p }; delete n[k]; return n; });
  };

  return (
    <div>
      <SectionHead title="Follow-up Management" sub="Track, schedule and complete all student follow-ups">
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={13} /> Add Follow-up
        </button>
      </SectionHead>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 18 }}>
        {/* Summary sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#F1F5F9", marginBottom: 14 }}>Today's Summary</p>
            {[["Total", summary.total, "#E2E8F0"],
            ["Completed", summary.completed, "#4ADE80"],
            ["Pending", summary.pending, "#FB923C"],
            ["Overdue", summary.overdue, "#F87171"],
            ].map(([l, v, c]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #1E2A45" }}>
                <span style={{ fontSize: 12.5, color: "#64748B" }}>{l}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: c }}>{v ?? "—"}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9", marginBottom: 10 }}>Legend</p>
            {[["#2563EB", "Scheduled"], ["#F59E0B", "Pending"], ["#EF4444", "Overdue"], ["#10B981", "Completed"]].map(([c, l]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, fontSize: 12.5, color: "#94A3B8" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />{l}
              </div>
            ))}
          </div>
        </div>

        {/* Follow-up cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {FILTERS.map(f => (
              <button key={f} className={`tab-btn ${filterTab === f ? "active" : ""}`} onClick={() => setFilterTab(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {error ? <PageError message={error} onRetry={refetch} /> :
            loading ? <Spinner text="Loading follow-ups…" /> :
              followups.length === 0 ? (
                <EmptyState
                  emoji="📅"
                  title={filterTab === "All" ? "No follow-ups yet" : `No ${filterTab} follow-ups`}
                  sub={filterTab === "All" ? "Schedule your first follow-up to get started" : "Try switching to a different filter"}
                  action={{ label: "+ Schedule Follow-up", onClick: () => setShowAddModal(true) }}
                />
              ) :
                followups.map(f => (
                  <div key={f.id} className="card card-hover" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                    <div style={{ display: "flex", gap: 14, flex: 1 }}>
                      <Avatar name={f.student_name} size={42} fontSize={16} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                          <p style={{ fontSize: 14, fontWeight: 800, color: "#E2E8F0" }}>{f.student_name}</p>
                          <Badge status={f.status.charAt(0).toUpperCase() + f.status.slice(1)} />
                          <span style={{ fontSize: 12, color: "#60A5FA", marginLeft: "auto" }}>
                            ⏰ {new Date(f.scheduled_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p style={{ fontSize: 12.5, color: "#7C3AED", marginBottom: 6 }}>{f.course_name || "—"}</p>
                        {f.notes && <p style={{ fontSize: 12.5, color: "#94A3B8" }}>📝 {f.notes}</p>}
                        <p style={{ fontSize: 11.5, color: "#334155", marginTop: 5 }}>
                          📱 {f.student_mobile} · Assigned: {f.assigned_to_name || "—"}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7, flexShrink: 0 }}>
                      <button className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: 12 }}><Phone size={12} /> Call</button>
                      <button className="btn btn-success" style={{ padding: "6px 12px", fontSize: 12 }}><MessageSquare size={12} /> WhatsApp</button>
                      <button className="btn btn-warning" style={{ padding: "6px 12px", fontSize: 12 }}><RefreshCw size={12} /> Reschedule</button>
                      <button className="btn btn-primary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setModal(f)}>
                        <CheckCircle size={12} /> Complete
                      </button>
                    </div>
                  </div>
                ))}
        </div>
      </div>

      {/* Complete modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title="Complete Follow-up" width={480}>
        {modal && (
          <>
            <div style={{ background: "#131D35", borderRadius: 10, padding: "12px 16px", marginBottom: 18, border: "1px solid #1E2A45" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#E2E8F0" }}>{modal.student_name}</p>
              <p style={{ fontSize: 12, color: "#7C3AED" }}>{modal.course_name}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <FormField label="Call Outcome" required error={popupErrors.outcome}>
                <select
                  className="inp"
                  value={popup.outcome}
                  onChange={e => { setPopup(p => ({ ...p, outcome: e.target.value })); if (popupErrors.outcome) setPopupErrors(p => { const n={...p}; delete n.outcome; return n; }); }}
                >
                  <option value="">Select outcome…</option>
                  {OUTCOMES.map(o => <option key={o}>{o}</option>)}
                </select>
              </FormField>
              <FormField label="Notes">
                <textarea className="inp" rows={3} placeholder="What was discussed…" value={popup.notes} onChange={e => setPopup(p => ({ ...p, notes: e.target.value }))} />
              </FormField>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <FormField label="Next Follow-up Date" col="1">
                  <input className="inp" type="date" value={popup.next_date} onChange={e => setPopup(p => ({ ...p, next_date: e.target.value }))} />
                </FormField>
                <FormField label="Update Status" required col="2" error={popupErrors.status}>
                  <select
                    className="inp"
                    value={popup.status}
                    onChange={e => { setPopup(p => ({ ...p, status: e.target.value })); if (popupErrors.status) setPopupErrors(p => { const n={...p}; delete n.status; return n; }); }}
                  >
                    {["completed", "rescheduled", "no_answer", "enrolled"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn btn-primary" onClick={handleComplete} disabled={completing}>
                {completing ? "Saving…" : <><CheckCircle size={13} /> Save & Complete</>}
              </button>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </>
        )}
      </Modal>
      <Modal open={showAddModal} onClose={() => { setShowAddModal(false); setAddErrors({}); }} title="Add Follow-up" width={500}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FormField label="Student" required error={addErrors.student_id}>
            <select
              className="inp"
              value={newFollowup.student_id}
              onChange={setNew("student_id")}
            >
              <option value="">Select student…</option>
              {allStudents.map(s => (
                <option key={s.id} value={s.id}>{s.full_name} — {s.mobile}</option>
              ))}
            </select>
          </FormField>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <FormField label="Type" col="1">
              <select className="inp" value={newFollowup.type} onChange={setNew("type")}>
                {["call", "whatsapp", "walk_in", "video_call", "email"].map(t => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Scheduled Date & Time" required col="2" error={addErrors.scheduled_at}>
              <input
                className="inp"
                type="datetime-local"
                value={newFollowup.scheduled_at}
                onChange={setNew("scheduled_at")}
              />
            </FormField>
          </div>

          <FormField label="Notes">
            <textarea
              className="inp"
              rows={3}
              placeholder="What to discuss, context…"
              value={newFollowup.notes}
              onChange={setNew("notes")}
              style={{ resize: "none" }}
            />
          </FormField>

          <FormField label="Next Follow-up Date (optional)">
            <input className="inp" type="date" value={newFollowup.next_date} onChange={setNew("next_date")} />
          </FormField>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button className="btn btn-primary" onClick={handleAddFollowup} disabled={creating}>
            {creating ? "Saving…" : <><CheckCircle size={13} /> Schedule Follow-up</>}
          </button>
          <button className="btn btn-ghost" onClick={() => { setShowAddModal(false); setAddErrors({}); }}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
