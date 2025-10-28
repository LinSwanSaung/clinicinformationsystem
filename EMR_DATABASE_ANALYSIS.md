# EMR (Electronic Medical Records) Database Analysis

## Current UI Data Requirements vs Database Schema

### 📋 **Overview**

This document analyzes the Patient EMR interface and identifies what data can be recorded in the current database versus what needs to be implemented.

---

## 🎯 **EMR UI Data Categories**

### 1. **Patient Information Header** ✅ COMPLETE
- **UI Fields:**
  - Name, Patient Number, Age, Gender
  - Phone, Email
  - Blood Group
  - Emergency Contact Info
  
- **Database Status:** ✅ **FULLY SUPPORTED**
- **Table:** `patients`
- **Implementation:** Complete - all fields exist

---

### 2. **Vital Signs** ✅ COMPLETE
- **UI Fields:**
  - Blood Pressure (Systolic/Diastolic)
  - Heart Rate (BPM)
  - Temperature (°C or °F)
  - Weight (kg)
  - Oxygen Saturation
  - Respiratory Rate
  - BMI
  - Pain Level
  - Notes
  
- **Database Status:** ✅ **FULLY SUPPORTED**
- **Table:** `vitals`
- **Implementation:** Complete - all fields exist with proper validation

---

### 3. **Known Allergies** ⚠️ PARTIAL
- **UI Fields:**
  - List of allergies
  - Ability to add new allergies
  - Displayed as badges
  
- **Current Database:** ⚠️ **TEXT FIELD ONLY**
  - `patients.allergies` (TEXT) - stores as comma-separated or JSON
  
- **Recommended Implementation:** 🔧 **NEEDS SEPARATE TABLE**
  ```sql
  CREATE TABLE patient_allergies (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      allergy_name VARCHAR(200) NOT NULL,
      severity VARCHAR(20), -- mild, moderate, severe, life-threatening
      reaction TEXT, -- description of reaction
      diagnosed_date DATE,
      diagnosed_by UUID REFERENCES users(id),
      notes TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      
      CONSTRAINT valid_severity CHECK (severity IN ('mild', 'moderate', 'severe', 'life-threatening'))
  );
  
  CREATE INDEX idx_patient_allergies_patient_id ON patient_allergies(patient_id);
  CREATE INDEX idx_patient_allergies_active ON patient_allergies(is_active);
  ```

---

### 4. **Diagnosis History** ⚠️ PARTIAL
- **UI Fields:**
  - Condition name
  - Date of diagnosis
  - List of historical diagnoses
  
- **Current Database:** ⚠️ **LIMITED SUPPORT**
  - `visits.diagnosis` (TEXT) - single diagnosis per visit
  - No dedicated diagnosis history table
  
- **Recommended Implementation:** 🔧 **NEEDS SEPARATE TABLE**
  ```sql
  CREATE TABLE patient_diagnoses (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,
      diagnosed_by UUID NOT NULL REFERENCES users(id),
      
      -- ICD-10 or custom diagnosis codes
      diagnosis_code VARCHAR(20),
      diagnosis_name VARCHAR(500) NOT NULL,
      diagnosis_type VARCHAR(50), -- primary, secondary, differential
      
      -- Clinical details
      severity VARCHAR(20), -- mild, moderate, severe
      status VARCHAR(20) DEFAULT 'active', -- active, resolved, chronic, in_remission
      
      -- Dates
      diagnosed_date DATE NOT NULL,
      onset_date DATE,
      resolved_date DATE,
      
      -- Additional info
      notes TEXT,
      treatment_plan TEXT,
      
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      
      CONSTRAINT valid_diagnosis_type CHECK (diagnosis_type IN ('primary', 'secondary', 'differential', 'rule_out')),
      CONSTRAINT valid_severity CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
      CONSTRAINT valid_status CHECK (status IN ('active', 'resolved', 'chronic', 'in_remission', 'recurring'))
  );
  
  CREATE INDEX idx_patient_diagnoses_patient_id ON patient_diagnoses(patient_id);
  CREATE INDEX idx_patient_diagnoses_status ON patient_diagnoses(status);
  CREATE INDEX idx_patient_diagnoses_date ON patient_diagnoses(diagnosed_date);
  ```

---

### 5. **Current Medications** ⚠️ PARTIAL
- **UI Fields:**
  - Medication name
  - Dosage
  - Frequency
  - Add new medications
  
- **Current Database:** ✅ **PARTIALLY SUPPORTED**
  - `prescriptions` table exists ✅
  - Has medication_name, dosage, frequency
  - Has status field (active, completed, cancelled, expired)
  
- **Status:** ✅ **USABLE** but could be enhanced
- **Recommendation:** 
  - Current `prescriptions` table can be used
  - Consider adding:
    - `is_current` flag for easy filtering
    - `medication_category` (antibiotic, painkiller, etc.)
    - `route_of_administration` (oral, IV, topical, etc.)

---

### 6. **Visit History** ⚠️ PARTIAL
- **UI Fields:**
  - Visit date and type
  - Nurse's notes (BP, BPM, Weight, Temp, Observations)
  - Doctor's notes (Diagnosis, Comments)
  - Prescribed medications
  - Expandable accordion view
  
- **Current Database:** ✅ **MOSTLY SUPPORTED**
  - `visits` table ✅ - has visit_date, visit_type, diagnosis
  - `vitals` table ✅ - linked to visits
  - `doctor_notes` table ✅ - linked to visits
  - `prescriptions` table ✅ - linked to visits
  
- **Status:** ✅ **FUNCTIONAL**
- **Missing Link:** Need to ensure all data is properly linked through `visit_id`

---

### 7. **Doctor's Notes** ✅ COMPLETE
- **UI Fields:**
  - Date of note
  - Note content
  - Prescribed medications
  - Expandable view
  
- **Database Status:** ✅ **FULLY SUPPORTED**
- **Table:** `doctor_notes`
- **Features:**
  - Linked to visits
  - Has note_type field
  - Private/public flag
  - Can show prescribed medications through prescriptions table

---

### 8. **Files & Documents** ✅ COMPLETE
- **UI Fields:**
  - Document name
  - File type
  - File size
  - Upload/View/Download actions
  
- **Database Status:** ✅ **FULLY SUPPORTED**
- **Table:** `medical_documents`
- **Features:**
  - File metadata (name, type, size, mime_type)
  - File path storage
  - Confidentiality flag
  - Linked to patients and visits

---

## 📊 **Summary Table**

| Feature | Current Status | Priority | Action Needed |
|---------|---------------|----------|---------------|
| Patient Info | ✅ Complete | - | None |
| Vitals | ✅ Complete | - | None |
| Allergies | ⚠️ Text field | 🔥 HIGH | Create dedicated table |
| Diagnoses | ⚠️ Limited | 🔥 HIGH | Create dedicated table |
| Medications | ✅ Usable | 🟡 MEDIUM | Enhance existing table |
| Visit History | ✅ Functional | - | None |
| Doctor Notes | ✅ Complete | - | None |
| Documents | ✅ Complete | - | None |

---

## 🚀 **Implementation Recommendations**

### **Priority 1: High (Required for Full EMR)**
1. **Create `patient_allergies` table**
   - Proper allergy tracking with severity
   - Better for querying and reporting
   - Improved patient safety features

2. **Create `patient_diagnoses` table**
   - Comprehensive diagnosis history
   - Track status changes (active → resolved)
   - Support for ICD-10 codes
   - Better clinical documentation

### **Priority 2: Medium (Enhancement)**
3. **Enhance `prescriptions` table**
   - Add medication categories
   - Add route of administration
   - Add refill tracking improvements

4. **Create backend services and APIs**
   - AllergyService & routes
   - DiagnosisService & routes
   - Enhance MedicationService

5. **Update frontend services**
   - allergyService.js
   - diagnosisService.js
   - Update patientService.js to fetch related data

---

## 💾 **SQL Scripts to Run**

### **Script 1: Patient Allergies Table**
```sql
-- Create patient allergies table
CREATE TABLE IF NOT EXISTS patient_allergies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    allergy_name VARCHAR(200) NOT NULL,
    allergen_type VARCHAR(50), -- medication, food, environmental, other
    severity VARCHAR(20), -- mild, moderate, severe, life-threatening
    reaction TEXT,
    diagnosed_date DATE,
    diagnosed_by UUID REFERENCES users(id),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_allergen_type CHECK (allergen_type IN ('medication', 'food', 'environmental', 'latex', 'insect', 'other')),
    CONSTRAINT valid_severity CHECK (severity IN ('mild', 'moderate', 'severe', 'life-threatening'))
);

CREATE INDEX idx_patient_allergies_patient_id ON patient_allergies(patient_id);
CREATE INDEX idx_patient_allergies_active ON patient_allergies(is_active);
CREATE INDEX idx_patient_allergies_severity ON patient_allergies(severity);
```

### **Script 2: Patient Diagnoses Table**
```sql
-- Create patient diagnoses table
CREATE TABLE IF NOT EXISTS patient_diagnoses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,
    diagnosed_by UUID NOT NULL REFERENCES users(id),
    
    diagnosis_code VARCHAR(20),
    diagnosis_name VARCHAR(500) NOT NULL,
    diagnosis_type VARCHAR(50), -- primary, secondary, differential, rule_out
    
    severity VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    
    diagnosed_date DATE NOT NULL,
    onset_date DATE,
    resolved_date DATE,
    
    notes TEXT,
    treatment_plan TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_diagnosis_type CHECK (diagnosis_type IN ('primary', 'secondary', 'differential', 'rule_out')),
    CONSTRAINT valid_severity CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'resolved', 'chronic', 'in_remission', 'recurring'))
);

CREATE INDEX idx_patient_diagnoses_patient_id ON patient_diagnoses(patient_id);
CREATE INDEX idx_patient_diagnoses_status ON patient_diagnoses(status);
CREATE INDEX idx_patient_diagnoses_date ON patient_diagnoses(diagnosed_date);
CREATE INDEX idx_patient_diagnoses_visit ON patient_diagnoses(visit_id);
```

### **Script 3: Enhance Prescriptions (Optional)**
```sql
-- Add optional enhancements to prescriptions table
ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS medication_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS route_of_administration VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_prescriptions_current ON prescriptions(is_current);
CREATE INDEX IF NOT EXISTS idx_prescriptions_category ON prescriptions(medication_category);
```

---

## 🔧 **Next Steps**

1. **Run SQL Scripts** in Supabase SQL Editor
2. **Create Backend Models**:
   - `PatientAllergy.model.js`
   - `PatientDiagnosis.model.js`
3. **Create Backend Services**:
   - `PatientAllergy.service.js`
   - `PatientDiagnosis.service.js`
4. **Create Backend Routes**:
   - `patientAllergy.routes.js`
   - `patientDiagnosis.routes.js`
5. **Create Frontend Services**:
   - `allergyService.js`
   - `diagnosisService.js`
6. **Update EMR Components** to use real API calls instead of dummy data

---

## 📝 **Notes**

- Current `patients` table has `allergies`, `medical_conditions`, and `current_medications` as TEXT fields
- These can remain for backward compatibility or quick summaries
- New dedicated tables provide better structure and querying capabilities
- All new tables follow the same pattern as existing tables (UUID primary keys, timestamps, soft deletes where appropriate)

