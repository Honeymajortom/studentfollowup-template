// controllers/attendance.controller.js
const { query, queryOne, queryAll, withTransaction } = require("../config/db");
const R = require("../utils/response");

// POST /api/attendance  (bulk mark for entire batch)
async function markBulk(req, res, next) {
  try {
    const { course_id, date, records } = req.body;

    await withTransaction(async (client) => {
      for (const rec of records) {
        await client.query(
          `INSERT INTO attendance (student_id, course_id, date, status, remark, marked_by)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (student_id, date, course_id)
           DO UPDATE SET status = $4, remark = $5, marked_by = $6`,
          [rec.student_id, course_id, date, rec.status, rec.remark || null, req.user.id]
        );
      }
    });

    return R.success(res, {}, `Attendance saved for ${records.length} students`);
  } catch (err) { next(err); }
}

// GET /api/attendance?course_id=&date=
async function getByDate(req, res, next) {
  try {
    const { course_id, date } = req.query;
    if (!course_id || !date) return R.badRequest(res, "course_id and date are required");

    const rows = await queryAll(
      `SELECT a.*, s.full_name, s.student_code, s.mobile
       FROM students s
       LEFT JOIN attendance a ON a.student_id = s.id AND a.date = $2 AND a.course_id = $1
       WHERE s.course_id = $1 AND s.status = 'active'
       ORDER BY s.full_name`,
      [course_id, date]
    );

    const present = rows.filter(r => r.status === "present").length;
    return R.success(res, { records: rows, stats: { present, absent: rows.length - present, total: rows.length } });
  } catch (err) { next(err); }
}

// GET /api/attendance/student/:id/summary
async function studentSummary(req, res, next) {
  try {
    const { course_id, month } = req.query;
    const conds  = ["a.student_id = $1"];
    const params = [req.params.id];
    let pi = 2;
    if (course_id) { conds.push(`a.course_id = $${pi++}`); params.push(course_id); }
    if (month)     { conds.push(`TO_CHAR(a.date,'YYYY-MM') = $${pi++}`); params.push(month); }

    const rows = await queryAll(
      `SELECT a.date, a.status, a.remark, c.name AS course_name
       FROM attendance a LEFT JOIN courses c ON c.id = a.course_id
       WHERE ${conds.join(" AND ")}
       ORDER BY a.date DESC`,
      params
    );

    const summary = {
      present: rows.filter(r => r.status === "present").length,
      absent:  rows.filter(r => r.status === "absent").length,
      total:   rows.length,
    };
    summary.rate = summary.total ? Math.round(summary.present / summary.total * 100) : 0;

    return R.success(res, { records: rows, summary });
  } catch (err) { next(err); }
}

module.exports = { markBulk, getByDate, studentSummary };
