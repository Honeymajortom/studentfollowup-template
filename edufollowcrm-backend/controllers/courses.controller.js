// controllers/courses.controller.js
const { query, queryOne, queryAll } = require("../config/db");
const R = require("../utils/response");

async function list(req, res, next) {
  try {
    const rows = await queryAll(
      `SELECT c.*, u.name AS trainer_name,
              COUNT(s.id) AS enrolled_count
       FROM courses c
       LEFT JOIN users    u ON u.id = c.trainer_id
       LEFT JOIN students s ON s.course_id = c.id AND s.status = 'active'
       WHERE c.is_active = TRUE
       GROUP BY c.id, u.name
       ORDER BY c.name`
    );
    return R.success(res, { courses: rows });
  } catch (err) { next(err); }
}

async function getOne(req, res, next) {
  try {
    const course = await queryOne(
      `SELECT c.*, u.name AS trainer_name FROM courses c
       LEFT JOIN users u ON u.id = c.trainer_id WHERE c.id = $1`,
      [req.params.id]
    );
    if (!course) return R.notFound(res, "Course not found");
    return R.success(res, { course });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { name, duration, fees, trainer_id, description, max_seats } = req.body;
    const { rows: [course] } = await query(
      `INSERT INTO courses (name, duration, fees, trainer_id, description, max_seats)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, duration, fees, trainer_id, description, max_seats || 30]
    );
    return R.created(res, { course });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const { name, duration, fees, trainer_id, description, max_seats, is_active } = req.body;
    const course = await queryOne(
      `UPDATE courses SET name=$1, duration=$2, fees=$3, trainer_id=$4,
       description=$5, max_seats=$6, is_active=$7 WHERE id=$8 RETURNING *`,
      [name, duration, fees, trainer_id, description, max_seats, is_active, req.params.id]
    );
    if (!course) return R.notFound(res, "Course not found");
    return R.success(res, { course });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await query("UPDATE courses SET is_active = FALSE WHERE id = $1", [req.params.id]);
    return R.success(res, {}, "Course deactivated");
  } catch (err) { next(err); }
}

module.exports = { list, getOne, create, update, remove };
