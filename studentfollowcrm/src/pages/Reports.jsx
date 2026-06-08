// src/pages/Reports.jsx
import { useState } from "react";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Download, Printer, Filter, Activity, ArrowRight } from "lucide-react";
import { SectionHead, ChartTooltip, Modal, FormField } from "../components/shared";
import { Spinner, PageError } from "../components/shared/Spinner";
import { useApi } from "../hooks/useApi";
import reportsApi from "../api/reports.api";
import coursesApi from "../api/courses.api";
import { REPORT_TYPES } from "../data/mockData";

export default function Reports() {
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]);
  const [to,   setTo]   = useState(new Date().toISOString().split("T")[0]);
  const [activeReport, setActiveReport] = useState(null);

  const { data: kpi,      loading: kpiLoad, error: kpiErr, refetch } = useApi(() => reportsApi.dashboard({ from, to }), [from, to]);
  const { data: admData,  loading: admLoad  }                         = useApi(() => reportsApi.admissions({ from, to }), [from, to]);
  const { data: srcData                     }                         = useApi(() => reportsApi.leadSources({ from, to }), [from, to]);
  const { data: cData                       }                         = useApi(() => coursesApi.list());

  const kpiS  = kpi?.students  || {};
  const kpiF  = kpi?.fees      || {};
  const courses = cData?.courses || [];

  const inr = (n) => n ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

  const KPIS = [
    { label:"Total Revenue",      value: inr(kpiF.collected),                  color:"#4ADE80" },
    { label:"Pending Fees",       value: inr(kpiF.pending),                    color:"#FB923C" },
    { label:"New Admissions",     value: kpiS.enrolled_this_period ?? "—",     color:"#60A5FA" },
    { label:"Lead Conv. Rate",    value: kpiS.total ? Math.round((kpiS.enrolled_this_period||0)/kpiS.total*100)+"%":"—", color:"#C084FC" },
    { label:"Overdue Fees",       value: kpiF.overdue_count ?? "—",            color:"#F87171" },
  ];

  const COLORS = ["#E1306C","#4285F4","#7C3AED","#10B981","#1877F2"];
  const pieData = srcData?.rows || [];

  if (kpiLoad) return <Spinner text="Loading reports…"/>;
  if (kpiErr)  return <PageError message={kpiErr} onRetry={refetch}/>;

  return (
    <div>
      <SectionHead title="Reports & Analytics" sub="Detailed insights to drive better decisions">
        <button className="btn btn-ghost"><Download size={13}/> PDF</button>
        <button className="btn btn-ghost"><Printer  size={13}/> Print</button>
      </SectionHead>

      {/* Filter bar */}
      <div className="card" style={{ padding:"14px 20px", marginBottom:22, display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
        <span style={{ fontSize:13, fontWeight:700, color:"#64748B", flexShrink:0 }}><Filter size={13} style={{ marginRight:6, verticalAlign:"middle" }}/>Filters:</span>
        <input className="inp" type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{ maxWidth:155 }}/>
        <span style={{ color:"#334155", fontSize:12 }}>to</span>
        <input className="inp" type="date" value={to}   onChange={e=>setTo(e.target.value)}   style={{ maxWidth:155 }}/>
        <select className="inp" style={{ maxWidth:200 }}>
          <option>All Courses</option>
          {courses.map(c=><option key={c.id}>{c.name}</option>)}
        </select>
        <button className="btn btn-primary" style={{ marginLeft:"auto" }} onClick={refetch}><Activity size={13}/> Refresh</button>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:24 }}>
        {KPIS.map(({ label, value, color })=>(
          <div key={label} className="card" style={{ padding:"14px 16px", textAlign:"center" }}>
            <p style={{ fontSize:22, fontWeight:800, color, marginBottom:3 }}>{value}</p>
            <p style={{ fontSize:11.5, color:"#475569" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:18, marginBottom:18 }}>
        <div className="card" style={{ padding:"20px 24px" }}>
          <p style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:16 }}>Monthly Admissions & Conversions</p>
          {admLoad ? <Spinner/> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={admData?.rows||[]} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2A45" vertical={false}/>
                <XAxis dataKey="month" tick={{ fill:"#475569", fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:"#475569", fontSize:11 }} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Legend wrapperStyle={{ fontSize:12, color:"#64748B" }}/>
                <Bar dataKey="admissions"  name="Admissions"  fill="#2563EB" radius={[4,4,0,0]} maxBarSize={16}/>
                <Bar dataKey="conversions" name="Conversions" fill="#10B981" radius={[4,4,0,0]} maxBarSize={16}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card" style={{ padding:"20px 24px" }}>
          <p style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:16 }}>Lead Source Breakdown</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="count" nameKey="source">
                {pieData.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{ background:"#0E1525", border:"1px solid #1E2A45", borderRadius:10, fontSize:12 }}/>
              <Legend wrapperStyle={{ fontSize:11.5, color:"#64748B" }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue area chart */}
      <div className="card" style={{ padding:"20px 24px", marginBottom:22 }}>
        <p style={{ fontSize:14, fontWeight:700, color:"#F1F5F9", marginBottom:16 }}>Monthly Revenue Trend</p>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={admData?.rows||[]}>
            <defs>
              <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E2A45" vertical={false}/>
            <XAxis dataKey="month" tick={{ fill:"#475569", fontSize:11 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill:"#475569", fontSize:11 }} axisLine={false} tickLine={false}/>
            <Tooltip content={<ChartTooltip/>}/>
            <Area type="monotone" dataKey="admissions" name="Admissions" stroke="#10B981" fill="url(#gRev)" strokeWidth={2.5}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Report type cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
        {REPORT_TYPES.map(r=>(
          <div key={r.title} className="card card-hover" style={{ padding:20, cursor:"pointer" }} onClick={()=>setActiveReport(r)}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
              <div style={{ width:40, height:40, borderRadius:11, background:r.color+"18", border:`1px solid ${r.color}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>
                {r.emoji}
              </div>
              <p style={{ fontSize:14, fontWeight:700, color:"#F1F5F9" }}>{r.title}</p>
            </div>
            <p style={{ fontSize:12.5, color:"#475569", lineHeight:1.6, marginBottom:12 }}>{r.desc}</p>
            <button className="btn btn-ghost" style={{ width:"100%", justifyContent:"center", fontSize:12 }}>Generate <ArrowRight size={12}/></button>
          </div>
        ))}
      </div>

      <Modal open={!!activeReport} onClose={()=>setActiveReport(null)} title={activeReport?.title||""} width={480}>
        {activeReport&&(
          <div>
            <p style={{ fontSize:13, color:"#94A3B8", marginBottom:20 }}>{activeReport.desc}</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
              <FormField label="Date From" col="1"><input className="inp" type="date" defaultValue={from}/></FormField>
              <FormField label="Date To"   col="2"><input className="inp" type="date" defaultValue={to}/></FormField>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button className="btn btn-primary" onClick={()=>setActiveReport(null)}><Download size={13}/> Download PDF</button>
              <button className="btn btn-ghost"   onClick={()=>setActiveReport(null)}><Printer   size={13}/> Print</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
