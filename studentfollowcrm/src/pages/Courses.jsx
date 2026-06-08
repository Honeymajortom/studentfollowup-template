// src/pages/Courses.jsx
import { useState } from "react";
import { Plus, Edit, Trash2, Users, CheckCircle, Image } from "lucide-react";
import { SectionHead, Modal, FormField, Badge } from "../components/shared";
import { Spinner, PageError, EmptyState } from "../components/shared/Spinner";
import { useApi, useMutation } from "../hooks/useApi";
import coursesApi from "../api/courses.api";
import staffApi   from "../api/staff.api";

const INIT = { name:"", duration:"", fees:"", trainer_id:"", description:"", max_seats:"30" };

export default function CoursesPage() {
  const [addModal,  setAddModal]  = useState(false);
  const [editTarget,setEditTarget]= useState(null);
  const [form,      setForm]      = useState(INIT);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const { data: cData, loading, error, refetch } = useApi(() => coursesApi.list());
  const { data: sData }                           = useApi(() => staffApi.list());
  const { mutate: saveCreate, loading: creating } = useMutation((d) => coursesApi.create(d));
  const { mutate: saveUpdate, loading: updating } = useMutation((d) => coursesApi.update(editTarget?.id, d));
  const { mutate: doDelete }                      = useMutation((id) => coursesApi.remove(id));

  const courses  = cData?.courses || [];
  const trainers = (sData?.staff  || []).filter(s => s.role === "trainer" || s.role === "admin");
  const saving   = creating || updating;

  function openEdit(c) {
    setForm({ name:c.name, duration:c.duration, fees:String(c.fees), trainer_id:c.trainer_id||"", description:c.description||"", max_seats:String(c.max_seats||30) });
    setEditTarget(c);
    setAddModal(true);
  }

  async function handleSave() {
    try {
      const payload = { ...form, fees: Number(form.fees), max_seats: Number(form.max_seats) };
      if (editTarget) await saveUpdate(payload);
      else            await saveCreate(payload);
      setAddModal(false); setEditTarget(null); setForm(INIT); refetch();
    } catch (e) { alert(e.message); }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Deactivate course "${name}"?`)) return;
    try { await doDelete(id); refetch(); } catch (e) { alert(e.message); }
  }

  if (error)   return <PageError message={error} onRetry={refetch}/>;

  return (
    <div>
      <SectionHead title="Course Management" sub={`${courses.length} active courses`}>
        <button className="btn btn-primary" onClick={()=>{ setForm(INIT); setEditTarget(null); setAddModal(true); }}>
          <Plus size={13}/> Add Course
        </button>
      </SectionHead>

      {/* Summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        {[
          ["Total Courses",   courses.length,                                                            "#2563EB"],
          ["Total Enrolled",  courses.reduce((a,c)=>a+Number(c.enrolled_count||0),0),                   "#10B981"],
          ["Avg Fee",         courses.length ? "₹"+(courses.reduce((a,c)=>a+Number(c.fees),0)/courses.length/1000).toFixed(0)+"K" : "—", "#7C3AED"],
          ["Active Trainers", [...new Set(courses.map(c=>c.trainer_id).filter(Boolean))].length,        "#F59E0B"],
        ].map(([l,v,c])=>(
          <div key={l} className="card" style={{ padding:"16px 18px" }}>
            <p style={{ fontSize:24, fontWeight:800, color:c, marginBottom:4 }}>{v}</p>
            <p style={{ fontSize:12, color:"#475569" }}>{l}</p>
          </div>
        ))}
      </div>

      {loading ? <Spinner text="Loading courses…"/> : courses.length===0 ? <EmptyState emoji="📚" title="No courses yet" sub="Add your first course"/> : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
          {courses.map(c=>{
            const pct = Math.round((Number(c.enrolled_count)||0) / Number(c.max_seats||30) * 100);
            const color = c.color || "#2563EB";
            return (
              <div key={c.id} className="card card-hover" style={{ padding:22 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
                  <div style={{ width:52, height:52, borderRadius:14, background:color+"18", border:`1px solid ${color}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>
                    📚
                  </div>
                  <Badge status="Active"/>
                </div>
                <h3 style={{ fontSize:15, fontWeight:800, color:"#F1F5F9", marginBottom:4 }}>{c.name}</h3>
                <p style={{ fontSize:12.5, color:"#475569", marginBottom:14 }}>{c.description||"—"}</p>
                <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}>
                  {[["⏱",c.duration],["💰","₹"+Number(c.fees).toLocaleString("en-IN")],["👨‍🏫",c.trainer_name||"TBD"]].map(([ic,v])=>(
                    <div key={v} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12.5, color:"#94A3B8" }}>
                      <span>{ic}</span><span>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:11.5, color:"#475569", marginBottom:5 }}>
                    <span>Seats filled</span>
                    <span style={{ color, fontWeight:700 }}>{c.enrolled_count||0}/{c.max_seats||30}</span>
                  </div>
                  <div className="progress-bar"><div style={{ height:"100%", width:pct+"%", borderRadius:3, background:`linear-gradient(90deg,${color},${color}88)` }}/></div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn btn-ghost"   style={{ flex:1, justifyContent:"center", fontSize:12 }} onClick={()=>openEdit(c)}><Edit size={12}/> Edit</button>
                  <button className="btn btn-primary" style={{ flex:1, justifyContent:"center", fontSize:12 }}><Users size={12}/> Students</button>
                  <button className="btn btn-danger"  style={{ padding:"7px 10px" }} onClick={()=>handleDelete(c.id,c.name)}><Trash2 size={12}/></button>
                </div>
              </div>
            );
          })}
          <div className="card" style={{ padding:22, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border:"2px dashed #1E2A45", cursor:"pointer", gap:10 }}
            onClick={()=>{ setForm(INIT); setEditTarget(null); setAddModal(true); }}>
            <div style={{ width:52, height:52, borderRadius:14, background:"#131D35", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Plus size={22} color="#334155"/>
            </div>
            <p style={{ fontSize:14, fontWeight:700, color:"#334155" }}>Add New Course</p>
          </div>
        </div>
      )}

      <Modal open={addModal} onClose={()=>{ setAddModal(false); setEditTarget(null); }} title={editTarget?"Edit Course":"Add New Course"} width={500}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <FormField label="Course Name" required col="1/-1"><input className="inp" value={form.name} onChange={set("name")} placeholder="e.g. Full Stack Development"/></FormField>
          <FormField label="Duration" required col="1"><input className="inp" value={form.duration} onChange={set("duration")} placeholder="e.g. 6 Months"/></FormField>
          <FormField label="Fees (₹)" required col="2"><input className="inp" type="number" value={form.fees} onChange={set("fees")} placeholder="35000"/></FormField>
          <FormField label="Max Seats" col="1"><input className="inp" type="number" value={form.max_seats} onChange={set("max_seats")} placeholder="30"/></FormField>
          <FormField label="Trainer" col="2">
            <select className="inp" value={form.trainer_id} onChange={set("trainer_id")}>
              <option value="">Select trainer…</option>
              {trainers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </FormField>
          <FormField label="Description" col="1/-1"><textarea className="inp" rows={2} value={form.description} onChange={set("description")} placeholder="Technologies covered, key highlights…"/></FormField>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : <><CheckCircle size={13}/> {editTarget?"Update":"Save"} Course</>}
          </button>
          <button className="btn btn-ghost" onClick={()=>{ setAddModal(false); setEditTarget(null); }}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
