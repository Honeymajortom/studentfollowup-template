// controllers/fees.controller.js
const { query, queryOne, queryAll, withTransaction } = require("../config/db");
const R = require("../utils/response");
const { generateReceipt } = require("../services/pdf.service");

// GET /api/fees  (all students with fee summary)
async function listFees(req, res, next) {
  try {
    const { status, course_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const conds  = [];
    const params = [];
    let pi = 1;
    if (status)    { conds.push(`f.status = $${pi++}`);    params.push(status); }
    if (course_id) { conds.push(`s.course_id = $${pi++}`); params.push(course_id); }
    const where = conds.length ? "WHERE " + conds.join(" AND ") : "";

    const { count } = await queryOne(
      `SELECT COUNT(*) FROM fees f JOIN students s ON s.id = f.student_id ${where}`, params
    );

    const rows = await queryAll(
      `SELECT f.*, s.full_name, s.student_code, s.mobile,
              c.name AS course_name
       FROM fees f
       JOIN students s ON s.id = f.student_id
       LEFT JOIN courses c ON c.id = s.course_id
       ${where}
       ORDER BY f.due_date ASC NULLS LAST
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, limit, offset]
    );
    return R.paginated(res, rows, parseInt(count), page, limit);
  } catch (err) { next(err); }
}

// GET /api/fees/dashboard
async function dashboard(req, res, next) {
  try {
    const totals = await queryOne(
      `SELECT
         SUM(paid)                                           AS total_collected,
         SUM(GREATEST(total_fees - paid - discount, 0))     AS total_pending,
         SUM(CASE WHEN status = 'overdue' THEN total_fees ELSE 0 END) AS overdue_amount,
         COUNT(*) FILTER (WHERE status = 'paid')            AS paid_count,
         COUNT(*) FILTER (WHERE status = 'overdue')         AS overdue_count,
         COUNT(*) FILTER (WHERE status IN ('pending','partial')) AS pending_count
       FROM fees`
    );

    const today = await queryOne(
      `SELECT COALESCE(SUM(amount), 0) AS today_collection
       FROM payments WHERE payment_date = CURRENT_DATE`
    );

    return R.success(res, { ...totals, today_collection: today.today_collection });
  } catch (err) { next(err); }
}

// POST /api/fees/payment  (record a payment)
async function addPayment(req, res, next) {
  try {
    const { student_id, amount, mode, reference_no, payment_date, note } = req.body;

    const result = await withTransaction(async (client) => {
      // Insert payment record
      const { rows: [payment] } = await client.query(
        `INSERT INTO payments (student_id, amount, mode, reference_no, payment_date, note, recorded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [student_id, amount, mode, reference_no, payment_date || new Date(), note, req.user.id]
      );

      // Update fees record
      const { rows: [fee] } = await client.query(
        `UPDATE fees
         SET paid = paid + $1,
             status = CASE
               WHEN (paid + $1) >= (total_fees - discount) THEN 'paid'::fees_status
               WHEN (paid + $1) > 0 THEN 'partial'::fees_status
               ELSE status
             END
         WHERE student_id = $2
         RETURNING *`,
        [amount, student_id]
      );

      return { payment, fee };
    });

    return R.created(res, result, "Payment recorded successfully");
  } catch (err) { next(err); }
}

// GET /api/fees/payment/:id/receipt  (PDF download)
async function downloadReceipt(req, res, next) {
  try {
    const payment = await queryOne(
      `SELECT p.*, s.full_name, s.student_code, s.mobile, s.email,
              c.name AS course_name, f.total_fees, f.paid AS total_paid, f.discount,
              u.name AS recorded_by_name
       FROM payments p
       JOIN students s ON s.id = p.student_id
       LEFT JOIN courses c ON c.id = s.course_id
       LEFT JOIN fees    f ON f.student_id = s.id
       LEFT JOIN users   u ON u.id = p.recorded_by
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (!payment) return R.notFound(res, "Payment not found");

    const pdfBuffer = await generateReceipt(payment);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="receipt-${payment.receipt_no}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) { next(err); }
}

// GET /api/fees/student/:studentId/payments
async function studentPayments(req, res, next) {
  try {
    const rows = await queryAll(
      `SELECT p.*, u.name AS recorded_by_name
       FROM payments p LEFT JOIN users u ON u.id = p.recorded_by
       WHERE p.student_id = $1 ORDER BY p.payment_date DESC`,
      [req.params.studentId]
    );
    return R.success(res, { payments: rows });
  } catch (err) { next(err); }
}

// POST /api/fees/bulk-payment
// Records full pending amount as received for each selected student.
async function bulkPayment(req, res, next) {
  try {
    const { student_ids, mode = "cash" } = req.body;

    let processed = 0;
    let skipped   = 0;

    for (const sid of student_ids) {
      const fee = await queryOne(
        "SELECT * FROM fees WHERE student_id = $1",
        [sid]
      );
      if (!fee) { skipped++; continue; }

      const pending = Math.max(
        0,
        Number(fee.total_fees) - Number(fee.paid) - Number(fee.discount)
      );
      if (pending <= 0) { skipped++; continue; }

      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO payments (student_id, amount, mode, note, recorded_by)
           VALUES ($1, $2, $3, 'Bulk payment recorded', $4)`,
          [sid, pending, mode, req.user.id]
        );
        await client.query(
          `UPDATE fees
           SET paid = paid + $1,
               status = CASE
                 WHEN (paid + $1) >= (total_fees - discount) THEN 'paid'::fees_status
                 WHEN (paid + $1) > 0 THEN 'partial'::fees_status
                 ELSE status END
           WHERE student_id = $2`,
          [pending, sid]
        );
      });
      processed++;
    }

    return R.success(
      res,
      { processed, skipped },
      `Payment recorded for ${processed} student(s)${skipped ? `, ${skipped} skipped (already paid)` : ""}`
    );
  } catch (err) { next(err); }
}

// GET /api/fees/export?format=csv|pdf&status=&course_id=
async function exportFees(req, res, next) {
  try {
    const { format = "csv", status, course_id } = req.query;
    const conditions = [];
    const params = [];
    let pi = 1;
    if (status)    { conditions.push(`f.status = $${pi++}`);    params.push(status); }
    if (course_id) { conditions.push(`s.course_id = $${pi++}`); params.push(course_id); }
    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

    const rows = await queryAll(
      `SELECT f.*, s.full_name, s.student_code, s.mobile, c.name AS course_name
       FROM fees f
       JOIN    students s ON s.id = f.student_id
       LEFT JOIN courses c ON c.id = s.course_id
       ${where}
       ORDER BY s.full_name ASC
       LIMIT 5000`,
      params
    );

    const date = new Date().toISOString().split("T")[0];
    const { feesToCSV, feesToPDF } = require("../services/export.service");

    if (format === "pdf") {
      const buf = await feesToPDF(rows);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="fees-${date}.pdf"`);
      return res.send(buf);
    }

    const csv = feesToCSV(rows);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="fees-${date}.csv"`);
    return res.send(csv);
  } catch (err) { next(err); }
}

module.exports = { listFees, dashboard, addPayment, bulkPayment, exportFees, downloadReceipt, studentPayments };
