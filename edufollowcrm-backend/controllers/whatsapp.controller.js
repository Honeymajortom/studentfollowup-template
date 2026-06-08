// controllers/whatsapp.controller.js
const { queryAll, queryOne, query } = require("../config/db");
const { sendBulk } = require("../services/whatsapp.service");
const R = require("../utils/response");

// POST /api/whatsapp/send
async function send(req, res, next) {
  try {
    const { student_ids, group, template_id, scheduled_at } = req.body;

    // If scheduled → save for the cron job
    if (scheduled_at) {
      await query(
        `INSERT INTO wa_logs (phone, template, status, sent_by, sent_at, message_body)
         SELECT mobile, t.name, 'scheduled', $3, $4, t.body
         FROM students s, wa_templates t
         WHERE s.id = ANY($1::uuid[]) AND t.id = $2`,
        [student_ids, template_id, req.user.id, new Date(scheduled_at)]
      );
      return R.success(res, {}, "Message scheduled successfully");
    }

    // Resolve group → student ids
    let ids = student_ids;
    if (group === "all") {
      const rows = await queryAll("SELECT id FROM students WHERE status != 'inactive'");
      ids = rows.map(r => r.id);
    } else if (group === "pending_fees") {
      const rows = await queryAll("SELECT s.id FROM students s JOIN fees f ON f.student_id = s.id WHERE f.status != 'paid'");
      ids = rows.map(r => r.id);
    } else if (group === "todays_followups") {
      const rows = await queryAll("SELECT DISTINCT student_id AS id FROM followups WHERE scheduled_at::date = CURRENT_DATE");
      ids = rows.map(r => r.id);
    } else if (group === "overdue") {
      const rows = await queryAll("SELECT s.id FROM students s JOIN fees f ON f.student_id = s.id WHERE f.status = 'overdue'");
      ids = rows.map(r => r.id);
    }

    if (!ids?.length) return R.badRequest(res, "No students found for the selected criteria");

    const results = await sendBulk({ studentIds: ids, templateId: template_id, sentBy: req.user.id });

    const sent   = results.filter(r => r.status === "sent").length;
    const failed = results.filter(r => r.status === "failed").length;
    return R.success(res, { results, summary: { sent, failed, total: results.length } });
  } catch (err) { next(err); }
}

// GET /api/whatsapp/templates
async function listTemplates(req, res, next) {
  try {
    const templates = await queryAll("SELECT * FROM wa_templates WHERE is_active = TRUE ORDER BY name");
    return R.success(res, { templates });
  } catch (err) { next(err); }
}

// GET /api/whatsapp/logs
async function getLogs(req, res, next) {
  try {
    const { student_id, status, page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;
    const conds  = [];
    const params = [];
    let pi = 1;
    if (student_id) { conds.push(`l.student_id = $${pi++}`); params.push(student_id); }
    if (status)     { conds.push(`l.status = $${pi++}`);     params.push(status); }
    const where = conds.length ? "WHERE " + conds.join(" AND ") : "";

    const { count } = await queryOne(`SELECT COUNT(*) FROM wa_logs l ${where}`, params);
    const rows = await queryAll(
      `SELECT l.*, s.full_name, s.student_code
       FROM wa_logs l LEFT JOIN students s ON s.id = l.student_id
       ${where} ORDER BY l.sent_at DESC LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, limit, offset]
    );
    return R.paginated(res, rows, parseInt(count), page, limit);
  } catch (err) { next(err); }
}

// GET /api/whatsapp/stats
async function stats(req, res, next) {
  try {
    const rows = await queryAll(
      `SELECT status, COUNT(*) AS count FROM wa_logs GROUP BY status`
    );
    const result = { sent: 0, delivered: 0, read: 0, failed: 0, scheduled: 0 };
    rows.forEach(r => { result[r.status] = parseInt(r.count); });
    return R.success(res, { stats: result });
  } catch (err) { next(err); }
}

// POST /api/whatsapp/webhook  (Meta sends delivery status updates here)
async function webhookVerify(req, res) {
  const mode      = req.query["hub.mode"];
  const token     = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === process.env.WA_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
}

async function webhookReceive(req, res, next) {
  try {
    const body = req.body;
    if (body.object !== "whatsapp_business_account") return res.sendStatus(404);

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const val = change.value;
        // Status updates
        for (const status of val.statuses || []) {
          const map = { delivered: "delivered", read: "read", failed: "failed" };
          const newStatus = map[status.status];
          if (newStatus) {
            await query(
              `UPDATE wa_logs SET status = $1,
               delivered_at = CASE WHEN $1 = 'delivered' THEN NOW() ELSE delivered_at END,
               read_at      = CASE WHEN $1 = 'read'      THEN NOW() ELSE read_at END
               WHERE wa_message_id = $2`,
              [newStatus, status.id]
            );
          }
        }
      }
    }
    res.sendStatus(200);
  } catch (err) { next(err); }
}

module.exports = { send, listTemplates, getLogs, stats, webhookVerify, webhookReceive };
