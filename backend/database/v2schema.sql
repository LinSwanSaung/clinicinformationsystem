-- =========================================================
-- CIS v2 Migration (idempotent; safe to run once)
-- Requires base schema with users/patients/appointments/visits/prescriptions
-- =========================================================

-- Ensure UUID generation available (your base already includes pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------------------------------------------------
-- 0) Appointments: keep your schema, only set default slot to 15 min
-- -------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='appointments' AND column_name='duration_minutes'
  ) THEN
    EXECUTE 'ALTER TABLE appointments ALTER COLUMN duration_minutes SET DEFAULT 15';
  END IF;
END $$;

DO $$
BEGIN
  -- Drop existing CHECK and recreate with extended set
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname='valid_role' AND conrelid='users'::regclass
  ) THEN
    ALTER TABLE users DROP CONSTRAINT valid_role;
  END IF;

  ALTER TABLE users
    ADD CONSTRAINT valid_role
    CHECK (role IN ('admin','doctor','nurse','receptionist','pharmacist','patient'));
END $$;

-- ------------------------------------------------------------------------------------
-- 1b) Users: add deleted_at for permanent soft delete (tombstone)
-- ------------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    BEGIN
      ALTER TABLE public.users
        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
    EXCEPTION WHEN others THEN
      -- ignore if race condition
      NULL;
    END;
  END IF;
END $$;
-- ---------------------------------------------------------
-- 2) Queue v2: per-doctor token lifecycle (non-preemptive)
--    Does NOT touch your existing queue tables.
-- ---------------------------------------------------------
DO $$
BEGIN
  BEGIN
    CREATE TYPE queue_token_state AS ENUM
    ('SCHEDULED','WAITING_SCHEDULED','WAITING','READY','IN_CONSULT','DONE','LATE','NO_SHOW','CANCELLED');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE TYPE queue_priority AS ENUM ('Normal','Emergency');
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

CREATE TABLE IF NOT EXISTS queue_tokens_v2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id     UUID NOT NULL REFERENCES patients(id)   ON DELETE CASCADE,
  doctor_id      UUID NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
  appointment_id UUID     REFERENCES appointments(id)    ON DELETE SET NULL,

  activation_at     TIMESTAMPTZ,   -- = slot start (NULL for walk-ins)
  appointment_time  TIMESTAMPTZ,   -- convenience
  checkin_time      TIMESTAMPTZ,
  ready_at          TIMESTAMPTZ,
  in_consult_at     TIMESTAMPTZ,
  done_at           TIMESTAMPTZ,
  late_at           TIMESTAMPTZ,

  priority  queue_priority NOT NULL DEFAULT 'Normal',
  penalized BOOLEAN NOT NULL DEFAULT FALSE,               -- late arrivals rank behind
  state     queue_token_state NOT NULL DEFAULT 'SCHEDULED',

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT qt2_consult_ts_ok CHECK (state <> 'IN_CONSULT' OR in_consult_at IS NOT NULL)
);

-- One active consult per doctor
CREATE UNIQUE INDEX IF NOT EXISTS uq_qt2_one_in_consult_per_doc
  ON queue_tokens_v2(doctor_id) WHERE state='IN_CONSULT';

CREATE INDEX IF NOT EXISTS idx_qt2_doctor_state  ON queue_tokens_v2(doctor_id, state);
CREATE INDEX IF NOT EXISTS idx_qt2_activation_at ON queue_tokens_v2(activation_at);
CREATE INDEX IF NOT EXISTS idx_qt2_ordering      ON queue_tokens_v2(appointment_time, checkin_time);

-- Keep updated_at fresh using your existing function
DROP TRIGGER IF EXISTS trg_qt2_touch_updated_at ON queue_tokens_v2;
CREATE TRIGGER trg_qt2_touch_updated_at
BEFORE UPDATE ON queue_tokens_v2
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------
-- 3) Diagnoses: hybrid ICD-10 + free-text per visit
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS diagnoses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id   UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  icd10_code VARCHAR(10),
  label      TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_diag_visit ON diagnoses(visit_id);
CREATE INDEX IF NOT EXISTS idx_diag_icd   ON diagnoses(icd10_code);

-- -------------------------------------------------------
-- 4) Billing: invoices, items, payments (no inventory)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id   UUID UNIQUE NOT NULL REFERENCES visits(id)    ON DELETE CASCADE,
  patient_id UUID        NOT NULL REFERENCES patients(id)  ON DELETE CASCADE,
  status     VARCHAR(10) NOT NULL DEFAULT 'draft',   -- draft|issued|paid|void
  subtotal   NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax        NUMERIC(12,2) NOT NULL DEFAULT 0,
  total      NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency   VARCHAR(8)   NOT NULL DEFAULT 'MMK',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_invoices_visit ON invoices(visit_id);

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  source     VARCHAR(20) NOT NULL,                -- 'prescription' | 'consult' | 'service'
  source_id  UUID,                                 -- e.g., prescriptions.id
  description TEXT NOT NULL,
  qty         NUMERIC(12,3) NOT NULL DEFAULT 1,
  unit_price  NUMERIC(12,2) NOT NULL DEFAULT 0,
  line_total  NUMERIC(12,2) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_items_invoice ON invoice_items(invoice_id);

CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  method     VARCHAR(20) NOT NULL,               -- 'cash','kbzpay','wave'
  amount     NUMERIC(12,2) NOT NULL,
  paid_at    TIMESTAMPTZ DEFAULT NOW(),
  received_by UUID REFERENCES users(id),
  CONSTRAINT pay_method_ok CHECK (method IN ('cash','kbzpay','wave'))
);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);

-- -------------------------------------------------------
-- 5) Prescriptions: add pharmacist decision fields
--    (matches your existing column names)
-- -------------------------------------------------------
DO $$
BEGIN
  -- Decision fields (independent of clinical status)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='prescriptions' AND column_name='dispense_choice'
  ) THEN
    ALTER TABLE prescriptions
      ADD COLUMN dispense_choice VARCHAR(10)
        CHECK (dispense_choice IN ('in_house','outside')) DEFAULT 'in_house',
      ADD COLUMN dispense_status VARCHAR(12)
        CHECK (dispense_status IN ('pending','dispensed','cancelled','outside')) DEFAULT 'pending',
      ADD COLUMN dispense_note TEXT;
  END IF;

  -- Unit price for billing; keep your existing quantity (INTEGER) and medication_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='prescriptions' AND column_name='unit_price'
  ) THEN
    ALTER TABLE prescriptions ADD COLUMN unit_price NUMERIC(12,2);
  END IF;

  -- Helpful index if not present
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='prescriptions' AND indexname='idx_rx_visit') THEN
    CREATE INDEX idx_rx_visit ON prescriptions(visit_id);
  END IF;
END $$;

-- -------------------------------------------------------
-- 6) Audit logs: add optional hash-chain fields if table exists
-- -------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='audit_logs') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='prev_hash') THEN
      ALTER TABLE audit_logs ADD COLUMN prev_hash TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='row_hash') THEN
      ALTER TABLE audit_logs ADD COLUMN row_hash TEXT;
    END IF;
  END IF;
END $$;

-- -------------------------------------------------------
-- 7) Billing helpers & pharmacist trigger (Dispense vs Outside)
-- -------------------------------------------------------

-- Upsert one invoice per visit
CREATE OR REPLACE FUNCTION ensure_visit_invoice(p_visit UUID, p_patient UUID, p_creator UUID DEFAULT NULL)
RETURNS UUID AS $$
DECLARE v_invoice UUID;
BEGIN
  -- Return existing invoice for the visit or create a draft invoice
  SELECT id INTO v_invoice FROM invoices WHERE visit_id = p_visit;
  IF v_invoice IS NULL THEN
    INSERT INTO invoices (
      visit_id, patient_id, status, subtotal, discount, tax, total, currency, created_by
    ) VALUES (
      p_visit, p_patient, 'draft', 0, 0, 0, 0, 'MMK', p_creator
    ) RETURNING id INTO v_invoice;
  END IF;
  RETURN v_invoice;

$$ LANGUAGE plpgsql;

-- Compute line_total on invoice_items (qty * unit_price)
CREATE OR REPLACE FUNCTION compute_line_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.line_total := COALESCE(NEW.qty, 1) * COALESCE(NEW.unit_price, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recalculate invoice totals from items
CREATE OR REPLACE FUNCTION recalc_invoice_totals(p_invoice UUID)
RETURNS VOID AS $$
DECLARE v_subtotal NUMERIC(12,2);
BEGIN
  SELECT COALESCE(SUM(line_total), 0) INTO v_subtotal
  FROM invoice_items WHERE invoice_id = p_invoice;

  UPDATE invoices
  SET subtotal = v_subtotal,
      total    = GREATEST(v_subtotal - discount + tax, 0),
      updated_at = NOW()
  WHERE id = p_invoice;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to recalc invoice totals after item changes
CREATE OR REPLACE FUNCTION trg_recalc_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE v_invoice UUID;
BEGIN
  v_invoice := COALESCE(NEW.invoice_id, OLD.invoice_id);
  PERFORM recalc_invoice_totals(v_invoice);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Keep updated_at fresh on new tables (align with base behavior)
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoice_items_updated_at ON invoice_items;
CREATE TRIGGER update_invoice_items_updated_at
BEFORE UPDATE ON invoice_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Maintain invoice item totals and parent invoice sums
DROP TRIGGER IF EXISTS trg_items_compute_total ON invoice_items;
CREATE TRIGGER trg_items_compute_total
BEFORE INSERT OR UPDATE ON invoice_items
FOR EACH ROW EXECUTE FUNCTION compute_line_total();

DROP TRIGGER IF EXISTS trg_items_recalc_invoice_aiud ON invoice_items;
CREATE TRIGGER trg_items_recalc_invoice_aiud
AFTER INSERT OR UPDATE OR DELETE ON invoice_items
FOR EACH ROW EXECUTE FUNCTION trg_recalc_invoice_totals();

-- When payments change, optionally mark invoice as paid when fully paid
CREATE OR REPLACE FUNCTION trg_update_invoice_status_from_payments()
RETURNS TRIGGER AS $$
DECLARE v_invoice UUID; v_paid NUMERIC(12,2); v_total NUMERIC(12,2);
BEGIN
  v_invoice := COALESCE(NEW.invoice_id, OLD.invoice_id);
  SELECT COALESCE(SUM(amount),0) INTO v_paid FROM payments WHERE invoice_id = v_invoice;
  SELECT total INTO v_total FROM invoices WHERE id = v_invoice;
  IF COALESCE(v_total,0) > 0 AND v_paid >= v_total THEN
    UPDATE invoices SET status = 'paid', updated_at = NOW()
    WHERE id = v_invoice AND status <> 'paid';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payments_update_invoice_status ON payments;
CREATE TRIGGER trg_payments_update_invoice_status
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION trg_update_invoice_status_from_payments();

-- -------------------------------------------------------
-- 8) RLS alignment for new tables (match base permissive policies)
-- -------------------------------------------------------
ALTER TABLE IF EXISTS diagnoses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoice_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS queue_tokens_v2 ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- diagnoses
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='diagnoses') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Healthcare staff can access all data" ON diagnoses';
    EXECUTE 'CREATE POLICY "Healthcare staff can access all data" ON diagnoses FOR ALL USING (true)';
  END IF;

  -- invoices
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name=''invoices'') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Healthcare staff can access all data" ON invoices';
    EXECUTE 'CREATE POLICY "Healthcare staff can access all data" ON invoices FOR ALL USING (true)';
  END IF;

  -- invoice_items
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name=''invoice_items'') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Healthcare staff can access all data" ON invoice_items';
    EXECUTE 'CREATE POLICY "Healthcare staff can access all data" ON invoice_items FOR ALL USING (true)';
  END IF;

  -- payments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name=''payments'') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Healthcare staff can access all data" ON payments';
    EXECUTE 'CREATE POLICY "Healthcare staff can access all data" ON payments FOR ALL USING (true)';
  END IF;

  -- queue_tokens_v2
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name=''queue_tokens_v2'') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Healthcare staff can access all data" ON queue_tokens_v2';
    EXECUTE 'CREATE POLICY "Healthcare staff can access all data" ON queue_tokens_v2 FOR ALL USING (true)';
  END IF;
END $$;
