// src/pages/StudentProfile.jsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Phone, Mail, BookOpen, Clock, UserCheck, Calendar, Plus, FileText, Upload, Edit, MessageSquare, Download } from "lucide-react";
import { Avatar, Badge, Modal, FormField } from "../components/shared";
import { Spinner, PageError } from "../components/shared/Spinner";
import { useApi, useMutation } from "../hooks/useApi";
import studentsApi  from "../api/students.api";
import followupsApi from "../api/followups.api";

const TABS = ["Personal","Follow-up History","Fees History","WhatsApp Logs","Documents","Attendance"];

export default function StudentProfile() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [tab,     setTab]     = useState("Personal");
  const [fuModal, setFuModal] = useState(false);
  const [fuForm,  setFuForm]  = useState({ type:"call", scheduled_at:"", notes:"", next_date:"" });
  const setF = k => e => setFuForm(p=>({ ...p, [k]: e.target.value }));

  const { data,    loading, error, refetch } = useApi(() => studentsApi.getOne(id), [id]);
  const { data: fuData,    loading: fuLoad  } = useApi(() => studentsApi.getFollowups(id),  [id]);
  const { data: payData,   loading: payLoad  } = useApi(() => studentsApi.getPayments(id),   [id]);
  const { data: waData,    loading: waLoad   } = useApi(() => studentsApi.getWaLogs(id),     [id]);
  const { data: attData,   loading: attLoad  } = useApi(() => studentsApi.getAttendance(id), [id]);
  const { mutate: addFu, loading: addingFu }   = useMutation((d) => followupsApi.create(d));

  if (loading) return <Spinner text="Loading student profile…"/>;
  if (error)   return <PageError message={error} onRetry={refetch}/>;

  const s = data?.student;
  if (!s) return <PageError message="Student not found"/>;

  const pending = Math.max(0, Number(s.total_fees||0) - Number(s.paid||0) - Number(s.discount||0));
  const pct     = s.total_fees ? Math.round((Number(s.paid||0) / (Number(s.total_fees) - Number(s.discount||0))) * 100) : 0;

  const followups  = fuData?.followups  || [];
  const payments   = payData?.payments  || [];
  const waLogs     = waData?.logs       || [];
  const attendance = attData?.attendance || [];
  const attStats   = attData?.stats     || {};

  async function handleAddFu() {
    try {
      await addFu({ ...fuForm, student_id: id });
      setFuModal(false);
      setFuForm({ type:"call", scheduled_at:"", notes:"", next_date:"" });
      refetch();
    } catch(e) { alert(e.message); }
  }

  function InfoRow({ Icon, label, value }) {
    return (
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:"1px solid #1E2A45" }}>
        <div style={{ width:28, height:28, borderRadius:8, background:"#131D35", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Icon size={13} color="#60A5FA"/>
        </div>
        <div>
          <p style={{ fontSize:10, color:"#334155", fontWeight:700, textTransform:"uppercase" }}>{label}</p>
          <p style={{ fontSize:12.5, color:"#CBD5E1", fontWeight:600 }}>{value || "—"}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-ghost" style={{ marginBottom:18 }} onClick={()=>navigate("/students")}>
        <ChevronLeft size={14}/> Back to Students
      </button>

      <div style={{ display:"grid", gridTemplateColumns:"270px 1fr", gap:18 }}>
        {/* ── Left Panel ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div className="card" style={{ padding:22, textAlign:"center" }}>
            <Avatar name={s.full_name} size={72} fontSize={28}/>
            <h3 style={{ fontSize:17, fontWeight:800, color:"#F1F5F9", marginTop:12, marginBottom:3 }}>{s.full_name}</h3>
            <p className="mono" style={{ fontSize:11, color:"#475569", marginBottom:10 }}>{s.student_code}</p>
            <Badge status={s.status}/>
            <div style={{ marginTop:18 }}>
              <InfoRow Icon={Phone}     label="Mobile"    value={s.mobile}/>
              <InfoRow Icon={Mail}      label="Email"     value={s.email}/>
              <InfoRow Icon={BookOpen}  label="Course"    value={s.course_name}/>
              <InfoRow Icon={Clock}     label="Batch"     value={s.batch_timing}/>
              <InfoRow Icon={UserCheck} label="Counselor" value={s.counselor_name}/>
              <InfoRow Icon={Calendar}  label="Enrolled"  value={s.enrolled_at ? new Date(s.enrolled_at).toLocaleDateString("en-IN") : "—"}/>
            </div>
            <div style={{ display:"flex", gap:8, marginTop:16 }}>
              <button className="btn btn-primary" style={{ flex:1, justifyContent:"center", padding:"7px" }}><Phone size={13}/></button>
              <button className="btn btn-success" style={{ flex:1, justifyContent:"center", padding:"7px" }}><MessageSquare size={13}/></button>
              <button className="btn btn-ghost"   style={{ flex:1, justifyContent:"center", padding:"7px" }} onClick={()=>navigate(`/edit-student/${s.id}`)}><Edit size={13}/></button>
            </div>
          </div>

          {/* Fees Summary */}
          {s.total_fees && (
            <div className="card" style={{ padding:18 }}>
              <p style={{ fontSize:13, fontWeight:700, color:"#F1F5F9", marginBottom:12 }}>Fees Summary</p>
              {[["Total Fees","₹"+Number(s.total_fees).toLocaleString("en-IN"),"#E2E8F0"],["Discount","₹"+Number(s.discount||0).toLocaleString("en-IN"),"#FB923C"],["Paid","₹"+Number(s.paid||0).toLocaleString("en-IN"),"#4ADE80"],["Pending","₹"+pending.toLocaleString("en-IN"),"#F87171"]].map(([l,v,c])=>(
                <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #1E2A45" }}>
                  <span style={{ fontSize:12.5, color:"#64748B" }}>{l}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:c }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11.5, color:"#64748B", marginBottom:5 }}>
                  <span>Payment Progress</span><span style={{ color:"#4ADE80" }}>{pct}%</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width:pct+"%" }}/></div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Panel ── */}
        <div className="card" style={{ padding:22 }}>
          <div style={{ display:"flex", gap:6, marginBottom:22, flexWrap:"wrap", borderBottom:"1px solid #1E2A45", paddingBottom:14 }}>
            {TABS.map(t=><button key={t} className={`tab-btn ${tab===t?"active":""}`} onClick={()=>setTab(t)}>{t}</button>)}
          </div>

          {/* Personal */}
          {tab==="Personal" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              {[["Full Name",s.full_name],["Gender",s.gender],["Date of Birth",s.dob?new Date(s.dob).toLocaleDateString("en-IN"):"—"],["Mobile",s.mobile],["Parent Mobile",s.parent_mobile],["Email",s.email],["Course",s.course_name],["Batch",s.batch_timing],["Lead Status",s.lead_status],["Inquiry Source",s.inquiry_source],["Payment Mode",s.fees_status]].map(([l,v])=>(
                <div key={l} style={{ background:"#131D35", borderRadius:10, padding:"12px 14px", border:"1px solid #1E2A45" }}>
                  <p style={{ fontSize:10.5, fontWeight:700, color:"#334155", textTransform:"uppercase", letterSpacing:".05em", marginBottom:4 }}>{l}</p>
                  <p style={{ fontSize:13.5, fontWeight:600, color:"#E2E8F0" }}>{v||"—"}</p>
                </div>
              ))}
              <div style={{ gridColumn:"1/-1", background:"#131D35", borderRadius:10, padding:"12px 14px", border:"1px solid #1E2A45" }}>
                <p style={{ fontSize:10.5, fontWeight:700, color:"#334155", textTransform:"uppercase", letterSpacing:".05em", marginBottom:4 }}>Address</p>
                <p style={{ fontSize:13.5, fontWeight:600, color:"#E2E8F0" }}>{s.address||"—"}</p>
              </div>
              <div style={{ gridColumn:"1/-1", background:"#131D35", borderRadius:10, padding:"12px 14px", border:"1px solid #1E2A45" }}>
                <p style={{ fontSize:10.5, fontWeight:700, color:"#334155", textTransform:"uppercase", letterSpacing:".05em", marginBottom:4 }}>Notes</p>
                <p style={{ fontSize:13.5, fontWeight:600, color:"#E2E8F0" }}>{s.notes||"—"}</p>
              </div>
            </div>
          )}

          {/* Follow-up History */}
          {tab==="Follow-up History" && (
            <div>
              <button className="btn btn-primary" style={{ marginBottom:14, alignSelf:"flex-end" }} onClick={()=>setFuModal(true)}><Plus size={13}/> Add Follow-up</button>
              {fuLoad ? <Spinner/> : followups.length===0 ? <p style={{ color:"#475569", fontSize:13 }}>No follow-ups recorded yet.</p> :
                followups.map(f=>(
                  <div key={f.id} style={{ background:"#131D35", borderRadius:12, padding:"14px 16px", border:"1px solid #1E2A45", marginBottom:10 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:"#E2E8F0" }}>{new Date(f.scheduled_at).toLocaleString("en-IN")}</span>
                      <Badge status={f.type}/>
                      <Badge status={f.status}/>
                    </div>
                    {f.outcome && <p style={{ fontSize:13, color:"#94A3B8", marginBottom:3 }}>Outcome: {f.outcome}</p>}
                    {f.notes   && <p style={{ fontSize:13, color:"#94A3B8" }}>Notes: {f.notes}</p>}
                    <p style={{ fontSize:11.5, color:"#475569", marginTop:4 }}>Staff: {f.assigned_to_name||"—"} · Next: {f.next_date ? new Date(f.next_date).toLocaleDateString("en-IN") : "—"}</p>
                  </div>
                ))
              }
            </div>
          )}

          {/* Fees History */}
          {tab==="Fees History" && (
            <div>
              {payLoad ? <Spinner/> : payments.length===0 ? <p style={{ color:"#475569", fontSize:13 }}>No payments recorded yet.</p> : (
                <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:14 }}>
                  <thead><tr style={{ background:"#080B14" }}>{["Date","Amount","Mode","Receipt","Note"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {payments.map(p=>(
                      <tr key={p.id} className="tr-row" style={{ borderTop:"1px solid #1E2A45" }}>
                        <td style={{ fontSize:13 }}>{new Date(p.payment_date).toLocaleDateString("en-IN")}</td>
                        <td style={{ fontSize:13, fontWeight:700, color:"#4ADE80" }}>₹{Number(p.amount).toLocaleString("en-IN")}</td>
                        <td><Badge status="info"/></td>
                        <td className="mono" style={{ fontSize:12, color:"#60A5FA" }}>{p.receipt_no}</td>
                        <td style={{ fontSize:12.5, color:"#94A3B8" }}>{p.note||"—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* WhatsApp Logs */}
          {tab==="WhatsApp Logs" && (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {waLoad ? <Spinner/> : waLogs.length===0 ? <p style={{ color:"#475569", fontSize:13 }}>No WhatsApp messages sent yet.</p> :
                waLogs.map(w=>(
                  <div key={w.id} style={{ background:"#131D35", borderRadius:12, padding:"13px 16px", border:"1px solid #1E2A45", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <p style={{ fontSize:13, fontWeight:700, color:"#E2E8F0", marginBottom:3 }}>{w.template||"Custom"}</p>
                      <p style={{ fontSize:12, color:"#475569" }}>{new Date(w.sent_at).toLocaleString("en-IN")} {w.read_at && `· Read ${new Date(w.read_at).toLocaleTimeString("en-IN")}`}</p>
                    </div>
                    <Badge status={w.status?.charAt(0).toUpperCase()+w.status?.slice(1)||"Sent"}/>
                  </div>
                ))
              }
            </div>
          )}

          {/* Documents */}
          {tab==="Documents" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div className="drop-zone" style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                <Upload size={20}/><span>Upload Document</span>
              </div>
              <div style={{ color:"#475569", fontSize:13, padding:20, textAlign:"center" }}>
                Document management coming soon.
              </div>
            </div>
          )}

          {/* Attendance */}
          {tab==="Attendance" && (
            <div>
              {attLoad ? <Spinner/> : (
                <>
                  <div style={{ display:"flex", gap:16, marginBottom:16 }}>
                    {[["Present",attStats.present,"#4ADE80"],["Absent",attStats.absent,"#F87171"],["Rate",attStats.rate+"%","#60A5FA"]].map(([l,v,c])=>(
                      <div key={l} style={{ background:"#131D35", borderRadius:10, padding:"12px 18px", border:"1px solid #1E2A45", textAlign:"center" }}>
                        <p style={{ fontSize:20, fontWeight:800, color:c }}>{v??0}</p>
                        <p style={{ fontSize:11, color:"#475569" }}>{l}</p>
                      </div>
                    ))}
                  </div>
                  {attendance.length===0 ? <p style={{ color:"#475569", fontSize:13 }}>No attendance records yet.</p> : (
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead><tr style={{ background:"#080B14" }}>{["Date","Course","Status","Remark"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                      <tbody>
                        {attendance.map((a,i)=>(
                          <tr key={i} className="tr-row" style={{ borderTop:"1px solid #1E2A45" }}>
                            <td style={{ fontSize:13 }}>{new Date(a.date).toLocaleDateString("en-IN")}</td>
                            <td style={{ fontSize:12.5, color:"#C084FC" }}>{a.course_name||"—"}</td>
                            <td><Badge status={a.status?.charAt(0).toUpperCase()+a.status?.slice(1)||"—"}/></td>
                            <td style={{ fontSize:12.5, color:"#475569" }}>{a.remark||"—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Follow-up Modal */}
      <Modal open={fuModal} onClose={()=>setFuModal(false)} title="Add Follow-up" width={460}>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <FormField label="Type">
            <select className="inp" value={fuForm.type} onChange={setF("type")}>
              {["call","whatsapp","walk_in","video_call","email"].map(t=><option key={t} value={t}>{t.replace("_"," ")}</option>)}
            </select>
          </FormField>
          <FormField label="Scheduled Date & Time" required>
            <input className="inp" type="datetime-local" value={fuForm.scheduled_at} onChange={setF("scheduled_at")}/>
          </FormField>
          <FormField label="Notes">
            <textarea className="inp" rows={3} placeholder="What to discuss…" value={fuForm.notes} onChange={setF("notes")}/>
          </FormField>
          <FormField label="Next Follow-up Date">
            <input className="inp" type="date" value={fuForm.next_date} onChange={setF("next_date")}/>
          </FormField>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <button className="btn btn-primary" onClick={handleAddFu} disabled={addingFu}>
            {addingFu?"Saving…":"Save Follow-up"}
          </button>
          <button className="btn btn-ghost" onClick={()=>setFuModal(false)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
