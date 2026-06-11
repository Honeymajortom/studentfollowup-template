-- =============================================================
-- EduFollow CRM  –  Leads Table Migration
-- Run: node migrations/run_leads.js
-- Safe to run multiple times (uses IF NOT EXISTS / OR REPLACE)
-- =============================================================

-- ── Leads table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id                   UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_code            VARCHAR(20)  NOT NULL UNIQUE,
  name                 VARCHAR(150) NOT NULL,
  mobile               VARCHAR(15)  NOT NULL,
  email                VARCHAR(200),
  city                 VARCHAR(100),
  college              VARCHAR(200),
  course_interest_id   UUID         REFERENCES courses(id) ON DELETE SET NULL,
  source               VARCHAR(50)  NOT NULL DEFAULT 'walk_in'
                         CHECK (source IN (
                           'college_visit','walk_in','website','whatsapp',
                           'facebook','referral','job_fair','home_visit','other'
                         )),
  assigned_to          UUID         REFERENCES users(id) ON DELETE SET NULL,
  status               VARCHAR(30)  NOT NULL DEFAULT 'new'
                         CHECK (status IN (
                           'new','contacted','follow_up','interested',
                           'hot_lead','not_interested','converted','lost'
                         )),
  next_followup        DATE,
  remarks              TEXT,
  converted_student_id UUID         REFERENCES students(id) ON DELETE SET NULL,
  created_by           UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_leads_mobile    ON leads (mobile);
CREATE INDEX IF NOT EXISTS idx_leads_status    ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned  ON leads (assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_name      ON leads USING GIN (name gin_trgm_ops);

-- ── Auto-generate lead_code  (e.g. LEAD0001) ──────────────────
CREATE SEQUENCE IF NOT EXISTS lead_seq START 1;

CREATE OR REPLACE FUNCTION gen_lead_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.lead_code := 'LEAD' || LPAD(nextval('lead_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lead_code ON leads;
CREATE TRIGGER trg_lead_code
BEFORE INSERT ON leads
FOR EACH ROW
WHEN (NEW.lead_code IS NULL OR NEW.lead_code = '')
EXECUTE FUNCTION gen_lead_code();

-- ── Auto-update updated_at (reuses touch_updated_at from schema.sql) ──
DROP TRIGGER IF EXISTS trg_leads_updated_at ON leads;
CREATE TRIGGER trg_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
