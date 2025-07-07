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
    
    CONSTRAINT valid_role CHECK (role IN ('admin', 'doctor', 'nurse', 'receptionist')),
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
    duration_minutes INTEGER DEFAULT 30,
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
    status VARCHAR(20) DEFAULT 'waiting',
    priority INTEGER DEFAULT 1,
    estimated_wait_time INTEGER, -- in minutes
    called_at TIMESTAMPTZ,
    served_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_token_status CHECK (status IN ('waiting', 'called', 'serving', 'completed', 'missed', 'cancelled')),
    CONSTRAINT valid_priority CHECK (priority >= 1 AND priority <= 5),
    CONSTRAINT valid_token_number CHECK (token_number > 0),
    UNIQUE(doctor_id, issued_date, token_number)
);

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
    15, 
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
    10, 
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
    20, 
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
