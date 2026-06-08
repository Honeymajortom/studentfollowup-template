// src/pages/Dashboard.jsx
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  Users, CalendarCheck, DollarSign, TrendingUp,
  AlertCircle, UserCheck, BookOpen, MessageSquare, Phone,
} from "lucide-react";
import { StatCard, SectionHead, ChartTooltip, Badge } from "../components/shared";
import { Spinner, PageError } from "../components/shared/Spinner";
import { useApi } from "../hooks/useApi";
import reportsApi   from "../api/reports.api";
import followupsApi from "../api/followups.api";

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: kpi,    loading: kpiLoad, error: kpiErr, refetch } = useApi(() => reportsApi.dashboard());
  const { data: fuData, loading: fuLoad }  = useApi(() => followupsApi.list({ limit: 4 }));
  const { data: monthly }                  = useApi(() => reportsApi.admissions());

  if (kpiLoad) return <Spinner text="Loading dashboard…" />;
  if (kpiErr)  return <PageError message={kpiErr} onRetry={refetch} />;

  const s  = kpi?.students  || {};
  const f  = kpi?.fees      || {};
  const fu = kpi?.followups || {};
  const wa = kpi?.whatsapp  || {};

  const inr = (n) => n ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

  const STATS = [
    { icon: Users,         label: "Total Students",      value: s.total                || "—", color: "#2563EB" },
    { icon: CalendarCheck, label: "Today's Follow-ups",  value: fu.today               || "—", color: "#7C3AED" },
    { icon: DollarSign,    label: "Pending Fees",         value: inr(f.pending),               color: "#F59E0B" },
    { icon: TrendingUp,    label: "Enrolled This Month",  value: s.enrolled_this_period || "—", color: "#10B981" },
    { icon: AlertCircle,   label: "Overdue Follow-ups",   value: fu.overdue             || "—", color: "#EF4444" },
    { icon: UserCheck,     label: "New This Period",      value: s.new_this_period      || "—", color: "#06B6D4" },
    { icon: BookOpen,      label: "Overdue Fees Count",   value: f.overdue_count        || "—", color: "#8B5CF6" },
    { icon: MessageSquare, label: "WA Sent",              value: wa.total_sent          || "—", color: "#22C55E" },
  ];

  const chartData  = monthly?.rows || [];
  const followups  = fuData?.rows  || [];

  return (
    <div>
      <SectionHead title="Dashboard" sub={kpi?.period ? `${kpi.period.from}  →  ${kpi.period.to}` : ""} />

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18, marginBottom: 18 }}>
        <div className="card" style={{ padding: "22px 24px" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 18 }}>Monthly Admissions & Conversions</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2A45" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#64748B" }} />
              <Bar dataKey="admissions"  name="Admissions"  fill="#2563EB" radius={[4,4,0,0]} maxBarSize={16} />
              <Bar dataKey="conversions" name="Conversions" fill="#7C3AED" radius={[4,4,0,0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: "22px 24px" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", marginBottom: 18 }}>Conversion Trend</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gcDash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2A45" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="conversions" name="Conversions" stroke="#7C3AED" fill="url(#gcDash)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Today's Follow-ups */}
      <div className="card" style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>Today's Follow-ups</p>
          <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => navigate("/followups")}>View all</button>
        </div>
        {fuLoad ? <Spinner /> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
            {followups.length === 0 && (
              <p style={{ color: "#475569", fontSize: 13, gridColumn: "1/-1" }}>No follow-ups scheduled today.</p>
            )}
            {followups.map(f => (
              <div key={f.id} style={{ background: "#131D35", borderRadius: 11, padding: "12px 14px", border: "1px solid #1E2A45" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}>{f.student_name}</span>
                  <span style={{ fontSize: 12, color: "#60A5FA", fontWeight: 600 }}>
                    {new Date(f.scheduled_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "#7C3AED", marginBottom: 8 }}>{f.course_name || "—"}</p>
                <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                  <button className="btn btn-ghost"   style={{ padding: "3px 9px", fontSize: 11 }}><Phone size={11} /> Call</button>
                  <button className="btn btn-success" style={{ padding: "3px 9px", fontSize: 11 }}><MessageSquare size={11} /> WA</button>
                  <Badge status={f.status.charAt(0).toUpperCase() + f.status.slice(1)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
