// src/pages/AddStudent.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, CheckCircle, MessageSquare, RotateCcw } from "lucide-react";
import { SectionHead, FormField } from "../components/shared";
import { useApi, useMutation } from "../hooks/useApi";
import { validateStudentForm, hasErrors } from "../utils/validate";
import studentsApi from "../api/students.api";
import coursesApi  from "../api/courses.api";
import staffApi    from "../api/staff.api";

const INIT = {
  full_name:"", gender:"male", dob:"", mobile:"", parent_mobile:"",
  email:"", address:"", course_id:"", batch_timing:"", counselor_id:"",
  lead_status:"new_inquiry", inquiry_source:"", next_followup:"", notes:"",
  total_fees:"", discount:"0", paid:"0", payment_mode:"cash", due_date:"",
};

function Section({ title, emoji, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid #1E2A45" }}>
        <span style={{ fontSize: 18 }}>{emoji}</span>
        <p style={{ fontSize: 14, fontWeight: 800, color: "#F1F5F9" }}>{title}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>{children}</div>
    </div>
  );
}

export default function AddStudent() {
  const navigate = useNavigate();
  const [form,     setForm]     = useState(INIT);
  const [errors,   setErrors]   = useState({});
  const [success,  setSuccess]  = useState(false);
  const [apiError, setApiError] = useState("");

  const { data: coursesData } = useApi(() => coursesApi.list());
  const { data: staffData   } = useApi(() => staffApi.list());
  const { mutate, loading }   = useMutation((data) => studentsApi.create(data));

  const courses     = coursesData?.courses || [];
  const counselors  = (staffData?.staff || []).filter(s => s.role.includes("counselor") || s.role === "admin");

  const set = k => e => {
    setForm(p => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors(p => { const n = { ...p }; delete n[k]; return n; });
  };

  function pickCourse(e) {
    const id = e.target.value;
    const c  = courses.find(c => c.id === id);
    setForm(p => ({ ...p, course_id: id, total_fees: c ? String(c.fees) : p.total_fees }));
    if (errors.course_id) setErrors(p => { const n = { ...p }; delete n.course_id; return n; });
  }

  const pending = Math.max(0, Number(form.total_fees||0) - Number(form.paid||0) - Number(form.discount||0));

  async function handleSave(sendWA = false) {
    const errs = validateStudentForm(form);
    if (hasErrors(errs)) { setErrors(errs); return; }
    setApiError("");
    try {
      await mutate({
        ...form,
        total_fees: Number(form.total_fees) || undefined,
        discount:   Number(form.discount)   || 0,
        paid:       Number(form.paid)        || 0,
      });
      setSuccess(true);
      setTimeout(() => navigate("/students"), 1200);
    } catch (e) { setApiError(e.message); }
  }

  return (
    <div>
      <button className="btn btn-ghost" style={{ marginBottom: 18 }} onClick={() => navigate("/students")}>
        <ChevronLeft size={14} /> Back to Students
      </button>
      <SectionHead title="Add New Student" sub="Fill in all details to enroll and set up a follow-up." />

      {apiError && (
        <div style={{ background: "#DC262618", border: "1px solid #DC262633", borderRadius: 10, padding: "10px 16px", marginBottom: 18, fontSize: 13, color: "#F87171" }}>
          ⚠️ {apiError}
        </div>
      )}
      {success && (
        <div style={{ background: "#16A34A18", border: "1px solid #16A34A33", borderRadius: 10, padding: "10px 16px", marginBottom: 18, fontSize: 13, color: "#4ADE80" }}>
          ✓ Student enrolled successfully! Redirecting…
        </div>
      )}

      <div className="card" style={{ padding: 28 }}>
        <Section title="Basic Information" emoji="👤">
          <FormField label="Full Name" required col="1/-1" error={errors.full_name}><input className="inp" value={form.full_name} onChange={set("full_name")} placeholder="e.g. Priya Sharma" /></FormField>
          <FormField label="Gender" col="1"><select className="inp" value={form.gender} onChange={set("gender")}>{["male","female","other"].map(g=><option key={g} value={g}>{g}</option>)}</select></FormField>
          <FormField label="Date of Birth" col="2"><input className="inp" type="date" value={form.dob} onChange={set("dob")} /></FormField>
          <FormField label="Mobile Number" required col="1" hint="10-digit Indian mobile" error={errors.mobile}><input className="inp" value={form.mobile} onChange={set("mobile")} placeholder="9XXXXXXXXX" /></FormField>
          <FormField label="Parent Mobile" col="2" error={errors.parent_mobile}><input className="inp" value={form.parent_mobile} onChange={set("parent_mobile")} placeholder="9XXXXXXXXX" /></FormField>
          <FormField label="Email Address" col="1/-1" error={errors.email}><input className="inp" type="email" value={form.email} onChange={set("email")} placeholder="student@email.com" /></FormField>
          <FormField label="Full Address" col="1/-1"><textarea className="inp" rows={2} value={form.address} onChange={set("address")} placeholder="House no., Street, Area, City, PIN" /></FormField>
        </Section>

        <Section title="Course Details" emoji="📚">
          <FormField label="Course Name" required col="1" error={errors.course_id}>
            <select className="inp" value={form.course_id} onChange={pickCourse}>
              <option value="">Select a course…</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name} — ₹{Number(c.fees).toLocaleString()}</option>)}
            </select>
          </FormField>
          <FormField label="Batch Timing" col="2"><input className="inp" value={form.batch_timing} onChange={set("batch_timing")} placeholder="e.g. 9:00 AM – 11:00 AM" /></FormField>
          <FormField label="Counselor Assigned" required col="1/-1" error={errors.counselor_id}>
            <select className="inp" value={form.counselor_id} onChange={set("counselor_id")}>
              <option value="">Select counselor…</option>
              {counselors.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
            </select>
          </FormField>
        </Section>

        <Section title="Fees Details" emoji="💰">
          <FormField label="Total Fees (₹)" required col="1" error={errors.total_fees}><input className="inp" type="number" value={form.total_fees} onChange={set("total_fees")} placeholder="35000" /></FormField>
          <FormField label="Discount (₹)" col="2"><input className="inp" type="number" value={form.discount} onChange={set("discount")} placeholder="0" /></FormField>
          <FormField label="Paid Amount (₹)" col="1"><input className="inp" type="number" value={form.paid} onChange={set("paid")} placeholder="0" /></FormField>
          <FormField label="Remaining (auto)" col="2"><input className="inp" readOnly value={form.total_fees ? "₹" + pending.toLocaleString("en-IN") : "—"} style={{ color: "#F87171", fontWeight: 700 }} /></FormField>
          <FormField label="Payment Mode" col="1">
            <select className="inp" value={form.payment_mode} onChange={set("payment_mode")}>
              {["cash","upi","neft","cheque","emi","scholarship"].map(m=><option key={m} value={m}>{m.toUpperCase()}</option>)}
            </select>
          </FormField>
          <FormField label="Fee Due Date" col="2"><input className="inp" type="date" value={form.due_date} onChange={set("due_date")} /></FormField>
        </Section>

        <Section title="Follow-up & Lead Details" emoji="📋">
          <FormField label="Inquiry Source" col="1">
            <select className="inp" value={form.inquiry_source} onChange={set("inquiry_source")}>
              <option value="">Select source…</option>
              {["Walk-in","Instagram","Facebook","Google","Referral","WhatsApp","Email","Other"].map(s=><option key={s} value={s.toLowerCase().replace("-","_")}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Lead Status" col="2">
            <select className="inp" value={form.lead_status} onChange={set("lead_status")}>
              {["new_inquiry","interested","demo_scheduled","enrolled","not_interested"].map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
            </select>
          </FormField>
          <FormField label="Next Follow-up Date" col="1"><input className="inp" type="date" value={form.next_followup} onChange={set("next_followup")} /></FormField>
          <FormField label="Notes" col="1/-1"><textarea className="inp" rows={3} value={form.notes} onChange={set("notes")} placeholder="Any additional notes…" /></FormField>
        </Section>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-primary" style={{ padding: "10px 24px" }} onClick={() => handleSave(false)} disabled={loading || hasErrors(errors)}>
            {loading ? "Saving…" : <><CheckCircle size={14} /> Save Student</>}
          </button>
          <button className="btn btn-success" style={{ padding: "10px 24px" }} onClick={() => handleSave(true)} disabled={loading || hasErrors(errors)}>
            <MessageSquare size={14} /> Save & Send WhatsApp
          </button>
          <button className="btn btn-ghost" style={{ padding: "10px 18px" }} onClick={() => setForm(INIT)}><RotateCcw size={13} /> Reset</button>
          <button className="btn btn-ghost" style={{ padding: "10px 18px", marginLeft: "auto" }} onClick={() => navigate("/students")}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
