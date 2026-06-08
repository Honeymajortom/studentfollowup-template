// controllers/reports.controller.js
const { queryOne, queryAll } = require("../config/db");
const R = require("../utils/response");

function dateRange(req) {
  const to   = req.query.to   || new Date().toISOString().split("T")[0];
  const from = req.query.from || new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                                    .toISOString().split("T")[0];
  return { from, to };
}

// GET /api/reports/dashboard  (all KPIs in one call)
async function dashboardKPIs(req, res, next) {
  try {
    const { from, to } = dateRange(req);

    const [students, fees, followups, wa] = await Promise.all([
      // Students summary
      queryOne(`
        SELECT
          COUNT(*)                                            AS total,
          COUNT(*) FILTER (WHERE status = 'active')          AS active,
          COUNT(*) FILTER (WHERE status = 'new_lead')        AS new_leads,
          COUNT(*) FILTER (WHERE created_at::date BETWEEN $1 AND $2) AS new_this_period,
          COUNT(*) FILTER (WHERE lead_status = 'enrolled' AND enrolled_at BETWEEN $1 AND $2) AS enrolled_this_period
        FROM students`, [from, to]),

      // Fees summary
      queryOne(`
        SELECT
          COALESCE(SUM(paid), 0)                              AS collected,
          COALESCE(SUM(GREATEST(total_fees-paid-discount,0)),0) AS pending,
          COUNT(*) FILTER (WHERE status='overdue')            AS overdue_count,
          COALESCE((SELECT SUM(amount) FROM payments WHERE payment_date BETWEEN $1 AND $2), 0) AS period_collection
        FROM fees`, [from, to]),

      // Follow-ups summary
      queryOne(`
        SELECT
          COUNT(*)                                             AS total,
          COUNT(*) FILTER (WHERE status = 'completed')        AS completed,
          COUNT(*) FILTER (WHERE status = 'overdue')          AS overdue,
          COUNT(*) FILTER (WHERE scheduled_at::date = CURRENT_DATE) AS today
        FROM followups
        WHERE scheduled_at::date BETWEEN $1 AND $2`, [from, to]),

      // WhatsApp
      queryOne(`
        SELECT
          COUNT(*) AS total_sent,
          COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
          COUNT(*) FILTER (WHERE status = 'failed')    AS failed
        FROM wa_logs WHERE sent_at::date BETWEEN $1 AND $2`, [from, to]),
    ]);

    return R.success(res, { students, fees, followups, whatsapp: wa, period: { from, to } });
  } catch (err) { next(err); }
}

// GET /api/reports/admissions  (monthly trend)
async function admissions(req, res, next) {
  try {
    const { from, to } = dateRange(req);
    const rows = await queryAll(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
         DATE_TRUNC('month', created_at)                      AS month_date,
         COUNT(*) AS admissions,
         COUNT(*) FILTER (WHERE lead_status = 'enrolled') AS conversions,
         COUNT(*) FILTER (WHERE status = 'new_lead')      AS leads
       FROM students
       WHERE created_at::date BETWEEN $1 AND $2
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY month_date`,
      [from, to]
    );
    return R.success(res, { rows, period: { from, to } });
  } catch (err) { next(err); }
}

// GET /api/reports/fees
async function feesReport(req, res, next) {
  try {
    const { from, to } = dateRange(req);
    const rows = await queryAll(
      `SELECT
         TO_CHAR(p.payment_date, 'Mon YYYY') AS month,
         DATE_TRUNC('month', p.payment_date) AS month_date,
         SUM(p.amount)                       AS collected,
         COUNT(*)                            AS transactions
       FROM payments p
       WHERE p.payment_date BETWEEN $1 AND $2
       GROUP BY DATE_TRUNC('month', p.payment_date)
       ORDER BY month_date`,
      [from, to]
    );
    return R.success(res, { rows, period: { from, to } });
  } catch (err) { next(err); }
}

// GET /api/reports/lead-sources
async function leadSources(req, res, next) {
  try {
    const { from, to } = dateRange(req);
    const rows = await queryAll(
      `SELECT
         COALESCE(inquiry_source, 'Unknown') AS source,
         COUNT(*) AS count,
         ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS percentage
       FROM students
       WHERE created_at::date BETWEEN $1 AND $2
         AND inquiry_source IS NOT NULL
       GROUP BY inquiry_source
       ORDER BY count DESC`,
      [from, to]
    );
    return R.success(res, { rows });
  } catch (err) { next(err); }
}

// GET /api/reports/staff-performance
async function staffPerformance(req, res, next) {
  try {
    const { from, to } = dateRange(req);
    const rows = await queryAll(
      `SELECT u.name, u.role,
         COUNT(DISTINCT s.id) AS students,
         COUNT(f.id) FILTER (WHERE f.status='completed' AND f.scheduled_at::date BETWEEN $1 AND $2) AS fu_completed,
         COUNT(f.id) FILTER (WHERE f.status='overdue'   AND f.scheduled_at::date BETWEEN $1 AND $2) AS fu_overdue,
         COUNT(DISTINCT s.id) FILTER (WHERE s.lead_status='enrolled' AND s.enrolled_at BETWEEN $1 AND $2) AS enrolled
       FROM users u
       LEFT JOIN students  s ON s.counselor_id = u.id
       LEFT JOIN followups f ON f.assigned_to  = u.id
       WHERE u.role IN ('counselor','admin')
       GROUP BY u.id ORDER BY enrolled DESC`,
      [from, to]
    );
    return R.success(res, { rows });
  } catch (err) { next(err); }
}

// GET /api/reports/course-performance
async function coursePerformance(req, res, next) {
  try {
    const rows = await queryAll(
      `SELECT c.name, c.fees, c.max_seats,
         COUNT(s.id)                              AS enrolled,
         COUNT(s.id) FILTER (WHERE s.status='active') AS active,
         COALESCE(SUM(p.amount), 0)               AS revenue,
         ROUND(COUNT(s.id)::numeric / NULLIF(c.max_seats,0) * 100, 1) AS fill_pct
       FROM courses c
       LEFT JOIN students s ON s.course_id = c.id
       LEFT JOIN payments p ON p.student_id = s.id
       WHERE c.is_active = TRUE
       GROUP BY c.id ORDER BY revenue DESC`
    );
    return R.success(res, { rows });
  } catch (err) { next(err); }
}

// GET /api/reports/attendance-summary?course_id=&month=
async function attendanceSummary(req, res, next) {
  try {
    const { course_id, month } = req.query;
    const conds  = [];
    const params = [];
    let pi = 1;
    if (course_id) { conds.push(`a.course_id = $${pi++}`); params.push(course_id); }
    if (month)     { conds.push(`TO_CHAR(a.date,'YYYY-MM') = $${pi++}`); params.push(month); }
    const where = conds.length ? "WHERE " + conds.join(" AND ") : "";

    const rows = await queryAll(
      `SELECT s.full_name, s.student_code,
         COUNT(*) FILTER (WHERE a.status='present') AS present,
         COUNT(*) FILTER (WHERE a.status='absent')  AS absent,
         COUNT(*)                                   AS total,
         ROUND(COUNT(*) FILTER (WHERE a.status='present')::numeric / NULLIF(COUNT(*),0) * 100, 1) AS rate
       FROM students s
       LEFT JOIN attendance a ON a.student_id = s.id
       ${where ? where + " AND s.id IS NOT NULL" : ""}
       GROUP BY s.id ORDER BY rate ASC`,
      params
    );
    return R.success(res, { rows });
  } catch (err) { next(err); }
}

module.exports = { dashboardKPIs, admissions, feesReport, leadSources, staffPerformance, coursePerformance, attendanceSummary };
