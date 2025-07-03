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
    
    CONSTRAINT valid_status CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
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

-- ===============================================
-- TRIGGERS
-- ===============================================

-- Update timestamp triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctor_notes_updated_at BEFORE UPDATE ON doctor_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate patient numbers
CREATE TRIGGER auto_generate_patient_number
    BEFORE INSERT ON patients
    FOR EACH ROW
    WHEN (NEW.patient_number IS NULL OR NEW.patient_number = '')
    EXECUTE FUNCTION generate_patient_number();

-- Auto-calculate BMI
CREATE TRIGGER calculate_vitals_bmi 
    BEFORE INSERT OR UPDATE ON vitals 
    FOR EACH ROW 
    EXECUTE FUNCTION calculate_bmi();

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

-- Basic policies (can be customized later)
CREATE POLICY "Healthcare staff can access all data" ON users FOR ALL USING (true);
CREATE POLICY "Healthcare staff can access all data" ON patients FOR ALL USING (true);
CREATE POLICY "Healthcare staff can access all data" ON appointments FOR ALL USING (true);
CREATE POLICY "Healthcare staff can access all data" ON visits FOR ALL USING (true);
CREATE POLICY "Healthcare staff can access all data" ON vitals FOR ALL USING (true);
CREATE POLICY "Healthcare staff can access all data" ON prescriptions FOR ALL USING (true);
CREATE POLICY "Healthcare staff can access all data" ON doctor_notes FOR ALL USING (true);
CREATE POLICY "Healthcare staff can access all data" ON medical_documents FOR ALL USING (true);
CREATE POLICY "Admins can access audit logs" ON audit_logs FOR ALL USING (true);

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
    'Alice', 'Anderson', '1985-03-15', 'Female', '+1234567801', 'alice.anderson@email.com', 
    '123 Main St, City, State 12345', 'Bob Anderson', '+1234567802', 'Spouse', 
    'A+', 'Penicillin', 'Hypertension', 'Health Insurance Co', 'HIC123456', true
),
(
    'Robert', 'Wilson', '1990-07-22', 'Male', '+1234567803', 'robert.wilson@email.com', 
    '456 Oak Ave, City, State 12345', 'Mary Wilson', '+1234567804', 'Mother', 
    'O-', 'None known', 'Diabetes Type 2', 'Medical Plus', 'MP789012', true
),
(
    'Maria', 'Garcia', '1978-11-08', 'Female', '+1234567805', 'maria.garcia@email.com', 
    '789 Pine Rd, City, State 12345', 'Carlos Garcia', '+1234567806', 'Husband', 
    'B+', 'Shellfish', 'None', 'Family Health', 'FH345678', true
);

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
    RAISE NOTICE '🔧 Next Steps:';
    RAISE NOTICE '   1. Test backend connection: npm run db:test';
    RAISE NOTICE '   2. Start backend server: npm run dev';
    RAISE NOTICE '   3. Test API endpoints at http://localhost:5000';
    RAISE NOTICE '';
    RAISE NOTICE 'Happy coding! 🏥✨';
END $$;
