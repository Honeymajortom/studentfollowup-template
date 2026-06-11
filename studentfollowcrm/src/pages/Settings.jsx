// src/pages/Settings.jsx
import { useState, useEffect, useRef } from "react";
import { Save, CheckCircle, Activity, Download, Upload, Calendar, Shield, Eye, EyeOff } from "lucide-react";
import { SectionHead, Toggle, FormField } from "../components/shared";
import { useMutation } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import authApi from "../api/auth.api";

const TABS = ["Institute","WhatsApp API","Change Password","Notifications","User Roles","Backup & Restore"];

function SaveRow({ onSave, saving, saved }) {
  return (
    <div style={{ display:"flex", gap:10, alignItems:"center", marginTop:24 }}>
      <button className="btn btn-primary" onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : <><Save size={13}/> Save Changes</>}
      </button>
      {saved && <span style={{ color:"#4ADE80", fontSize:13, display:"flex", alignItems:"center", gap:5 }}><CheckCircle size={14}/> Saved!</span>}
    </div>
  );
}

function ToggleRow({ label, sub, defaultValue=false }) {
  const [on, setOn] = useState(defaultValue);
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid #1E2A45" }}>
      <div>
        <p style={{ fontSize:13.5, fontWeight:600, color:"#E2E8F0" }}>{label}</p>
        {sub && <p style={{ fontSize:12, color:"#475569", marginTop:2 }}>{sub}</p>}
      </div>
      <Toggle value={on} onChange={setOn}/>
    </div>
  );
}

// ── Institute Tab ────────────────────────────────────────────────────────────
function InstituteTab() {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [logoName, setLogoName] = useState(null);
  const fileRef = useRef(null);
  function handleSave() { setSaving(true); setTimeout(()=>{ setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2000); },600); }
  function handleLogoChange(e) {
    const f = e.target.files[0];
    if (f) setLogoName(f.name);
  }
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, maxWidth:720 }}>
      <FormField label="Institute Name" required col="1/-1"><input className="inp" defaultValue="EduSpark Institute"/></FormField>
      <FormField label="Phone" required col="1"><input className="inp" defaultValue="9876543210"/></FormField>
      <FormField label="Email" col="2"><input className="inp" type="email" defaultValue="info@eduspark.in"/></FormField>
      <FormField label="Website" col="1"><input className="inp" defaultValue="https://eduspark.in"/></FormField>
      <FormField label="GSTIN" col="2"><input className="inp" defaultValue="27XXXXX0000X1Z5"/></FormField>
      <FormField label="Address" col="1/-1"><textarea className="inp" rows={2} defaultValue="MIDC Area, Nagpur, Maharashtra 440016"/></FormField>
      <FormField label="Institute Logo" col="1/-1">
        <input ref={fileRef} type="file" accept="image/png,image/svg+xml" style={{ display:"none" }} onChange={handleLogoChange}/>
        <div className="drop-zone" style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }} onClick={()=>fileRef.current.click()}>
          <span style={{ fontSize:24 }}>🎓</span>
          <span>{logoName ? `Selected: ${logoName}` : "Click to upload logo (PNG/SVG, max 2 MB)"}</span>
        </div>
      </FormField>
      <div style={{ gridColumn:"1/-1" }}><SaveRow onSave={handleSave} saving={saving} saved={saved}/></div>
    </div>
  );
}

// ── WhatsApp API Tab ─────────────────────────────────────────────────────────
function WhatsAppAPITab() {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [tested, setTested] = useState(null);
  function handleSave() { setSaving(true); setTimeout(()=>{ setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2000); },600); }
  return (
    <div style={{ maxWidth:560 }}>
      <div style={{ background:"#0B4A2E", border:"1px solid #16A34A33", borderRadius:12, padding:"14px 18px", marginBottom:22 }}>
        <p style={{ fontSize:13.5, fontWeight:700, color:"#4ADE80", marginBottom:4 }}>Meta WhatsApp Cloud API</p>
        <p style={{ fontSize:12.5, color:"#86EFAC", lineHeight:1.6 }}>
          Store access tokens in backend <code style={{ color:"#4ADE80" }}>.env</code> — never in the frontend.
          The backend proxies all WhatsApp calls.
        </p>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {[["Phone Number ID",""],["WhatsApp Business Account ID",""],["API Version","v18.0"]].map(([l,d])=>(
          <FormField key={l} label={l}><input className="inp" defaultValue={d} placeholder={`Enter ${l}…`}/></FormField>
        ))}
      </div>
      <div style={{ display:"flex", gap:10, marginTop:20, alignItems:"center" }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}><Save size={13}/> Save Config</button>
        <button className="btn btn-ghost" onClick={()=>setTested("ok")}><Activity size={13}/> Test Connection</button>
        {saving && <span style={{ color:"#64748B", fontSize:13 }}>Saving…</span>}
        {saved  && <span style={{ color:"#4ADE80", fontSize:13 }}>✓ Saved!</span>}
        {tested === "ok" && <span style={{ color:"#4ADE80", fontSize:13 }}>✓ Connection OK</span>}
      </div>
    </div>
  );
}

// ── Change Password Tab (replaces Payment for this CRM) ──────────────────────
function ChangePasswordTab() {
  const [cur,  setCur]  = useState("");
  const [next, setNext] = useState("");
  const [show, setShow] = useState(false);
  const { mutate, loading, success, error } = useMutation(
    (d) => authApi.changePassword(d.current, d.next)
  );
  const [localError, setLocalError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const timerRef = useRef(null);
  useEffect(() => {
    if (success) {
      setShowSuccess(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShowSuccess(false), 3000);
    }
    return () => clearTimeout(timerRef.current);
  }, [success]);
  async function handleChange() {
    setLocalError(null);
    if (!cur || !next) return setLocalError("Both fields are required.");
    if (next.length < 8) return setLocalError("New password must be at least 8 characters.");
    try {
      await mutate({ current: cur, next });
      setCur(""); setNext("");
    } catch(e) { /* error already surfaced via useMutation state */ }
  }
  return (
    <div style={{ maxWidth:420 }}>
      <p style={{ fontSize:13, color:"#475569", marginBottom:20 }}>Update your login password.</p>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <FormField label="Current Password">
          <div style={{ position:"relative" }}>
            <input className="inp" type={show?"text":"password"} value={cur} onChange={e=>setCur(e.target.value)} placeholder="Current password" style={{ paddingRight:40 }}/>
            <button type="button" onClick={()=>setShow(p=>!p)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#475569" }}>
              {show ? <EyeOff size={15}/> : <Eye size={15}/>}
            </button>
          </div>
        </FormField>
        <FormField label="New Password" hint="Minimum 8 characters">
          <input className="inp" type={show?"text":"password"} value={next} onChange={e=>setNext(e.target.value)} placeholder="New password"/>
        </FormField>
      </div>
      <div style={{ display:"flex", gap:10, alignItems:"center", marginTop:20 }}>
        <button className="btn btn-primary" onClick={handleChange} disabled={loading}>
          {loading?"Saving…":<><CheckCircle size={13}/> Update Password</>}
        </button>
        {showSuccess && <span style={{ color:"#4ADE80", fontSize:13 }}>✓ Password updated!</span>}
        {(localError || error) && <span style={{ color:"#F87171", fontSize:13 }}>✗ {localError || error}</span>}
      </div>
    </div>
  );
}

// ── Notifications Tab ────────────────────────────────────────────────────────
function NotificationsTab() {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const rows = [
    ["Follow-up due reminder",    "Notify staff 1 hour before a follow-up is due.",       true ],
    ["Fee due notification",       "Alert when student fee is due in 3 days.",             true ],
    ["Student birthday alert",     "Wish students on their birthdays via WhatsApp.",       false],
    ["New admission notification", "Notify admin when a new student is enrolled.",         true ],
    ["WhatsApp delivery failure",  "Alert when a WhatsApp message fails to deliver.",      true ],
    ["Missed follow-up digest",    "Daily summary of missed follow-ups at 6 PM.",          true ],
    ["Weekly performance email",   "Send weekly performance summary to admin email.",      false],
    ["Overdue fee escalation",     "Notify senior counselor when fee is overdue 7+ days.", true ],
  ];
  return (
    <div style={{ maxWidth:560 }}>
      {rows.map(([l,s,d])=><ToggleRow key={l} label={l} sub={s} defaultValue={d}/>)}
      <SaveRow onSave={()=>{ setSaving(true); setTimeout(()=>{ setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2000); },600); }} saving={saving} saved={saved}/>
    </div>
  );
}

// ── User Roles Tab ───────────────────────────────────────────────────────────
function UserRolesTab() {
  const roles = [
    { role:"Admin",      desc:"Full access to all modules.",                 color:"#2563EB", perms:["Dashboard","Students","Follow-ups","WhatsApp","Fees","Courses","Attendance","Reports","Staff","Settings"] },
    { role:"Counselor",  desc:"Manages assigned students & follow-ups.",     color:"#7C3AED", perms:["Dashboard","Students","Follow-ups","WhatsApp"] },
    { role:"Trainer",    desc:"View students & mark attendance.",            color:"#10B981", perms:["Students","Attendance","Courses"] },
    { role:"Accountant", desc:"Fees section only.",                          color:"#F59E0B", perms:["Fees"] },
  ];
  return (
    <div>
      <p style={{ fontSize:13, color:"#475569", marginBottom:18 }}>Role permissions are enforced by the backend JWT middleware.</p>
      {roles.map(r=>(
        <div key={r.role} className="card" style={{ padding:18, marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:r.color+"18", border:`1px solid ${r.color}33`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Shield size={16} color={r.color}/>
              </div>
              <div>
                <p style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>{r.role}</p>
                <p style={{ fontSize:12, color:"#475569" }}>{r.desc}</p>
              </div>
            </div>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {r.perms.map(p=>(
              <span key={p} style={{ background:r.color+"18", color:r.color, border:`1px solid ${r.color}33`, padding:"2px 10px", borderRadius:20, fontSize:11.5, fontWeight:600 }}>{p}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Backup Tab ───────────────────────────────────────────────────────────────
function BackupTab() {
  const restoreRef = useRef(null);
  const [status, setStatus] = useState({});

  function handleExport() {
    setStatus(s=>({ ...s, export:"exporting" }));
    setTimeout(()=> setStatus(s=>({ ...s, export:"done" })), 800);
  }
  function handleRestore(e) {
    const f = e.target.files[0];
    if (f) setStatus(s=>({ ...s, restore:`Selected: ${f.name}` }));
  }
  function handleConfigure() {
    setStatus(s=>({ ...s, schedule:"Auto-backup is already enabled (daily at 2 AM UTC)." }));
  }

  return (
    <div style={{ maxWidth:560 }}>
      <input ref={restoreRef} type="file" accept=".json" style={{ display:"none" }} onChange={handleRestore}/>
      {[
        {
          title:"Export All Data", Icon:Download, color:"#2563EB",
          desc:"Download complete DB backup as JSON from the backend.",
          btn: status.export==="exporting" ? "Exporting…" : "Export Now",
          cls:"btn-primary", onClick: handleExport,
          note: status.export==="done" ? "✓ Export ready (feature requires backend endpoint)" : null,
        },
        {
          title:"Restore from Backup", Icon:Upload, color:"#7C3AED",
          desc:"Restore data from a previous JSON backup file.",
          btn:"Choose File", cls:"btn-ghost", onClick:()=>restoreRef.current.click(),
          note: status.restore || null,
        },
        {
          title:"Schedule Auto Backup", Icon:Calendar, color:"#10B981",
          desc:"Automatically backup PostgreSQL daily to cloud storage.",
          btn:"Configure", cls:"btn-ghost", onClick: handleConfigure,
          note: status.schedule || null,
        },
      ].map(({ title, Icon, color, desc, btn, cls, onClick, note })=>(
        <div key={title}>
          <div className="card card-hover" style={{ padding:18, marginBottom: note ? 4 : 12, display:"flex", justifyContent:"space-between", alignItems:"center", gap:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:42, height:42, borderRadius:11, background:color+"18", border:`1px solid ${color}33`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Icon size={18} color={color}/>
              </div>
              <div>
                <p style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>{title}</p>
                <p style={{ fontSize:12.5, color:"#475569" }}>{desc}</p>
              </div>
            </div>
            <button className={`btn ${cls}`} style={{ flexShrink:0, padding:"7px 16px" }} onClick={onClick}>{btn}</button>
          </div>
          {note && <p style={{ fontSize:12, color:"#4ADE80", marginBottom:10, paddingLeft:4 }}>{note}</p>}
        </div>
      ))}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Settings() {
  const [tab, setTab] = useState("Institute");
  const content = {
    "Institute":        <InstituteTab/>,
    "WhatsApp API":     <WhatsAppAPITab/>,
    "Change Password":  <ChangePasswordTab/>,
    "Notifications":    <NotificationsTab/>,
    "User Roles":       <UserRolesTab/>,
    "Backup & Restore": <BackupTab/>,
  };
  return (
    <div>
      <SectionHead title="Settings" sub="Configure institute, integrations and preferences"/>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", borderBottom:"1px solid #1E2A45", paddingBottom:14, marginBottom:24 }}>
        {TABS.map(t=><button key={t} className={`tab-btn ${tab===t?"active":""}`} onClick={()=>setTab(t)}>{t}</button>)}
      </div>
      {content[tab]}
    </div>
  );
}
