// src/pages/Attendance.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Save, CheckCircle } from "lucide-react";
import { SectionHead, Avatar } from "../components/shared";
import { Spinner, PageError, EmptyState } from "../components/shared/Spinner";
import { useApi, useMutation } from "../hooks/useApi";
import attendanceApi from "../api/attendance.api";
import coursesApi    from "../api/courses.api";

export default function Attendance() {
  const navigate = useNavigate();
  const [courseId, setCourseId] = useState("");
  const [date,     setDate]     = useState(new Date().toISOString().split("T")[0]);
  const [records,  setRecords]  = useState([]);   // [{ student_id, status, remark }]
  const [saved,    setSaved]    = useState(false);

  const { data: cData }                            = useApi(() => coursesApi.list());
  const { mutate: save, loading: saving }          = useMutation((d) => attendanceApi.markBulk(d));

  const courses = cData?.courses || [];

  // When courseId or date changes, load existing attendance sheet
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError,   setSheetError]   = useState(null);

  useEffect(() => {
    if (!courseId) return;
    setSheetLoading(true);
    setSheetError(null);
    attendanceApi.getByDate(courseId, date)
      .then(r => {
        const rows = r.data.data.records || [];
        setRecords(rows.map(s => ({
          student_id: s.id,
          full_name:  s.full_name,
          student_code: s.student_code,
          mobile:     s.mobile,
          status:     s.status || "present",
          remark:     s.remark || "",
        })));
      })
      .catch(e => setSheetError(e.message))
      .finally(() => setSheetLoading(false));
  }, [courseId, date]);

  function toggle(id, status)   { setRecords(r => r.map(s => s.student_id===id ? { ...s, status } : s)); }
  function setRemark(id, remark){ setRecords(r => r.map(s => s.student_id===id ? { ...s, remark } : s)); }
  function markAll(status)      { setRecords(r => r.map(s => ({ ...s, status }))); }

  async function handleSave() {
    if (!courseId) return alert("Please select a course first.");
    try {
      await save({ course_id: courseId, date, records: records.map(({ student_id, status, remark }) => ({ student_id, status, remark })) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { alert(e.message); }
  }

  const present = records.filter(r => r.status === "present").length;
  const absent  = records.length - present;
  const rate    = records.length ? Math.round(present / records.length * 100) : 0;

  return (
    <div>
      <SectionHead title="Attendance Management" sub="Mark and track daily student attendance">
        <button className="btn btn-ghost"><Download size={13}/> Export</button>
      </SectionHead>

      {/* Controls */}
      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
        <select className="inp" style={{ maxWidth:280 }} value={courseId} onChange={e=>setCourseId(e.target.value)}>
          <option value="">Select a course…</option>
          {courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className="inp" type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ maxWidth:180 }}/>

        {/* Summary chips */}
        {records.length > 0 && (
          <div style={{ marginLeft:"auto", display:"flex", gap:10 }}>
            {[["Present",present,"#16A34A18","#16A34A33","#4ADE80"],["Absent",absent,"#DC262618","#DC262633","#F87171"],["Rate",rate+"%","#2563EB18","#2563EB33","#60A5FA"]].map(([l,v,bg,border,color])=>(
              <div key={l} style={{ background:bg, border:`1px solid ${border}`, borderRadius:10, padding:"8px 16px", textAlign:"center" }}>
                <p style={{ fontSize:20, fontWeight:800, color }}>{v}</p>
                <p style={{ fontSize:11, color:"#64748B" }}>{l}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sheet */}
      {!courseId ? (
        <EmptyState emoji="☝️" title="Select a course to begin"
          sub="Choose a course and date from the controls above to load the attendance sheet" />
      ) : sheetLoading ? <Spinner text="Loading attendance sheet…"/> :
        sheetError   ? <PageError message={sheetError}/> :
        records.length === 0 ? (
          <EmptyState emoji="👥" title="No students in this course"
            sub="Enrol students into this course first, then you can mark attendance"
            action={{ label: "Go to Students", onClick: () => navigate("/students") }} />
        ) : (
        <div className="card" style={{ padding:0, overflow:"hidden", marginBottom:14 }}>
          <div style={{ background:"#080B14", padding:"10px 18px", display:"flex", gap:8, borderBottom:"1px solid #1E2A45" }}>
            <button className="btn btn-success" style={{ fontSize:12, padding:"4px 12px" }} onClick={()=>markAll("present")}>✓ Mark All Present</button>
            <button className="btn btn-danger"  style={{ fontSize:12, padding:"4px 12px" }} onClick={()=>markAll("absent")}>✗ Mark All Absent</button>
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#080B14" }}>
              {["#","Student","Mobile","Status","Remarks"].map(h=><th key={h}>{h}</th>)}
            </tr></thead>
            <tbody>
              {records.map((s,i)=>{
                const isPresent = s.status === "present";
                return (
                  <tr key={s.student_id} className="tr-row" style={{ borderTop:"1px solid #1E2A45" }}>
                    <td className="mono" style={{ fontSize:11, color:"#334155" }}>{i+1}</td>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <Avatar name={s.full_name} size={34} fontSize={14}/>
                        <div>
                          <p style={{ fontSize:13, fontWeight:700, color:"#E2E8F0" }}>{s.full_name}</p>
                          <p style={{ fontSize:11, color:"#475569" }}>{s.student_code}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize:12.5, color:"#94A3B8" }}>{s.mobile}</td>
                    <td>
                      <div style={{ display:"flex", gap:7 }}>
                        <button onClick={()=>toggle(s.student_id,"present")} className="btn" style={{ padding:"5px 12px", fontSize:12, background:isPresent?"#16A34A22":"#131D35", color:isPresent?"#4ADE80":"#64748B", border:isPresent?"1px solid #16A34A44":"1px solid #1E2A45", transition:"all .15s" }}>✓ Present</button>
                        <button onClick={()=>toggle(s.student_id,"absent")}  className="btn" style={{ padding:"5px 12px", fontSize:12, background:!isPresent?"#DC262622":"#131D35", color:!isPresent?"#F87171":"#64748B", border:!isPresent?"1px solid #DC262644":"1px solid #1E2A45", transition:"all .15s" }}>✗ Absent</button>
                      </div>
                    </td>
                    <td>
                      <input className="inp" style={{ padding:"5px 10px", fontSize:12, maxWidth:220 }} placeholder="Optional remark…" value={s.remark} onChange={e=>setRemark(s.student_id,e.target.value)}/>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {records.length > 0 && (
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <button className="btn btn-primary" style={{ padding:"10px 28px" }} onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : <><Save size={14}/> Save Attendance</>}
          </button>
          {saved && <span style={{ color:"#4ADE80", fontSize:13, display:"flex", alignItems:"center", gap:5 }}><CheckCircle size={14}/> Saved successfully!</span>}
          <span style={{ fontSize:12, color:"#475569" }}>{present} present · {absent} absent · {date}</span>
        </div>
      )}
    </div>
  );
}
