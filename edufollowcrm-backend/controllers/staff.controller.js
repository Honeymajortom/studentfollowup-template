// controllers/staff.controller.js
const bcrypt   = require("bcryptjs");
const { query, queryOne, queryAll } = require("../config/db");
const R = require("../utils/response");

// GET /api/staff
async function list(req, res, next) {
  try {
    const rows = await queryAll(
      `SELECT u.id, u.name, u.email, u.role, u.phone, u.is_active, u.joined_date, u.last_login,
              COUNT(DISTINCT s.id)  AS student_count,
              COUNT(DISTINCT f.id) FILTER (WHERE f.status = 'completed') AS followups_completed,
              COUNT(DISTINCT f.id) AS total_followups
       FROM users u
       LEFT JOIN students  s ON s.counselor_id = u.id
       LEFT JOIN followups f ON f.assigned_to  = u.id
       GROUP BY u.id
       ORDER BY u.name`
    );
    return R.success(res, { staff: rows });
  } catch (err) { next(err); }
}

// GET /api/staff/:id
async function getOne(req, res, next) {
  try {
    const staff = await queryOne(
      "SELECT id, name, email, role, phone, is_active, joined_date, last_login FROM users WHERE id = $1",
      [req.params.id]
    );
    if (!staff) return R.notFound(res, "Staff not found");
    return R.success(res, { staff });
  } catch (err) { next(err); }
}

// POST /api/staff
async function create(req, res, next) {
  try {
    const { name, email, password, role, phone, joined_date } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const { rows: [staff] } = await query(
      `INSERT INTO users (name, email, password_hash, role, phone, joined_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, phone, joined_date`,
      [name, email, hash, role, phone, joined_date]
    );
    return R.created(res, { staff });
  } catch (err) { next(err); }
}

// PATCH /api/staff/:id
async function update(req, res, next) {
  try {
    const { name, role, phone, joined_date, is_active } = req.body;
    const staff = await queryOne(
      `UPDATE users SET name=$1, role=$2, phone=$3, joined_date=$4, is_active=$5
       WHERE id=$6
       RETURNING id, name, email, role, phone, is_active, joined_date`,
      [name, role, phone, joined_date, is_active, req.params.id]
    );
    if (!staff) return R.notFound(res, "Staff not found");
    return R.success(res, { staff });
  } catch (err) { next(err); }
}

// POST /api/staff/:id/assign-leads  (bulk reassign students)
async function assignLeads(req, res, next) {
  try {
    const { student_ids } = req.body;  // array of UUIDs
    if (!Array.isArray(student_ids) || student_ids.length === 0)
      return R.badRequest(res, "student_ids array is required");

    await query(
      `UPDATE students SET counselor_id = $1
       WHERE id = ANY($2::uuid[])`,
      [req.params.id, student_ids]
    );
    return R.success(res, {}, `${student_ids.length} students assigned`);
  } catch (err) { next(err); }
}

// GET /api/staff/:id/performance
async function performance(req, res, next) {
  try {
    const { from, to } = req.query;
    const fromDate = from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
    const toDate   = to   || new Date().toISOString().split("T")[0];

    const stats = await queryOne(
      `SELECT
         COUNT(DISTINCT f.id) FILTER (WHERE f.status = 'completed') AS followups_done,
         COUNT(DISTINCT f.id) FILTER (WHERE f.status = 'overdue')   AS followups_overdue,
         COUNT(DISTINCT s.id) FILTER (WHERE s.lead_status = 'enrolled' AND s.enrolled_at BETWEEN $2 AND $3) AS enrolled,
         COUNT(DISTINCT s.id) AS total_students
       FROM users u
       LEFT JOIN followups f ON f.assigned_to = u.id AND f.scheduled_at::date BETWEEN $2 AND $3
       LEFT JOIN students  s ON s.counselor_id = u.id
       WHERE u.id = $1`,
      [req.params.id, fromDate, toDate]
    );
    return R.success(res, { stats, period: { from: fromDate, to: toDate } });
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, assignLeads, performance };
