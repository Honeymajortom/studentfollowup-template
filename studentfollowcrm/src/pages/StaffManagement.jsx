// src/pages/StaffManagement.jsx
import { useState } from "react";
import { Plus, Edit, Trash2, CheckCircle } from "lucide-react";
import { SectionHead, Badge, Avatar, Modal, FormField } from "../components/shared";
import { Spinner, PageError } from "../components/shared/Spinner";
import { useApi, useMutation } from "../hooks/useApi";
import staffApi    from "../api/staff.api";
import studentsApi from "../api/students.api";

const ROLES = ["admin","counselor","trainer","accountant"];
const INIT  = { name:"", email:"", password:"", role:"counselor", phone:"", joined_date:"", is_active:true };

function perfColor(p) { return p>=90?"#4ADE80":p>=80?"#60A5FA":"#FB923C"; }

export default function StaffManagement() {
  const [addModal,    setAddModal]    = useState(false);
  const [assignModal, setAssignModal] = useState(null);
  const [form,        setForm]        = useState(INIT);
  const [assigned,    setAssigned]    = useState({});
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const { data,        loading, error, refetch }  = useApi(() => staffApi.list());
  const { data: sData }                            = useApi(() => studentsApi.list({ limit: 100 }));
  const { mutate: createStaff, loading: creating } = useMutation((d) => staffApi.create(d));
  const { mutate: assignLeads, loading: assigning} = useMutation((d) => staffApi.assignLeads(assignModal?.id, d));

  const staff    = data?.staff         || [];
  const students = sData?.rows         || [];

  const totals = {
    total:   staff.length,
    active:  staff.filter(s=>s.is_active).length,
    managed: staff.reduce((a,s)=>a+Number(s.student_count||0),0),
    avgPerf: staff.length ? Math.round(staff.reduce((a,s)=>a+Number(s.performance||0),0)/staff.length) : 0,
  };

  async function handleCreate() {
    try { await createStaff(form); setAddModal(false); setForm(INIT); refetch(); }
    catch(e) { alert(e.message); }
  }

  async function handleAssign() {
    const ids = Object.entries(assigned).filter(([,v])=>v).map(([k])=>k);
    try { await assignLeads(ids); setAssignModal(null); setAssigned({}); }
    catch(e) { alert(e.message); }
  }

  function openAssign(s) {
    const pre = {};
    students.forEach(st => { if (st.counselor_id === s.id) pre[st.id] = true; });
    setAssigned(pre);
    setAssignModal(s);
  }

  return (
    <div>
      <SectionHead title="Staff Management" sub="Manage counselors, trainers and admin staff">
        <button className="btn btn-primary" onClick={()=>{ setForm(INIT); setAddModal(true); }}><Plus size={13}/> Add Staff</button>
      </SectionHead>

      {/* Summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
        {[["Total Staff",totals.total,"#2563EB"],["Active",totals.active,"#4ADE80"],["Students Managed",totals.managed,"#C084FC"],["Avg Performance",totals.avgPerf+"%","#FB923C"]].map(([l,v,c])=>(
          <div key={l} className="card" style={{ padding:"16px 18px" }}>
            <p style={{ fontSize:24, fontWeight:800, color:c, marginBottom:4 }}>{v}</p>
            <p style={{ fontSize:12, color:"#475569" }}>{l}</p>
          </div>
        ))}
      </div>

      {error   ? <PageError message={error} onRetry={refetch}/> :
       loading  ? <Spinner text="Loading staff…"/> : (
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#080B14" }}>
              {["Staff Member","Role","Contact","Students","Performance","Status","Actions"].map(h=><th key={h}>{h}</th>)}
            </tr></thead>
            <tbody>
              {staff.map(s=>{
                const perf = Number(s.performance||0);
                return (
                  <tr key={s.id} className="tr-row" style={{ borderTop:"1px solid #1E2A45" }}>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:11 }}>
                        <Avatar name={s.name} size={36} fontSize={14}/>
                        <div>
                          <p style={{ fontSize:13, fontWeight:700, color:"#E2E8F0" }}>{s.name}</p>
                          <p style={{ fontSize:11, color:"#334155" }}>Joined {s.joined_date ? new Date(s.joined_date).toLocaleDateString("en-IN") : "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td><Badge status={s.role}/></td>
                    <td style={{ fontSize:12.5 }}>
                      <p style={{ color:"#94A3B8" }}>{s.email}</p>
                      <p style={{ color:"#60A5FA" }}>{s.phone||"—"}</p>
                    </td>
                    <td style={{ fontSize:15, fontWeight:700, color:"#E2E8F0" }}>{s.student_count||0}</td>
                    <td style={{ minWidth:160 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div className="progress-bar" style={{ flex:1 }}>
                          <div className="progress-fill" style={{ width:perf+"%", background:`linear-gradient(90deg,${perfColor(perf)},${perfColor(perf)}88)` }}/>
                        </div>
                        <span style={{ fontSize:12, color:perfColor(perf), fontWeight:700, minWidth:34 }}>{perf}%</span>
                      </div>
                    </td>
                    <td><Badge status={s.is_active?"Active":"Inactive"}/></td>
                    <td>
                      <div style={{ display:"flex", gap:5 }}>
                        <button className="btn btn-ghost"   style={{ padding:"4px 8px" }}><Edit size={12}/></button>
                        <button className="btn btn-primary" style={{ padding:"4px 10px", fontSize:11 }} onClick={()=>openAssign(s)}>Assign Leads</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal open={addModal} onClose={()=>setAddModal(false)} title="Add Staff Member" width={480}>
        <form onSubmit={e => { e.preventDefault(); handleCreate(); }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <FormField label="Full Name" required col="1/-1"><input className="inp" value={form.name} onChange={set("name")} placeholder="Staff member's full name" autoComplete="off"/></FormField>
            <FormField label="Email" required col="1/-1"><input className="inp" type="email" value={form.email} onChange={set("email")} placeholder="staff@eduspark.in" autoComplete="off"/></FormField>
            <FormField label="Password" required col="1/-1"><input className="inp" type="password" value={form.password} onChange={set("password")} placeholder="Min 8 characters" autoComplete="new-password"/></FormField>
            <FormField label="Role" required col="1">
              <select className="inp" value={form.role} onChange={set("role")}>{ROLES.map(r=><option key={r} value={r}>{r}</option>)}</select>
            </FormField>
            <FormField label="Phone" col="2"><input className="inp" value={form.phone} onChange={set("phone")} placeholder="9XXXXXXXXX" autoComplete="off"/></FormField>
            <FormField label="Joining Date" col="1"><input className="inp" type="date" value={form.joined_date} onChange={set("joined_date")}/></FormField>
          </div>
          <div style={{ display:"flex", gap:10, marginTop:18 }}>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? "Adding…" : <><CheckCircle size={13}/> Add Staff</>}
            </button>
            <button type="button" className="btn btn-ghost" onClick={()=>setAddModal(false)}>Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Assign Leads Modal */}
      <Modal open={!!assignModal} onClose={()=>setAssignModal(null)} title={`Assign Students — ${assignModal?.name||""}`} width={480}>
        <p style={{ fontSize:13, color:"#64748B", marginBottom:14 }}>
          Select students to assign to <b style={{ color:"#93C5FD" }}>{assignModal?.name}</b>
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:300, overflowY:"auto", marginBottom:16 }}>
          {students.map(s=>(
            <label key={s.id} style={{ display:"flex", alignItems:"center", gap:12, background:"#131D35", borderRadius:10, padding:"10px 14px", cursor:"pointer", border:"1px solid #1E2A45" }}>
              <input type="checkbox" style={{ accentColor:"#2563EB" }} checked={!!assigned[s.id]} onChange={e=>setAssigned(p=>({ ...p, [s.id]: e.target.checked }))}/>
              <Avatar name={s.full_name} size={30} fontSize={12}/>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:"#E2E8F0" }}>{s.full_name}</p>
                <p style={{ fontSize:11, color:"#475569" }}>{s.course_name||"—"} · {s.status}</p>
              </div>
              <Badge status={s.status}/>
            </label>
          ))}
        </div>
        <p style={{ fontSize:12, color:"#475569", marginBottom:14 }}>
          {Object.values(assigned).filter(Boolean).length} students selected
        </p>
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn btn-primary" onClick={handleAssign} disabled={assigning}>
            {assigning?"Saving…":<><CheckCircle size={13}/> Save Assignment</>}
          </button>
          <button className="btn btn-ghost" onClick={()=>setAssignModal(null)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
