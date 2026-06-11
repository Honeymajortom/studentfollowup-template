// middleware/validate.js
const Joi = require("joi");
const { badRequest } = require("../utils/response");

// Factory: returns an Express middleware that validates req.body against schema
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly:   false,   // collect ALL errors at once
      stripUnknown: true,    // remove unknown fields
    });
    if (error) {
      const details = error.details.map(d => d.message.replace(/['"]/g, ""));
      return badRequest(res, "Validation failed", details);
    }
    req.body = value;   // use the sanitised value
    next();
  };
}

// ── Shared Joi types ──────────────────────────────────────────
const phone = Joi.string().pattern(/^[6-9]\d{9}$/).messages({
  "string.pattern.base": "Must be a valid 10-digit Indian mobile number",
});

const uuid = Joi.string().uuid({ version: "uuidv4" });

// ── Auth schemas ──────────────────────────────────────────────
const loginSchema = Joi.object({
  email:    Joi.string().email().lowercase().required(),
  password: Joi.string().min(6).required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword:     Joi.string().min(8).required(),
});

// ── Student schemas ───────────────────────────────────────────
const createStudentSchema = Joi.object({
  full_name:       Joi.string().min(2).max(150).required(),
  gender:          Joi.string().valid("male","female","other"),
  dob:             Joi.date().iso().less("now"),
  mobile:          phone.required(),
  parent_mobile:   phone,
  email:           Joi.string().email().lowercase(),
  address:         Joi.string().max(400),
  course_id:       uuid,
  batch_timing:    Joi.string().max(50),
  counselor_id:    uuid,
  lead_status:     Joi.string().valid("new_inquiry","interested","demo_scheduled","enrolled","not_interested"),
  inquiry_source:  Joi.string().max(80),
  next_followup:   Joi.date().iso(),
  notes:           Joi.string().max(1000),
  enrolled_at:     Joi.date().iso(),
  // Fees (optional — creates fee record)
  total_fees:      Joi.number().positive(),
  discount:        Joi.number().min(0),
  paid:            Joi.number().min(0),
  payment_mode:    Joi.string().valid("cash","upi","neft","cheque","emi","scholarship"),
  due_date:        Joi.date().iso(),
});

const updateStudentSchema = createStudentSchema.fork(
  ["full_name","mobile"],
  f => f.optional()
);

// ── Follow-up schemas ─────────────────────────────────────────
const createFollowupSchema = Joi.object({
  student_id:   uuid.required(),
  type:         Joi.string().valid("call","whatsapp","walk_in","video_call","email").default("call"),
  scheduled_at: Joi.date().iso().required(),
  notes:        Joi.string().max(1000),
  next_date:    Joi.date().iso(),
});

const completeFollowupSchema = Joi.object({
  outcome:     Joi.string().max(500).required(),
  notes:       Joi.string().max(1000),
  next_date:   Joi.date().iso(),
  status:      Joi.string().valid("completed","rescheduled","no_answer","enrolled").required(),
  // If rescheduled, new scheduled_at is required
  scheduled_at: Joi.when("status", {
    is:   "rescheduled",
    then: Joi.date().iso().required(),
    otherwise: Joi.date().iso(),
  }),
});

// ── Payment schemas ───────────────────────────────────────────
const createPaymentSchema = Joi.object({
  student_id:   uuid.required(),
  amount:       Joi.number().positive().required(),
  mode:         Joi.string().valid("cash","upi","neft","cheque","emi","scholarship").required(),
  reference_no: Joi.string().max(100),
  payment_date: Joi.date().iso().default(() => new Date()),
  note:         Joi.string().max(500),
});

// ── Course schemas ────────────────────────────────────────────
const createCourseSchema = Joi.object({
  name:        Joi.string().min(2).max(200).required(),
  duration:    Joi.string().max(50).required(),
  fees:        Joi.number().positive().required(),
  trainer_id:  uuid,
  description: Joi.string().max(1000),
  max_seats:   Joi.number().integer().positive().default(30),
});

// ── Attendance schema ─────────────────────────────────────────
const attendanceSchema = Joi.object({
  course_id: uuid.required(),
  date:      Joi.date().iso().required(),
  records:   Joi.array().items(
    Joi.object({
      student_id: uuid.required(),
      status:     Joi.string().valid("present","absent","late","excused").required(),
      remark:     Joi.string().max(255),
    })
  ).min(1).required(),
});

// ── Staff schemas ─────────────────────────────────────────────
const createStaffSchema = Joi.object({
  name:        Joi.string().min(2).max(120).required(),
  email:       Joi.string().email().lowercase().required(),
  password:    Joi.string().min(8).required(),
  role:        Joi.string().valid("admin","counselor","trainer","accountant").required(),
  phone:       phone,
  joined_date: Joi.date().iso(),
});

// ── Lead schemas ──────────────────────────────────────────────
const createLeadSchema = Joi.object({
  name:               Joi.string().min(2).max(150).required(),
  mobile:             phone.required(),
  email:              Joi.string().email().lowercase(),
  city:               Joi.string().max(100),
  college:            Joi.string().max(200),
  course_interest_id: uuid,
  source:             Joi.string().valid(
                        "college_visit","walk_in","website","whatsapp",
                        "facebook","referral","job_fair","home_visit","other"
                      ).default("walk_in"),
  assigned_to:        uuid,
  next_followup:      Joi.date().iso(),
  remarks:            Joi.string().max(1000),
});

const updateLeadSchema = createLeadSchema
  .fork(["name", "mobile"], f => f.optional())
  .keys({
    status: Joi.string().valid(
      "new","contacted","follow_up","interested",
      "hot_lead","not_interested","converted","lost"
    ),
  });

const convertLeadSchema = Joi.object({
  course_id:    uuid,
  batch_timing: Joi.string().max(50),
  enrolled_at:  Joi.date().iso(),
});

// ── WhatsApp template schemas ─────────────────────────────────
const templateKey = Joi.string().pattern(/^[a-z0-9_]+$/).max(100)
  .messages({ "string.pattern.base": "Template key must be lowercase letters, numbers, or underscores" });

const createTemplateSchema = Joi.object({
  name:         Joi.string().min(2).max(100).required(),
  template_key: templateKey.required(),
  body:         Joi.string().min(10).max(2000).required(),
  variables:    Joi.array().items(Joi.string().max(30)).default([]),
});

const updateTemplateSchema = Joi.object({
  name:         Joi.string().min(2).max(100),
  template_key: templateKey,
  body:         Joi.string().min(10).max(2000),
  variables:    Joi.array().items(Joi.string().max(30)),
  is_active:    Joi.boolean(),
}).min(1);

// ── WhatsApp schema ───────────────────────────────────────────
const sendWASchema = Joi.object({
  student_ids:  Joi.array().items(uuid).min(1),
  group:        Joi.string().valid("all","pending_fees","todays_followups","overdue"),
  template_id:  Joi.number().integer().required(),
  scheduled_at: Joi.date().iso(),
}).or("student_ids","group");   // one of them is required

module.exports = {
  validate,
  schemas: {
    login:            loginSchema,
    changePassword:   changePasswordSchema,
    createStudent:    createStudentSchema,
    updateStudent:    updateStudentSchema,
    createFollowup:   createFollowupSchema,
    completeFollowup: completeFollowupSchema,
    createPayment:    createPaymentSchema,
    createCourse:     createCourseSchema,
    attendance:       attendanceSchema,
    createStaff:      createStaffSchema,
    sendWA:           sendWASchema,
    createLead:       createLeadSchema,
    updateLead:       updateLeadSchema,
    convertLead:      convertLeadSchema,
    bulkAssign:       Joi.object({
                        student_ids:  Joi.array().items(uuid).min(1).required(),
                        counselor_id: uuid.required(),
                      }),
    bulkPayment:      Joi.object({
                        student_ids: Joi.array().items(uuid).min(1).required(),
                        mode:        Joi.string().valid("cash","upi","neft","cheque","emi","scholarship").default("cash"),
                      }),
    createTemplate:   createTemplateSchema,
    updateTemplate:   updateTemplateSchema,
  },
};
