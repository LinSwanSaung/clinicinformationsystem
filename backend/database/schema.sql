-- ===============================================
-- RealCIS Clinic Information System Database
-- Consolidated Schema (Single Source of Truth)
-- ===============================================
-- 
-- This schema.sql file is the authoritative baseline for fresh database installations.
-- It consolidates all migrations from backend/database/migrations/ into a single
-- idempotent schema definition.
--
-- Created: Stage 3 Refactor (2025-11-03)
-- Updated: November 2025 - Removed sample data, fixed table order
-- Purpose: Single authoritative schema.sql for fresh installs
--
-- Structure:
--   1. Extensions
--   2. Tables (in dependency order - patients first, then users, etc.)
--   3. Constraints
--   4. Indexes
--   5. Views
--   6. Functions
--   7. Triggers
--   8. Row Level Security (RLS) Policies
--
-- Usage:
--   - Fresh install: Run entire file in Supabase SQL Editor
--   - Existing DB: Check for conflicts before applying
--   - Testing: Apply to clean DB, run pg_dump --schema-only, compare with this file
--
-- Note: This schema creates empty tables. Add your own users and data after setup.
-- ===============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===============================================
-- PATIENTS TABLE (Created FIRST - referenced by users.patient_id)
-- ===============================================
CREATE TABLE IF NOT EXISTS patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_number VARCHAR(20) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(100),
    blood_group VARCHAR(5),
    allergies TEXT,
    medical_conditions TEXT,
    current_medications TEXT,
    insurance_provider VARCHAR(200),
    insurance_number VARCHAR(100),
    registration_date TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_gender CHECK (gender IN ('Male', 'Female', 'Other')),
    CONSTRAINT valid_blood_group CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    CONSTRAINT valid_age CHECK (date_of_birth <= CURRENT_DATE)
);

-- ===============================================
-- USERS TABLE (Created AFTER patients - has FK to patients)
-- ===============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'nurse',
    specialty VARCHAR(100),
    license_number VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT valid_role CHECK (
        role IN ('admin', 'doctor', 'nurse', 'receptionist', 'cashier', 'pharmacist', 'patient')
    ),
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

COMMENT ON COLUMN users.patient_id IS 'Links a patient portal account to the patients table';

-- ===============================================
-- APPOINTMENTS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 10,
    appointment_type VARCHAR(100),
    reason_for_visit TEXT,
    status VARCHAR(20) DEFAULT 'scheduled',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_by_admin BOOLEAN DEFAULT false,
    resolved_reason TEXT,
    
    CONSTRAINT valid_status CHECK (status IN ('scheduled', 'waiting', 'ready_for_doctor', 'consulting', 'completed', 'cancelled', 'no_show', 'late')),
    CONSTRAINT valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 480)
);

COMMENT ON COLUMN appointments.status IS 
'Appointment status: 
- scheduled: Initial state when appointment is booked
- late: Patient arrived more than 10 minutes late or manually marked as late by receptionist
- waiting: Patient checked in and in queue (has token)
- ready_for_doctor: After vitals taken, ready for consultation
- consulting: Doctor currently consulting
- completed: Consultation finished
- cancelled: Appointment cancelled
- no_show: Patient did not show up';

-- ===============================================
-- VISITS TABLE (Medical Encounters)
-- ===============================================
CREATE TABLE IF NOT EXISTS visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    visit_date TIMESTAMPTZ DEFAULT NOW(),
    visit_type VARCHAR(100),
    chief_complaint TEXT,
    history_of_present_illness TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    follow_up_instructions TEXT,
    status VARCHAR(20) DEFAULT 'in_progress',
    total_cost DECIMAL(10,2),
    payment_status VARCHAR(20) DEFAULT 'pending',
    visit_start_time TIMESTAMPTZ,
    visit_end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_by_admin BOOLEAN DEFAULT false,
    resolved_reason TEXT,
    
    CONSTRAINT valid_visit_status CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'partial', 'paid', 'insurance_pending'))
);

-- ===============================================
-- VITALS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS vitals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    recorded_by UUID NOT NULL REFERENCES users(id),
    temperature DECIMAL(4,1),
    temperature_unit VARCHAR(1) DEFAULT 'C',
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    heart_rate INTEGER,
    respiratory_rate INTEGER,
    oxygen_saturation DECIMAL(5,2),
    weight DECIMAL(5,2),
    weight_unit VARCHAR(2) DEFAULT 'kg',
    height DECIMAL(5,2),
    height_unit VARCHAR(2) DEFAULT 'cm',
    bmi DECIMAL(4,1),
    pain_level INTEGER,
    priority VARCHAR(20),
    notes TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_temp_celsius CHECK (temperature_unit != 'C' OR (temperature >= 30.0 AND temperature <= 45.0)),
    CONSTRAINT valid_temp_fahrenheit CHECK (temperature_unit != 'F' OR (temperature >= 86.0 AND temperature <= 113.0)),
    CONSTRAINT valid_blood_pressure CHECK (
        (blood_pressure_systolic IS NULL AND blood_pressure_diastolic IS NULL) OR
        (blood_pressure_systolic BETWEEN 60 AND 250 AND blood_pressure_diastolic BETWEEN 30 AND 150)
    ),
    CONSTRAINT valid_heart_rate CHECK (heart_rate IS NULL OR (heart_rate BETWEEN 30 AND 220)),
    CONSTRAINT valid_respiratory_rate CHECK (respiratory_rate IS NULL OR (respiratory_rate BETWEEN 8 AND 50)),
    CONSTRAINT valid_oxygen_saturation CHECK (oxygen_saturation IS NULL OR (oxygen_saturation BETWEEN 70.0 AND 100.0)),
    CONSTRAINT valid_pain_level CHECK (pain_level IS NULL OR (pain_level BETWEEN 0 AND 10))
);

-- ===============================================
-- PRESCRIPTIONS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id),
    doctor_note_id UUID REFERENCES doctor_notes(id) ON DELETE SET NULL,
    medication_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration VARCHAR(100),
    quantity INTEGER,
    refills INTEGER DEFAULT 0,
    instructions TEXT,
    status VARCHAR(20) DEFAULT 'active',
    prescribed_date TIMESTAMPTZ DEFAULT NOW(),
    start_date DATE,
    end_date DATE,
    -- Enhanced prescription fields
    medication_category VARCHAR(100),
    route_of_administration VARCHAR(50),
    is_current BOOLEAN DEFAULT true,
    discontinued_date DATE,
    discontinued_by UUID REFERENCES users(id),
    discontinuation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (status IN ('active', 'completed', 'cancelled', 'expired')),
    CONSTRAINT valid_refills CHECK (refills >= 0 AND refills <= 12),
    CONSTRAINT valid_quantity CHECK (quantity IS NULL OR quantity > 0),
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

-- ===============================================
-- DOCTOR NOTES TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS doctor_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id),
    note_type VARCHAR(50),
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_note_type CHECK (note_type IN ('assessment', 'plan', 'observation', 'follow_up', 'general'))
);

-- ===============================================
-- MEDICAL DOCUMENTS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS medical_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100),
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    description TEXT,
    is_confidential BOOLEAN DEFAULT false,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_file_size CHECK (file_size IS NULL OR file_size > 0)
);

-- ===============================================
-- AUDIT LOGS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES users(id), -- NULL indicates system-generated events
    actor_role VARCHAR(50),
    status VARCHAR(20) DEFAULT 'success',
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_action CHECK (action IN (
        -- Existing values from database
        'ACTIVATE', 'CREATE', 'DEACTIVATE', 'DELETE', 
        'LOGIN_FAILURE', 'LOGIN_SUCCESS', 'LOGOUT', 'UPDATE', 'VIEW',
        -- Future values for new features
        'INSERT', 'LOGIN', 'LOGIN_FAILED', 'EXPORT', 'DOWNLOAD',
        'ADMIN.OVERRIDE', 'ADMIN.RESTORE',
        'USER.CREATE', 'USER.UPDATE', 'USER.DELETE',
        'UPDATE_ROLE', 'GRANT_ACCESS', 'REVOKE_ACCESS',
        'ACCESS', 'MODIFY', 'READ',
        -- Invoice-specific actions
        'INVOICE.CREATE', 'INVOICE.COMPLETE', 'INVOICE.CANCEL', 'INVOICE.PAYMENT',
        -- Payment-specific actions
        'PAYMENT.RECORD',
        -- Token-specific actions
        'TOKEN.MISSED_AUTO', 'TOKEN.CANCELLED_DOCTOR_UNAVAILABLE'
    )),
    CONSTRAINT valid_status CHECK (status IN ('success', 'failed', 'denied', 'warning'))
);

-- Add comments for audit_logs columns
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action. NULL indicates system-generated events or automated processes.';
COMMENT ON COLUMN audit_logs.actor_role IS 'Role of the user who performed the action (admin, doctor, nurse, etc.)';
COMMENT ON COLUMN audit_logs.status IS 'Outcome of the action: success, failed, denied, or warning';
COMMENT ON COLUMN audit_logs.reason IS 'Optional context or reason for the action (especially for overrides, deletions, access changes)';

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_role ON audit_logs(actor_role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_status ON audit_logs(action, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);


-- ===============================================
-- DOCTOR AVAILABILITY TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS doctor_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_day_of_week CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    UNIQUE(doctor_id, day_of_week, start_time, end_time)
);

-- ===============================================
-- QUEUE TOKENS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS queue_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token_number INTEGER NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    visit_id UUID REFERENCES visits(id) ON DELETE RESTRICT,
    issued_date DATE DEFAULT CURRENT_DATE,
    issued_time TIMESTAMPTZ DEFAULT NOW(),
    -- Queue lifecycle
    status VARCHAR(20) DEFAULT 'waiting', -- waiting|called|serving|completed|missed|cancelled|delayed
    priority INTEGER DEFAULT 1,
    estimated_wait_time INTEGER DEFAULT 7, -- minutes patient has to arrive
    -- Extended lifecycle timestamps (alignment with scheduling and consult)
    checkin_time TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    called_at TIMESTAMPTZ,
    served_at TIMESTAMPTZ,
    in_consult_at TIMESTAMPTZ,
    done_at TIMESTAMPTZ,
    late_at TIMESTAMPTZ,
    consult_expected_minutes INTEGER DEFAULT 15, -- target consult duration
    -- Delay tracking fields
    delay_reason TEXT, -- reason why patient was delayed
    delayed_at TIMESTAMPTZ, -- timestamp when patient was marked as delayed
    undelayed_at TIMESTAMPTZ, -- timestamp when patient was undelayed
    previous_status VARCHAR(20), -- status before being delayed
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_token_status CHECK (status IN ('waiting', 'called', 'serving', 'completed', 'missed', 'cancelled', 'delayed')),
    CONSTRAINT valid_priority CHECK (priority >= 1 AND priority <= 5),
    CONSTRAINT valid_token_number CHECK (token_number > 0),
    UNIQUE(doctor_id, issued_date, token_number)
);

-- NOTE: All queue_tokens columns are already in table definition above
-- This DO block kept for idempotency on existing databases

-- ===============================================
-- CLINIC SETTINGS (global thresholds)
-- ===============================================
CREATE TABLE IF NOT EXISTS clinic_settings (
    key TEXT PRIMARY KEY,
    late_threshold_minutes INTEGER NOT NULL DEFAULT 7,     -- minutes before marking late/no-show
    consult_expected_minutes INTEGER NOT NULL DEFAULT 15,  -- target consult length in minutes
    clinic_name TEXT,                                      -- clinic name
    clinic_logo_url TEXT,                                  -- URL to clinic logo (Supabase Storage public URL)
    clinic_phone TEXT,                                     -- clinic phone number
    clinic_email TEXT,                                     -- clinic email address
    clinic_address TEXT,                                   -- clinic physical address
    currency_code TEXT DEFAULT 'USD',                      -- ISO currency code (USD, MMK, etc.)
    currency_symbol TEXT DEFAULT '$',                      -- currency symbol ($, K, etc.)
    payment_qr_code_url TEXT,                              -- URL to payment QR code image (Supabase Storage public URL)
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure the single global row exists
INSERT INTO clinic_settings (key)
VALUES ('global')
ON CONFLICT (key) DO NOTHING;

-- ===============================================
-- INDEXES FOR PERFORMANCE
-- ===============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_patient_id ON users(patient_id);

-- Ensure one portal account per patient
CREATE UNIQUE INDEX IF NOT EXISTS uniq_patient_portal_per_patient
  ON users(patient_id)
  WHERE role = 'patient' AND patient_id IS NOT NULL;

-- Patients indexes
CREATE INDEX IF NOT EXISTS idx_patients_patient_number ON patients(patient_number);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_active ON patients(is_active);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Visits indexes
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_doctor_id ON visits(doctor_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);

-- Unique index: One active visit per patient (Stage 5 Phase B)
CREATE UNIQUE INDEX IF NOT EXISTS visits_one_active_per_patient
ON visits(patient_id)
WHERE status = 'in_progress';

-- Vitals indexes
CREATE INDEX IF NOT EXISTS idx_vitals_visit_id ON vitals(visit_id);
CREATE INDEX IF NOT EXISTS idx_vitals_patient_id ON vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_vitals_recorded_at ON vitals(recorded_at);

-- Prescriptions indexes
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_note_id ON prescriptions(doctor_note_id);

-- Doctor Availability indexes
CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor_id ON doctor_availability(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_day ON doctor_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_active ON doctor_availability(is_active);

-- Queue Tokens indexes
CREATE INDEX IF NOT EXISTS idx_queue_tokens_patient_id ON queue_tokens(patient_id);
CREATE INDEX IF NOT EXISTS idx_queue_tokens_doctor_id ON queue_tokens(doctor_id);
CREATE INDEX IF NOT EXISTS idx_queue_tokens_date ON queue_tokens(issued_date);
CREATE INDEX IF NOT EXISTS idx_queue_tokens_status ON queue_tokens(status);
CREATE INDEX IF NOT EXISTS idx_queue_tokens_number ON queue_tokens(doctor_id, issued_date, token_number);
CREATE INDEX IF NOT EXISTS idx_queue_tokens_visit_id ON queue_tokens(visit_id);
-- New helpful indexes for lifecycle
CREATE INDEX IF NOT EXISTS idx_queue_tokens_doctor_status ON queue_tokens(doctor_id, status);
-- Only one active consult per doctor at a time (status = 'serving')
CREATE UNIQUE INDEX IF NOT EXISTS uq_queue_one_serving_per_doctor
    ON queue_tokens(doctor_id)
    WHERE status = 'serving';

-- ===============================================
-- HELPER FUNCTIONS
-- ===============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Auto-generate patient numbers
CREATE OR REPLACE FUNCTION generate_patient_number()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    formatted_number VARCHAR(20);
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(patient_number FROM 2) AS INTEGER)), 0) + 1
    INTO next_number
    FROM patients 
    WHERE patient_number ~ '^P[0-9]+$';
    
    formatted_number := 'P' || LPAD(next_number::TEXT, 6, '0');
    NEW.patient_number := formatted_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- BMI calculation function
CREATE OR REPLACE FUNCTION calculate_bmi()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.weight IS NOT NULL AND NEW.height IS NOT NULL AND NEW.height > 0 THEN
        DECLARE
            weight_kg DECIMAL(5,2);
            height_m DECIMAL(5,2);
        BEGIN
            weight_kg := CASE 
                WHEN NEW.weight_unit = 'lb' THEN NEW.weight * 0.453592
                ELSE NEW.weight
            END;
            
            height_m := CASE 
                WHEN NEW.height_unit = 'in' THEN NEW.height * 0.0254
                WHEN NEW.height_unit = 'ft' THEN NEW.height * 0.3048
                ELSE NEW.height / 100
            END;
            
            NEW.bmi := ROUND(weight_kg / (height_m * height_m), 1);
        END;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Auto-generate queue token numbers
-- ===============================================
-- Atomic function to start consultation with advisory lock
-- Prevents race conditions when multiple requests try to start consultations
-- for the same doctor simultaneously
-- ===============================================
CREATE OR REPLACE FUNCTION start_consultation_atomic(
  p_token_id UUID,
  p_doctor_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  token_data JSONB
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_token_record RECORD;
  v_existing_serving_token RECORD;
  v_updated_token RECORD;
  v_lock_key BIGINT;
BEGIN
  -- Generate a unique lock key based on doctor_id
  -- Using pg_advisory_lock with doctor_id hash to ensure only one consultation
  -- can be started per doctor at a time
  -- Use hashtext to convert UUID to bigint for advisory lock
  v_lock_key := abs(hashtext(p_doctor_id::TEXT))::bigint;
  
  -- Acquire advisory lock (blocks until lock is available)
  PERFORM pg_advisory_xact_lock(v_lock_key);
  
  -- Now we have exclusive access to this doctor's consultation state
  -- Check if token exists and is in 'called' status
  SELECT * INTO v_token_record
  FROM queue_tokens
  WHERE id = p_token_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Token not found'::TEXT, NULL::JSONB;
    RETURN;
  END IF;
  
  IF v_token_record.status != 'called' THEN
    RETURN QUERY SELECT 
      FALSE, 
      format('Token status is ''%s'' but should be ''called''', v_token_record.status)::TEXT,
      NULL::JSONB;
    RETURN;
  END IF;
  
  -- Check if doctor already has a serving token (with date filter for today)
  SELECT * INTO v_existing_serving_token
  FROM queue_tokens
  WHERE doctor_id = p_doctor_id
    AND status = 'serving'
    AND issued_date = CURRENT_DATE
  LIMIT 1;
  
  IF FOUND THEN
    RETURN QUERY SELECT 
      FALSE,
      format('Doctor already has a patient in consultation (Token #%s)', v_existing_serving_token.token_number)::TEXT,
      NULL::JSONB;
    RETURN;
  END IF;
  
  -- Update token status to 'serving' atomically
  UPDATE queue_tokens
  SET 
    status = 'serving',
    served_at = NOW(),
    in_consult_at = NOW(),
    updated_at = NOW()
  WHERE id = p_token_id
    AND status = 'called'  -- Double-check status hasn't changed
  RETURNING * INTO v_updated_token;
  
  IF NOT FOUND THEN
    -- Token status changed between check and update (shouldn't happen with lock, but safety check)
    RETURN QUERY SELECT FALSE, 'Token status changed during update'::TEXT, NULL::JSONB;
    RETURN;
  END IF;
  
  -- Success - return updated token data
  RETURN QUERY SELECT 
    TRUE,
    format('Consultation started successfully (Token #%s)', v_updated_token.token_number)::TEXT,
    to_jsonb(v_updated_token);
    
  -- Lock is automatically released when transaction ends
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION start_consultation_atomic(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION start_consultation_atomic(UUID, UUID) TO service_role;

-- Add comment
COMMENT ON FUNCTION start_consultation_atomic IS 
  'Atomically starts a consultation using advisory locks to prevent race conditions. 
   Ensures only one consultation can be started per doctor at a time.';

-- ===============================================
-- Generate token number for queue
-- ===============================================
CREATE OR REPLACE FUNCTION generate_token_number()
RETURNS TRIGGER AS $$
DECLARE
    next_token INTEGER;
BEGIN
    SELECT COALESCE(MAX(token_number), 0) + 1
    INTO next_token
    FROM queue_tokens 
    WHERE doctor_id = NEW.doctor_id 
    AND issued_date = NEW.issued_date;
    
    NEW.token_number := next_token;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- NOTE: record_payment_atomic function is defined AFTER billing tables (invoices, invoice_items, payment_transactions)

-- Function to check doctor availability
CREATE OR REPLACE FUNCTION is_doctor_available(
    p_doctor_id UUID,
    p_day_of_week VARCHAR,
    p_time TIME
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM doctor_availability 
        WHERE doctor_id = p_doctor_id 
        AND day_of_week = p_day_of_week 
        AND start_time <= p_time 
        AND end_time > p_time 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql;

-- Function to validate doctor availability (ensures only doctors can have availability records)
CREATE OR REPLACE FUNCTION validate_doctor_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the user is actually a doctor
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = NEW.doctor_id 
        AND role = 'doctor' 
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'Doctor availability can only be set for active users with doctor role';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to convert 12-hour time format to 24-hour format
CREATE OR REPLACE FUNCTION convert_12hr_to_24hr(
    p_time_str VARCHAR,
    p_am_pm VARCHAR
) RETURNS TIME AS $$
DECLARE
    time_parts TEXT[];
    hour_part INTEGER;
    minute_part INTEGER;
    result_time TIME;
BEGIN
    -- Split the time string by ':'
    time_parts := string_to_array(p_time_str, ':');
    
    -- Extract hour and minute
    hour_part := time_parts[1]::INTEGER;
    minute_part := COALESCE(time_parts[2]::INTEGER, 0);
    
    -- Validate input
    IF hour_part < 1 OR hour_part > 12 THEN
        RAISE EXCEPTION 'Hour must be between 1 and 12 for 12-hour format';
    END IF;
    
    IF minute_part < 0 OR minute_part > 59 THEN
        RAISE EXCEPTION 'Minutes must be between 0 and 59';
    END IF;
    
    -- Convert to 24-hour format
    IF UPPER(p_am_pm) = 'AM' THEN
        IF hour_part = 12 THEN
            hour_part := 0; -- 12 AM = 00:xx
        END IF;
    ELSIF UPPER(p_am_pm) = 'PM' THEN
        IF hour_part != 12 THEN
            hour_part := hour_part + 12; -- PM hours except 12 PM
        END IF;
    ELSE
        RAISE EXCEPTION 'AM/PM indicator must be either AM or PM';
    END IF;
    
    -- Create time
    result_time := make_time(hour_part, minute_part, 0);
    
    RETURN result_time;
END;
$$ LANGUAGE plpgsql;

-- Function to convert 24-hour time format to 12-hour format with AM/PM
CREATE OR REPLACE FUNCTION convert_24hr_to_12hr(p_time TIME)
RETURNS TEXT AS $$
DECLARE
    hour_24 INTEGER;
    minute_part INTEGER;
    hour_12 INTEGER;
    am_pm TEXT;
    result TEXT;
BEGIN
    -- Extract hour and minute from time
    hour_24 := EXTRACT(HOUR FROM p_time);
    minute_part := EXTRACT(MINUTE FROM p_time);
    
    -- Convert to 12-hour format
    IF hour_24 = 0 THEN
        hour_12 := 12;
        am_pm := 'AM';
    ELSIF hour_24 < 12 THEN
        hour_12 := hour_24;
        am_pm := 'AM';
    ELSIF hour_24 = 12 THEN
        hour_12 := 12;
        am_pm := 'PM';
    ELSE
        hour_12 := hour_24 - 12;
        am_pm := 'PM';
    END IF;
    
    -- Format the result
    result := hour_12::TEXT || ':' || LPAD(minute_part::TEXT, 2, '0') || ' ' || am_pm;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get all availability for a doctor in 12-hour format
CREATE OR REPLACE FUNCTION get_doctor_availability_12hr(p_doctor_id UUID)
RETURNS TABLE (
    id UUID,
    doctor_id UUID,
    day_of_week VARCHAR,
    start_time_12hr TEXT,
    end_time_12hr TEXT,
    start_time_24hr TIME,
    end_time_24hr TIME,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        da.id,
        da.doctor_id,
        da.day_of_week,
        convert_24hr_to_12hr(da.start_time) AS start_time_12hr,
        convert_24hr_to_12hr(da.end_time) AS end_time_12hr,
        da.start_time AS start_time_24hr,
        da.end_time AS end_time_24hr,
        da.is_active
    FROM doctor_availability da
    WHERE da.doctor_id = p_doctor_id
    ORDER BY 
        CASE da.day_of_week
            WHEN 'Monday' THEN 1
            WHEN 'Tuesday' THEN 2
            WHEN 'Wednesday' THEN 3
            WHEN 'Thursday' THEN 4
            WHEN 'Friday' THEN 5
            WHEN 'Saturday' THEN 6
            WHEN 'Sunday' THEN 7
        END,
        da.start_time;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- DOCTOR UNAVAILABILITY MANAGEMENT
-- ===============================================

-- Function to check if doctor is currently available (not on break, within working hours)
CREATE OR REPLACE FUNCTION is_doctor_currently_available(
    p_doctor_id UUID,
    p_check_time TIMESTAMPTZ DEFAULT NOW()
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_day VARCHAR;
    v_current_time TIME;
    v_is_available BOOLEAN;
BEGIN
    -- Get current day and time
    v_current_day := TO_CHAR(p_check_time, 'Day');
    v_current_day := TRIM(INITCAP(v_current_day)); -- Format: 'Monday', 'Tuesday', etc.
    v_current_time := p_check_time::TIME;
    
    -- Check if doctor has an active availability slot for current time
    SELECT EXISTS (
        SELECT 1
        FROM doctor_availability
        WHERE doctor_id = p_doctor_id
        AND day_of_week = v_current_day
        AND start_time <= v_current_time
        AND end_time > v_current_time
        AND is_active = true
    ) INTO v_is_available;
    
    RETURN v_is_available;
END;
$$ LANGUAGE plpgsql;

-- Function to get doctor's next available time slot for today
CREATE OR REPLACE FUNCTION get_doctor_next_available_time(
    p_doctor_id UUID,
    p_check_time TIMESTAMPTZ DEFAULT NOW()
) RETURNS TIME AS $$
DECLARE
    v_current_day VARCHAR;
    v_current_time TIME;
    v_next_start_time TIME;
BEGIN
    v_current_day := TO_CHAR(p_check_time, 'Day');
    v_current_day := TRIM(INITCAP(v_current_day));
    v_current_time := p_check_time::TIME;
    
    -- Get the next availability slot start time after current time
    SELECT start_time INTO v_next_start_time
    FROM doctor_availability
    WHERE doctor_id = p_doctor_id
    AND day_of_week = v_current_day
    AND start_time > v_current_time
    AND is_active = true
    ORDER BY start_time ASC
    LIMIT 1;
    
    RETURN v_next_start_time;
END;
$$ LANGUAGE plpgsql;

-- Function to check if doctor has any remaining availability today
CREATE OR REPLACE FUNCTION doctor_has_remaining_availability_today(
    p_doctor_id UUID,
    p_check_time TIMESTAMPTZ DEFAULT NOW()
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_day VARCHAR;
    v_current_time TIME;
    v_has_availability BOOLEAN;
BEGIN
    v_current_day := TO_CHAR(p_check_time, 'Day');
    v_current_day := TRIM(INITCAP(v_current_day));
    v_current_time := p_check_time::TIME;
    
    -- Check if there are any availability slots remaining today
    SELECT EXISTS (
        SELECT 1
        FROM doctor_availability
        WHERE doctor_id = p_doctor_id
        AND day_of_week = v_current_day
        AND end_time > v_current_time  -- Any slot that hasn't ended yet
        AND is_active = true
    ) INTO v_has_availability;
    
    RETURN v_has_availability;
END;
$$ LANGUAGE plpgsql;

-- Function to mark tokens as missed when doctor is unavailable
CREATE OR REPLACE FUNCTION mark_tokens_missed_during_unavailability(
    p_doctor_id UUID DEFAULT NULL,  -- If NULL, check all doctors
    p_check_time TIMESTAMPTZ DEFAULT NOW()
) RETURNS TABLE (
    updated_token_id UUID,
    token_number INTEGER,
    patient_name TEXT,
    reason TEXT
) AS $$
DECLARE
    token_record RECORD;
    v_is_currently_available BOOLEAN;
    v_has_more_availability BOOLEAN;
    v_next_available TIME;
    v_missed_reason TEXT;
    v_current_date DATE;
BEGIN
    v_current_date := p_check_time::DATE;
    
    -- Loop through all active tokens for the day
    FOR token_record IN
        SELECT 
            qt.id,
            qt.token_number,
            qt.doctor_id,
            qt.status,
            qt.issued_date,
            qt.visit_id,
            p.first_name || ' ' || p.last_name AS patient_name,
            u.first_name || ' ' || u.last_name AS doctor_name
        FROM queue_tokens qt
        JOIN patients p ON qt.patient_id = p.id
        JOIN users u ON qt.doctor_id = u.id
        WHERE qt.issued_date = v_current_date
        AND qt.status IN ('waiting', 'called', 'delayed')  -- Only active statuses
        AND (p_doctor_id IS NULL OR qt.doctor_id = p_doctor_id)
        AND u.is_active = true  -- Only check active doctors
    LOOP
        -- Check doctor's current availability
        v_is_currently_available := is_doctor_currently_available(
            token_record.doctor_id, 
            p_check_time
        );
        
        -- If doctor is not currently available, check if they have remaining availability
        IF NOT v_is_currently_available THEN
            v_has_more_availability := doctor_has_remaining_availability_today(
                token_record.doctor_id,
                p_check_time
            );
            
            -- Only mark as missed if doctor has NO more availability today
            -- If doctor is on break, skip this token (keep it active)
            IF NOT v_has_more_availability THEN
                -- Doctor has finished for the day - mark token as missed
                v_missed_reason := 'Doctor ' || token_record.doctor_name || 
                    ' has finished for the day. No remaining availability.';
            ELSE
                -- Doctor is on break - keep token active, skip to next token
                CONTINUE;
            END IF;
            
            -- Update token status to missed (only reached if doctor finished for day)
            UPDATE queue_tokens
            SET 
                status = 'missed',
                updated_at = p_check_time,
                previous_status = token_record.status,
                delay_reason = v_missed_reason
            WHERE id = token_record.id;
            
            -- Update related visit if exists
            IF token_record.visit_id IS NOT NULL THEN
                UPDATE visits
                SET 
                    status = 'cancelled',
                    updated_at = p_check_time
                WHERE id = token_record.visit_id
                AND status = 'in_progress';
            END IF;
            
            -- Log audit event
            INSERT INTO audit_logs (
                action,
                table_name,
                record_id,
                user_id,
                new_values
            ) VALUES (
                'TOKEN.MISSED_AUTO',
                'queue_tokens',
                token_record.id,
                NULL,  -- System action
                jsonb_build_object(
                    'token_number', token_record.token_number,
                    'doctor_id', token_record.doctor_id,
                    'doctor_name', token_record.doctor_name,
                    'patient_name', token_record.patient_name,
                    'reason', v_missed_reason,
                    'previous_status', token_record.status,
                    'auto_marked_at', p_check_time
                )
            );
            
            -- Return updated token info
            RETURN QUERY SELECT 
                token_record.id,
                token_record.token_number,
                token_record.patient_name,
                v_missed_reason;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to manually mark all waiting tokens as missed for a specific doctor
CREATE OR REPLACE FUNCTION cancel_doctor_remaining_tokens(
    p_doctor_id UUID,
    p_reason TEXT DEFAULT 'Doctor unavailable for the rest of the day',
    p_performed_by UUID DEFAULT NULL
) RETURNS TABLE (
    cancelled_token_id UUID,
    token_number INTEGER,
    patient_name TEXT
) AS $$
DECLARE
    token_record RECORD;
    v_current_date DATE;
BEGIN
    v_current_date := CURRENT_DATE;
    
    -- Update all active tokens for the doctor today
    FOR token_record IN
        SELECT 
            qt.id,
            qt.token_number,
            qt.visit_id,
            p.first_name || ' ' || p.last_name AS patient_name
        FROM queue_tokens qt
        JOIN patients p ON qt.patient_id = p.id
        WHERE qt.doctor_id = p_doctor_id
        AND qt.issued_date = v_current_date
        AND qt.status IN ('waiting', 'called', 'delayed')
    LOOP
        -- Update token to missed
        UPDATE queue_tokens
        SET 
            status = 'missed',
            updated_at = NOW(),
            delay_reason = p_reason
        WHERE id = token_record.id;
        
        -- Update related visit if exists
        IF token_record.visit_id IS NOT NULL THEN
            UPDATE visits
            SET 
                status = 'cancelled',
                updated_at = NOW()
            WHERE id = token_record.visit_id
            AND status = 'in_progress';
        END IF;
        
        -- Log audit event
        INSERT INTO audit_logs (
            action,
            table_name,
            record_id,
            user_id,
            new_values
        ) VALUES (
            'TOKEN.CANCELLED_DOCTOR_UNAVAILABLE',
            'queue_tokens',
            token_record.id,
            p_performed_by,
            jsonb_build_object(
                'token_number', token_record.token_number,
                'doctor_id', p_doctor_id,
                'patient_name', token_record.patient_name,
                'reason', p_reason,
                'cancelled_at', NOW()
            )
        );
        
        RETURN QUERY SELECT 
            token_record.id,
            token_record.token_number,
            token_record.patient_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- TRIGGERS
-- ===============================================

-- Update timestamp triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_visits_updated_at ON visits;
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prescriptions_updated_at ON prescriptions;
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_doctor_notes_updated_at ON doctor_notes;
CREATE TRIGGER update_doctor_notes_updated_at BEFORE UPDATE ON doctor_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_doctor_availability_updated_at ON doctor_availability;
CREATE TRIGGER update_doctor_availability_updated_at BEFORE UPDATE ON doctor_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_queue_tokens_updated_at ON queue_tokens;
CREATE TRIGGER update_queue_tokens_updated_at BEFORE UPDATE ON queue_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate patient numbers
DROP TRIGGER IF EXISTS auto_generate_patient_number ON patients;
CREATE TRIGGER auto_generate_patient_number
    BEFORE INSERT ON patients
    FOR EACH ROW
    WHEN (NEW.patient_number IS NULL OR NEW.patient_number = '')
    EXECUTE FUNCTION generate_patient_number();

-- Auto-calculate BMI
DROP TRIGGER IF EXISTS calculate_vitals_bmi ON vitals;
CREATE TRIGGER calculate_vitals_bmi 
    BEFORE INSERT OR UPDATE ON vitals 
    FOR EACH ROW 
    EXECUTE FUNCTION calculate_bmi();

-- Auto-generate token numbers
DROP TRIGGER IF EXISTS auto_generate_token_number ON queue_tokens;
CREATE TRIGGER auto_generate_token_number
    BEFORE INSERT ON queue_tokens
    FOR EACH ROW
    WHEN (NEW.token_number IS NULL OR NEW.token_number = 0)
    EXECUTE FUNCTION generate_token_number();

-- Validate doctor role for availability
DROP TRIGGER IF EXISTS validate_doctor_availability_trigger ON doctor_availability;
CREATE TRIGGER validate_doctor_availability_trigger
    BEFORE INSERT OR UPDATE ON doctor_availability
    FOR EACH ROW
    EXECUTE FUNCTION validate_doctor_availability();

-- ===============================================
-- ROW LEVEL SECURITY (RLS)
-- ===============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_tokens ENABLE ROW LEVEL SECURITY;
-- NOTE: appointment_queue table was removed (replaced by queue_tokens with visit_id)
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

-- Basic policies (can be customized later)
DROP POLICY IF EXISTS "Healthcare staff can access all data" ON users;
CREATE POLICY "Healthcare staff can access all data" ON users FOR ALL USING (true);

DROP POLICY IF EXISTS "Healthcare staff can access all data" ON patients;
CREATE POLICY "Healthcare staff can access all data" ON patients FOR ALL USING (true);

DROP POLICY IF EXISTS "Healthcare staff can access all data" ON appointments;
CREATE POLICY "Healthcare staff can access all data" ON appointments FOR ALL USING (true);

DROP POLICY IF EXISTS "Healthcare staff can access all data" ON visits;
CREATE POLICY "Healthcare staff can access all data" ON visits FOR ALL USING (true);

DROP POLICY IF EXISTS "Healthcare staff can access all data" ON vitals;
CREATE POLICY "Healthcare staff can access all data" ON vitals FOR ALL USING (true);

DROP POLICY IF EXISTS "Healthcare staff can access all data" ON prescriptions;
CREATE POLICY "Healthcare staff can access all data" ON prescriptions FOR ALL USING (true);

DROP POLICY IF EXISTS "Healthcare staff can access all data" ON doctor_notes;
CREATE POLICY "Healthcare staff can access all data" ON doctor_notes FOR ALL USING (true);

DROP POLICY IF EXISTS "Healthcare staff can access all data" ON medical_documents;
CREATE POLICY "Healthcare staff can access all data" ON medical_documents FOR ALL USING (true);

DROP POLICY IF EXISTS "Admins can access audit logs" ON audit_logs;
CREATE POLICY "Admins can access audit logs" ON audit_logs FOR ALL USING (true);

DROP POLICY IF EXISTS "Healthcare staff can access all data" ON doctor_availability;
CREATE POLICY "Healthcare staff can access all data" ON doctor_availability FOR ALL USING (true);

DROP POLICY IF EXISTS "Healthcare staff can access all data" ON queue_tokens;
CREATE POLICY "Healthcare staff can access all data" ON queue_tokens FOR ALL USING (true);

DROP POLICY IF EXISTS "Healthcare staff can access all data" ON clinic_settings;
CREATE POLICY "Healthcare staff can access all data" ON clinic_settings FOR ALL USING (true);

-- ===============================================
-- COMPLETION MESSAGE
-- ===============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 RealCIS Database Schema Created Successfully!';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Tables Created:';
    RAISE NOTICE '   • users (admin, doctors, nurses, receptionists)';
    RAISE NOTICE '   • patients (demographics and medical history)';
    RAISE NOTICE '   • appointments (scheduling)';
    RAISE NOTICE '   • visits (medical encounters)';
    RAISE NOTICE '   • vitals (measurements and vital signs)';
    RAISE NOTICE '   • prescriptions (medications)';
    RAISE NOTICE '   • doctor_notes (clinical notes)';
    RAISE NOTICE '   • medical_documents (file uploads)';
    RAISE NOTICE '   • audit_logs (security tracking)';
    RAISE NOTICE '   • doctor_availability (doctor schedules)';
    RAISE NOTICE '   • queue_tokens (patient queue management)';
    RAISE NOTICE '   • patient_allergies (allergy tracking)';
    RAISE NOTICE '   • patient_diagnoses (diagnosis tracking)';
    RAISE NOTICE '   • patient_documents (document storage)';
    RAISE NOTICE '   • services (billable services)';
    RAISE NOTICE '   • invoices (billing)';
    RAISE NOTICE '   • invoice_items (line items)';
    RAISE NOTICE '   • payment_transactions (payments)';
    RAISE NOTICE '   • notifications (user notifications)';
    RAISE NOTICE '   • clinic_settings (global settings)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Helper Functions:';
    RAISE NOTICE '   • convert_12hr_to_24hr(time_str, am_pm)';
    RAISE NOTICE '   • convert_24hr_to_12hr(time)';
    RAISE NOTICE '   • get_doctor_availability_12hr(doctor_id)';
    RAISE NOTICE '   • generate_patient_number()';
    RAISE NOTICE '   • generate_token_number()';
    RAISE NOTICE '   • generate_invoice_number()';
    RAISE NOTICE '   • start_consultation_atomic(token_id, doctor_id)';
    RAISE NOTICE '   • record_payment_atomic(...)';
    RAISE NOTICE '   • calculate_bmi()';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Views Created:';
    RAISE NOTICE '   • active_patient_allergies';
    RAISE NOTICE '   • active_patient_diagnoses';
    RAISE NOTICE '   • current_patient_medications';
    RAISE NOTICE '   • outstanding_invoices';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Next Steps:';
    RAISE NOTICE '   1. Create your first admin user via API or direct INSERT';
    RAISE NOTICE '   2. Start backend server: npm run dev';
    RAISE NOTICE '   3. Test API endpoints at http://localhost:5000';
    RAISE NOTICE '';
    RAISE NOTICE 'Happy coding! 🏥✨';
END $$;

-- ===============================================
-- EMR ENHANCEMENTS MIGRATION
-- Adds dedicated tables for allergies and diagnoses
-- Enhances prescriptions table
-- Run this in Supabase SQL Editor
-- ===============================================

-- ===============================================
-- PATIENT ALLERGIES TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS patient_allergies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,
    
    -- Allergy details
    allergy_name VARCHAR(200) NOT NULL,
    allergen_type VARCHAR(50), -- medication, food, environmental, other
    severity VARCHAR(20), -- mild, moderate, severe, life-threatening
    reaction TEXT, -- description of reaction (e.g., "rash", "anaphylaxis")
    
    -- Clinical tracking
    diagnosed_date DATE,
    diagnosed_by UUID REFERENCES users(id),
    verified_date DATE,
    verified_by UUID REFERENCES users(id),
    
    -- Status and notes
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT valid_allergen_type CHECK (
        allergen_type IN ('medication', 'food', 'environmental', 'latex', 'insect', 'animal', 'other')
    ),
    CONSTRAINT valid_severity CHECK (
        severity IN ('mild', 'moderate', 'severe', 'life-threatening')
    )
);

-- Indexes for patient allergies
CREATE INDEX IF NOT EXISTS idx_patient_allergies_patient_id ON patient_allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_active ON patient_allergies(is_active);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_severity ON patient_allergies(severity);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_name ON patient_allergies(allergy_name);

-- ===============================================
-- PATIENT DIAGNOSES TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS patient_diagnoses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,
    diagnosed_by UUID NOT NULL REFERENCES users(id),
    
    -- Diagnosis information
    diagnosis_code VARCHAR(20), -- ICD-10 code
    icd_10_code VARCHAR(20), -- ICD-10 diagnostic code
    diagnosis_name VARCHAR(500) NOT NULL,
    diagnosis_type VARCHAR(50), -- primary, secondary, differential, rule_out
    category VARCHAR(50) DEFAULT 'primary', -- primary, secondary, comorbidity, rule-out, working, differential
    
    -- Clinical details
    severity VARCHAR(20), -- mild, moderate, severe, critical
    status VARCHAR(20) DEFAULT 'active', -- active, resolved, chronic, in_remission, recurring
    
    -- Date tracking
    diagnosed_date DATE NOT NULL,
    diagnosis_date TIMESTAMPTZ DEFAULT NOW(), -- Date when the diagnosis was made
    onset_date DATE, -- when symptoms started
    resolved_date DATE, -- when condition was resolved
    
    -- Clinical notes
    notes TEXT,
    symptoms TEXT,
    treatment_plan TEXT,
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT valid_diagnosis_type CHECK (
        diagnosis_type IN ('primary', 'secondary', 'differential', 'rule_out', 'chronic', 'acute')
    ),
    CONSTRAINT valid_severity CHECK (
        severity IN ('mild', 'moderate', 'severe', 'critical')
    ),
    CONSTRAINT valid_status CHECK (
        status IN ('active', 'resolved', 'chronic', 'in_remission', 'recurring', 'ruled_out')
    ),
    CONSTRAINT valid_date_order CHECK (
        resolved_date IS NULL OR 
        onset_date IS NULL OR 
        resolved_date >= onset_date
    )
);

-- Indexes for patient diagnoses
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_patient_id ON patient_diagnoses(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_visit ON patient_diagnoses(visit_id);
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_status ON patient_diagnoses(status);
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_date ON patient_diagnoses(diagnosed_date);
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_code ON patient_diagnoses(diagnosis_code);
CREATE INDEX IF NOT EXISTS idx_patient_diagnoses_doctor ON patient_diagnoses(diagnosed_by);

-- ===============================================
-- PATIENT DOCUMENTS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS patient_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Document metadata
    document_type VARCHAR(50) DEFAULT 'other',
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT,
    file_size INTEGER,
    file_type VARCHAR(100),
    
    -- Upload tracking
    uploaded_by UUID REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_document_type CHECK (
        document_type IN ('lab_result', 'x_ray', 'prescription', 'medical_report', 'consent_form', 'insurance', 'other')
    )
);

-- Indexes for patient documents
CREATE INDEX IF NOT EXISTS idx_patient_documents_patient_id ON patient_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_documents_created_at ON patient_documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_documents_type ON patient_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_patient_documents_uploader ON patient_documents(uploaded_by);

COMMENT ON TABLE patient_documents IS 'Stores metadata for patient documents uploaded to Supabase Storage';
COMMENT ON COLUMN patient_documents.document_type IS 'Type of document: lab_result, x_ray, prescription, medical_report, consent_form, insurance, other';
COMMENT ON COLUMN patient_documents.file_path IS 'Path in Supabase Storage';
COMMENT ON COLUMN patient_documents.file_url IS 'Public URL to access the document';

-- NOTE: All enhanced prescription fields are already in prescriptions table definition above
-- This section kept for idempotency on existing databases

-- Add indexes for enhanced prescription fields
CREATE INDEX IF NOT EXISTS idx_prescriptions_current ON prescriptions(is_current);
CREATE INDEX IF NOT EXISTS idx_prescriptions_category ON prescriptions(medication_category);
CREATE INDEX IF NOT EXISTS idx_prescriptions_route ON prescriptions(route_of_administration);

-- ===============================================
-- UPDATE FUNCTIONS
-- ===============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to patient_allergies
DROP TRIGGER IF EXISTS update_patient_allergies_updated_at ON patient_allergies;
CREATE TRIGGER update_patient_allergies_updated_at
    BEFORE UPDATE ON patient_allergies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to patient_diagnoses
DROP TRIGGER IF EXISTS update_patient_diagnoses_updated_at ON patient_diagnoses;
CREATE TRIGGER update_patient_diagnoses_updated_at
    BEFORE UPDATE ON patient_diagnoses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===============================================

-- Enable RLS on new tables
ALTER TABLE patient_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_diagnoses ENABLE ROW LEVEL SECURITY;

-- Patient Allergies Policies (using simple true for PostgreSQL compatibility)
-- Note: Authorization is handled at application layer
DROP POLICY IF EXISTS "Allow authenticated users to read allergies" ON patient_allergies;
CREATE POLICY "Healthcare staff can access allergies" ON patient_allergies FOR ALL USING (true);

-- Patient Diagnoses Policies
DROP POLICY IF EXISTS "Allow authenticated users to read diagnoses" ON patient_diagnoses;
CREATE POLICY "Healthcare staff can access diagnoses" ON patient_diagnoses FOR ALL USING (true);

-- Patient Documents Policies
-- Enable RLS on patient_documents
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read documents" ON patient_documents;
CREATE POLICY "Healthcare staff can access documents" ON patient_documents FOR ALL USING (true);

-- ===============================================
-- HELPER VIEWS
-- ===============================================

-- View for active patient allergies
CREATE OR REPLACE VIEW active_patient_allergies AS
SELECT 
    pa.*,
    p.first_name || ' ' || p.last_name AS patient_name,
    p.patient_number,
    u.first_name || ' ' || u.last_name AS diagnosed_by_name
FROM patient_allergies pa
JOIN patients p ON pa.patient_id = p.id
LEFT JOIN users u ON pa.diagnosed_by = u.id
WHERE pa.is_active = true
  AND pa.deleted_at IS NULL;

-- View for active patient diagnoses
CREATE OR REPLACE VIEW active_patient_diagnoses AS
SELECT 
    pd.*,
    p.first_name || ' ' || p.last_name AS patient_name,
    p.patient_number,
    u.first_name || ' ' || u.last_name AS diagnosed_by_name
FROM patient_diagnoses pd
JOIN patients p ON pd.patient_id = p.id
LEFT JOIN users u ON pd.diagnosed_by = u.id
WHERE pd.status IN ('active', 'chronic')
  AND pd.deleted_at IS NULL;

-- View for current medications
CREATE OR REPLACE VIEW current_patient_medications AS
SELECT 
    pr.*,
    p.first_name || ' ' || p.last_name AS patient_name,
    p.patient_number,
    u.first_name || ' ' || u.last_name AS prescribed_by_name
FROM prescriptions pr
JOIN patients p ON pr.patient_id = p.id
LEFT JOIN users u ON pr.doctor_id = u.id
WHERE pr.is_current = true
  AND pr.status = 'active';

-- ===============================================
-- ADDITIONAL INDEXES
-- ===============================================

-- Migration: Add visit_id to queue_tokens table
-- Purpose: Link each queue token to its specific visit for proper vitals tracking
-- Date: 2025-10-15

-- NOTE: visit_id is already in queue_tokens table definition above
CREATE INDEX IF NOT EXISTS idx_queue_tokens_visit_id ON queue_tokens(visit_id);

-- NOTE: visit_start_time and visit_end_time are already in visits table definition above
CREATE INDEX IF NOT EXISTS idx_visits_start_time ON visits(visit_start_time);
CREATE INDEX IF NOT EXISTS idx_visits_end_time ON visits(visit_end_time);

-- NOTE: visit_id is already in patient_allergies table definition above
CREATE INDEX IF NOT EXISTS idx_patient_allergies_visit_id ON patient_allergies(visit_id);

-- Add comment
COMMENT ON COLUMN patient_allergies.visit_id IS 'Links the allergy to the specific visit when it was recorded';

-- NOTE: category and diagnosis_date are already in patient_diagnoses table definition above
COMMENT ON COLUMN patient_diagnoses.category IS 'Category of diagnosis: primary, secondary, comorbidity, rule-out, working, differential';
COMMENT ON COLUMN patient_diagnoses.diagnosis_date IS 'Date when the diagnosis was made';
COMMENT ON COLUMN patient_diagnoses.icd_10_code IS 'ICD-10 diagnostic code';

-- ===============================================
-- PURCHASING/BILLING SYSTEM - New Tables
-- Run this SQL in your Supabase SQL Editor
-- ===============================================

-- ===============================================
-- SERVICES TABLE
-- Available services that can be billed (consultations, procedures, tests, etc.)
-- ===============================================
CREATE TABLE IF NOT EXISTS services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_code VARCHAR(20) UNIQUE NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- consultation, procedure, laboratory, imaging, other
    default_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_category CHECK (category IN ('consultation', 'procedure', 'laboratory', 'imaging', 'pharmacy', 'other'))
);

-- ===============================================
-- INVOICES TABLE
-- Main invoice/bill for each visit
-- ===============================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    visit_id UUID NOT NULL UNIQUE REFERENCES visits(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Financial details
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(10, 2) DEFAULT 0.00,
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    balance_due DECIMAL(10, 2) DEFAULT 0,
    
    -- Payment holds
    on_hold BOOLEAN DEFAULT false,
    hold_reason TEXT,
    hold_date TIMESTAMPTZ,
    payment_due_date DATE,
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'pending', -- draft, pending, partial_paid, paid, cancelled, refunded
    payment_method VARCHAR(50), -- cash, card, insurance, mobile_payment
    payment_notes TEXT,
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_by UUID REFERENCES users(id), -- cashier who completed
    completed_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES users(id),
    cancelled_at TIMESTAMPTZ,
    cancelled_reason TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_by_admin BOOLEAN DEFAULT false,
    resolved_reason TEXT,
    
    -- Optimistic locking for concurrent edit prevention
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Outstanding balance inclusion flag
    include_outstanding_balance BOOLEAN DEFAULT false,
    
    CONSTRAINT valid_invoice_status CHECK (status IN ('draft', 'pending', 'partial_paid', 'paid', 'cancelled', 'refunded')),
    CONSTRAINT valid_payment_method CHECK (payment_method IN ('cash', 'online_payment', 'mixed'))
);

-- ===============================================
-- INVOICE ITEMS TABLE
-- Individual line items on an invoice (services, medicines, etc.)
-- ===============================================
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Item details
    item_type VARCHAR(20) NOT NULL, -- service, medicine, other
    item_id UUID, -- Reference to service_id or prescription_id
    item_name VARCHAR(255) NOT NULL,
    item_description TEXT,
    
    -- Pricing
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    
    -- Metadata
    added_by UUID REFERENCES users(id), -- doctor or cashier who added
    added_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    
    CONSTRAINT valid_item_type CHECK (item_type IN ('service', 'medicine', 'other'))
);

-- ===============================================
-- PAYMENT TRANSACTIONS TABLE
-- Track individual payments made against an invoice
-- ===============================================
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Payment details
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(100), -- receipt number, transaction ID, etc.
    payment_notes TEXT,
    
    -- Audit (both received_by and processed_by for compatibility)
    received_by UUID REFERENCES users(id), -- cashier (legacy field)
    received_at TIMESTAMPTZ DEFAULT NOW(), -- legacy field
    processed_by UUID REFERENCES users(id), -- cashier (new field)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_payment_method_tx CHECK (payment_method IN ('cash', 'online_payment'))
);

-- ===============================================
-- NOTE: Medicine Inventory - NOT IMPLEMENTED
-- Medicine prices will be manually entered by cashier
-- No inventory tracking per user requirement
-- ===============================================

-- ===============================================
-- INDEXES for Performance
-- ===============================================
-- Unique index: One invoice per visit (prevents duplicate invoices)
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoices_one_per_visit ON invoices(visit_id);
CREATE INDEX IF NOT EXISTS idx_queue_tokens_visit_id_billing ON queue_tokens(visit_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice_id ON payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

-- ===============================================
-- TRIGGERS for updated_at (Billing Tables)
-- ===============================================
DO $$
BEGIN
    -- Create trigger for services table
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_services_updated_at') THEN
        CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Create trigger for invoices table
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_invoices_updated_at') THEN
        CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ===============================================
-- Atomic function to record payment with advisory lock
-- Prevents race conditions when multiple payments are recorded simultaneously
-- for the same invoice
-- ===============================================
CREATE OR REPLACE FUNCTION record_payment_atomic(
  p_invoice_id UUID,
  p_amount DECIMAL(10,2),
  p_payment_method VARCHAR(50),
  p_payment_reference TEXT,
  p_payment_notes TEXT,
  p_received_by UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  payment_data JSONB,
  invoice_data JSONB
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_invoice_record RECORD;
  v_payment_record RECORD;
  v_lock_key BIGINT;
  v_total_paid DECIMAL(10,2);
  v_new_balance DECIMAL(10,2);
  v_subtotal DECIMAL(10,2);
  v_discount DECIMAL(10,2);
  v_tax DECIMAL(10,2);
  v_total_amount DECIMAL(10,2);
BEGIN
  -- Generate a unique lock key based on invoice_id
  -- Using pg_advisory_lock to ensure only one payment can be recorded
  -- per invoice at a time
  v_lock_key := abs(hashtext(p_invoice_id::TEXT))::bigint;
  
  -- Acquire advisory lock (blocks until lock is available)
  PERFORM pg_advisory_xact_lock(v_lock_key);
  
  -- Now we have exclusive access to this invoice
  -- Get current invoice state
  SELECT * INTO v_invoice_record
  FROM invoices
  WHERE id = p_invoice_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Invoice not found'::TEXT, NULL::JSONB, NULL::JSONB;
    RETURN;
  END IF;
  
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN QUERY SELECT FALSE, 'Payment amount must be greater than 0'::TEXT, NULL::JSONB, NULL::JSONB;
    RETURN;
  END IF;
  
  -- Calculate invoice totals from items (atomic calculation)
  SELECT COALESCE(SUM(total_price), 0) INTO v_subtotal
  FROM invoice_items
  WHERE invoice_id = p_invoice_id;
  
  v_discount := COALESCE(v_invoice_record.discount_amount, 0);
  v_tax := COALESCE(v_invoice_record.tax_amount, 0);
  v_total_amount := v_subtotal - v_discount + v_tax;
  
  -- Get current total paid (sum of all payment transactions)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM payment_transactions
  WHERE invoice_id = p_invoice_id;
  
  -- Create payment transaction
  INSERT INTO payment_transactions (
    invoice_id,
    amount,
    payment_method,
    payment_reference,
    payment_notes,
    received_by
  )
  VALUES (
    p_invoice_id,
    p_amount,
    p_payment_method,
    p_payment_reference,
    p_payment_notes,
    p_received_by
  )
  RETURNING * INTO v_payment_record;
  
  -- Recalculate total paid (including new payment)
  v_total_paid := v_total_paid + p_amount;
  v_new_balance := v_total_amount - v_total_paid;
  
  -- Update invoice with new totals and status
  UPDATE invoices
  SET 
    subtotal = v_subtotal,
    total_amount = v_total_amount,
    amount_paid = v_total_paid,
    balance_due = v_new_balance,
    status = CASE 
      WHEN v_new_balance <= 0 THEN 'paid'
      WHEN v_total_paid > 0 THEN 'partial_paid'
      ELSE 'pending'
    END,
    -- Set completed_at and completed_by when invoice becomes fully paid
    completed_at = CASE 
      WHEN v_new_balance <= 0 AND completed_at IS NULL THEN NOW()
      ELSE completed_at
    END,
    completed_by = CASE 
      WHEN v_new_balance <= 0 AND completed_by IS NULL THEN p_received_by
      ELSE completed_by
    END,
    updated_at = NOW()
  WHERE id = p_invoice_id
  RETURNING * INTO v_invoice_record;
  
  -- Success - return payment and updated invoice data
  RETURN QUERY SELECT 
    TRUE,
    format('Payment of %s recorded successfully', p_amount)::TEXT,
    to_jsonb(v_payment_record),
    to_jsonb(v_invoice_record);
    
  -- Lock is automatically released when transaction ends
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION record_payment_atomic(UUID, DECIMAL, VARCHAR, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_payment_atomic(UUID, DECIMAL, VARCHAR, TEXT, TEXT, UUID) TO service_role;

-- Add comment
COMMENT ON FUNCTION record_payment_atomic IS 
  'Atomically records a payment and recalculates invoice totals using advisory locks. 
   Prevents race conditions when multiple payments are recorded simultaneously.';

-- ===============================================
-- FUNCTION: Increment Invoice Version (Optimistic Locking)
-- Auto-increments version when invoice data changes
-- ===============================================
CREATE OR REPLACE FUNCTION increment_invoice_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Only increment version if data actually changed (not just updated_at)
    IF (OLD.subtotal IS DISTINCT FROM NEW.subtotal) OR
       (OLD.discount_amount IS DISTINCT FROM NEW.discount_amount) OR
       (OLD.discount_percentage IS DISTINCT FROM NEW.discount_percentage) OR
       (OLD.tax_amount IS DISTINCT FROM NEW.tax_amount) OR
       (OLD.total_amount IS DISTINCT FROM NEW.total_amount) OR
       (OLD.paid_amount IS DISTINCT FROM NEW.paid_amount) OR
       (OLD.balance IS DISTINCT FROM NEW.balance) OR
       (OLD.balance_due IS DISTINCT FROM NEW.balance_due) OR
       (OLD.status IS DISTINCT FROM NEW.status) OR
       (OLD.on_hold IS DISTINCT FROM NEW.on_hold) THEN
        NEW.version = OLD.version + 1;
    ELSE
        NEW.version = OLD.version; -- Keep same version if only metadata changed
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_invoice_version
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION increment_invoice_version();

-- ===============================================
-- FUNCTION: Auto-generate Invoice Number (Atomic)
-- Uses advisory lock to prevent race conditions
-- ===============================================
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR AS $$
DECLARE
    new_number VARCHAR;
    sequence_num INTEGER;
    lock_key BIGINT;
    date_prefix VARCHAR;
BEGIN
    -- Generate date prefix: INV-YYYYMMDD
    date_prefix := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    -- Generate lock key based on current date (same date = same lock)
    lock_key := abs(hashtext(date_prefix))::bigint;
    
    -- Acquire advisory lock to prevent concurrent invoice number generation
    -- This ensures only one invoice number is generated at a time for the same date
    PERFORM pg_advisory_xact_lock(lock_key);
    
    -- Get the highest sequence number for today (atomic with lock)
    -- Extract the numeric part after the last dash
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(invoice_number FROM '(\d+)$') AS INTEGER)
    ), 0) + 1 INTO sequence_num
    FROM invoices
    WHERE DATE(created_at) = CURRENT_DATE
    AND invoice_number LIKE date_prefix || '-%';
    
    -- Format: INV-YYYYMMDD-0001
    new_number := date_prefix || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    -- Lock is automatically released when transaction ends
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- TRIGGER: Auto-generate invoice number on insert
-- ===============================================
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number();

-- ===============================================
-- FUNCTION: Update Invoice Atomic (Optimistic Locking)
-- Atomically updates invoice with version checking to prevent concurrent edit conflicts
-- ===============================================
CREATE OR REPLACE FUNCTION update_invoice_atomic(
  p_invoice_id UUID,
  p_version INTEGER,  -- Expected current version from frontend
  p_updates JSONB     -- Fields to update
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  invoice_data JSONB
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_lock_key BIGINT;
  v_current_version INTEGER;
  v_current_invoice RECORD;
  v_updated_invoice RECORD;
BEGIN
  -- Generate lock key based on invoice_id
  v_lock_key := abs(hashtext(p_invoice_id::TEXT))::bigint;
  
  -- Acquire advisory lock (blocks until lock is available)
  PERFORM pg_advisory_xact_lock(v_lock_key);
  
  -- Get current invoice state
  SELECT * INTO v_current_invoice
  FROM invoices
  WHERE id = p_invoice_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Invoice not found'::TEXT, NULL::JSONB;
    RETURN;
  END IF;
  
  -- Check version matches (optimistic locking)
  IF v_current_invoice.version != p_version THEN
    RETURN QUERY SELECT 
      FALSE, 
      format('Invoice was modified by another user. Current version: %s, Expected: %s', 
             v_current_invoice.version, p_version)::TEXT,
      to_jsonb(v_current_invoice);
    RETURN;
  END IF;
  
  -- Version matches - proceed with update
  -- Build dynamic UPDATE query from JSONB
  UPDATE invoices
  SET 
    subtotal = COALESCE((p_updates->>'subtotal')::DECIMAL, subtotal),
    discount_amount = COALESCE((p_updates->>'discount_amount')::DECIMAL, discount_amount),
    discount_percentage = COALESCE((p_updates->>'discount_percentage')::DECIMAL, discount_percentage),
    tax_amount = COALESCE((p_updates->>'tax_amount')::DECIMAL, tax_amount),
    total_amount = COALESCE((p_updates->>'total_amount')::DECIMAL, total_amount),
    paid_amount = COALESCE((p_updates->>'paid_amount')::DECIMAL, paid_amount),
    balance = COALESCE((p_updates->>'balance')::DECIMAL, balance),
    balance_due = COALESCE((p_updates->>'balance_due')::DECIMAL, balance_due),
    status = COALESCE(p_updates->>'status', status),
    on_hold = COALESCE((p_updates->>'on_hold')::BOOLEAN, on_hold),
    hold_reason = COALESCE(p_updates->>'hold_reason', hold_reason),
    payment_due_date = COALESCE((p_updates->>'payment_due_date')::DATE, payment_due_date),
    updated_at = NOW()
  WHERE id = p_invoice_id
    AND version = p_version  -- Double-check version hasn't changed
  RETURNING * INTO v_updated_invoice;
  
  IF NOT FOUND THEN
    -- Version changed between check and update (shouldn't happen with lock, but safety check)
    RETURN QUERY SELECT 
      FALSE, 
      'Invoice version changed during update. Please refresh and try again.'::TEXT,
      NULL::JSONB;
    RETURN;
  END IF;
  
  -- Success - return updated invoice
  RETURN QUERY SELECT 
    TRUE,
    'Invoice updated successfully'::TEXT,
    to_jsonb(v_updated_invoice);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_invoice_atomic(UUID, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION update_invoice_atomic(UUID, INTEGER, JSONB) TO service_role;

COMMENT ON FUNCTION update_invoice_atomic IS 
  'Atomically updates invoice with version checking to prevent concurrent edit conflicts. 
   Returns error if version mismatch detected.';

-- ===============================================
-- FUNCTION: Add Invoice Item Atomic (Optimistic Locking)
-- Atomically adds invoice item with version checking to prevent concurrent edit conflicts
-- ===============================================
CREATE OR REPLACE FUNCTION add_invoice_item_atomic(
  p_invoice_id UUID,
  p_version INTEGER,  -- Expected current version
  p_item_type VARCHAR(20),
  p_item_name VARCHAR(255),
  p_item_description TEXT,
  p_quantity DECIMAL(10,2),
  p_unit_price DECIMAL(10,2),
  p_discount_amount DECIMAL(10,2),
  p_notes TEXT,
  p_added_by UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  item_data JSONB,
  invoice_data JSONB
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_lock_key BIGINT;
  v_current_version INTEGER;
  v_current_invoice RECORD;
  v_new_item RECORD;
  v_total_price DECIMAL(10,2);
BEGIN
  -- Generate lock key
  v_lock_key := abs(hashtext(p_invoice_id::TEXT))::bigint;
  
  -- Acquire advisory lock
  PERFORM pg_advisory_xact_lock(v_lock_key);
  
  -- Get current invoice state
  SELECT * INTO v_current_invoice
  FROM invoices
  WHERE id = p_invoice_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Invoice not found'::TEXT, NULL::JSONB, NULL::JSONB;
    RETURN;
  END IF;
  
  -- Check version matches
  IF v_current_invoice.version != p_version THEN
    RETURN QUERY SELECT 
      FALSE, 
      format('Invoice was modified by another user. Current version: %s, Expected: %s', 
             v_current_invoice.version, p_version)::TEXT,
      NULL::JSONB,
      to_jsonb(v_current_invoice);
    RETURN;
  END IF;
  
  -- Calculate total price (handle null discount_amount)
  v_total_price := (p_quantity * p_unit_price) - COALESCE(NULLIF(p_discount_amount, 0), 0);
  
  -- Insert new item
  INSERT INTO invoice_items (
    invoice_id,
    item_type,
    item_name,
    item_description,
    quantity,
    unit_price,
    discount_amount,
    total_price,
    notes,
    added_by
  ) VALUES (
    p_invoice_id,
    p_item_type,
    p_item_name,
    p_item_description,
    p_quantity,
    p_unit_price,
    COALESCE(p_discount_amount, 0),
    v_total_price,
    p_notes,
    p_added_by
  ) RETURNING * INTO v_new_item;
  
  -- Recalculate invoice totals (this will increment version via trigger)
  -- Note: We need to recalculate manually since we're in a function
  -- The trigger will handle version increment
  
  -- Success - return new item and updated invoice
  SELECT * INTO v_current_invoice FROM invoices WHERE id = p_invoice_id;
  
  RETURN QUERY SELECT 
    TRUE,
    'Item added successfully'::TEXT,
    to_jsonb(v_new_item),
    to_jsonb(v_current_invoice);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION add_invoice_item_atomic(UUID, INTEGER, VARCHAR, VARCHAR, TEXT, DECIMAL, DECIMAL, DECIMAL, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_invoice_item_atomic(UUID, INTEGER, VARCHAR, VARCHAR, TEXT, DECIMAL, DECIMAL, DECIMAL, TEXT, UUID) TO service_role;

COMMENT ON FUNCTION add_invoice_item_atomic IS 
  'Atomically adds invoice item with version checking to prevent concurrent edit conflicts.';

-- ===============================================
-- ENABLE ROW LEVEL SECURITY
-- ===============================================
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- RLS POLICIES (Allow all for authenticated users during development)
-- ===============================================
DROP POLICY IF EXISTS "Healthcare staff can access all data" ON services;
CREATE POLICY "Healthcare staff can access all data" ON services FOR ALL USING (true);

DROP POLICY IF EXISTS "Healthcare staff can access all data" ON invoices;
CREATE POLICY "Healthcare staff can access all data" ON invoices FOR ALL USING (true);

DROP POLICY IF EXISTS "Healthcare staff can access all data" ON invoice_items;
CREATE POLICY "Healthcare staff can access all data" ON invoice_items FOR ALL USING (true);

DROP POLICY IF EXISTS "Healthcare staff can access all data" ON payment_transactions;
CREATE POLICY "Healthcare staff can access all data" ON payment_transactions FOR ALL USING (true);

-- ===============================================
-- NOTIFICATIONS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info', -- info, success, warning, error
  related_entity_type VARCHAR(50), -- visit, appointment, patient, etc.
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notification Policies (using simple true for PostgreSQL compatibility)
-- Note: Authorization is handled at application layer
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Healthcare staff can access notifications" ON notifications FOR ALL USING (true);

COMMENT ON TABLE notifications IS 'User notifications for various system events';
COMMENT ON COLUMN notifications.type IS 'Type of notification: info, success, warning, error';
COMMENT ON COLUMN notifications.related_entity_type IS 'Entity type the notification relates to';
COMMENT ON COLUMN notifications.related_entity_id IS 'ID of the related entity';


-- ===============================================
-- PAYMENT HOLDS & PARTIAL PAYMENTS MIGRATION
-- Add support for partial payments and payment holds
-- ===============================================

-- Step 1: Create payment_transactions table for tracking multiple payments per invoice
-- NOTE: payment_transactions table is already defined above with all fields

-- NOTE: All invoice payment tracking columns are already in invoices table definition above
-- This section kept for idempotency on existing databases

-- Initialize existing invoices (for databases that already have data)
UPDATE invoices
SET 
    amount_paid = CASE WHEN status = 'paid' THEN total_amount ELSE COALESCE(amount_paid, 0) END,
    balance_due = CASE WHEN status = 'paid' THEN 0 ELSE COALESCE(balance_due, total_amount) END
WHERE amount_paid IS NULL OR balance_due IS NULL;

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice ON payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_date ON payment_transactions(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_on_hold ON invoices(on_hold) WHERE on_hold = true;
CREATE INDEX IF NOT EXISTS idx_invoices_balance_due ON invoices(patient_id, balance_due) WHERE balance_due > 0;
CREATE INDEX IF NOT EXISTS idx_invoices_payment_due ON invoices(payment_due_date) WHERE payment_due_date IS NOT NULL;

-- Step 6: Enable RLS on payment_transactions
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for payment_transactions
DROP POLICY IF EXISTS "Users can view payment transactions" ON payment_transactions;
CREATE POLICY "Users can view payment transactions" ON payment_transactions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Cashiers can create payment transactions" ON payment_transactions;
CREATE POLICY "Cashiers can create payment transactions" ON payment_transactions
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update payment transactions" ON payment_transactions;
CREATE POLICY "Admins can update payment transactions" ON payment_transactions
    FOR UPDATE USING (true);

-- Step 8: Create helper view for outstanding invoices
CREATE OR REPLACE VIEW outstanding_invoices AS
SELECT 
    i.id,
    i.invoice_number,
    i.patient_id,
    p.first_name,
    p.last_name,
    p.patient_number,
    i.visit_id,
    i.total_amount,
    i.amount_paid,
    i.balance_due,
    i.on_hold,
    i.hold_reason,
    i.payment_due_date,
    i.created_at,
    i.hold_date,
    COUNT(pt.id) as payment_count,
    MAX(pt.payment_date) as last_payment_date
FROM invoices i
LEFT JOIN patients p ON i.patient_id = p.id
LEFT JOIN payment_transactions pt ON i.id = pt.invoice_id
WHERE i.balance_due > 0
GROUP BY i.id, p.id
ORDER BY i.created_at DESC;

COMMENT ON TABLE payment_transactions IS 'Track individual payment transactions for invoices (supports partial payments)';
COMMENT ON VIEW outstanding_invoices IS 'View of all invoices with outstanding balance';

