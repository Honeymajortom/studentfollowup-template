// controllers/followups.controller.js
const { query, queryOne, queryAll } = require("../config/db");
const R = require("../utils/response");

// GET /api/followups  (today | date | all)
async function list(req, res, next) {
  try {
    const { date, status, assigned_to, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conds  = [];
    let pi = 1;

    if (date) {
      conds.push(`f.scheduled_at::date = $${pi++}`);
      params.push(date);
    }
    if (status)      { conds.push(`f.status = $${pi++}`);      params.push(status); }
    if (assigned_to) { conds.push(`f.assigned_to = $${pi++}`); params.push(assigned_to); }

    // Counselors see only their own follow-ups
    if (req.user.role === "counselor") {
      conds.push(`f.assigned_to = $${pi++}`);
      params.push(req.user.id);
    }

    const where = conds.length ? "WHERE " + conds.join(" AND ") : "";

    const { count } = await queryOne(
      `SELECT COUNT(*) FROM followups f ${where}`, params
    );

    const rows = await queryAll(
      `SELECT f.*,
              s.full_name AS student_name, s.mobile AS student_mobile,
              c.name AS course_name,
              u.name AS assigned_to_name
       FROM followups f
       JOIN students s ON s.id = f.student_id
       LEFT JOIN courses c ON c.id = s.course_id
       LEFT JOIN users   u ON u.id = f.assigned_to
       ${where}
       ORDER BY f.scheduled_at ASC
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, limit, offset]
    );

    return R.paginated(res, rows, parseInt(count), page, limit);
  } catch (err) { next(err); }
}

// GET /api/followups/today-summary
async function todaySummary(req, res, next) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const rows = await queryAll(
      `SELECT status, COUNT(*) AS count
       FROM followups
       WHERE scheduled_at::date = $1
       GROUP BY status`,
      [today]
    );
    const summary = { total: 0, scheduled: 0, completed: 0, pending: 0, overdue: 0, no_answer: 0 };
    rows.forEach(r => {
      summary[r.status] = parseInt(r.count);
      summary.total += parseInt(r.count);
    });
    return R.success(res, { summary });
  } catch (err) { next(err); }
}

// POST /api/followups
async function create(req, res, next) {
  try {
    const { student_id, type, scheduled_at, notes, next_date } = req.body;
    const assigned_to = req.body.assigned_to || req.user.id;

    // Verify student exists
    const student = await queryOne("SELECT id FROM students WHERE id = $1", [student_id]);
    if (!student) return R.notFound(res, "Student not found");

    const { rows: [fu] } = await query(
      `INSERT INTO followups (student_id, assigned_to, type, scheduled_at, notes, next_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [student_id, assigned_to, type, scheduled_at, notes, next_date]
    );

    // Update student's next_followup date
    await query(
      "UPDATE students SET next_followup = $1 WHERE id = $2",
      [next_date || scheduled_at, student_id]
    );

    return R.created(res, { followup: fu });
  } catch (err) { next(err); }
}

// PATCH /api/followups/:id/complete
async function complete(req, res, next) {
  try {
    const { outcome, notes, next_date, status, scheduled_at } = req.body;

    const fu = await queryOne("SELECT * FROM followups WHERE id = $1", [req.params.id]);
    if (!fu) return R.notFound(res, "Follow-up not found");

    const { rows: [updated] } = await query(
      `UPDATE followups
       SET status = $1, outcome = $2, notes = $3, completed_at = NOW(),
           next_date = $4, scheduled_at = COALESCE($5, scheduled_at)
       WHERE id = $6 RETURNING *`,
      [status, outcome, notes, next_date, scheduled_at, req.params.id]
    );

    // Update student's next_followup
    if (next_date) {
      await query("UPDATE students SET next_followup = $1 WHERE id = $2", [next_date, fu.student_id]);
    }

    // If enrolled, also update student lead_status
    if (status === "enrolled") {
      await query(
        "UPDATE students SET lead_status = 'enrolled', status = 'active' WHERE id = $1",
        [fu.student_id]
      );
    }

    return R.success(res, { followup: updated }, "Follow-up completed");
  } catch (err) { next(err); }
}

// GET /api/followups/notifications
// Returns today's + overdue non-completed follow-ups for the current user.
// Counselors see only their own; admins see all.
async function notifications(req, res, next) {
  try {
    const params = [];
    let pi = 1;
    let roleClause = "";

    if (req.user.role === "counselor") {
      roleClause = `AND f.assigned_to = $${pi++}`;
      params.push(req.user.id);
    }

    const rows = await queryAll(
      `SELECT f.id, f.type, f.status, f.scheduled_at, f.notes,
              s.full_name AS student_name, s.mobile AS student_mobile,
              c.name      AS course_name,
              COUNT(*) OVER () AS total_count
       FROM followups f
       JOIN students s ON s.id = f.student_id
       LEFT JOIN courses c ON c.id = s.course_id
       WHERE f.scheduled_at::date <= CURRENT_DATE
         AND f.status NOT IN ('completed', 'rescheduled', 'no_answer')
         ${roleClause}
       ORDER BY
         CASE WHEN f.scheduled_at::date < CURRENT_DATE THEN 0 ELSE 1 END,
         f.scheduled_at ASC
       LIMIT 15`,
      params
    );

    const count = rows.length > 0 ? parseInt(rows[0].total_count) : 0;
    const items = rows.map(({ total_count, ...r }) => r);

    return R.success(res, { items, count });
  } catch (err) { next(err); }
}

// DELETE /api/followups/:id
async function remove(req, res, next) {
  try {
    const fu = await queryOne("DELETE FROM followups WHERE id = $1 RETURNING id", [req.params.id]);
    if (!fu) return R.notFound(res, "Follow-up not found");
    return R.success(res, {}, "Follow-up deleted");
  } catch (err) { next(err); }
}

module.exports = { list, todaySummary, notifications, create, complete, remove };
