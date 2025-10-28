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

