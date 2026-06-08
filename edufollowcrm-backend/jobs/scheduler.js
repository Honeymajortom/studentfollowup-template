// jobs/scheduler.js
// Scheduled background jobs using node-cron
// Docs: https://www.npmjs.com/package/node-cron  (cron syntax: sec min hr dom mon dow)

const cron   = require("node-cron");
const { queryAll, query } = require("../config/db");
const { sendBulk }        = require("../services/whatsapp.service");
const logger              = require("../utils/logger");

// ── Job 1: Morning follow-up reminders ────────────────────────
// Runs every day at 8:00 AM
// Sends "Follow-up Reminder" WA message to students with today's follow-up
cron.schedule("0 8 * * *", async () => {
  logger.info("[CRON] Running: morning follow-up reminders");
  try {
    const today    = new Date().toISOString().split("T")[0];
    const students = await queryAll(
      `SELECT DISTINCT s.id
       FROM students s
       JOIN followups f ON f.student_id = s.id
       WHERE f.scheduled_at::date = $1
         AND f.status IN ('scheduled','pending')
         AND s.status != 'inactive'`,
      [today]
    );

    if (!students.length) {
      logger.info("[CRON] No follow-ups today — skipping WA send");
      return;
    }

    // Template ID 1 = "Follow-up Reminder" (from wa_templates seed)
    const results = await sendBulk({
      studentIds: students.map(s => s.id),
      templateId: 1,
      sentBy:     null,  // system send
    });

    logger.info(`[CRON] Follow-up reminders sent: ${results.filter(r => r.status === "sent").length}/${students.length}`);
  } catch (err) {
    logger.error("[CRON] Follow-up reminder job failed:", err.message);
  }
});

// ── Job 2: Fee due reminders ──────────────────────────────────
// Runs every day at 9:00 AM
// Sends "Fee Reminder" to students whose due date is in 3 days
cron.schedule("0 9 * * *", async () => {
  logger.info("[CRON] Running: fee due reminders");
  try {
    const students = await queryAll(
      `SELECT s.id FROM students s
       JOIN fees f ON f.student_id = s.id
       WHERE f.status IN ('pending','partial')
         AND f.due_date = CURRENT_DATE + INTERVAL '3 days'`
    );

    if (!students.length) return;

    const results = await sendBulk({
      studentIds: students.map(s => s.id),
      templateId: 2,   // "Fee Reminder"
      sentBy:     null,
    });

    logger.info(`[CRON] Fee reminders sent: ${results.filter(r => r.status === "sent").length}/${students.length}`);
  } catch (err) {
    logger.error("[CRON] Fee reminder job failed:", err.message);
  }
});

// ── Job 3: Mark overdue fees ──────────────────────────────────
// Runs every day at 00:05 AM
// Marks any fee record as "overdue" if due_date has passed and status != paid
cron.schedule("5 0 * * *", async () => {
  logger.info("[CRON] Running: mark overdue fees");
  try {
    const { rowCount } = await query(
      `UPDATE fees
       SET status = 'overdue'
       WHERE due_date < CURRENT_DATE
         AND status IN ('pending','partial')`
    );
    logger.info(`[CRON] ${rowCount} fee records marked overdue`);
  } catch (err) {
    logger.error("[CRON] Overdue fee marking failed:", err.message);
  }
});

// ── Job 4: Mark overdue follow-ups ───────────────────────────
// Runs every day at 00:10 AM
// Follow-ups that were scheduled in the past and still "scheduled/pending" → overdue
cron.schedule("10 0 * * *", async () => {
  logger.info("[CRON] Running: mark overdue follow-ups");
  try {
    const { rowCount } = await query(
      `UPDATE followups
       SET status = 'overdue'
       WHERE scheduled_at < NOW()
         AND status IN ('scheduled','pending')`
    );
    logger.info(`[CRON] ${rowCount} follow-ups marked overdue`);
  } catch (err) {
    logger.error("[CRON] Overdue follow-up marking failed:", err.message);
  }
});

// ── Job 5: Send scheduled WhatsApp messages ───────────────────
// Runs every 5 minutes
// Picks up wa_logs rows with status='scheduled' and sent_at <= NOW()
cron.schedule("*/5 * * * *", async () => {
  try {
    const pending = await queryAll(
      `SELECT l.*, s.id AS student_id, t.id AS template_id
       FROM wa_logs l
       JOIN students     s ON s.mobile = l.phone
       JOIN wa_templates t ON t.name   = l.template
       WHERE l.status = 'scheduled'
         AND l.sent_at <= NOW()`
    );

    if (!pending.length) return;
    logger.info(`[CRON] Sending ${pending.length} scheduled WA messages`);

    for (const row of pending) {
      await sendBulk({
        studentIds: [row.student_id],
        templateId: row.template_id,
        sentBy:     row.sent_by,
      });
    }
  } catch (err) {
    logger.error("[CRON] Scheduled WA send failed:", err.message);
  }
});

// ── Job 6: Student birthday greetings ────────────────────────
// Runs every day at 9:30 AM
// Sends WhatsApp to students whose birthday is today (optional feature)
cron.schedule("30 9 * * *", async () => {
  logger.info("[CRON] Running: birthday greetings");
  try {
    const students = await queryAll(
      `SELECT id FROM students
       WHERE TO_CHAR(dob, 'MM-DD') = TO_CHAR(CURRENT_DATE, 'MM-DD')
         AND status != 'inactive'`
    );
    if (!students.length) return;

    // Using template 4 = "Admission Confirmation" as a placeholder
    // You can add a "Birthday Greeting" template to wa_templates
    logger.info(`[CRON] Birthday greetings: ${students.length} students`);
  } catch (err) {
    logger.error("[CRON] Birthday greeting job failed:", err.message);
  }
});

logger.info("✅  All cron jobs registered");
