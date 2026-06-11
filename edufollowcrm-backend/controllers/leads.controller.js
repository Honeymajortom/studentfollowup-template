// controllers/leads.controller.js
const { query, queryOne, queryAll, withTransaction } = require("../config/db");
const R = require("../utils/response");

// ── GET /api/leads ────────────────────────────────────────────
async function list(req, res, next) {
  try {
    const {
      search = "",
      status,
      course_interest_id,
      assigned_to,
      page  = 1,
      limit = 10,
    } = req.query;

    const offset = (page - 1) * limit;
    const conditions = [];
    const params     = [];
    let pi = 1;

    if (search) {
      conditions.push(
        `(l.name ILIKE $${pi} OR l.mobile ILIKE $${pi} OR l.email ILIKE $${pi} OR l.lead_code ILIKE $${pi})`
      );
      params.push(`%${search}%`); pi++;
    }
    if (status)             { conditions.push(`l.status = $${pi++}`);             params.push(status); }
    if (course_interest_id) { conditions.push(`l.course_interest_id = $${pi++}`); params.push(course_interest_id); }
    if (assigned_to)        { conditions.push(`l.assigned_to = $${pi++}`);        params.push(assigned_to); }

    const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

    const countRow = await queryOne(
      `SELECT COUNT(*) FROM leads l ${where}`,
      params
    );
    const total = parseInt(countRow.count);

    const rows = await queryAll(
      `SELECT l.*,
              c.name AS course_name,
              u.name AS assigned_to_name
       FROM leads l
       LEFT JOIN courses c ON c.id = l.course_interest_id
       LEFT JOIN users   u ON u.id = l.assigned_to
       ${where}
       ORDER BY l.created_at DESC
       LIMIT $${pi} OFFSET $${pi + 1}`,
      [...params, limit, offset]
    );

    return R.paginated(res, rows, total, page, limit);
  } catch (err) { next(err); }
}

// ── GET /api/leads/:id ────────────────────────────────────────
async function getOne(req, res, next) {
  try {
    const lead = await queryOne(
      `SELECT l.*,
              c.name  AS course_name,
              u.name  AS assigned_to_name,
              cb.name AS created_by_name
       FROM leads l
       LEFT JOIN courses c  ON c.id  = l.course_interest_id
       LEFT JOIN users   u  ON u.id  = l.assigned_to
       LEFT JOIN users   cb ON cb.id = l.created_by
       WHERE l.id = $1`,
      [req.params.id]
    );
    if (!lead) return R.notFound(res, "Lead not found");
    return R.success(res, { lead });
  } catch (err) { next(err); }
}

// ── POST /api/leads ───────────────────────────────────────────
async function create(req, res, next) {
  try {
    const {
      name, mobile, email, city, college,
      course_interest_id, source, assigned_to,
      next_followup, remarks,
    } = req.body;

    const lead = await queryOne(
      `INSERT INTO leads
         (name, mobile, email, city, college, course_interest_id,
          source, assigned_to, next_followup, remarks, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        name, mobile, email || null, city || null, college || null,
        course_interest_id || null, source || "walk_in",
        assigned_to || null, next_followup || null,
        remarks || null, req.user.id,
      ]
    );

    await query(
      `INSERT INTO audit_log (user_id, action, entity, entity_id, new_data, ip_address)
       VALUES ($1,'CREATE_LEAD','leads',$2,$3,$4)`,
      [req.user.id, lead.id, JSON.stringify({ name, mobile, status: "new" }), req.ip]
    );

    return R.created(res, { lead }, "Lead created successfully");
  } catch (err) { next(err); }
}

// ── PATCH /api/leads/:id ──────────────────────────────────────
async function update(req, res, next) {
  try {
    const existing = await queryOne("SELECT * FROM leads WHERE id = $1", [req.params.id]);
    if (!existing) return R.notFound(res, "Lead not found");

    const allowed = [
      "name", "mobile", "email", "city", "college",
      "course_interest_id", "source", "assigned_to",
      "status", "next_followup", "remarks",
    ];
    const sets   = [];
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
    const lead = await queryOne(
      `UPDATE leads SET ${sets.join(", ")} WHERE id = $${pi} RETURNING *`,
      params
    );

    await query(
      `INSERT INTO audit_log (user_id, action, entity, entity_id, old_data, new_data, ip_address)
       VALUES ($1,'UPDATE_LEAD','leads',$2,$3,$4,$5)`,
      [req.user.id, lead.id, JSON.stringify(existing), JSON.stringify(req.body), req.ip]
    );

    return R.success(res, { lead }, "Lead updated");
  } catch (err) { next(err); }
}

// ── DELETE /api/leads/:id ─────────────────────────────────────
async function remove(req, res, next) {
  try {
    const lead = await queryOne(
      "DELETE FROM leads WHERE id = $1 RETURNING id, name",
      [req.params.id]
    );
    if (!lead) return R.notFound(res, "Lead not found");
    return R.success(res, {}, `Lead '${lead.name}' deleted`);
  } catch (err) { next(err); }
}

// ── POST /api/leads/:id/convert ───────────────────────────────
async function convert(req, res, next) {
  try {
    const lead = await queryOne("SELECT * FROM leads WHERE id = $1", [req.params.id]);
    if (!lead)                      return R.notFound(res, "Lead not found");
    if (lead.status === "converted") return R.badRequest(res, "Lead is already converted");

    const { course_id, batch_timing, enrolled_at } = req.body;

    const student = await withTransaction(async (client) => {
      const { rows: [s] } = await client.query(
        `INSERT INTO students
           (full_name, mobile, email, address, course_id, batch_timing,
            counselor_id, lead_status, inquiry_source, next_followup,
            notes, enrolled_at, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'enrolled',$8,$9,$10,$11,'active')
         RETURNING *`,
        [
          lead.name,
          lead.mobile,
          lead.email        || null,
          lead.city         || null,
          course_id         || lead.course_interest_id || null,
          batch_timing      || null,
          lead.assigned_to  || null,
          lead.source       || null,
          lead.next_followup || null,
          lead.remarks      || null,
          enrolled_at       || new Date().toISOString().split("T")[0],
        ]
      );

      await client.query(
        `UPDATE leads SET status = 'converted', converted_student_id = $1 WHERE id = $2`,
        [s.id, lead.id]
      );

      await client.query(
        `INSERT INTO audit_log (user_id, action, entity, entity_id, new_data, ip_address)
         VALUES ($1,'CONVERT_LEAD','leads',$2,$3,$4)`,
        [req.user.id, lead.id, JSON.stringify({ student_id: s.id }), req.ip]
      );

      return s;
    });

    return R.success(res, { student }, "Lead converted to student successfully");
  } catch (err) { next(err); }
}

// ── GET /api/leads/:id/timeline ───────────────────────────────
const ACTION_LABELS = {
  CREATE_LEAD:  "Lead created",
  UPDATE_LEAD:  "Lead updated",
  CONVERT_LEAD: "Converted to student",
};

async function timeline(req, res, next) {
  try {
    const rows = await queryAll(
      `SELECT a.action, a.old_data, a.new_data, a.created_at,
              u.name AS actor_name
       FROM audit_log a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.entity = 'leads' AND a.entity_id = $1
       ORDER BY a.created_at DESC`,
      [req.params.id]
    );

    const items = rows.map(r => {
      let notes = null;
      if (r.action === "UPDATE_LEAD" && r.new_data) {
        const changes = Object.entries(r.new_data)
          .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
          .join(", ");
        notes = changes || null;
      }
      return {
        action:     ACTION_LABELS[r.action] || r.action,
        actor_name: r.actor_name,
        created_at: r.created_at,
        notes,
      };
    });

    return R.success(res, { timeline: items });
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, remove, convert, timeline };
