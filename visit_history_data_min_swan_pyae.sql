-- ===============================================
-- VISIT HISTORY DATA FOR MIN SWAN PYAE
-- Run this SQL in your Supabase SQL Editor
-- ===============================================

-- First, ensure required users exist (from seed data)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, specialty, license_number, is_active)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'doctor@clinic.com',
  '$2a$10$BNxTl9qVrUFJ5Rz9HGDDuuAYxlQVQA5iiEP5k6PLbTpOMFATLZnFe', -- bcrypt hash for 'doctor123'
  'John',
  'Smith',
  '555-2000',
  'doctor',
  'General Medicine',
  'MD12345',
  true
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_active)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'nurse@clinic.com',
  '$2a$10$oDVT/nLoD9.GIFGbD6enfeIp/WHuZI03NwmST4jV5tIJYSMxgNyOu', -- bcrypt hash for 'nurse123'
  'Sarah',
  'Johnson',
  '555-3000',
  'nurse',
  true
) ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_active)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'receptionist@clinic.com',
  '$2a$10$hs0.VJgHi9VgCEa2OUupHehPEmhp0q.34/9zIQcgQ7WAzfpI39gOK', -- bcrypt hash for 'recept123'
  'Emily',
  'Brown',
  '555-4000',
  'receptionist',
  true
) ON CONFLICT (email) DO NOTHING;

-- First, insert patient Min Swan Pyae if not exists
INSERT INTO patients (
    id,
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
    current_medications,
    insurance_provider,
    insurance_number,
    registration_date
) VALUES (
    '12345678-1234-1234-1234-123456789abc',
    'P001001',
    'Min Swan',
    'Pyae',
    '1995-03-15',
    'Male',
    '+95-9-123456789',
    'minswanpyae@email.com',
    'No. 123, Main Street, Yangon, Myanmar',
    'Daw Khin Mya',
    '+95-9-987654321',
    'Mother',
    'O+',
    'Penicillin allergy',
    'None',
    'None',
    'Myanmar Health Insurance',
    'MHI-123456',
    '2024-01-15 09:00:00'
) ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email;

-- Insert patient allergies
INSERT INTO patient_allergies (
    id,
    patient_id,
    allergy_name,
    allergen_type,
    severity,
    reaction,
    diagnosed_date,
    diagnosed_by,
    notes,
    is_active
) VALUES 
    (
        '11111111-2222-3333-4444-555566667777',
        '12345678-1234-1234-1234-123456789abc',
        'Penicillin',
        'medication',
        'severe',
        'Severe skin rash, difficulty breathing',
        '2024-02-15',
        '22222222-2222-2222-2222-222222222222', -- Dr. John Smith
        'Patient experienced anaphylactic reaction during previous treatment',
        true
    ),
    (
        '22222222-3333-4444-5555-666677778888',
        '12345678-1234-1234-1234-123456789abc',
        'Shellfish',
        'food',
        'moderate',
        'Hives, nausea, vomiting',
        '2024-03-10',
        '22222222-2222-2222-2222-222222222222', -- Dr. John Smith
        'Allergic reaction to prawns and crab',
        true
    )
ON CONFLICT (id) DO NOTHING;

-- Insert patient diagnoses
INSERT INTO patient_diagnoses (
    id,
    patient_id,
    diagnosed_by,
    diagnosis_code,
    diagnosis_name,
    diagnosis_type,
    severity,
    status,
    diagnosed_date,
    onset_date,
    notes
) VALUES 
    (
        '33333333-4444-5555-6666-777788889999',
        '12345678-1234-1234-1234-123456789abc',
        '22222222-2222-2222-2222-222222222222', -- Dr. John Smith
        'J06.9',
        'Upper Respiratory Tract Infection',
        'primary',
        'mild',
        'resolved',
        '2024-09-15',
        '2024-09-12',
        'Viral upper respiratory infection, resolved with symptomatic treatment'
    ),
    (
        '44444444-5555-6666-7777-888899990000',
        '12345678-1234-1234-1234-123456789abc',
        '22222222-2222-2222-2222-222222222222', -- Dr. John Smith
        'K30',
        'Functional Dyspepsia',
        'primary',
        'moderate',
        'active',
        '2024-10-01',
        '2024-09-28',
        'Chronic dyspepsia, ongoing management with dietary modifications'
    )
ON CONFLICT (id) DO NOTHING;

-- Insert visit records
INSERT INTO visits (
    id,
    patient_id,
    doctor_id,
    visit_date,
    visit_type,
    chief_complaint,
    history_of_present_illness,
    diagnosis,
    treatment_plan,
    follow_up_instructions,
    status,
    total_cost,
    payment_status
) VALUES 
    -- Visit 1: September 15, 2024 - Upper Respiratory Infection
    (
        '55555555-6666-7777-8888-999900001111',
        '12345678-1234-1234-1234-123456789abc',
        '22222222-2222-2222-2222-222222222222', -- Dr. John Smith
        '2024-09-15 10:30:00',
        'General Consultation',
        'Cough and sore throat for 3 days',
        'Patient presents with productive cough, sore throat, and mild fever for the past 3 days. No shortness of breath or chest pain. Symptoms started gradually.',
        'Upper Respiratory Tract Infection (J06.9)',
        'Symptomatic treatment with rest, increased fluid intake, and supportive medications',
        'Return if symptoms worsen or persist beyond 7 days. Avoid contact with others until fever-free for 24 hours.',
        'completed',
        25000.00,
        'paid'
    ),
    -- Visit 2: October 1, 2024 - Stomach Issues
    (
        '66666666-7777-8888-9999-000011112222',
        '12345678-1234-1234-1234-123456789abc',
        '22222222-2222-2222-2222-222222222222', -- Dr. John Smith
        '2024-10-01 14:15:00',
        'General Consultation',
        'Stomach pain and indigestion for 1 week',
        'Patient complains of epigastric pain, bloating, and early satiety for the past week. Pain is worse after meals. No vomiting or diarrhea. Appetite decreased.',
        'Functional Dyspepsia (K30)',
        'Dietary modifications, avoid spicy foods, small frequent meals. PPI therapy initiated.',
        'Follow up in 2 weeks. Keep food diary. Return immediately if severe pain or vomiting occurs.',
        'completed',
        30000.00,
        'paid'
    ),
    -- Visit 3: October 8, 2024 - Follow-up
    (
        '77777777-8888-9999-0000-111122223333',
        '12345678-1234-1234-1234-123456789abc',
        '22222222-2222-2222-2222-222222222222', -- Dr. John Smith
        '2024-10-08 09:45:00',
        'Follow-up',
        'Follow-up for stomach issues',
        'Patient returns for follow-up. Reports moderate improvement in symptoms with dietary changes. Still experiencing occasional bloating but pain much reduced.',
        'Functional Dyspepsia (K30) - improving',
        'Continue current management. Consider H. pylori testing if no further improvement.',
        'Continue dietary modifications. Return in 4 weeks or if symptoms worsen.',
        'completed',
        20000.00,
        'paid'
    )
ON CONFLICT (id) DO NOTHING;

-- Insert vitals for each visit
INSERT INTO vitals (
    id,
    visit_id,
    patient_id,
    recorded_by,
    temperature,
    blood_pressure_systolic,
    blood_pressure_diastolic,
    heart_rate,
    respiratory_rate,
    oxygen_saturation,
    weight,
    height,
    pain_level,
    notes,
    recorded_at
) VALUES 
    -- Vitals for Visit 1 (September 15, 2024)
    (
        '88888888-9999-0000-1111-222233334444',
        '55555555-6666-7777-8888-999900001111',
        '12345678-1234-1234-1234-123456789abc',
        '33333333-3333-3333-3333-333333333333', -- Nurse Sarah Johnson
        37.8,
        120,
        80,
        88,
        18,
        98.5,
        70.5,
        175.0,
        3,
        'Patient appears slightly unwell, mild fever present',
        '2024-09-15 10:15:00'
    ),
    -- Vitals for Visit 2 (October 1, 2024)
    (
        '99999999-0000-1111-2222-333344445555',
        '66666666-7777-8888-9999-000011112222',
        '12345678-1234-1234-1234-123456789abc',
        '33333333-3333-3333-3333-333333333333', -- Nurse Sarah Johnson
        36.5,
        125,
        82,
        75,
        16,
        99.0,
        70.0,
        175.0,
        5,
        'Patient complaining of abdominal discomfort, appears anxious',
        '2024-10-01 14:00:00'
    ),
    -- Vitals for Visit 3 (October 8, 2024)
    (
        '00000000-1111-2222-3333-444455556666',
        '77777777-8888-9999-0000-111122223333',
        '12345678-1234-1234-1234-123456789abc',
        '33333333-3333-3333-3333-333333333333', -- Nurse Sarah Johnson
        36.2,
        118,
        78,
        72,
        16,
        99.2,
        70.2,
        175.0,
        2,
        'Patient appears much better, symptoms improving',
        '2024-10-08 09:30:00'
    )
ON CONFLICT (id) DO NOTHING;

-- Insert prescriptions for each visit
INSERT INTO prescriptions (
    id,
    visit_id,
    patient_id,
    doctor_id,
    medication_name,
    dosage,
    frequency,
    duration,
    quantity,
    refills,
    instructions,
    status,
    prescribed_date,
    start_date,
    end_date
) VALUES 
    -- Prescriptions for Visit 1 (Upper Respiratory Infection)
    (
        '11111111-1111-2222-3333-444455556666',
        '55555555-6666-7777-8888-999900001111',
        '12345678-1234-1234-1234-123456789abc',
        '22222222-2222-2222-2222-222222222222',
        'Paracetamol',
        '500mg',
        'Every 6 hours as needed',
        '5 days',
        20,
        0,
        'Take with food. Do not exceed 4 doses per day. For fever and pain relief.',
        'completed',
        '2024-09-15 10:30:00',
        '2024-09-15',
        '2024-09-20'
    ),
    (
        '22222222-2222-3333-4444-555566667777',
        '55555555-6666-7777-8888-999900001111',
        '12345678-1234-1234-1234-123456789abc',
        '22222222-2222-2222-2222-222222222222',
        'Dextromethorphan Syrup',
        '15ml',
        'Three times daily',
        '7 days',
        1,
        0,
        'Take after meals. For cough suppression. Shake well before use.',
        'completed',
        '2024-09-15 10:30:00',
        '2024-09-15',
        '2024-09-22'
    ),
    -- Prescriptions for Visit 2 (Dyspepsia)
    (
        '33333333-3333-4444-5555-666677778888',
        '66666666-7777-8888-9999-000011112222',
        '12345678-1234-1234-1234-123456789abc',
        '22222222-2222-2222-2222-222222222222',
        'Omeprazole',
        '20mg',
        'Once daily before breakfast',
        '4 weeks',
        28,
        1,
        'Take 30 minutes before breakfast on empty stomach. For acid reduction.',
        'active',
        '2024-10-01 14:15:00',
        '2024-10-01',
        '2024-10-29'
    ),
    (
        '44444444-4444-5555-6666-777788889999',
        '66666666-7777-8888-9999-000011112222',
        '12345678-1234-1234-1234-123456789abc',
        '22222222-2222-2222-2222-222222222222',
        'Simethicone',
        '40mg',
        'Three times daily after meals',
        '2 weeks',
        42,
        0,
        'Take after meals for gas and bloating relief. Chew thoroughly if tablets.',
        'completed',
        '2024-10-01 14:15:00',
        '2024-10-01',
        '2024-10-15'
    ),
    -- Prescriptions for Visit 3 (Follow-up)
    (
        '55555555-5555-6666-7777-888899990000',
        '77777777-8888-9999-0000-111122223333',
        '12345678-1234-1234-1234-123456789abc',
        '22222222-2222-2222-2222-222222222222',
        'Omeprazole',
        '20mg',
        'Once daily before breakfast',
        '4 weeks',
        28,
        1,
        'Continue current dosage. Take 30 minutes before breakfast on empty stomach.',
        'active',
        '2024-10-08 09:45:00',
        '2024-10-08',
        '2024-11-05'
    )
ON CONFLICT (id) DO NOTHING;

-- Insert doctor notes for each visit
INSERT INTO doctor_notes (
    id,
    visit_id,
    patient_id,
    doctor_id,
    note_type,
    content,
    is_private
) VALUES 
    -- Notes for Visit 1
    (
        '66666666-6666-7777-8888-999900001111',
        '55555555-6666-7777-8888-999900001111',
        '12345678-1234-1234-1234-123456789abc',
        '22222222-2222-2222-2222-222222222222',
        'assessment',
        'Patient presents with classic symptoms of viral upper respiratory tract infection. Physical examination reveals mild pharyngeal erythema, no lymphadenopathy. Chest clear on auscultation.',
        false
    ),
    (
        '77777777-7777-8888-9999-000011112222',
        '55555555-6666-7777-8888-999900001111',
        '12345678-1234-1234-1234-123456789abc',
        '22222222-2222-2222-2222-222222222222',
        'plan',
        'Symptomatic treatment with analgesics and cough suppressant. Patient educated on self-care measures including rest and hydration. No antibiotics indicated for viral infection.',
        false
    ),
    -- Notes for Visit 2
    (
        '88888888-8888-9999-0000-111122223333',
        '66666666-7777-8888-9999-000011112222',
        '12345678-1234-1234-1234-123456789abc',
        '22222222-2222-2222-2222-222222222222',
        'assessment',
        'Patient presents with dyspeptic symptoms. Epigastric tenderness on examination. No alarm symptoms present. History suggests functional dyspepsia. Will start empirical PPI therapy.',
        false
    ),
    (
        '99999999-9999-0000-1111-222233334444',
        '66666666-7777-8888-9999-000011112222',
        '12345678-1234-1234-1234-123456789abc',
        '22222222-2222-2222-2222-222222222222',
        'plan',
        'Initiated PPI therapy and dietary counseling. Patient advised to avoid trigger foods, eat smaller frequent meals. Consider H. pylori testing if symptoms persist despite treatment.',
        false
    ),
    -- Notes for Visit 3
    (
        'aaaaaaaa-aaaa-1111-2222-333344445555',
        '77777777-8888-9999-0000-111122223333',
        '12345678-1234-1234-1234-123456789abc',
        '22222222-2222-2222-2222-222222222222',
        'assessment',
        'Patient reports good response to PPI therapy and dietary modifications. Symptoms much improved. No alarm symptoms. Physical examination unremarkable.',
        false
    ),
    (
        'bbbbbbbb-bbbb-2222-3333-444455556666',
        '77777777-8888-9999-0000-111122223333',
        '12345678-1234-1234-1234-123456789abc',
        '22222222-2222-2222-2222-222222222222',
        'plan',
        'Continue current PPI therapy for another 4 weeks. Maintain dietary modifications. Schedule follow-up in 4 weeks to assess treatment response. Consider step-down therapy if symptoms fully resolve.',
        false
    )
ON CONFLICT (id) DO NOTHING;

-- Create sample appointments for context
INSERT INTO appointments (
    id,
    patient_id,
    doctor_id,
    appointment_date,
    appointment_time,
    duration_minutes,
    appointment_type,
    reason_for_visit,
    status,
    notes,
    created_by
) VALUES 
    (
        'cccccccc-cccc-3333-4444-555566667777',
        '12345678-1234-1234-1234-123456789abc',
        '22222222-2222-2222-2222-222222222222',
        '2024-09-15',
        '10:30:00',
        30,
        'General Consultation',
        'Cough and sore throat',
        'completed',
        'Walk-in appointment for respiratory symptoms',
        '44444444-4444-4444-4444-444444444444'
    ),
    (
        'dddddddd-dddd-4444-5555-666677778888',
        '12345678-1234-1234-1234-123456789abc',
        '22222222-2222-2222-2222-222222222222',
        '2024-10-01',
        '14:15:00',
        30,
        'General Consultation',
        'Stomach problems',
        'completed',
        'Scheduled appointment for gastrointestinal symptoms',
        '44444444-4444-4444-4444-444444444444'
    ),
    (
        'eeeeeeee-eeee-5555-6666-777788889999',
        '12345678-1234-1234-1234-123456789abc',
        '22222222-2222-2222-2222-222222222222',
        '2024-10-08',
        '09:45:00',
        20,
        'Follow-up',
        'Follow-up for dyspepsia',
        'completed',
        'Follow-up appointment to assess treatment response',
        '44444444-4444-4444-4444-444444444444'
    )
ON CONFLICT (id) DO NOTHING;

-- Update the visits table to link with appointments
UPDATE visits SET appointment_id = 'cccccccc-cccc-3333-4444-555566667777' WHERE id = '55555555-6666-7777-8888-999900001111';
UPDATE visits SET appointment_id = 'dddddddd-dddd-4444-5555-666677778888' WHERE id = '66666666-7777-8888-9999-000011112222';
UPDATE visits SET appointment_id = 'eeeeeeee-eeee-5555-6666-777788889999' WHERE id = '77777777-8888-9999-0000-111122223333';

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 VISIT HISTORY DATA SUCCESSFULLY POPULATED! 🎉';
    RAISE NOTICE '';
    RAISE NOTICE '👤 Patient: Min Swan Pyae (Patient #P001001)';
    RAISE NOTICE '� Users: Dr. John Smith, Nurse Sarah Johnson, Receptionist Emily Brown';
    RAISE NOTICE '�📊 Data Created:';
    RAISE NOTICE '   • 3 User accounts (Doctor, Nurse, Receptionist)';
    RAISE NOTICE '   • 1 Patient record with complete demographics';
    RAISE NOTICE '   • 2 Allergies (Penicillin - severe, Shellfish - moderate)';
    RAISE NOTICE '   • 2 Diagnoses (URTI - resolved, Dyspepsia - active)';
    RAISE NOTICE '   • 3 Visits (Sep 15, Oct 1, Oct 8, 2024)';
    RAISE NOTICE '   • 3 Vitals records (temperature, BP, weight, etc.)';
    RAISE NOTICE '   • 5 Prescriptions (Paracetamol, Cough syrup, Omeprazole, etc.)';
    RAISE NOTICE '   • 6 Doctor notes (assessments and treatment plans)';
    RAISE NOTICE '   • 3 Appointments (linked to visits)';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Visit Summary:';
    RAISE NOTICE '   Visit 1 (Sep 15): Upper Respiratory Infection - RESOLVED';
    RAISE NOTICE '   Visit 2 (Oct 1): Functional Dyspepsia - ONGOING';
    RAISE NOTICE '   Visit 3 (Oct 8): Follow-up - IMPROVING';
    RAISE NOTICE '';
    RAISE NOTICE '💰 Total Costs: 75,000 MMK (All payments completed)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Ready to test visit history in the EMR system!';
    RAISE NOTICE '   Navigate to: Nurse Dashboard → Electronic Medical Records';
    RAISE NOTICE '   Search for: Min Swan Pyae';
    RAISE NOTICE '   Click: Visit History tab';
    RAISE NOTICE '';
END $$;