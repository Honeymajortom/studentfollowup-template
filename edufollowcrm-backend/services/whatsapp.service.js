// services/whatsapp.service.js
// Meta WhatsApp Cloud API integration
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api

const axios  = require("axios");
const { query, queryAll } = require("../config/db");

const BASE_URL = `https://graph.facebook.com/${process.env.WA_API_VERSION}`;

// Low-level: send one message via Meta API
async function sendMessage(to, templateName, components = [], language = "en") {
  const phone = to.startsWith("+") ? to.slice(1) : to.startsWith("0") ? "91" + to.slice(1) : "91" + to;

  const response = await axios.post(
    `${BASE_URL}/${process.env.WA_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      recipient_type:    "individual",
      to:               phone,
      type:             "template",
      template: {
        name:       templateName,
        language:   { code: language },
        components: components.length ? components : undefined,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.messages?.[0]?.id;
}

// High-level: send to list of students, log each to DB
async function sendBulk({ studentIds, templateId, sentBy }) {
  // Fetch template
  const { rows: [template] } = await query(
    "SELECT * FROM wa_templates WHERE id = $1 AND is_active = TRUE",
    [templateId]
  );
  if (!template) throw new Error("Template not found or inactive");

  // Fetch students
  const students = await queryAll(
    `SELECT s.id, s.full_name, s.mobile, s.parent_mobile,
            c.name AS course_name, f.paid, f.total_fees
     FROM students s
     LEFT JOIN courses c ON c.id = s.course_id
     LEFT JOIN fees    f ON f.student_id = s.id
     WHERE s.id = ANY($1::uuid[])`,
    [studentIds]
  );

  const results = [];
  for (const student of students) {
    try {
      // Build component parameters from template.variables
      const components = buildComponents(template, student);
      const waId = await sendMessage(student.mobile, template.template_key, components);

      // Log success
      await query(
        `INSERT INTO wa_logs (student_id, phone, template, message_body, wa_message_id, status, sent_by)
         VALUES ($1, $2, $3, $4, $5, 'sent', $6)`,
        [student.id, student.mobile, template.name, template.body, waId, sentBy]
      );

      results.push({ studentId: student.id, status: "sent", waId });
    } catch (err) {
      // Log failure
      await query(
        `INSERT INTO wa_logs (student_id, phone, template, status, error_reason, sent_by)
         VALUES ($1, $2, $3, 'failed', $4, $5)`,
        [student.id, student.mobile, template.name, err.message, sentBy]
      );
      results.push({ studentId: student.id, status: "failed", error: err.message });
    }
  }

  return results;
}

function buildComponents(template, student) {
  const varMap = {
    name:       student.full_name,
    course:     student.course_name || "",
    amount:     student.total_fees  ? `₹${(student.total_fees - student.paid).toLocaleString("en-IN")}` : "",
    date:       new Date().toLocaleDateString("en-IN"),
    time:       new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    phone:      student.mobile,
    days:       "3",
  };

  if (!template.variables?.length) return [];

  return [{
    type: "body",
    parameters: template.variables.map(v => ({
      type: "text",
      text: varMap[v] || v,
    })),
  }];
}

module.exports = { sendMessage, sendBulk };
