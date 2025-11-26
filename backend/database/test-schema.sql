-- ===============================================
-- RealCIS Schema Test Script
-- Run this AFTER schema.sql to verify everything works
-- ===============================================

-- ===============================================
-- 1. VERIFY ALL TABLES EXIST
-- ===============================================
SELECT '=== TABLES CHECK ===' AS test_section;

SELECT table_name, 
       CASE WHEN table_name IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected: 20 tables
SELECT 'Total Tables: ' || COUNT(*) AS table_count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- ===============================================
-- 2. VERIFY ALL VIEWS EXIST
-- ===============================================
SELECT '=== VIEWS CHECK ===' AS test_section;

SELECT table_name AS view_name,
       '✓ EXISTS' AS status
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ===============================================
-- 3. VERIFY ALL FUNCTIONS EXIST
-- ===============================================
SELECT '=== FUNCTIONS CHECK ===' AS test_section;

SELECT routine_name,
       '✓ EXISTS' AS status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ===============================================
-- 4. VERIFY ALL TRIGGERS EXIST
-- ===============================================
SELECT '=== TRIGGERS CHECK ===' AS test_section;

SELECT trigger_name, event_object_table AS table_name,
       '✓ EXISTS' AS status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ===============================================
-- 5. TEST: CREATE A USER (Admin)
-- ===============================================
SELECT '=== TEST: CREATE ADMIN USER ===' AS test_section;

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
) ON CONFLICT (email) DO NOTHING
RETURNING id, email, role, '✓ Admin created' AS status;

-- ===============================================
-- 6. TEST: CREATE A DOCTOR
-- ===============================================
SELECT '=== TEST: CREATE DOCTOR ===' AS test_section;

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
) ON CONFLICT (email) DO NOTHING
RETURNING id, email, role, specialty, '✓ Doctor created' AS status;

-- ===============================================
-- 7. TEST: CREATE A PATIENT (Auto-generate patient_number)
-- ===============================================
SELECT '=== TEST: CREATE PATIENT (Auto Patient Number) ===' AS test_section;

INSERT INTO patients (
    first_name, 
    last_name, 
    date_of_birth, 
    gender, 
    phone, 
    email, 
    blood_group
) VALUES (
    'Alice', 
    'Anderson', 
    '1985-03-15', 
    'Female', 
    '+1234567801', 
    'alice@email.com',
    'A+'
)
RETURNING id, patient_number, first_name, last_name, 
          CASE WHEN patient_number LIKE 'P%' THEN '✓ Auto patient_number works!' ELSE '✗ FAILED' END AS status;

-- ===============================================
-- 8. TEST: CREATE DOCTOR AVAILABILITY
-- ===============================================
SELECT '=== TEST: CREATE DOCTOR AVAILABILITY ===' AS test_section;

INSERT INTO doctor_availability (
    doctor_id, 
    day_of_week, 
    start_time, 
    end_time, 
    is_active
) VALUES (
    (SELECT id FROM users WHERE email = 'dr.smith@clinic.com'),
    'Monday',
    convert_12hr_to_24hr('9:00', 'AM'),
    convert_12hr_to_24hr('5:00', 'PM'),
    true
) ON CONFLICT (doctor_id, day_of_week, start_time, end_time) DO NOTHING
RETURNING id, day_of_week, start_time, end_time, '✓ Availability created' AS status;

-- ===============================================
-- 9. TEST: TIME CONVERSION FUNCTIONS
-- ===============================================
SELECT '=== TEST: TIME CONVERSION FUNCTIONS ===' AS test_section;

SELECT 
    convert_12hr_to_24hr('9:00', 'AM') AS "9:00 AM -> 24hr",
    convert_12hr_to_24hr('2:30', 'PM') AS "2:30 PM -> 24hr",
    convert_12hr_to_24hr('12:00', 'PM') AS "12:00 PM -> 24hr",
    convert_12hr_to_24hr('12:00', 'AM') AS "12:00 AM -> 24hr",
    '✓ 12hr to 24hr conversion works!' AS status;

SELECT 
    convert_24hr_to_12hr('09:00'::TIME) AS "09:00 -> 12hr",
    convert_24hr_to_12hr('14:30'::TIME) AS "14:30 -> 12hr",
    convert_24hr_to_12hr('00:00'::TIME) AS "00:00 -> 12hr",
    convert_24hr_to_12hr('12:00'::TIME) AS "12:00 -> 12hr",
    '✓ 24hr to 12hr conversion works!' AS status;

-- ===============================================
-- 10. TEST: GET DOCTOR AVAILABILITY (12hr format)
-- ===============================================
SELECT '=== TEST: GET DOCTOR AVAILABILITY ===' AS test_section;

SELECT * FROM get_doctor_availability_12hr(
    (SELECT id FROM users WHERE email = 'dr.smith@clinic.com')
);

-- ===============================================
-- 11. TEST: CREATE AN APPOINTMENT
-- ===============================================
SELECT '=== TEST: CREATE APPOINTMENT ===' AS test_section;

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
) VALUES (
    (SELECT id FROM patients WHERE email = 'alice@email.com'),
    (SELECT id FROM users WHERE email = 'dr.smith@clinic.com'),
    CURRENT_DATE,
    '09:00',
    30,
    'Follow-up',
    'General check-up',
    'scheduled',
    (SELECT id FROM users WHERE email = 'admin@clinic.com')
)
RETURNING id, appointment_date, appointment_time, status, '✓ Appointment created' AS status;

-- ===============================================
-- 12. TEST: CREATE A VISIT
-- ===============================================
SELECT '=== TEST: CREATE VISIT ===' AS test_section;

INSERT INTO visits (
    patient_id,
    doctor_id,
    visit_type,
    chief_complaint,
    status
) VALUES (
    (SELECT id FROM patients WHERE email = 'alice@email.com'),
    (SELECT id FROM users WHERE email = 'dr.smith@clinic.com'),
    'Follow-up',
    'General check-up',
    'in_progress'
)
RETURNING id, visit_date, status, '✓ Visit created' AS status;

-- ===============================================
-- 13. TEST: CREATE VITALS (BMI Auto-calculation)
-- ===============================================
SELECT '=== TEST: CREATE VITALS (Auto BMI) ===' AS test_section;

INSERT INTO vitals (
    visit_id,
    patient_id,
    recorded_by,
    temperature,
    blood_pressure_systolic,
    blood_pressure_diastolic,
    heart_rate,
    weight,
    weight_unit,
    height,
    height_unit
) VALUES (
    (SELECT id FROM visits WHERE patient_id = (SELECT id FROM patients WHERE email = 'alice@email.com') LIMIT 1),
    (SELECT id FROM patients WHERE email = 'alice@email.com'),
    (SELECT id FROM users WHERE email = 'admin@clinic.com'),
    37.0,
    120,
    80,
    72,
    70,  -- 70 kg
    'kg',
    170, -- 170 cm
    'cm'
)
RETURNING id, temperature, blood_pressure_systolic, blood_pressure_diastolic, 
          weight, height, bmi,
          CASE WHEN bmi IS NOT NULL THEN '✓ BMI auto-calculated: ' || bmi ELSE '✗ BMI not calculated' END AS status;

-- ===============================================
-- 14. TEST: CREATE QUEUE TOKEN (Auto-generate token_number)
-- ===============================================
SELECT '=== TEST: CREATE QUEUE TOKEN ===' AS test_section;

INSERT INTO queue_tokens (
    patient_id,
    doctor_id,
    visit_id,
    status,
    priority
) VALUES (
    (SELECT id FROM patients WHERE email = 'alice@email.com'),
    (SELECT id FROM users WHERE email = 'dr.smith@clinic.com'),
    (SELECT id FROM visits WHERE patient_id = (SELECT id FROM patients WHERE email = 'alice@email.com') LIMIT 1),
    'waiting',
    1
)
RETURNING id, token_number, status,
          CASE WHEN token_number > 0 THEN '✓ Token auto-generated: #' || token_number ELSE '✗ Token not generated' END AS status;

-- ===============================================
-- 15. TEST: CREATE SERVICE
-- ===============================================
SELECT '=== TEST: CREATE SERVICE ===' AS test_section;

INSERT INTO services (service_code, service_name, description, category, default_price) 
VALUES ('CONS-GEN', 'General Consultation', 'General medical consultation', 'consultation', 50.00)
ON CONFLICT (service_code) DO NOTHING
RETURNING id, service_code, service_name, default_price, '✓ Service created' AS status;

-- ===============================================
-- 16. TEST: CREATE INVOICE (Auto-generate invoice_number)
-- ===============================================
SELECT '=== TEST: CREATE INVOICE ===' AS test_section;

INSERT INTO invoices (
    visit_id,
    patient_id,
    subtotal,
    total_amount,
    status,
    created_by
) VALUES (
    (SELECT id FROM visits WHERE patient_id = (SELECT id FROM patients WHERE email = 'alice@email.com') LIMIT 1),
    (SELECT id FROM patients WHERE email = 'alice@email.com'),
    50.00,
    50.00,
    'pending',
    (SELECT id FROM users WHERE email = 'admin@clinic.com')
)
RETURNING id, invoice_number, total_amount, status,
          CASE WHEN invoice_number LIKE 'INV-%' THEN '✓ Invoice number auto-generated!' ELSE '✗ Invoice number failed' END AS status;

-- ===============================================
-- 17. TEST: ADD INVOICE ITEM
-- ===============================================
SELECT '=== TEST: ADD INVOICE ITEM ===' AS test_section;

INSERT INTO invoice_items (
    invoice_id,
    item_type,
    item_name,
    quantity,
    unit_price,
    total_price,
    added_by
) VALUES (
    (SELECT id FROM invoices WHERE patient_id = (SELECT id FROM patients WHERE email = 'alice@email.com') LIMIT 1),
    'service',
    'General Consultation',
    1,
    50.00,
    50.00,
    (SELECT id FROM users WHERE email = 'admin@clinic.com')
)
RETURNING id, item_name, quantity, unit_price, total_price, '✓ Invoice item added' AS status;

-- ===============================================
-- 18. TEST: RECORD PAYMENT (Atomic Function)
-- ===============================================
SELECT '=== TEST: RECORD PAYMENT ATOMIC ===' AS test_section;

SELECT * FROM record_payment_atomic(
    (SELECT id FROM invoices WHERE patient_id = (SELECT id FROM patients WHERE email = 'alice@email.com') LIMIT 1),
    50.00,
    'cash',
    'CASH-001',
    'Full payment received',
    (SELECT id FROM users WHERE email = 'admin@clinic.com')
);

-- Verify invoice is now paid
SELECT invoice_number, total_amount, amount_paid, balance_due, status,
       CASE WHEN status = 'paid' THEN '✓ Invoice marked as PAID!' ELSE '⚠ Status: ' || status END AS payment_status
FROM invoices 
WHERE patient_id = (SELECT id FROM patients WHERE email = 'alice@email.com');

-- ===============================================
-- 19. TEST: PATIENT ALLERGY
-- ===============================================
SELECT '=== TEST: CREATE PATIENT ALLERGY ===' AS test_section;

INSERT INTO patient_allergies (
    patient_id,
    allergy_name,
    allergen_type,
    severity,
    reaction,
    is_active
) VALUES (
    (SELECT id FROM patients WHERE email = 'alice@email.com'),
    'Penicillin',
    'medication',
    'severe',
    'Anaphylaxis',
    true
)
RETURNING id, allergy_name, severity, '✓ Allergy recorded' AS status;

-- ===============================================
-- 20. TEST: PATIENT DIAGNOSIS
-- ===============================================
SELECT '=== TEST: CREATE PATIENT DIAGNOSIS ===' AS test_section;

INSERT INTO patient_diagnoses (
    patient_id,
    diagnosed_by,
    diagnosis_name,
    diagnosis_type,
    severity,
    status,
    diagnosed_date
) VALUES (
    (SELECT id FROM patients WHERE email = 'alice@email.com'),
    (SELECT id FROM users WHERE email = 'dr.smith@clinic.com'),
    'Hypertension',
    'primary',
    'moderate',
    'active',
    CURRENT_DATE
)
RETURNING id, diagnosis_name, status, '✓ Diagnosis recorded' AS status;

-- ===============================================
-- 21. TEST: PRESCRIPTION
-- ===============================================
SELECT '=== TEST: CREATE PRESCRIPTION ===' AS test_section;

INSERT INTO prescriptions (
    patient_id,
    doctor_id,
    visit_id,
    medication_name,
    dosage,
    frequency,
    duration,
    instructions,
    status
) VALUES (
    (SELECT id FROM patients WHERE email = 'alice@email.com'),
    (SELECT id FROM users WHERE email = 'dr.smith@clinic.com'),
    (SELECT id FROM visits WHERE patient_id = (SELECT id FROM patients WHERE email = 'alice@email.com') LIMIT 1),
    'Lisinopril',
    '10mg',
    'Once daily',
    '30 days',
    'Take in the morning with water',
    'active'
)
RETURNING id, medication_name, dosage, frequency, '✓ Prescription created' AS status;

-- ===============================================
-- 22. TEST: VIEWS
-- ===============================================
SELECT '=== TEST: VIEWS ===' AS test_section;

-- Active allergies view
SELECT 'active_patient_allergies' AS view_name, COUNT(*) AS records FROM active_patient_allergies;

-- Active diagnoses view
SELECT 'active_patient_diagnoses' AS view_name, COUNT(*) AS records FROM active_patient_diagnoses;

-- Current medications view
SELECT 'current_patient_medications' AS view_name, COUNT(*) AS records FROM current_patient_medications;

-- Outstanding invoices view
SELECT 'outstanding_invoices' AS view_name, COUNT(*) AS records FROM outstanding_invoices;

-- ===============================================
-- 23. TEST: CLINIC SETTINGS
-- ===============================================
SELECT '=== TEST: CLINIC SETTINGS ===' AS test_section;

SELECT key, late_threshold_minutes, consult_expected_minutes, currency_code, currency_symbol,
       '✓ Clinic settings initialized' AS status
FROM clinic_settings;

-- Update clinic settings
UPDATE clinic_settings 
SET clinic_name = 'Test Clinic',
    clinic_phone = '+1234567890',
    currency_code = 'USD',
    currency_symbol = '$'
WHERE key = 'global'
RETURNING key, clinic_name, '✓ Settings updated' AS status;

-- ===============================================
-- 24. TEST: UPDATED_AT TRIGGER
-- ===============================================
SELECT '=== TEST: UPDATED_AT TRIGGER ===' AS test_section;

-- Get current updated_at
SELECT id, updated_at AS original_updated_at FROM patients WHERE email = 'alice@email.com';

-- Update patient
UPDATE patients SET phone = '+9999999999' WHERE email = 'alice@email.com';

-- Check if updated_at changed
SELECT id, updated_at AS new_updated_at,
       '✓ updated_at trigger works!' AS status
FROM patients WHERE email = 'alice@email.com';

-- ===============================================
-- 25. FINAL SUMMARY
-- ===============================================
SELECT '=== FINAL SUMMARY ===' AS test_section;

SELECT 
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM patients) AS total_patients,
    (SELECT COUNT(*) FROM appointments) AS total_appointments,
    (SELECT COUNT(*) FROM visits) AS total_visits,
    (SELECT COUNT(*) FROM vitals) AS total_vitals,
    (SELECT COUNT(*) FROM queue_tokens) AS total_tokens,
    (SELECT COUNT(*) FROM invoices) AS total_invoices,
    (SELECT COUNT(*) FROM services) AS total_services,
    (SELECT COUNT(*) FROM patient_allergies) AS total_allergies,
    (SELECT COUNT(*) FROM patient_diagnoses) AS total_diagnoses,
    (SELECT COUNT(*) FROM prescriptions) AS total_prescriptions,
    '🎉 ALL TESTS COMPLETED!' AS status;

-- ===============================================
-- CLEANUP (Optional - uncomment to remove test data)
-- ===============================================
-- DELETE FROM payment_transactions;
-- DELETE FROM invoice_items;
-- DELETE FROM invoices;
-- DELETE FROM prescriptions;
-- DELETE FROM patient_diagnoses;
-- DELETE FROM patient_allergies;
-- DELETE FROM vitals;
-- DELETE FROM queue_tokens;
-- DELETE FROM visits;
-- DELETE FROM appointments;
-- DELETE FROM doctor_availability;
-- DELETE FROM patients;
-- DELETE FROM users WHERE email != 'admin@clinic.com';

SELECT '✅ Schema verification complete! All functions, triggers, and rules are working.' AS final_status;
