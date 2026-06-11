// src/pages/Fees.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Printer, MessageSquare, CheckCircle, X, CreditCard } from "lucide-react";
import { SectionHead, Badge, Avatar, Modal, FormField, ExportMenu } from "../components/shared";
import { Spinner, PageError, EmptyState } from "../components/shared/Spinner";
import { useApi, useMutation } from "../hooks/useApi";
import feesApi from "../api/fees.api";
import { useIsMobile } from "../hooks/useIsMobile";

const MODES = ["cash","upi","neft","cheque","emi","scholarship"];

function inr(n) { return n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—"; }

function FeeCard({ s, selected, onToggle, onPay, onReceipt }) {
  const pending = Math.max(0, Number(s.total_fees) - Number(s.paid || 0) - Number(s.discount || 0));
  return (
    <div className="card" style={{ padding: "14px 16px", background: selected ? "#131D3580" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <Checkbox checked={selected} onChange={onToggle} />
        <Avatar name={s.full_name} size={38} fontSize={15} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: "#E2E8F0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.full_name}</p>
          <p style={{ fontSize: 11, color: "#334155" }}>{s.student_code}</p>
        </div>
        <Badge status={s.fees_status?.charAt(0).toUpperCase() + s.fees_status?.slice(1) || "—"} />
      </div>
      {s.course_name && (
        <p style={{ fontSize: 12, color: "#C084FC", marginBottom: 10 }}>{s.course_name}</p>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[["Total", inr(s.total_fees), "#E2E8F0"], ["Paid", inr(s.paid), "#4ADE80"], ["Due", inr(pending), pending > 0 ? "#F87171" : "#4ADE80"]].map(([l, v, c]) => (
          <div key={l} style={{ textAlign: "center", padding: "8px 4px", background: "#080B14", borderRadius: 8, border: "1px solid #1E2A45" }}>
            <p style={{ fontSize: 10, color: "#475569", marginBottom: 3 }}>{l}</p>
            <p style={{ fontSize: 13, fontWeight: 700, color: c }}>{v}</p>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button className="btn btn-primary" style={{ fontSize: 12, padding: "6px 12px", flex: 1, justifyContent: "center" }} onClick={onPay}>
          <Plus size={12} /> Pay
        </button>
        <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 10px" }} onClick={onReceipt} title="Receipt">
          <Printer size={12} />
        </button>
      </div>
    </div>
  );
}

function Checkbox({ checked, onChange, indeterminate = false }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={el => el && (el.indeterminate = indeterminate)}
      onChange={onChange}
      style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#2563EB", flexShrink: 0 }}
    />
  );
}

export default function Fees() {
  const navigate  = useNavigate();
  const isMobile  = useIsMobile();
  const [exporting, setExporting] = useState(false);

  async function handleExport(format) {
    setExporting(true);
    try {
      const res = await feesApi.export({ format });
      const mime = format === "pdf" ? "application/pdf" : "text/csv";
      const url  = URL.createObjectURL(new Blob([res.data], { type: mime }));
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `fees-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (e) { alert("Export failed: " + e.message); }
    finally { setExporting(false); }
  }
  const [payModal,  setPayModal]  = useState(null);
  const [receipt,   setReceipt]   = useState(null);
  const [payForm,   setPayForm]   = useState({ amount:"", mode:"upi", reference_no:"", note:"" });
  const set = k => e => setPayForm(p => ({ ...p, [k]: e.target.value }));

  // Bulk selection
  const [selected,    setSelected]    = useState(new Set());
  const [bulkModal,   setBulkModal]   = useState(false);
  const [bulkMode,    setBulkMode]    = useState("cash");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg,     setBulkMsg]     = useState("");

  const { data: dash }                              = useApi(() => feesApi.dashboard());
  const { data, loading, error, refetch }           = useApi(() => feesApi.list({ limit: 50 }));
  const { mutate: savePayment, loading: saving, success } = useMutation((d) => feesApi.addPayment(d));

  const rows = data?.rows || [];
  const d    = dash || {};

  // ── Selection helpers ──────────────────────────────────────
  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(prev =>
      prev.size === rows.length ? new Set() : new Set(rows.map(r => r.id))
    );
  }

  const allSelected  = rows.length > 0 && selected.size === rows.length;
  const someSelected = selected.size > 0 && selected.size < rows.length;

  // ── Bulk payment ───────────────────────────────────────────
  async function handleBulkPayment() {
    setBulkLoading(true);
    setBulkMsg("");
    try {
      const res = await feesApi.bulkPayment({
        student_ids: Array.from(selected),
        mode: bulkMode,
      });
      const { processed, skipped } = res.data.data;
      setBulkMsg(`✓ Processed ${processed} student${processed !== 1 ? "s" : ""}${skipped > 0 ? `, ${skipped} skipped (already paid)` : ""}`);
      setSelected(new Set());
      refetch();
      setTimeout(() => { setBulkModal(false); setBulkMsg(""); }, 2000);
    } catch (e) {
      setBulkMsg("Error: " + e.message);
    } finally {
      setBulkLoading(false);
    }
  }

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
    { emoji:"💰", label:"Total Collected",   value: inr(d.total_collected),  color:"#4ADE80" },
    { emoji:"⏳", label:"Total Pending",      value: inr(d.total_pending),    color:"#FB923C" },
    { emoji:"📅", label:"Today's Collection", value: inr(d.today_collection), color:"#60A5FA" },
    { emoji:"🚨", label:"Overdue Count",      value: d.overdue_count ?? "—",  color:"#F87171" },
  ];

  return (
    <div>
      <SectionHead title="Fees Management" sub="Track all fee collections, pending dues and receipts">
        <ExportMenu onExport={handleExport} loading={exporting} />
        <button className="btn btn-primary"><Plus size={13}/> Add Payment</button>
      </SectionHead>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        {STATS.map(s => (
          <div key={s.label} className="card" style={{ padding:"18px 20px" }}>
            <span style={{ fontSize:24 }}>{s.emoji}</span>
            <p style={{ fontSize:24, fontWeight:800, color:s.color, marginTop:8, marginBottom:3 }}>{s.value}</p>
            <p style={{ fontSize:12, color:"#475569" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:10, background:"#131D35", border:"1px solid #4ADE8044", borderRadius:10, padding:"9px 16px", marginBottom:12 }}>
          <span style={{ fontSize:13, color:"#4ADE80", fontWeight:700 }}>
            {selected.size} student{selected.size !== 1 ? "s" : ""} selected
          </span>
          <div style={{ width:1, height:18, background:"#1E2A45" }} />
          <button
            className="btn btn-success"
            style={{ fontSize:12, padding:"5px 12px" }}
            onClick={() => { setBulkMode("cash"); setBulkMsg(""); setBulkModal(true); }}
          >
            <CreditCard size={13} /> Mark as Received
          </button>
          <button
            className="btn btn-ghost"
            style={{ fontSize:12, padding:"5px 10px", marginLeft:"auto" }}
            onClick={() => setSelected(new Set())}
          >
            <X size={13} /> Clear
          </button>
        </div>
      )}

      {/* Table */}
      {error   ? <PageError message={error} onRetry={refetch} /> :
       loading  ? <Spinner text="Loading fees…" /> :
       rows.length === 0 ? <EmptyState emoji="💸" title="No fee records yet"
         sub="Fee records are created automatically when you add a student with a fee plan"
         action={{ label: "+ Add a Student", onClick: () => navigate("/add-student") }} /> :
       isMobile ? (
         <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
           {rows.map(s => (
             <FeeCard key={s.id} s={s}
               selected={selected.has(s.id)}
               onToggle={() => toggleSelect(s.id)}
               onPay={() => setPayModal(s)}
               onReceipt={() => setReceipt(s)}
             />
           ))}
         </div>
       ) : (
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#080B14" }}>
                <th style={{ padding:"12px 14px", width:40 }}>
                  <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
                </th>
                {["Student","Course","Total","Paid","Pending","Due Date","Status","Actions"].map(h => (
                  <th key={h} style={{ padding:"12px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"#334155", textTransform:"uppercase", letterSpacing:".05em", whiteSpace:"nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(s => (
                <tr
                  key={s.id}
                  className="tr-row"
                  style={{ borderTop:"1px solid #1E2A45", background: selected.has(s.id) ? "#131D3580" : undefined }}
                >
                  <td style={{ padding:"12px 14px" }}>
                    <Checkbox checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} />
                  </td>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <Avatar name={s.full_name} size={32} fontSize={13}/>
                      <div>
                        <p style={{ fontSize:13, fontWeight:700, color:"#E2E8F0" }}>{s.full_name}</p>
                        <p style={{ fontSize:11, color:"#334155" }}>{s.student_code}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:12.5, color:"#C084FC" }}>{s.course_name||"—"}</td>
                  <td style={{ padding:"12px 16px", fontSize:13, fontWeight:600 }}>{inr(s.total_fees)}</td>
                  <td style={{ padding:"12px 16px", fontSize:13, fontWeight:700, color:"#4ADE80" }}>{inr(s.paid)}</td>
                  <td style={{ padding:"12px 16px", fontSize:13, fontWeight:700, color: Number(s.total_fees)-Number(s.paid||0)-Number(s.discount||0)>0 ? "#F87171":"#4ADE80" }}>
                    {inr(Math.max(0, Number(s.total_fees)-Number(s.paid||0)-Number(s.discount||0)))}
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:12.5, color:"#64748B" }}>{s.due_date ? new Date(s.due_date).toLocaleDateString("en-IN") : "—"}</td>
                  <td style={{ padding:"12px 16px" }}><Badge status={s.fees_status?.charAt(0).toUpperCase()+s.fees_status?.slice(1)||"—"}/></td>
                  <td style={{ padding:"12px 16px" }}>
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
       )
      }

      {/* Bulk Payment Modal */}
      <Modal open={bulkModal} onClose={() => setBulkModal(false)} title="Mark as Received" width={420}>
        <p style={{ fontSize:13, color:"#64748B", marginBottom:18 }}>
          Record <b style={{ color:"#4ADE80" }}>full pending amount</b> for{" "}
          <b style={{ color:"#4ADE80" }}>{selected.size} student{selected.size !== 1 ? "s" : ""}</b> in a single action.
          Students with no pending balance will be skipped.
        </p>
        <FormField label="Payment Mode" required>
          <select className="inp" value={bulkMode} onChange={e => setBulkMode(e.target.value)}>
            {MODES.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
          </select>
        </FormField>
        {bulkMsg && (
          <p style={{ marginTop:12, fontSize:13, color: bulkMsg.startsWith("Error") ? "#F87171" : "#4ADE80" }}>
            {bulkMsg}
          </p>
        )}
        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          <button
            className="btn btn-success"
            onClick={handleBulkPayment}
            disabled={bulkLoading}
          >
            {bulkLoading ? "Processing…" : <><CreditCard size={13}/> Confirm Receipt</>}
          </button>
          <button className="btn btn-ghost" onClick={() => setBulkModal(false)}>Cancel</button>
        </div>
      </Modal>

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
