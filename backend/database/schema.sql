-- ===============================================
-- RealCIS Clinic Information System Database
-- Complete Schema - Run this in Supabase SQL Editor
-- ===============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===============================================
-- USERS TABLE
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
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    CONSTRAINT valid_role CHECK (role IN ('admin', 'doctor', 'nurse', 'receptionist', 'cashier', 'pharmacist')),
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ===============================================
-- PATIENTS TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_number VARCHAR(20) UNIQUE NOT NULL,
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
    
    CONSTRAINT valid_status CHECK (status IN ('scheduled', 'waiting', 'ready_for_doctor', 'consulting', 'completed', 'cancelled', 'no_show')),
    CONSTRAINT valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 480)
);

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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
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
    action VARCHAR(20) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))
);

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
    issued_date DATE DEFAULT CURRENT_DATE,
    issued_time TIMESTAMPTZ DEFAULT NOW(),
    -- Queue lifecycle
    status VARCHAR(20) DEFAULT 'waiting', -- waiting|called|serving|completed|missed|cancelled
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
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_token_status CHECK (status IN ('waiting', 'called', 'serving', 'completed', 'missed', 'cancelled')),
    CONSTRAINT valid_priority CHECK (priority >= 1 AND priority <= 5),
    CONSTRAINT valid_token_number CHECK (token_number > 0),
    UNIQUE(doctor_id, issued_date, token_number)
);

-- Ensure extended queue columns exist for idempotency (if older deployments)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='queue_tokens' AND column_name='checkin_time'
    ) THEN
        ALTER TABLE queue_tokens
            ADD COLUMN checkin_time TIMESTAMPTZ,
            ADD COLUMN ready_at TIMESTAMPTZ,
            ADD COLUMN in_consult_at TIMESTAMPTZ,
            ADD COLUMN done_at TIMESTAMPTZ,
            ADD COLUMN late_at TIMESTAMPTZ,
            ADD COLUMN consult_expected_minutes INTEGER DEFAULT 15;
    END IF;

    -- Make sure estimated_wait_time has default 7
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='queue_tokens' AND column_name='estimated_wait_time'
    ) THEN
        ALTER TABLE queue_tokens ALTER COLUMN estimated_wait_time SET DEFAULT 7;
    END IF;
END $$;

-- ===============================================
-- APPOINTMENT QUEUE TABLE
-- ===============================================
CREATE TABLE IF NOT EXISTS appointment_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    queue_position INTEGER NOT NULL,
    estimated_start_time TIMESTAMPTZ,
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'queued',
    priority INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_queue_status CHECK (status IN ('queued', 'in_progress', 'completed', 'skipped', 'cancelled')),
    CONSTRAINT valid_queue_priority CHECK (priority >= 1 AND priority <= 5),
    CONSTRAINT valid_queue_position CHECK (queue_position > 0)
);

-- ===============================================
-- CLINIC SETTINGS (global thresholds)
-- ===============================================
CREATE TABLE IF NOT EXISTS clinic_settings (
    key TEXT PRIMARY KEY,
    late_threshold_minutes INTEGER NOT NULL DEFAULT 7,     -- minutes before marking late/no-show
    consult_expected_minutes INTEGER NOT NULL DEFAULT 15,  -- target consult length in minutes
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

-- Vitals indexes
CREATE INDEX IF NOT EXISTS idx_vitals_visit_id ON vitals(visit_id);
CREATE INDEX IF NOT EXISTS idx_vitals_patient_id ON vitals(patient_id);
CREATE INDEX IF NOT EXISTS idx_vitals_recorded_at ON vitals(recorded_at);

-- Prescriptions indexes
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);

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
-- New helpful indexes for lifecycle
CREATE INDEX IF NOT EXISTS idx_queue_tokens_doctor_status ON queue_tokens(doctor_id, status);
-- Only one active consult per doctor at a time (status = 'serving')
CREATE UNIQUE INDEX IF NOT EXISTS uq_queue_one_serving_per_doctor
    ON queue_tokens(doctor_id)
    WHERE status = 'serving';

-- Appointment Queue indexes
CREATE INDEX IF NOT EXISTS idx_appointment_queue_appointment_id ON appointment_queue(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_queue_doctor_id ON appointment_queue(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointment_queue_patient_id ON appointment_queue(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointment_queue_status ON appointment_queue(status);
CREATE INDEX IF NOT EXISTS idx_appointment_queue_position ON appointment_queue(doctor_id, queue_position);
CREATE INDEX IF NOT EXISTS idx_appointment_queue_created_date ON appointment_queue(doctor_id, created_at);

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

-- Auto-calculate queue position
CREATE OR REPLACE FUNCTION calculate_queue_position()
RETURNS TRIGGER AS $$
DECLARE
    next_position INTEGER;
    queue_date DATE;
BEGIN
    queue_date := DATE(NEW.created_at);
    
    SELECT COALESCE(MAX(queue_position), 0) + 1
    INTO next_position
    FROM appointment_queue 
    WHERE doctor_id = NEW.doctor_id 
    AND DATE(created_at) = queue_date
    AND status IN ('queued', 'in_progress');
    
    NEW.queue_position := next_position;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

DROP TRIGGER IF EXISTS update_appointment_queue_updated_at ON appointment_queue;
CREATE TRIGGER update_appointment_queue_updated_at BEFORE UPDATE ON appointment_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Auto-calculate queue position
DROP TRIGGER IF EXISTS auto_calculate_queue_position ON appointment_queue;
CREATE TRIGGER auto_calculate_queue_position
    BEFORE INSERT ON appointment_queue
    FOR EACH ROW
    WHEN (NEW.queue_position IS NULL OR NEW.queue_position = 0)
    EXECUTE FUNCTION calculate_queue_position();

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
ALTER TABLE appointment_queue ENABLE ROW LEVEL SECURITY;
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

DROP POLICY IF EXISTS "Healthcare staff can access all data" ON appointment_queue;
CREATE POLICY "Healthcare staff can access all data" ON appointment_queue FOR ALL USING (true);
DROP POLICY IF EXISTS "Healthcare staff can access all data" ON clinic_settings;
CREATE POLICY "Healthcare staff can access all data" ON clinic_settings FOR ALL USING (true);

-- ===============================================
-- SAMPLE DATA
-- ===============================================

-- Insert default admin user (password: admin123)
INSERT INTO users (
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    phone,
    is_active
) VALUES (
    'admin@clinic.com',
    crypt('admin123', gen_salt('bf')),
    'System',
    'Administrator',
    'admin',
    '+1234567890',
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert sample doctor
INSERT INTO users (
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    phone,
    specialty,
    license_number,
    is_active
) VALUES (
    'dr.smith@clinic.com',
    crypt('doctor123', gen_salt('bf')),
    'John',
    'Smith',
    'doctor',
    '+1234567891',
    'Internal Medicine',
    'MD12345',
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert sample nurse
INSERT INTO users (
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    phone,
    specialty,
    is_active
) VALUES (
    'nurse.williams@clinic.com',
    crypt('nurse123', gen_salt('bf')),
    'Emily',
    'Williams',
    'nurse',
    '+1234567893',
    'General Nursing',
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert sample receptionist
INSERT INTO users (
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    phone,
    is_active
) VALUES (
    'reception@clinic.com',
    crypt('reception123', gen_salt('bf')),
    'Lisa',
    'Davis',
    'receptionist',
    '+1234567895',
    true
) ON CONFLICT (email) DO NOTHING;

-- Insert sample patients
INSERT INTO patients (
    patient_number,
    first_name, 
    last_name, 
    date_of_birth, 
    gender, 
    phone, 
    email, 
    address, 
    emergency_contact_name, 
    emergency_contact_phone, 
    emergency_contact_relationship, 
    blood_group, 
    allergies, 
    medical_conditions, 
    insurance_provider, 
    insurance_number, 
    is_active
) VALUES 
(
    'P000001',
    'Alice', 'Anderson', '1985-03-15', 'Female', '+1234567801', 'alice.anderson@email.com', 
    '123 Main St, City, State 12345', 'Bob Anderson', '+1234567802', 'Spouse', 
    'A+', 'Penicillin', 'Hypertension', 'Health Insurance Co', 'HIC123456', true
),
(
    'P000002',
    'Robert', 'Wilson', '1990-07-22', 'Male', '+1234567803', 'robert.wilson@email.com', 
    '456 Oak Ave, City, State 12345', 'Mary Wilson', '+1234567804', 'Mother', 
    'O-', 'None known', 'Diabetes Type 2', 'Medical Plus', 'MP789012', true
),
(
    'P000003',
    'Maria', 'Garcia', '1978-11-08', 'Female', '+1234567805', 'maria.garcia@email.com', 
    '789 Pine Rd, City, State 12345', 'Carlos Garcia', '+1234567806', 'Husband', 
    'B+', 'Shellfish', 'None', 'Family Health', 'FH345678', true
) ON CONFLICT (patient_number) DO NOTHING;

-- Insert sample doctor availability (for Dr. Smith) - More realistic and varied times
-- Using the conversion function to store proper 24-hour format in database
INSERT INTO doctor_availability (
    doctor_id, 
    day_of_week, 
    start_time, 
    end_time, 
    is_active
) VALUES
-- Monday - Morning shift
(
    (SELECT id FROM users WHERE email = 'dr.smith@clinic.com'),
    'Monday',
    convert_12hr_to_24hr('9:00', 'AM'),
    convert_12hr_to_24hr('12:30', 'PM'),
    true
),
-- Monday - Afternoon shift
(
    (SELECT id FROM users WHERE email = 'dr.smith@clinic.com'),
    'Monday',
    convert_12hr_to_24hr('2:00', 'PM'),
    convert_12hr_to_24hr('6:00', 'PM'),
    true
),
-- Tuesday - Morning shift
(
    (SELECT id FROM users WHERE email = 'dr.smith@clinic.com'),
    'Tuesday',
    convert_12hr_to_24hr('8:30', 'AM'),
    convert_12hr_to_24hr('1:00', 'PM'),
    true
),
-- Tuesday - Evening shift
(
    (SELECT id FROM users WHERE email = 'dr.smith@clinic.com'),
    'Tuesday',
    convert_12hr_to_24hr('3:00', 'PM'),
    convert_12hr_to_24hr('7:30', 'PM'),
    true
),
-- Wednesday - Full day
(
    (SELECT id FROM users WHERE email = 'dr.smith@clinic.com'),
    'Wednesday',
    convert_12hr_to_24hr('9:00', 'AM'),
    convert_12hr_to_24hr('5:00', 'PM'),
    true
),
-- Thursday - Morning only
(
    (SELECT id FROM users WHERE email = 'dr.smith@clinic.com'),
    'Thursday',
    convert_12hr_to_24hr('10:00', 'AM'),
    convert_12hr_to_24hr('2:00', 'PM'),
    true
),
-- Friday - Afternoon/Evening
(
    (SELECT id FROM users WHERE email = 'dr.smith@clinic.com'),
    'Friday',
    convert_12hr_to_24hr('1:00', 'PM'),
    convert_12hr_to_24hr('8:00', 'PM'),
    true
),
-- Saturday - Half day
(
    (SELECT id FROM users WHERE email = 'dr.smith@clinic.com'),
    'Saturday',
    convert_12hr_to_24hr('9:00', 'AM'),
    convert_12hr_to_24hr('1:00', 'PM'),
    true
)
ON CONFLICT (doctor_id, day_of_week, start_time, end_time) DO NOTHING;

-- Insert sample appointments for testing
INSERT INTO appointments (
    patient_id,
    doctor_id,
    appointment_date,
    appointment_time,
    duration_minutes,
    appointment_type,
    reason_for_visit,
    status,
    created_by
) VALUES 
(
    (SELECT id FROM patients WHERE email = 'alice.anderson@email.com'),
    (SELECT id FROM users WHERE email = 'dr.smith@clinic.com'),
    CURRENT_DATE,
    '09:00',
    30,
    'Follow-up',
    'Hypertension check-up',
    'scheduled',
    (SELECT id FROM users WHERE email = 'admin@clinic.com')
),
(
    (SELECT id FROM patients WHERE email = 'robert.wilson@email.com'),
    (SELECT id FROM users WHERE email = 'dr.smith@clinic.com'),
    CURRENT_DATE,
    '09:30',
    30,
    'Regular Check-up',
    'Diabetes monitoring',
    'scheduled',
    (SELECT id FROM users WHERE email = 'admin@clinic.com')
),
(
    (SELECT id FROM patients WHERE email = 'maria.garcia@email.com'),
    (SELECT id FROM users WHERE email = 'dr.smith@clinic.com'),
    CURRENT_DATE,
    '10:00',
    30,
    'Consultation',
    'General health assessment',
    'scheduled',
    (SELECT id FROM users WHERE email = 'admin@clinic.com')
)
ON CONFLICT DO NOTHING;

-- Insert sample queue tokens
INSERT INTO queue_tokens (
    token_number, 
    patient_id, 
    doctor_id, 
    appointment_id, 
    issued_date, 
    issued_time, 
    status, 
    priority, 
    estimated_wait_time, 
    called_at, 
    served_at, 
    created_by
) VALUES 
(
    1, 
    (SELECT id FROM patients WHERE email = 'alice.anderson@email.com'), 
    (SELECT id FROM users WHERE email = 'dr.smith@clinic.com'), 
    NULL, 
    CURRENT_DATE, 
    NOW(), 
    'waiting', 
    1, 
    DEFAULT, 
    NULL, 
    NULL, 
    (SELECT id FROM users WHERE email = 'admin@clinic.com')
),
(
    2, 
    (SELECT id FROM patients WHERE email = 'robert.wilson@email.com'), 
    (SELECT id FROM users WHERE email = 'dr.smith@clinic.com'), 
    NULL, 
    CURRENT_DATE, 
    NOW(), 
    'waiting', 
    1, 
    DEFAULT, 
    NULL, 
    NULL, 
    (SELECT id FROM users WHERE email = 'admin@clinic.com')
),
(
    3, 
    (SELECT id FROM patients WHERE email = 'maria.garcia@email.com'), 
    (SELECT id FROM users WHERE email = 'dr.smith@clinic.com'), 
    NULL, 
    CURRENT_DATE, 
    NOW(), 
    'waiting', 
    1, 
    DEFAULT, 
    NULL, 
    NULL, 
    (SELECT id FROM users WHERE email = 'admin@clinic.com')
) ON CONFLICT (doctor_id, issued_date, token_number) DO NOTHING;

-- Insert sample appointment queue
INSERT INTO appointment_queue (
    appointment_id, 
    doctor_id, 
    patient_id, 
    queue_position, 
    estimated_start_time, 
    actual_start_time, 
    actual_end_time, 
    status, 
    priority, 
    notes
) 
SELECT 
    a.id,
    a.doctor_id,
    a.patient_id,
    ROW_NUMBER() OVER (ORDER BY a.appointment_time),
    a.appointment_date::timestamp + a.appointment_time + (ROW_NUMBER() OVER (ORDER BY a.appointment_time) - 1) * INTERVAL '5 minutes',
    NULL,
    NULL,
    'queued',
    1,
    CASE ROW_NUMBER() OVER (ORDER BY a.appointment_time)
        WHEN 1 THEN 'First in queue'
        WHEN 2 THEN 'Second in queue'
        WHEN 3 THEN 'Third in queue'
        ELSE 'In queue'
    END
FROM appointments a
WHERE a.appointment_date = CURRENT_DATE
AND a.doctor_id = (SELECT id FROM users WHERE email = 'dr.smith@clinic.com')
ON CONFLICT DO NOTHING;

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
    RAISE NOTICE '   • appointment_queue (appointment scheduling queue)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Sample Users Created:';
    RAISE NOTICE '   • admin@clinic.com (password: admin123)';
    RAISE NOTICE '   • dr.smith@clinic.com (password: doctor123)';
    RAISE NOTICE '   • nurse.williams@clinic.com (password: nurse123)';
    RAISE NOTICE '   • reception@clinic.com (password: reception123)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Sample Patients Created:';
    RAISE NOTICE '   • Alice Anderson (Patient P000001)';
    RAISE NOTICE '   • Robert Wilson (Patient P000002)';
    RAISE NOTICE '   • Maria Garcia (Patient P000003)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Doctor Availability Features:';
    RAISE NOTICE '   • Dynamic time input with AM/PM support';
    RAISE NOTICE '   • Automatic 12hr to 24hr conversion';
    RAISE NOTICE '   • Flexible scheduling for any time';
    RAISE NOTICE '   • Multiple shifts per day supported';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Time Conversion Functions Available:';
    RAISE NOTICE '   • convert_12hr_to_24hr(time_str, am_pm)';
    RAISE NOTICE '   • convert_24hr_to_12hr(time)';
    RAISE NOTICE '   • get_doctor_availability_12hr(doctor_id)';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Usage Examples:';
    RAISE NOTICE '   SELECT convert_12hr_to_24hr(''2:30'', ''PM''); -- Returns 14:30:00';
    RAISE NOTICE '   SELECT convert_24hr_to_12hr(''14:30''::TIME); -- Returns "2:30 PM"';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Next Steps:';
    RAISE NOTICE '   1. Test backend connection: npm run db:test';
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
    diagnosis_name VARCHAR(500) NOT NULL,
    diagnosis_type VARCHAR(50), -- primary, secondary, differential, rule_out
    
    -- Clinical details
    severity VARCHAR(20), -- mild, moderate, severe, critical
    status VARCHAR(20) DEFAULT 'active', -- active, resolved, chronic, in_remission, recurring
    
    -- Date tracking
    diagnosed_date DATE NOT NULL,
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
-- ENHANCE PRESCRIPTIONS TABLE
-- ===============================================
-- Add optional columns if they don't exist
DO $$
BEGIN
    -- Medication category
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' 
        AND table_name='prescriptions' 
        AND column_name='medication_category'
    ) THEN
        ALTER TABLE prescriptions 
        ADD COLUMN medication_category VARCHAR(100);
    END IF;
    
    -- Route of administration
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' 
        AND table_name='prescriptions' 
        AND column_name='route_of_administration'
    ) THEN
        ALTER TABLE prescriptions 
        ADD COLUMN route_of_administration VARCHAR(50);
    END IF;
    
    -- Is current flag
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' 
        AND table_name='prescriptions' 
        AND column_name='is_current'
    ) THEN
        ALTER TABLE prescriptions 
        ADD COLUMN is_current BOOLEAN DEFAULT true;
    END IF;
    
    -- Discontinuation tracking
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' 
        AND table_name='prescriptions' 
        AND column_name='discontinued_date'
    ) THEN
        ALTER TABLE prescriptions 
        ADD COLUMN discontinued_date DATE,
        ADD COLUMN discontinued_by UUID REFERENCES users(id),
        ADD COLUMN discontinuation_reason TEXT;
    END IF;
END $$;

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

-- Patient Allergies Policies
-- Allow authenticated users to read allergies
CREATE POLICY "Allow authenticated users to read allergies"
    ON patient_allergies
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Allow doctors and nurses to insert allergies
CREATE POLICY "Allow doctors and nurses to insert allergies"
    ON patient_allergies
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Allow doctors and nurses to update allergies
CREATE POLICY "Allow doctors and nurses to update allergies"
    ON patient_allergies
    FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Patient Diagnoses Policies
-- Allow authenticated users to read diagnoses
CREATE POLICY "Allow authenticated users to read diagnoses"
    ON patient_diagnoses
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Allow doctors to insert diagnoses
CREATE POLICY "Allow doctors to insert diagnoses"
    ON patient_diagnoses
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Allow doctors to update diagnoses
CREATE POLICY "Allow doctors to update diagnoses"
    ON patient_diagnoses
    FOR UPDATE
    USING (auth.role() = 'authenticated');

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
-- SAMPLE DATA (Optional - for testing)
-- ===============================================

-- Uncomment below to insert sample data

/*
-- Sample allergy for existing patient
INSERT INTO patient_allergies (patient_id, allergy_name, allergen_type, severity, reaction, diagnosed_date)
SELECT 
    id,
    'Penicillin',
    'medication',
    'severe',
    'Anaphylactic reaction - severe breathing difficulty and hives',
    '2023-01-15'
FROM patients
WHERE patient_number = 'P2024-0001'
LIMIT 1;

-- Sample diagnosis for existing patient
INSERT INTO patient_diagnoses (patient_id, diagnosis_name, diagnosed_by, diagnosed_date, status, severity)
SELECT 
    p.id,
    'Type 2 Diabetes Mellitus',
    u.id,
    '2023-06-20',
    'chronic',
    'moderate'
FROM patients p
CROSS JOIN users u
WHERE p.patient_number = 'P2024-0001'
  AND u.role = 'doctor'
LIMIT 1;
*/

-- ===============================================
-- MIGRATION COMPLETE
-- ===============================================
-- Run this script in Supabase SQL Editor
-- Then create corresponding models, services, and routes in backend
-- ===============================================


-- Migration: Add visit_id to queue_tokens table
-- Purpose: Link each queue token to its specific visit for proper vitals tracking
-- Date: 2025-10-15

-- Add visit_id column to queue_tokens
ALTER TABLE queue_tokens
ADD COLUMN IF NOT EXISTS visit_id UUID REFERENCES visits(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_queue_tokens_visit_id ON queue_tokens(visit_id);

ALTER TABLE visits
ADD COLUMN IF NOT EXISTS visit_start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS visit_end_time TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_visits_start_time ON visits(visit_start_time);
CREATE INDEX IF NOT EXISTS idx_visits_end_time ON visits(visit_end_time);

-- Add visit_id column to patient_allergies
ALTER TABLE patient_allergies
ADD COLUMN IF NOT EXISTS visit_id UUID REFERENCES visits(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_patient_allergies_visit_id ON patient_allergies(visit_id);

-- Add comment
COMMENT ON COLUMN patient_allergies.visit_id IS 'Links the allergy to the specific visit when it was recorded';

-- Add category column to patient_diagnoses
ALTER TABLE patient_diagnoses
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'primary';

-- Add comment
COMMENT ON COLUMN patient_diagnoses.category IS 'Category of diagnosis: primary, secondary, comorbidity, rule-out, working, differential';

-- Add diagnosis_date column to patient_diagnoses
ALTER TABLE patient_diagnoses
ADD COLUMN IF NOT EXISTS diagnosis_date TIMESTAMPTZ DEFAULT NOW();

-- Add comment
COMMENT ON COLUMN patient_diagnoses.diagnosis_date IS 'Date when the diagnosis was made';

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
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    
    -- Financial details
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(10, 2) DEFAULT 0.00,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'pending', -- pending, partial, paid, cancelled
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
    
    CONSTRAINT valid_invoice_status CHECK (status IN ('pending', 'partial', 'paid', 'cancelled')),
    CONSTRAINT valid_payment_method CHECK (payment_method IN ('cash', 'card', 'insurance', 'mobile_payment', 'mixed'))
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
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(100), -- receipt number, transaction ID, etc.
    payment_notes TEXT,
    
    -- Audit
    received_by UUID REFERENCES users(id), -- cashier
    received_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_payment_method_tx CHECK (payment_method IN ('cash', 'card', 'insurance', 'mobile_payment'))
);

-- ===============================================
-- NOTE: Medicine Inventory - NOT IMPLEMENTED
-- Medicine prices will be manually entered by cashier
-- No inventory tracking per user requirement
-- ===============================================

-- ===============================================
-- INDEXES for Performance
-- ===============================================
CREATE INDEX idx_invoices_visit_id ON invoices(visit_id);
CREATE INDEX idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_payment_transactions_invoice_id ON payment_transactions(invoice_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_is_active ON services(is_active);

-- ===============================================
-- TRIGGERS for updated_at
-- ===============================================
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- FUNCTION: Auto-generate Invoice Number
-- ===============================================
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR AS $$
DECLARE
    new_number VARCHAR;
    sequence_num INTEGER;
BEGIN
    -- Get the next sequence number for today
    SELECT COUNT(*) + 1 INTO sequence_num
    FROM invoices
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Format: INV-YYYYMMDD-0001
    new_number := 'INV-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
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
-- SAMPLE DATA - Common Services
-- ===============================================
INSERT INTO services (service_code, service_name, description, category, default_price) VALUES
('CONS-GEN', 'General Consultation', 'General medical consultation with doctor', 'consultation', 50.00),
('CONS-SPEC', 'Specialist Consultation', 'Consultation with specialist doctor', 'consultation', 100.00),
('CONS-FOLL', 'Follow-up Consultation', 'Follow-up visit', 'consultation', 30.00),
('LAB-CBC', 'Complete Blood Count', 'CBC laboratory test', 'laboratory', 25.00),
('LAB-URIN', 'Urinalysis', 'Complete urinalysis', 'laboratory', 15.00),
('LAB-GLUC', 'Blood Glucose Test', 'Fasting blood glucose', 'laboratory', 20.00),
('IMG-XRAY', 'X-Ray', 'Digital X-Ray imaging', 'imaging', 75.00),
('PROC-INJ', 'Injection/IV', 'Medication injection or IV administration', 'procedure', 10.00),
('PROC-DRESS', 'Wound Dressing', 'Wound cleaning and dressing', 'procedure', 20.00),
('PROC-SUTUR', 'Suturing', 'Minor wound suturing', 'procedure', 50.00);

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================
-- Run these to verify the tables were created successfully:

-- Check services
-- SELECT * FROM services ORDER BY category, service_name;

-- Check table structure
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('services', 'invoices', 'invoice_items', 'payment_transactions')
-- ORDER BY table_name;

-- Create notifications table
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

-- Policy: Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: System can create notifications
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

COMMENT ON TABLE notifications IS 'User notifications for various system events';
COMMENT ON COLUMN notifications.type IS 'Type of notification: info, success, warning, error';
COMMENT ON COLUMN notifications.related_entity_type IS 'Entity type the notification relates to';
COMMENT ON COLUMN notifications.related_entity_id IS 'ID of the related entity';


-- ===============================================
-- PAYMENT HOLDS & PARTIAL PAYMENTS MIGRATION
-- Add support for partial payments and payment holds
-- ===============================================

-- Step 1: Create payment_transactions table for tracking multiple payments per invoice
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Payment details
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50),
    payment_notes TEXT,
    
    -- Tracking
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add payment tracking columns to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_due DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS on_hold BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hold_reason TEXT,
ADD COLUMN IF NOT EXISTS hold_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_due_date DATE;

-- Step 3: Initialize existing invoices
UPDATE invoices
SET 
    amount_paid = CASE WHEN status = 'paid' THEN total_amount ELSE 0 END,
    balance_due = CASE WHEN status = 'paid' THEN 0 ELSE total_amount END,
    on_hold = CASE WHEN status != 'paid' THEN true ELSE false END
WHERE amount_paid IS NULL OR balance_due IS NULL;

-- Step 4: Update invoice status constraint to include partial_paid
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS valid_invoice_status;
ALTER TABLE invoices ADD CONSTRAINT valid_invoice_status 
    CHECK (status IN ('draft', 'pending', 'partial_paid', 'paid', 'cancelled', 'refunded'));

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

