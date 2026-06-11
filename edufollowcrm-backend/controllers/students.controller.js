// controllers/students.controller.js
const { query, queryOne, queryAll, withTransaction } = require("../config/db");
const R = require("../utils/response");

// ── GET /api/students  (search + filter + paginate) ──────────
async function list(req, res, next) {
  try {
    const {
      search = "",
      status, lead_status, course_id, counselor_id,
      fees_status,
      page = 1,
      limit = 10,
      sort = "created_at",
      order = "desc",
    } = req.query;

    const offset = (page - 1) * limit;
    const ALLOWED_SORT = ["full_name", "created_at", "next_followup", "enrolled_at"];
    const safeSort = ALLOWED_SORT.includes(sort) ? sort : "created_at";
    const safeOrder = order === "asc" ? "ASC" : "DESC";

    const conditions = [];
    const params = [];
    let pi = 1;

    if (search) {
      conditions.push(`(s.full_name ILIKE $${pi} OR s.mobile ILIKE $${pi} OR s.student_code ILIKE $${pi} OR s.email ILIKE $${pi})`);
      params.push(`%${search}%`); pi++;
    }
    if (status) { conditions.push(`s.status = $${pi++}`); params.push(status); }
    if (lead_status) { conditions.push(`s.lead_status = $${pi++}`); params.push(lead_status); }
    if (course_id) { conditions.push(`s.course_id = $${pi++}`); params.push(course_id); }
    if (counselor_id) { conditions.push(`s.counselor_id = $${pi++}`); params.push(counselor_id); }
    if (fees_status) { conditions.push(`f.status = $${pi++}`); params.push(fees_status); }

    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

    const countRow = await queryOne(
      `SELECT COUNT(*) FROM students s LEFT JOIN fees f ON f.student_id = s.id ${where}`,
      params
    );
    const total = parseInt(countRow.count);

    const rows = await queryAll(
      `SELECT s.*, 
              c.name  AS course_name,
              c.fees  AS course_fees,
              u.name  AS counselor_name,
              f.total_fees, f.paid, f.discount, f.due_date, f.status AS fees_status
       FROM students s
       LEFT JOIN courses c ON c.id = s.course_id
       LEFT JOIN users   u ON u.id = s.counselor_id
       LEFT JOIN fees    f ON f.student_id = s.id
       ${where}
       ORDER BY s.${safeSort} ${safeOrder}
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, limit, offset]
    );

    return R.paginated(res, rows, total, page, limit);
  } catch (err) { next(err); }
}

// ── GET /api/students/:id ─────────────────────────────────────
async function getOne(req, res, next) {
  try {
    const student = await queryOne(
      `SELECT s.*,
              c.name AS course_name, c.fees AS course_fees, c.duration,
              u.name AS counselor_name, u.email AS counselor_email,
              f.total_fees, f.paid, f.discount, f.due_date, f.status AS fees_status
       FROM students s
       LEFT JOIN courses c ON c.id = s.course_id
       LEFT JOIN users   u ON u.id = s.counselor_id
       LEFT JOIN fees    f ON f.student_id = s.id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (!student) return R.notFound(res, "Student not found");
    return R.success(res, { student });
  } catch (err) { next(err); }
}

// ── POST /api/students ────────────────────────────────────────
async function create(req, res, next) {
  try {
    const {
      full_name, gender, dob, mobile, parent_mobile, email, address,
      course_id, batch_timing, counselor_id, lead_status, inquiry_source,
      next_followup, notes, enrolled_at,
      total_fees, discount = 0, paid = 0, payment_mode, due_date,
    } = req.body;

    const result = await withTransaction(async (client) => {
      // Insert student
      const studentStatus =
      lead_status === "enrolled" ? "active" : "new_lead";
      const { rows: [student] } = await client.query(
        `INSERT INTO students
     (
       full_name,
       gender,
       dob,
       mobile,
       parent_mobile,
       email,
       address,
       course_id,
       batch_timing,
       counselor_id,
       lead_status,
       inquiry_source,
       next_followup,
       notes,
       enrolled_at,
       status
     )
   VALUES
     (
       $1,$2,$3,$4,$5,$6,$7,$8,
       $9,$10,$11,$12,$13,$14,$15,$16
     )
   RETURNING *`,
        [
          full_name,
          gender,
          dob || null,
          mobile,
          parent_mobile || null,
          email || null,
          address || null,
          course_id || null,
          batch_timing || null,
          counselor_id || null,
          lead_status,
          inquiry_source || null,
          next_followup || null,
          notes || null,
          enrolled_at || null,
          studentStatus
        ]
      );

      // Create fee record if fees data provided
      if (total_fees) {
        const feesStatus = paid >= (total_fees - discount) ? "paid" : paid > 0 ? "partial" : "pending";
        await client.query(
          `INSERT INTO fees (student_id, total_fees, discount, paid, due_date, status)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [student.id, total_fees, discount, paid, due_date, feesStatus]
        );

        // If initial payment, log it
        if (paid > 0) {
          await client.query(
            `INSERT INTO payments (student_id, amount, mode, payment_date, note, recorded_by)
             VALUES ($1, $2, $3, NOW(), 'Initial payment', $4)`,
            [student.id, paid, payment_mode || "cash", req.user.id]
          );
        }
      }

      return student;
    });

    return R.created(res, { student: result }, "Student enrolled successfully");
  } catch (err) { next(err); }
}

// ── PATCH /api/students/:id ───────────────────────────────────
async function update(req, res, next) {
  try {
    // Build SET clause dynamically from provided fields
    const allowed = [
      "full_name", "gender", "dob", "mobile", "parent_mobile", "email", "address",
      "course_id", "batch_timing", "counselor_id", "status", "lead_status",
      "inquiry_source", "next_followup", "notes", "enrolled_at",
    ];
    const sets = [];
    const params = [];
    let pi = 1;
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        sets.push(`${key} = $${pi++}`);
        params.push(req.body[key]);
      }
    }
    if (sets.length === 0) return R.badRequest(res, "No valid fields to update");

    params.push(req.params.id);
    const student = await queryOne(
      `UPDATE students SET ${sets.join(", ")} WHERE id = $${pi} RETURNING *`,
      params
    );
    if (!student) return R.notFound(res, "Student not found");
    return R.success(res, { student }, "Student updated");
  } catch (err) { next(err); }
}

// ── DELETE /api/students/:id ──────────────────────────────────
async function remove(req, res, next) {
  try {
    const student = await queryOne(
      "DELETE FROM students WHERE id = $1 RETURNING id, full_name",
      [req.params.id]
    );
    if (!student) return R.notFound(res, "Student not found");
    return R.success(res, {}, `Student '${student.full_name}' deleted`);
  } catch (err) { next(err); }
}

// ── GET /api/students/:id/followups ───────────────────────────
async function getFollowups(req, res, next) {
  try {
    const rows = await queryAll(
      `SELECT f.*, u.name AS assigned_to_name
       FROM followups f
       LEFT JOIN users u ON u.id = f.assigned_to
       WHERE f.student_id = $1
       ORDER BY f.scheduled_at DESC`,
      [req.params.id]
    );
    return R.success(res, { followups: rows });
  } catch (err) { next(err); }
}

// ── GET /api/students/:id/payments ───────────────────────────
async function getPayments(req, res, next) {
  try {
    const rows = await queryAll(
      `SELECT p.*, u.name AS recorded_by_name
       FROM payments p
       LEFT JOIN users u ON u.id = p.recorded_by
       WHERE p.student_id = $1
       ORDER BY p.payment_date DESC`,
      [req.params.id]
    );
    return R.success(res, { payments: rows });
  } catch (err) { next(err); }
}

// ── GET /api/students/:id/attendance ─────────────────────────
async function getAttendance(req, res, next) {
  try {
    const rows = await queryAll(
      `SELECT a.*, c.name AS course_name, u.name AS marked_by_name
       FROM attendance a
       LEFT JOIN courses c ON c.id = a.course_id
       LEFT JOIN users   u ON u.id = a.marked_by
       WHERE a.student_id = $1
       ORDER BY a.date DESC`,
      [req.params.id]
    );
    const present = rows.filter(r => r.status === "present").length;
    const total = rows.length;
    return R.success(res, { attendance: rows, stats: { present, absent: total - present, total, rate: total ? Math.round(present / total * 100) : 0 } });
  } catch (err) { next(err); }
}

// ── GET /api/students/:id/wa-logs ─────────────────────────────
async function getWaLogs(req, res, next) {
  try {
    const rows = await queryAll(
      "SELECT * FROM wa_logs WHERE student_id = $1 ORDER BY sent_at DESC",
      [req.params.id]
    );
    return R.success(res, { logs: rows });
  } catch (err) { next(err); }
}

// ── PATCH /api/students/bulk-assign ──────────────────
async function bulkAssign(req, res, next) {
  try {
    const { student_ids, counselor_id } = req.body;

    const counselor = await queryOne(
      "SELECT id, name FROM users WHERE id = $1 AND is_active = TRUE",
      [counselor_id]
    );
    if (!counselor) return R.notFound(res, "Counselor not found");

    const result = await query(
      "UPDATE students SET counselor_id = $1 WHERE id = ANY($2::uuid[])",
      [counselor_id, student_ids]
    );

    return R.success(
      res,
      { count: result.rowCount, counselor_name: counselor.name },
      `${result.rowCount} student(s) assigned to ${counselor.name}`
    );
  } catch (err) { next(err); }
}

// GET /api/students/export?format=csv|pdf&search=&status=&course_id=&fees_status=
async function exportStudents(req, res, next) {
  try {
    const { format = "csv", search = "", status, course_id, fees_status } = req.query;
    const conditions = [];
    const params = [];
    let pi = 1;
    if (search)      { conditions.push(`(s.full_name ILIKE $${pi} OR s.mobile ILIKE $${pi} OR s.student_code ILIKE $${pi})`); params.push(`%${search}%`); pi++; }
    if (status)      { conditions.push(`s.status = $${pi++}`);    params.push(status); }
    if (course_id)   { conditions.push(`s.course_id = $${pi++}`); params.push(course_id); }
    if (fees_status) { conditions.push(`f.status = $${pi++}`);    params.push(fees_status); }
    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

    const rows = await queryAll(
      `SELECT s.*, c.name AS course_name, u.name AS counselor_name,
              f.total_fees, f.paid, f.discount, f.due_date, f.status AS fees_status
       FROM students s
       LEFT JOIN courses c ON c.id = s.course_id
       LEFT JOIN users   u ON u.id = s.counselor_id
       LEFT JOIN fees    f ON f.student_id = s.id
       ${where}
       ORDER BY s.full_name ASC
       LIMIT 5000`,
      params
    );

    const date = new Date().toISOString().split("T")[0];
    const { studentsToCSV, studentsToPDF } = require("../services/export.service");

    if (format === "pdf") {
      const buf = await studentsToPDF(rows);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="students-${date}.pdf"`);
      return res.send(buf);
    }

    const csv = studentsToCSV(rows);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="students-${date}.csv"`);
    return res.send(csv);
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, remove, bulkAssign, exportStudents, getFollowups, getPayments, getAttendance, getWaLogs };
