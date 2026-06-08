// src/pages/WhatsApp.jsx
import { useState } from "react";
import { Send, Eye, Activity, CheckCircle, XCircle, Clock, MessageSquare } from "lucide-react";
import { SectionHead, Badge, Modal, FormField } from "../components/shared";
import { Spinner, PageError } from "../components/shared/Spinner";
import { useApi, useMutation } from "../hooks/useApi";
import whatsappApi from "../api/whatsapp.api";
import studentsApi from "../api/students.api";

export default function WhatsApp() {
  const [preview,     setPreview]     = useState(null);
  const [sendModal,   setSendModal]   = useState(false);
  const [selTemplate, setSelTemplate] = useState(null);
  const [selGroup,    setSelGroup]    = useState("todays_followups");
  const [schedTime,   setSchedTime]   = useState("");
  const [sendResult,  setSendResult]  = useState(null);

  const { data: tData, loading: tLoad, error: tErr } = useApi(() => whatsappApi.listTemplates());
  const { data: sData }                               = useApi(() => whatsappApi.stats());
  const { mutate: doSend, loading: sending }          = useMutation((d) => whatsappApi.send(d));

  const templates = tData?.templates || [];
  const stats     = sData?.stats     || {};

  if (!selTemplate && templates.length > 0 && !selTemplate) {
    // auto-select first template once loaded
  }
  const activeTemplate = selTemplate || templates[0];

  async function handleSend() {
    if (!activeTemplate) return;
    try {
      const payload = {
        template_id:  activeTemplate.id,
        group:        selGroup,
        scheduled_at: schedTime || undefined,
      };
      const res = await doSend(payload);
      setSendResult(res.data);
      setTimeout(() => { setSendResult(null); setSendModal(false); }, 2500);
    } catch (e) { alert(e.message); }
  }

  const WA_STATS = [
    { label:"Total Sent",  value: stats.sent      || 0, color:"#22C55E", Icon: Send        },
    { label:"Delivered",   value: stats.delivered || 0, color:"#2563EB", Icon: CheckCircle },
    { label:"Failed",      value: stats.failed    || 0, color:"#EF4444", Icon: XCircle     },
    { label:"Scheduled",   value: stats.scheduled || 0, color:"#F59E0B", Icon: Clock       },
  ];

  return (
    <div>
      <SectionHead title="WhatsApp Reminders" sub="Automated messaging via Meta WhatsApp Cloud API">
        <button className="btn btn-ghost"><Activity size={13}/> Message Logs</button>
        <button className="btn btn-primary" onClick={()=>setSendModal(true)}><Send size={13}/> Send Message</button>
      </SectionHead>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        {WA_STATS.map(({ label, value, color, Icon })=>(
          <div key={label} className="card" style={{ padding:"18px 20px", display:"flex", gap:14, alignItems:"center" }}>
            <div style={{ background:color+"18", border:`1px solid ${color}22`, borderRadius:10, padding:10, flexShrink:0 }}>
              <Icon size={20} color={color}/>
            </div>
            <div>
              <p style={{ fontSize:26, fontWeight:800, color }}>{value}</p>
              <p style={{ fontSize:12, color:"#475569" }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:18 }}>
        {/* Templates */}
        <div>
          <p style={{ fontSize:15, fontWeight:800, color:"#F1F5F9", marginBottom:14 }}>Message Templates</p>
          {tLoad ? <Spinner/> : tErr ? <PageError message={tErr}/> : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {templates.map(t=>(
                <div key={t.id} className="card card-hover" style={{ padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:16 }}>
                  <div style={{ display:"flex", gap:14, flex:1 }}>
                    <div style={{ width:46, height:46, borderRadius:12, background:"#131D35", border:"1px solid #1E2A45", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
                      💬
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:14, fontWeight:700, color:"#E2E8F0", marginBottom:4 }}>{t.name}</p>
                      <p style={{ fontSize:12, color:"#475569", lineHeight:1.5, marginBottom:4 }}>{t.body.substring(0,90)}…</p>
                      <span style={{ fontSize:11, color:"#64748B" }}>Key: <code style={{ color:"#7C3AED" }}>{t.template_key}</code></span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:7, flexShrink:0 }}>
                    <button className="btn btn-ghost"   style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>setPreview(t)}><Eye size={12}/> Preview</button>
                    <button className="btn btn-primary" style={{ padding:"5px 10px", fontSize:12 }} onClick={()=>{ setSelTemplate(t); setSendModal(true); }}><Send size={12}/> Use</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Send */}
        <div className="card" style={{ padding:20 }}>
          <p style={{ fontSize:14, fontWeight:800, color:"#F1F5F9", marginBottom:16 }}>Quick Send</p>
          <div style={{ display:"flex", flexDirection:"column", gap:13 }}>
            <FormField label="Template">
              <select className="inp" value={activeTemplate?.id||""} onChange={e=>setSelTemplate(templates.find(t=>t.id===Number(e.target.value)))}>
                {templates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </FormField>
            <FormField label="Recipients">
              <select className="inp" value={selGroup} onChange={e=>setSelGroup(e.target.value)}>
                <option value="all">All Students</option>
                <option value="pending_fees">Pending Fees</option>
                <option value="todays_followups">Today's Follow-ups</option>
                <option value="overdue">Overdue Follow-ups</option>
              </select>
            </FormField>
            <FormField label="Schedule (optional)">
              <input className="inp" type="datetime-local" value={schedTime} onChange={e=>setSchedTime(e.target.value)}/>
            </FormField>
            <button className="btn btn-primary" style={{ justifyContent:"center", padding:"10px" }} onClick={handleSend} disabled={sending}>
              {sending ? "Sending…" : <><Send size={13}/> {schedTime?"Schedule":"Send Now"}</>}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal open={!!preview} onClose={()=>setPreview(null)} title="Template Preview" width={420}>
        {preview&&(
          <div>
            <div style={{ background:"#0B4A2E", borderRadius:14, padding:"14px 16px", border:"1px solid #16A34A33", marginBottom:16 }}>
              <div style={{ background:"#16A34A", color:"#fff", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:20, display:"inline-block", marginBottom:8 }}>WhatsApp</div>
              <p style={{ fontSize:13.5, color:"#DCF8C6", lineHeight:1.7 }}>{preview.body}</p>
            </div>
            <p style={{ fontSize:12, color:"#475569", marginBottom:16 }}>
              Variables: {(preview.variables||[]).map(v=><code key={v} style={{ color:"#7C3AED", marginRight:6 }}>{"{"+v+"}"}</code>)}
            </p>
            <button className="btn btn-primary" onClick={()=>{ setSelTemplate(preview); setSendModal(true); setPreview(null); }}><Send size={13}/> Use</button>
          </div>
        )}
      </Modal>

      {/* Full Send Modal */}
      <Modal open={sendModal} onClose={()=>setSendModal(false)} title={`Send: ${activeTemplate?.name||"Message"}`} width={480}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {activeTemplate && (
            <div style={{ background:"#0B4A2E", borderRadius:10, padding:"12px 14px", border:"1px solid #16A34A22" }}>
              <p style={{ fontSize:12, color:"#86EFAC", lineHeight:1.6 }}>{activeTemplate.body}</p>
            </div>
          )}
          <FormField label="Template">
            <select className="inp" value={activeTemplate?.id||""} onChange={e=>setSelTemplate(templates.find(t=>t.id===Number(e.target.value)))}>
              {templates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </FormField>
          <FormField label="Recipients">
            <select className="inp" value={selGroup} onChange={e=>setSelGroup(e.target.value)}>
              <option value="all">All Students</option>
              <option value="pending_fees">Pending Fees Only</option>
              <option value="todays_followups">Today's Follow-ups</option>
              <option value="overdue">Overdue Follow-ups</option>
            </select>
          </FormField>
          <FormField label="Schedule (optional)">
            <input className="inp" type="datetime-local" value={schedTime} onChange={e=>setSchedTime(e.target.value)}/>
          </FormField>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:20, alignItems:"center" }}>
          <button className="btn btn-primary" style={{ padding:"10px 24px" }} onClick={handleSend} disabled={sending}>
            {sending ? "Sending…" : <><Send size={13}/> {schedTime?"Schedule":"Send Now"}</>}
          </button>
          <button className="btn btn-ghost" onClick={()=>setSendModal(false)}>Cancel</button>
          {sendResult && (
            <span style={{ color:"#4ADE80", fontSize:13 }}>
              ✓ {sendResult.summary?.sent||0} sent, {sendResult.summary?.failed||0} failed
            </span>
          )}
        </div>
      </Modal>
    </div>
  );
}
