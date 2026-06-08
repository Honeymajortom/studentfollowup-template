// src/pages/Fees.jsx
import { useState } from "react";
import { Plus, Download, Printer, MessageSquare, CheckCircle } from "lucide-react";
import { SectionHead, Badge, Avatar, Modal, FormField } from "../components/shared";
import { Spinner, PageError, EmptyState } from "../components/shared/Spinner";
import { useApi, useMutation } from "../hooks/useApi";
import feesApi from "../api/fees.api";

const MODES = ["cash","upi","neft","cheque","emi","scholarship"];

function inr(n) { return n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—"; }

export default function Fees() {
  const [payModal,  setPayModal]  = useState(null);
  const [receipt,   setReceipt]   = useState(null);
  const [payForm,   setPayForm]   = useState({ amount:"", mode:"upi", reference_no:"", note:"" });
  const set = k => e => setPayForm(p => ({ ...p, [k]: e.target.value }));

  const { data: dash }                              = useApi(() => feesApi.dashboard());
  const { data, loading, error, refetch }           = useApi(() => feesApi.list({ limit: 50 }));
  const { mutate: savePayment, loading: saving, success } = useMutation((d) => feesApi.addPayment(d));

  const rows  = data?.rows || [];
  const d     = dash || {};

  async function handlePayment() {
    try {
      await savePayment({ student_id: payModal.student_id, ...payForm, amount: Number(payForm.amount) });
      setPayModal(null);
      setPayForm({ amount:"", mode:"upi", reference_no:"", note:"" });
      refetch();
    } catch (e) { alert(e.message); }
  }

  async function handleReceipt(paymentId) {
    try {
      const res = await feesApi.downloadReceipt(paymentId);
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      window.open(url, "_blank");
    } catch (e) { alert("Could not generate receipt: " + e.message); }
  }

  const STATS = [
    { emoji:"💰", label:"Total Collected",  value: inr(d.total_collected),   color:"#4ADE80" },
    { emoji:"⏳", label:"Total Pending",     value: inr(d.total_pending),      color:"#FB923C" },
    { emoji:"📅", label:"Today's Collection",value: inr(d.today_collection),  color:"#60A5FA" },
    { emoji:"🚨", label:"Overdue Count",     value: d.overdue_count ?? "—",   color:"#F87171" },
  ];

  return (
    <div>
      <SectionHead title="Fees Management" sub="Track all fee collections, pending dues and receipts">
        <button className="btn btn-ghost"><Download size={13}/> Export</button>
        <button className="btn btn-primary"><Plus size={13}/> Add Payment</button>
      </SectionHead>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        {STATS.map(s=>(
          <div key={s.label} className="card" style={{ padding:"18px 20px" }}>
            <span style={{ fontSize:24 }}>{s.emoji}</span>
            <p style={{ fontSize:24, fontWeight:800, color:s.color, marginTop:8, marginBottom:3 }}>{s.value}</p>
            <p style={{ fontSize:12, color:"#475569" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {error   ? <PageError message={error} onRetry={refetch} /> :
       loading  ? <Spinner text="Loading fees…" /> :
       rows.length===0 ? <EmptyState emoji="💸" title="No fee records yet" /> : (
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:"#080B14" }}>
              {["Student","Course","Total","Paid","Pending","Due Date","Status","Actions"].map(h=><th key={h}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map(s=>(
                <tr key={s.id} className="tr-row" style={{ borderTop:"1px solid #1E2A45" }}>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <Avatar name={s.full_name} size={32} fontSize={13}/>
                      <div>
                        <p style={{ fontSize:13, fontWeight:700, color:"#E2E8F0" }}>{s.full_name}</p>
                        <p style={{ fontSize:11, color:"#334155" }}>{s.student_code}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize:12.5, color:"#C084FC" }}>{s.course_name||"—"}</td>
                  <td style={{ fontSize:13, fontWeight:600 }}>{inr(s.total_fees)}</td>
                  <td style={{ fontSize:13, fontWeight:700, color:"#4ADE80" }}>{inr(s.paid)}</td>
                  <td style={{ fontSize:13, fontWeight:700, color: Number(s.total_fees)-Number(s.paid||0)-Number(s.discount||0)>0 ? "#F87171":"#4ADE80" }}>
                    {inr(Math.max(0, Number(s.total_fees)-Number(s.paid||0)-Number(s.discount||0)))}
                  </td>
                  <td style={{ fontSize:12.5, color:"#64748B" }}>{s.due_date ? new Date(s.due_date).toLocaleDateString("en-IN") : "—"}</td>
                  <td><Badge status={s.fees_status?.charAt(0).toUpperCase()+s.fees_status?.slice(1)||"—"}/></td>
                  <td>
                    <div style={{ display:"flex", gap:5 }}>
                      <button className="btn btn-primary" style={{ padding:"4px 10px", fontSize:11 }}
                        onClick={()=>setPayModal(s)}><Plus size={11}/> Pay</button>
                      <button className="btn btn-ghost" style={{ padding:"4px 7px" }}
                        title="Print Receipt" onClick={()=>setReceipt(s)}><Printer size={11}/></button>
                      <button className="btn btn-ghost" style={{ padding:"4px 7px" }} title="Remind"><MessageSquare size={11}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Payment Modal */}
      <Modal open={!!payModal} onClose={()=>setPayModal(null)} title="Add Payment" width={440}>
        {payModal&&(
          <>
            <div style={{ background:"#131D35", borderRadius:10, padding:"12px 16px", marginBottom:18, border:"1px solid #1E2A45", display:"flex", justifyContent:"space-between" }}>
              <div>
                <p style={{ fontSize:14, fontWeight:700, color:"#E2E8F0" }}>{payModal.full_name}</p>
                <p style={{ fontSize:12, color:"#7C3AED" }}>{payModal.course_name}</p>
              </div>
              <div style={{ textAlign:"right" }}>
                <p style={{ fontSize:11, color:"#475569" }}>Remaining</p>
                <p style={{ fontSize:17, fontWeight:800, color:"#F87171" }}>
                  {inr(Math.max(0,Number(payModal.total_fees)-Number(payModal.paid||0)-Number(payModal.discount||0)))}
                </p>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <FormField label="Amount (₹)" required><input className="inp" type="number" value={payForm.amount} onChange={set("amount")} placeholder="Enter amount…"/></FormField>
              <FormField label="Payment Mode">
                <select className="inp" value={payForm.mode} onChange={set("mode")}>
                  {MODES.map(m=><option key={m} value={m}>{m.toUpperCase()}</option>)}
                </select>
              </FormField>
              <FormField label="Transaction / Reference No"><input className="inp" value={payForm.reference_no} onChange={set("reference_no")} placeholder="UPI Ref, Cheque No…"/></FormField>
              <FormField label="Note"><input className="inp" value={payForm.note} onChange={set("note")} placeholder="e.g. 2nd instalment"/></FormField>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:18, alignItems:"center" }}>
              <button className="btn btn-primary" onClick={handlePayment} disabled={saving}>
                {saving ? "Saving…" : <><CheckCircle size={13}/> Save Payment</>}
              </button>
              <button className="btn btn-ghost" onClick={()=>setPayModal(null)}>Cancel</button>
              {success && <span style={{ color:"#4ADE80", fontSize:13 }}>✓ Saved!</span>}
            </div>
          </>
        )}
      </Modal>

      {/* Receipt modal — shows student summary, actual PDF opens in new tab */}
      <Modal open={!!receipt} onClose={()=>setReceipt(null)} title="Payment Receipt" width={440}>
        {receipt&&(
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🧾</div>
            <p style={{ fontSize:15, fontWeight:700, color:"#F1F5F9", marginBottom:6 }}>{receipt.full_name}</p>
            <p style={{ fontSize:13, color:"#7C3AED", marginBottom:20 }}>{receipt.course_name}</p>
            <p style={{ fontSize:13, color:"#64748B", marginBottom:20 }}>
              Open the latest payment receipt as a PDF. It will open in a new tab.
            </p>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <button className="btn btn-primary" onClick={async()=>{
                const payments = await feesApi.studentPayments(receipt.student_id||receipt.id);
                const latest   = payments.data.data.payments?.[0];
                if (latest) handleReceipt(latest.id);
                setReceipt(null);
              }}><Printer size={13}/> Open PDF</button>
              <button className="btn btn-ghost" onClick={()=>setReceipt(null)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
