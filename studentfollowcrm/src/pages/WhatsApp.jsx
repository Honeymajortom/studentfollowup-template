// src/pages/WhatsApp.jsx
import { useState, useCallback } from "react";
import {
  Send, Eye, Activity, CheckCircle, XCircle, Clock, Plus,
  Edit, Trash2, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { SectionHead, Badge, Modal, FormField } from "../components/shared";
import { Spinner, PageError, EmptyState } from "../components/shared/Spinner";
import { useApi, useMutation } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import whatsappApi from "../api/whatsapp.api";

// ── Helpers ────────────────────────────────────────────────────

const SAMPLE_VALUES = {
  name:   "Rahul Sharma",
  course: "Python Development",
  amount: "₹5,000",
  date:   "15 Jun 2026",
  time:   "10:30 AM",
  phone:  "9876543210",
  days:   "3",
};

const VAR_LABELS = {
  name:   "Student Name",
  course: "Course",
  amount: "Fee Amount",
  date:   "Date",
  time:   "Time",
  phone:  "Phone",
  days:   "Days",
};

function previewBody(template, sampleValues = SAMPLE_VALUES) {
  if (!template?.body) return "";
  let text = template.body;
  (template.variables || []).forEach((v, i) => {
    text = text.replace(new RegExp(`\\{\\{${i + 1}\\}\\}`, "g"), sampleValues[v] || `{${v}}`);
  });
  return text;
}

function getCategory(t) {
  const s = ((t.template_key || "") + " " + (t.name || "")).toLowerCase();
  if (s.includes("fee"))                         return { emoji: "💰", color: "#FB923C", label: "Fee" };
  if (s.includes("demo") || s.includes("class")) return { emoji: "🎓", color: "#A855F7", label: "Demo" };
  if (s.includes("admission") || s.includes("confirm") || s.includes("enrollment"))
                                                 return { emoji: "🎉", color: "#4ADE80", label: "Admission" };
  if (s.includes("attend"))                      return { emoji: "📊", color: "#60A5FA", label: "Attendance" };
  if (s.includes("follow"))                      return { emoji: "📅", color: "#F59E0B", label: "Follow-up" };
  return { emoji: "💬", color: "#94A3B8", label: "General" };
}

const AVAILABLE_VARS = Object.keys(VAR_LABELS);

// ── Component ──────────────────────────────────────────────────

export default function WhatsApp() {
  const { user } = useAuth();
  const isAdmin  = user?.role === "admin";

  // Send flow
  const [sendModal,   setSendModal]   = useState(false);
  const [selTemplate, setSelTemplate] = useState(null);
  const [selGroup,    setSelGroup]    = useState("todays_followups");
  const [schedTime,   setSchedTime]   = useState("");
  const [sendResult,  setSendResult]  = useState(null);

  // Preview
  const [preview, setPreview] = useState(null);

  // Logs modal
  const [logsModal, setLogsModal] = useState(false);
  const [logsPage,  setLogsPage]  = useState(1);

  // Template editor (admin only)
  const [editModal,   setEditModal]   = useState(false);
  const [editTarget,  setEditTarget]  = useState(null); // null = new
  const [tplForm,     setTplForm]     = useState({ name: "", template_key: "", body: "", variables: "" });
  const [tplSaving,   setTplSaving]   = useState(false);
  const [tplMsg,      setTplMsg]      = useState("");
  const [refreshKey,  setRefreshKey]  = useState(0);

  const setTpl = k => e => setTplForm(p => ({ ...p, [k]: e.target.value }));

  // Data
  const { data: tData, loading: tLoad, error: tErr } = useApi(() => whatsappApi.listTemplates(), [refreshKey]);
  const { data: sData }                               = useApi(() => whatsappApi.stats(), [refreshKey]);
  const { data: logData, loading: logLoad }           = useApi(
    () => logsModal ? whatsappApi.getLogs({ page: logsPage, limit: 20 }) : Promise.resolve(null),
    [logsModal, logsPage]
  );
  const { mutate: doSend, loading: sending } = useMutation((d) => whatsappApi.send(d));

  const templates = tData?.templates || [];
  const stats     = sData?.stats     || {};
  const logs      = logData?.rows    || [];
  const logTotal  = logData?.pagination?.total || 0;
  const logPages  = Math.max(1, Math.ceil(logTotal / 20));

  const activeTemplate = selTemplate || templates[0];

  // ── Send ─────────────────────────────────────────────────────
  async function handleSend() {
    if (!activeTemplate) return;
    try {
      const res = await doSend({
        template_id:  activeTemplate.id,
        group:        selGroup,
        scheduled_at: schedTime || undefined,
      });
      setSendResult(res.data);
      setTimeout(() => { setSendResult(null); setSendModal(false); }, 2500);
    } catch (e) { alert(e.message); }
  }

  // ── Save template (create / update) ──────────────────────────
  async function handleSaveTemplate() {
    setTplSaving(true);
    setTplMsg("");
    try {
      const vars = tplForm.variables
        .split(",")
        .map(v => v.trim())
        .filter(Boolean);
      const payload = {
        name:         tplForm.name.trim(),
        template_key: tplForm.template_key.trim(),
        body:         tplForm.body.trim(),
        variables:    vars,
      };
      if (editTarget) {
        await whatsappApi.updateTemplate(editTarget.id, payload);
        setTplMsg("✓ Template updated");
      } else {
        await whatsappApi.createTemplate(payload);
        setTplMsg("✓ Template created");
      }
      setRefreshKey(k => k + 1);
      setTimeout(() => { setEditModal(false); setTplMsg(""); }, 1200);
    } catch (e) {
      setTplMsg("Error: " + (e.response?.data?.message || e.message));
    } finally {
      setTplSaving(false);
    }
  }

  async function handleDeleteTemplate(t) {
    if (!window.confirm(`Deactivate template "${t.name}"?`)) return;
    try {
      await whatsappApi.deleteTemplate(t.id);
      setRefreshKey(k => k + 1);
    } catch (e) { alert(e.message); }
  }

  function openEditModal(t = null) {
    setEditTarget(t);
    setTplMsg("");
    if (t) {
      setTplForm({
        name:         t.name,
        template_key: t.template_key,
        body:         t.body,
        variables:    (t.variables || []).join(", "),
      });
    } else {
      setTplForm({ name: "", template_key: "", body: "", variables: "" });
    }
    setEditModal(true);
  }

  // ── Stats bar ─────────────────────────────────────────────────
  const WA_STATS = [
    { label: "Total Sent",  value: stats.sent      || 0, color: "#22C55E", Icon: Send        },
    { label: "Delivered",   value: stats.delivered || 0, color: "#2563EB", Icon: CheckCircle },
    { label: "Failed",      value: stats.failed    || 0, color: "#EF4444", Icon: XCircle     },
    { label: "Scheduled",   value: stats.scheduled || 0, color: "#F59E0B", Icon: Clock       },
  ];

  // ── Status badge color ─────────────────────────────────────────
  function statusColor(s) {
    return s === "sent" ? "#22C55E" : s === "delivered" ? "#2563EB" : s === "read" ? "#A855F7" : s === "failed" ? "#EF4444" : "#F59E0B";
  }

  // ── Template preview section (live substitution) ───────────────
  function TemplatePreviewBox({ template, compact = false }) {
    if (!template) return null;
    const cat  = getCategory(template);
    const text = previewBody(template);
    return (
      <div style={{ background: "#0B4A2E", borderRadius: 14, padding: compact ? "12px 14px" : "16px 18px", border: "1px solid #16A34A33" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ background: "#16A34A", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>WhatsApp</div>
          <div style={{ background: cat.color + "22", color: cat.color, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{cat.emoji} {cat.label}</div>
        </div>
        <p style={{ fontSize: compact ? 12.5 : 13.5, color: "#DCF8C6", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{text}</p>
        {(template.variables || []).length > 0 && (
          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 5 }}>
            {template.variables.map(v => (
              <span key={v} style={{ fontSize: 10, background: "#16A34A22", color: "#86EFAC", padding: "2px 7px", borderRadius: 20, border: "1px solid #16A34A33" }}>
                {"{" + v + "}"} = {VAR_LABELS[v] || v}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <SectionHead title="WhatsApp Reminders" sub="Automated messaging via Meta WhatsApp Cloud API">
        <button className="btn btn-ghost" onClick={() => { setLogsPage(1); setLogsModal(true); }}>
          <Activity size={13}/> Message Logs
        </button>
        {isAdmin && (
          <button className="btn btn-ghost" onClick={() => openEditModal(null)}>
            <Plus size={13}/> New Template
          </button>
        )}
        <button className="btn btn-primary" onClick={() => setSendModal(true)}>
          <Send size={13}/> Send Message
        </button>
      </SectionHead>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {WA_STATS.map(({ label, value, color, Icon }) => (
          <div key={label} className="card" style={{ padding: "18px 20px", display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ background: color + "18", border: `1px solid ${color}22`, borderRadius: 10, padding: 10, flexShrink: 0 }}>
              <Icon size={20} color={color}/>
            </div>
            <div>
              <p style={{ fontSize: 26, fontWeight: 800, color }}>{value}</p>
              <p style={{ fontSize: 12, color: "#475569" }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18 }}>
        {/* Template list */}
        <div>
          <p style={{ fontSize: 15, fontWeight: 800, color: "#F1F5F9", marginBottom: 14 }}>Message Templates</p>
          {tLoad ? <Spinner/> : tErr ? <PageError message={tErr}/> : templates.length === 0 ? (
            <EmptyState emoji="📋" title="No templates yet" sub={isAdmin ? 'Click "New Template" to create one' : "Ask your admin to create templates"} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {templates.map(t => {
                const cat = getCategory(t);
                return (
                  <div key={t.id} className="card card-hover" style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                      {/* Left: icon + info */}
                      <div style={{ display: "flex", gap: 14, flex: 1 }}>
                        <div style={{ width: 46, height: 46, borderRadius: 12, background: cat.color + "18", border: `1px solid ${cat.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                          {cat.emoji}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: "#E2E8F0" }}>{t.name}</p>
                            <span style={{ fontSize: 10, background: cat.color + "22", color: cat.color, padding: "2px 7px", borderRadius: 20, fontWeight: 700 }}>{cat.label}</span>
                          </div>
                          <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.5, marginBottom: 6 }}>
                            {previewBody(t).substring(0, 100)}…
                          </p>
                          {/* Variable chips */}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {(t.variables || []).map(v => (
                              <span key={v} style={{ fontSize: 10, background: "#1E2A45", color: "#7C3AED", padding: "2px 7px", borderRadius: 20, border: "1px solid #2D1B69" }}>
                                {"{" + v + "}"}
                              </span>
                            ))}
                            <span style={{ fontSize: 10, color: "#334155", marginLeft: 2 }}>
                              Key: <code style={{ color: "#475569" }}>{t.template_key}</code>
                            </span>
                          </div>
                        </div>
                      </div>
                      {/* Actions */}
                      <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                        <button className="btn btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => setPreview(t)}>
                          <Eye size={12}/> Preview
                        </button>
                        <button className="btn btn-primary" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => { setSelTemplate(t); setSendModal(true); }}>
                          <Send size={12}/> Use
                        </button>
                        {isAdmin && (
                          <>
                            <button className="btn btn-ghost" style={{ padding: "5px 8px" }} onClick={() => openEditModal(t)} title="Edit"><Edit size={12}/></button>
                            <button className="btn btn-danger" style={{ padding: "5px 8px" }} onClick={() => handleDeleteTemplate(t)} title="Deactivate"><Trash2 size={12}/></button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Send sidebar */}
        <div className="card" style={{ padding: 20, alignSelf: "start" }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#F1F5F9", marginBottom: 16 }}>Quick Send</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <FormField label="Template">
              <select className="inp" value={activeTemplate?.id || ""} onChange={e => setSelTemplate(templates.find(t => t.id === Number(e.target.value)))}>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </FormField>
            {/* Mini preview in sidebar */}
            {activeTemplate && (
              <div style={{ background: "#0B4A2E", borderRadius: 10, padding: "10px 12px", border: "1px solid #16A34A22" }}>
                <p style={{ fontSize: 11.5, color: "#86EFAC", lineHeight: 1.6 }}>{previewBody(activeTemplate)}</p>
              </div>
            )}
            <FormField label="Recipients">
              <select className="inp" value={selGroup} onChange={e => setSelGroup(e.target.value)}>
                <option value="all">All Students</option>
                <option value="pending_fees">Pending Fees</option>
                <option value="todays_followups">Today's Follow-ups</option>
                <option value="overdue">Overdue Follow-ups</option>
              </select>
            </FormField>
            <FormField label="Schedule (optional)">
              <input className="inp" type="datetime-local" value={schedTime} onChange={e => setSchedTime(e.target.value)}/>
            </FormField>
            <button className="btn btn-primary" style={{ justifyContent: "center", padding: "10px" }} onClick={handleSend} disabled={sending}>
              {sending ? "Sending…" : <><Send size={13}/> {schedTime ? "Schedule" : "Send Now"}</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Preview Modal ───────────────────────────────────────── */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title="Template Preview" width={460}>
        {preview && (
          <div>
            <TemplatePreviewBox template={preview} />
            <div style={{ marginTop: 16, padding: "12px 14px", background: "#131D35", borderRadius: 10, border: "1px solid #1E2A45" }}>
              <p style={{ fontSize: 11, color: "#334155", fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: ".05em" }}>Sample values used above</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(preview.variables || []).map(v => (
                  <span key={v} style={{ fontSize: 11, color: "#94A3B8" }}>
                    <code style={{ color: "#7C3AED" }}>{"{" + v + "}"}</code> → {SAMPLE_VALUES[v] || v}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
              <button className="btn btn-primary" onClick={() => { setSelTemplate(preview); setSendModal(true); setPreview(null); }}>
                <Send size={13}/> Use Template
              </button>
              {isAdmin && (
                <button className="btn btn-ghost" onClick={() => { openEditModal(preview); setPreview(null); }}>
                  <Edit size={13}/> Edit
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Full Send Modal ─────────────────────────────────────── */}
      <Modal open={sendModal} onClose={() => setSendModal(false)} title="Send WhatsApp Message" width={500}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FormField label="Template" required>
            <select className="inp" value={activeTemplate?.id || ""} onChange={e => setSelTemplate(templates.find(t => t.id === Number(e.target.value)))}>
              <option value="">Select a template…</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </FormField>

          {activeTemplate && <TemplatePreviewBox template={activeTemplate} compact />}

          <FormField label="Recipients" required>
            <select className="inp" value={selGroup} onChange={e => setSelGroup(e.target.value)}>
              <option value="all">All Students</option>
              <option value="pending_fees">Pending Fees Only</option>
              <option value="todays_followups">Today's Follow-ups</option>
              <option value="overdue">Overdue Follow-ups</option>
            </select>
          </FormField>
          <FormField label="Schedule for later (optional)" hint="Leave empty to send immediately">
            <input className="inp" type="datetime-local" value={schedTime} onChange={e => setSchedTime(e.target.value)}/>
          </FormField>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20, alignItems: "center" }}>
          <button className="btn btn-primary" style={{ padding: "10px 24px" }} onClick={handleSend} disabled={sending || !activeTemplate}>
            {sending ? "Sending…" : <><Send size={13}/> {schedTime ? "Schedule" : "Send Now"}</>}
          </button>
          <button className="btn btn-ghost" onClick={() => setSendModal(false)}>Cancel</button>
          {sendResult && (
            <span style={{ color: "#4ADE80", fontSize: 13 }}>
              ✓ {sendResult.summary?.sent || 0} sent, {sendResult.summary?.failed || 0} failed
            </span>
          )}
        </div>
      </Modal>

      {/* ── Message Logs Modal ──────────────────────────────────── */}
      <Modal open={logsModal} onClose={() => setLogsModal(false)} title="Message Logs" width={700}>
        {logLoad ? <Spinner text="Loading logs…"/> : logs.length === 0 ? (
          <EmptyState emoji="📭" title="No messages sent yet" />
        ) : (
          <>
            <div style={{ overflowX: "auto", marginBottom: 14 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#080B14" }}>
                    {["Student","Template","Phone","Status","Sent At"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#334155", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l, i) => (
                    <tr key={l.id || i} style={{ borderTop: "1px solid #1E2A45" }}>
                      <td style={{ padding: "10px 14px", fontSize: 13, color: "#E2E8F0" }}>
                        {l.full_name || "—"}
                        {l.student_code && <span style={{ fontSize: 10, color: "#475569", marginLeft: 5 }}>{l.student_code}</span>}
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 12.5, color: "#94A3B8" }}>{l.template}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#475569", fontFamily: "monospace" }}>{l.phone}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: statusColor(l.status), background: statusColor(l.status) + "18", padding: "2px 8px", borderRadius: 20 }}>
                          {l.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#475569" }}>
                        {l.sent_at ? new Date(l.sent_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {logPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: 12, color: "#475569" }}>
                  Showing {(logsPage - 1) * 20 + 1}–{Math.min(logsPage * 20, logTotal)} of {logTotal}
                </p>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-ghost" style={{ padding: "5px 10px" }} onClick={() => setLogsPage(p => Math.max(1, p - 1))} disabled={logsPage === 1}><ChevronLeft size={13}/></button>
                  <button className="btn btn-ghost" style={{ padding: "5px 10px" }} onClick={() => setLogsPage(p => Math.min(logPages, p + 1))} disabled={logsPage === logPages}><ChevronRight size={13}/></button>
                </div>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* ── Add / Edit Template Modal (admin) ──────────────────── */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title={editTarget ? "Edit Template" : "New Template"} width={520}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <FormField label="Template Name" required>
              <input className="inp" value={tplForm.name} onChange={setTpl("name")} placeholder="e.g. Fee Reminder"/>
            </FormField>
            <FormField label="Template Key (Meta)" required hint="Lowercase, underscores only">
              <input className="inp" value={tplForm.template_key} onChange={setTpl("template_key")} placeholder="e.g. fee_reminder"/>
            </FormField>
          </div>
          <FormField label="Message Body" required hint={"Use {{1}}, {{2}}… for variables in order"}>
            <textarea
              className="inp"
              rows={4}
              value={tplForm.body}
              onChange={setTpl("body")}
              placeholder={"Hi {{1}}, your fee of ₹{{2}} is due on {{3}}. — EduSpark"}
              style={{ resize: "vertical" }}
            />
          </FormField>
          <FormField label="Variables (comma-separated, in order)" hint={`Available: ${AVAILABLE_VARS.join(", ")}`}>
            <input className="inp" value={tplForm.variables} onChange={setTpl("variables")} placeholder="name, amount, date"/>
          </FormField>

          {/* Live preview */}
          {tplForm.body && (
            <div>
              <p style={{ fontSize: 11, color: "#334155", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".05em" }}>Live Preview</p>
              <TemplatePreviewBox template={{
                body:         tplForm.body,
                template_key: tplForm.template_key,
                name:         tplForm.name,
                variables:    tplForm.variables.split(",").map(v => v.trim()).filter(Boolean),
              }} compact />
            </div>
          )}
        </div>
        {tplMsg && (
          <p style={{ marginTop: 12, fontSize: 13, color: tplMsg.startsWith("Error") ? "#F87171" : "#4ADE80" }}>{tplMsg}</p>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button className="btn btn-primary" onClick={handleSaveTemplate} disabled={tplSaving || !tplForm.name || !tplForm.body}>
            {tplSaving ? "Saving…" : <><CheckCircle size={13}/> {editTarget ? "Update" : "Create"} Template</>}
          </button>
          <button className="btn btn-ghost" onClick={() => setEditModal(false)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
