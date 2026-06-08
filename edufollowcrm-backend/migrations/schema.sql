-- =============================================================
-- EduFollow CRM  –  Complete PostgreSQL Schema
-- Run order: execute this file once against your database
-- psql -U postgres -d edufollowcrm -f migrations/schema.sql
-- =============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for fast LIKE search

-- ── ENUM types ───────────────────────────────────────────────
CREATE TYPE user_role         AS ENUM ('admin','counselor','trainer','accountant');
CREATE TYPE student_status    AS ENUM ('active','new_lead','follow_up','inactive','dropped');
CREATE TYPE lead_status       AS ENUM ('new_inquiry','interested','demo_scheduled','enrolled','not_interested');
CREATE TYPE fees_status       AS ENUM ('paid','pending','overdue','partial');
CREATE TYPE payment_mode      AS ENUM ('cash','upi','neft','cheque','emi','scholarship');
CREATE TYPE followup_status   AS ENUM ('scheduled','pending','overdue','completed','rescheduled','no_answer');
CREATE TYPE followup_type     AS ENUM ('call','whatsapp','walk_in','video_call','email');
CREATE TYPE wa_status         AS ENUM ('sent','delivered','read','failed','scheduled');
CREATE TYPE attendance_status AS ENUM ('present','absent','late','excused');
CREATE TYPE gender_type       AS ENUM ('male','female','other');

-- ── 1. USERS (staff login) ────────────────────────────────────
CREATE TABLE users (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(200)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          user_role     NOT NULL DEFAULT 'counselor',
  phone         VARCHAR(15),
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  joined_date   DATE,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── 2. COURSES ────────────────────────────────────────────────
CREATE TABLE courses (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(200)  NOT NULL UNIQUE,
  duration    VARCHAR(50)   NOT NULL,   -- e.g. "6 Months"
  fees        NUMERIC(10,2) NOT NULL,
  trainer_id  UUID          REFERENCES users(id) ON DELETE SET NULL,
  description TEXT,
  max_seats   INTEGER       NOT NULL DEFAULT 30,
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── 3. STUDENTS ───────────────────────────────────────────────
CREATE TABLE students (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_code    VARCHAR(20)   NOT NULL UNIQUE,  -- e.g. STU001
  full_name       VARCHAR(150)  NOT NULL,
  gender          gender_type,
  dob             DATE,
  mobile          VARCHAR(15)   NOT NULL UNIQUE,
  parent_mobile   VARCHAR(15),
  email           VARCHAR(200),
  address         TEXT,
  course_id       UUID          REFERENCES courses(id) ON DELETE SET NULL,
  batch_timing    VARCHAR(50),
  counselor_id    UUID          REFERENCES users(id) ON DELETE SET NULL,
  status          student_status NOT NULL DEFAULT 'new_lead',
  lead_status     lead_status    NOT NULL DEFAULT 'new_inquiry',
  inquiry_source  VARCHAR(80),
  next_followup   DATE,
  notes           TEXT,
  enrolled_at     DATE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
-- Fast search index
CREATE INDEX idx_students_name    ON students USING GIN (full_name gin_trgm_ops);
CREATE INDEX idx_students_mobile  ON students (mobile);
CREATE INDEX idx_students_status  ON students (status);
CREATE INDEX idx_students_counselor ON students (counselor_id);

-- ── 4. FEES ───────────────────────────────────────────────────
CREATE TABLE fees (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID          NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  total_fees  NUMERIC(10,2) NOT NULL,
  discount    NUMERIC(10,2) NOT NULL DEFAULT 0,
  paid        NUMERIC(10,2) NOT NULL DEFAULT 0,
  due_date    DATE,
  status      fees_status   NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_fees_student ON fees (student_id);

-- ── 5. PAYMENTS (fee transaction log) ────────────────────────
CREATE TABLE payments (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID          NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount        NUMERIC(10,2) NOT NULL,
  mode          payment_mode  NOT NULL,
  reference_no  VARCHAR(100),
  receipt_no    VARCHAR(50)   NOT NULL UNIQUE,
  payment_date  DATE          NOT NULL DEFAULT CURRENT_DATE,
  note          TEXT,
  recorded_by   UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payments_student ON payments (student_id);
CREATE INDEX idx_payments_date    ON payments (payment_date);

-- ── 6. FOLLOW-UPS ─────────────────────────────────────────────
CREATE TABLE followups (
  id           UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id   UUID             NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assigned_to  UUID             REFERENCES users(id) ON DELETE SET NULL,
  type         followup_type    NOT NULL DEFAULT 'call',
  status       followup_status  NOT NULL DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ      NOT NULL,
  completed_at TIMESTAMPTZ,
  outcome      TEXT,
  notes        TEXT,
  next_date    DATE,
  created_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_followups_student   ON followups (student_id);
CREATE INDEX idx_followups_assigned  ON followups (assigned_to);
CREATE INDEX idx_followups_scheduled ON followups (scheduled_at);
CREATE INDEX idx_followups_status    ON followups (status);

-- ── 7. ATTENDANCE ─────────────────────────────────────────────
CREATE TABLE attendance (
  id          UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID              NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id   UUID              REFERENCES courses(id) ON DELETE SET NULL,
  date        DATE              NOT NULL,
  status      attendance_status NOT NULL DEFAULT 'present',
  remark      VARCHAR(255),
  marked_by   UUID              REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, date, course_id)
);
CREATE INDEX idx_attendance_student ON attendance (student_id);
CREATE INDEX idx_attendance_date    ON attendance (date);
CREATE INDEX idx_attendance_course  ON attendance (course_id);

-- ── 8. WHATSAPP LOGS ──────────────────────────────────────────
CREATE TABLE wa_logs (
  id           UUID       PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id   UUID       REFERENCES students(id) ON DELETE SET NULL,
  phone        VARCHAR(20) NOT NULL,
  template     VARCHAR(100),
  message_body TEXT,
  wa_message_id VARCHAR(100),   -- ID returned by Meta API
  status       wa_status  NOT NULL DEFAULT 'sent',
  error_reason TEXT,
  sent_by      UUID       REFERENCES users(id) ON DELETE SET NULL,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at      TIMESTAMPTZ
);
CREATE INDEX idx_wa_logs_student ON wa_logs (student_id);
CREATE INDEX idx_wa_logs_sent    ON wa_logs (sent_at);

-- ── 9. WA TEMPLATES ───────────────────────────────────────────
CREATE TABLE wa_templates (
  id           SERIAL       PRIMARY KEY,
  name         VARCHAR(100) NOT NULL UNIQUE,
  template_key VARCHAR(100) NOT NULL,  -- Meta template name (snake_case)
  body         TEXT         NOT NULL,
  variables    TEXT[],                 -- variable names e.g. {name}, {course}
  language     VARCHAR(10)  NOT NULL DEFAULT 'en',
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── 10. AUDIT LOG ─────────────────────────────────────────────
CREATE TABLE audit_log (
  id          BIGSERIAL    PRIMARY KEY,
  user_id     UUID         REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(80)  NOT NULL,   -- e.g. 'CREATE_STUDENT', 'DELETE_PAYMENT'
  entity      VARCHAR(50)  NOT NULL,   -- e.g. 'students'
  entity_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_user   ON audit_log (user_id);
CREATE INDEX idx_audit_entity ON audit_log (entity, entity_id);

-- ── Auto-update updated_at ─────────────────────────────────────
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','courses','students','fees','followups'] LOOP
    EXECUTE format('
      CREATE TRIGGER trg_%s_updated_at
      BEFORE UPDATE ON %s
      FOR EACH ROW EXECUTE FUNCTION touch_updated_at();', t, t);
  END LOOP;
END $$;

-- ── Auto-generate student_code ─────────────────────────────────
CREATE SEQUENCE student_seq START 1;
CREATE OR REPLACE FUNCTION gen_student_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.student_code := 'STU' || LPAD(nextval('student_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_student_code
BEFORE INSERT ON students
FOR EACH ROW
WHEN (NEW.student_code IS NULL OR NEW.student_code = '')
EXECUTE FUNCTION gen_student_code();

-- ── Auto-generate receipt_no ───────────────────────────────────
CREATE SEQUENCE receipt_seq START 1;
CREATE OR REPLACE FUNCTION gen_receipt_no()
RETURNS TRIGGER AS $$
BEGIN
  NEW.receipt_no := 'RCP-' || LPAD(nextval('receipt_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_receipt_no
BEFORE INSERT ON payments
FOR EACH ROW
WHEN (NEW.receipt_no IS NULL OR NEW.receipt_no = '')
EXECUTE FUNCTION gen_receipt_no();

-- ── Seed: WA templates ─────────────────────────────────────────
INSERT INTO wa_templates (name, template_key, body, variables) VALUES
('Follow-up Reminder',    'followup_reminder',    'Hi {{1}}, this is a reminder for your follow-up call today at {{2}}. Please be available. — EduSpark', ARRAY['name','time']),
('Fee Reminder',          'fee_reminder',          'Dear {{1}}, your fee installment of ₹{{2}} is due on {{3}}. Kindly pay to avoid late charges. — EduSpark', ARRAY['name','amount','date']),
('Demo Class Reminder',   'demo_class_reminder',   'Hi {{1}}! Your FREE demo class for {{2}} is tomorrow at {{3}}. Don''t miss it! — EduSpark', ARRAY['name','course','time']),
('Admission Confirmation','admission_confirmation','Congratulations {{1}}! 🎉 Your admission to {{2}} is confirmed. Classes begin {{3}}. Welcome! — EduSpark', ARRAY['name','course','date']),
('Attendance Reminder',   'attendance_reminder',   'Dear {{1}}, you have missed {{2}} classes in {{3}}. Please attend regularly. — EduSpark', ARRAY['name','days','course']);

-- ── Seed: default admin user (password: Admin@123) ─────────────
-- bcrypt hash of 'Admin@123'
INSERT INTO users (name, email, password_hash, role, phone, joined_date) VALUES
('Super Admin', 'admin@eduspark.in', '$2b$10$rBV2JDeWW3./TKQuhYAaHOW4BETiXZdFRXSPVJLPPfqeJxpRbhSbi', 'admin', '9876543210', CURRENT_DATE);
