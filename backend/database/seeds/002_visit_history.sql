-- Sample visit history data for testing
-- Patient: Min Swan Pyae (dd6d5f91-b939-40ff-a47c-d4e17075978a)
-- Doctor: John Smith (22222222-2222-2222-2222-222222222222)

-- Visit 1: Recent visit (2 days ago)
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
) VALUES (
    '77777777-8888-9999-0000-111122223333',
    'dd6d5f91-b939-40ff-a47c-d4e17075978a',
    '22222222-2222-2222-2222-222222222222',
    NOW() - INTERVAL '2 days',
    'follow_up',
    'Follow-up for hypertension',
    'Patient reports feeling better since starting medication. Blood pressure has been stable. No side effects reported.',
    'Essential hypertension, controlled',
    'Continue current medication regimen. Monitor blood pressure daily.',
    'Return in 3 months for routine follow-up. Call if BP readings consistently above 140/90.',
    'completed',
    75.00,
    'paid'
) ON CONFLICT (id) DO NOTHING;

-- Visit 2: Previous visit (1 week ago)
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
) VALUES (
    '88888888-9999-0000-1111-222233334444',
    'dd6d5f91-b939-40ff-a47c-d4e17075978a',
    '22222222-2222-2222-2222-222222222222',
    NOW() - INTERVAL '1 week',
    'consultation',
    'Headache and dizziness',
    'Patient complains of persistent headaches for the past 3 days, accompanied by mild dizziness. No fever. Blood pressure elevated.',
    'Headache, likely due to hypertension',
    'Started on antihypertensive medication. Rest and stress management.',
    'Follow up in 1 week to check blood pressure response.',
    'completed',
    120.00,
    'paid'
) ON CONFLICT (id) DO NOTHING;

-- Visit 3: Initial visit (1 month ago)
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
) VALUES (
    '99999999-0000-1111-2222-333344445555',
    'dd6d5f91-b939-40ff-a47c-d4e17075978a',
    '22222222-2222-2222-2222-222222222222',
    NOW() - INTERVAL '1 month',
    'initial_consultation',
    'General health checkup',
    'New patient seeking general health assessment. No specific complaints. Wants to establish care.',
    'General health assessment - overall healthy',
    'Routine health maintenance. Lifestyle counseling provided.',
    'Return annually for routine physical. Maintain healthy diet and exercise.',
    'completed',
    150.00,
    'paid'
) ON CONFLICT (id) DO NOTHING;

-- Related tables: Let's add some sample allergies, diagnoses, and prescriptions

-- Patient allergies
INSERT INTO patient_allergies (
    id,
    patient_id,
    allergy_name,
    allergen_type,
    severity,
    reaction,
    diagnosed_date
) VALUES (
    'aaaa1111-bbbb-2222-cccc-333344445555',
    'dd6d5f91-b939-40ff-a47c-d4e17075978a',
    'Penicillin',
    'medication',
    'severe',
    'Rash and difficulty breathing',
    NOW() - INTERVAL '1 month'
) ON CONFLICT (id) DO NOTHING;

-- Visit diagnoses (linking diagnoses to specific visits)
INSERT INTO visit_diagnoses (
    id,
    visit_id,
    diagnosis_name,
    icd_10_code,
    category,
    status,
    severity,
    notes
) VALUES 
(
    'dddd1111-eeee-2222-ffff-333344445555',
    '77777777-8888-9999-0000-111122223333',
    'Essential hypertension',
    'I10',
    'cardiovascular',
    'active',
    'moderate',
    'Well controlled with medication'
),
(
    'eeee2222-ffff-3333-gggg-444455556666',
    '88888888-9999-0000-1111-222233334444',
    'Tension headache',
    'G44.209',
    'neurological',
    'resolved',
    'mild',
    'Related to elevated blood pressure'
) ON CONFLICT (id) DO NOTHING;

-- Prescriptions
INSERT INTO prescriptions (
    id,
    visit_id,
    patient_id,
    medication_name,
    dosage,
    frequency,
    duration,
    instructions,
    status,
    prescribed_date
) VALUES 
(
    'ffff1111-gggg-2222-hhhh-333344445555',
    '88888888-9999-0000-1111-222233334444',
    'dd6d5f91-b939-40ff-a47c-d4e17075978a',
    'Lisinopril',
    '10mg',
    'once daily',
    '30 days',
    'Take in the morning with water. Monitor blood pressure daily.',
    'active',
    NOW() - INTERVAL '1 week'
),
(
    'gggg2222-hhhh-3333-iiii-444455556666',
    '88888888-9999-0000-1111-222233334444',
    'dd6d5f91-b939-40ff-a47c-d4e17075978a',
    'Ibuprofen',
    '400mg',
    'as needed',
    '5 days',
    'Take with food for headache. Do not exceed 3 times daily.',
    'completed',
    NOW() - INTERVAL '1 week'
) ON CONFLICT (id) DO NOTHING;

-- Services (for billing/cost tracking)
INSERT INTO services (
    id,
    visit_id,
    service_name,
    description,
    cost,
    category
) VALUES 
(
    'hhhh1111-iiii-2222-jjjj-333344445555',
    '77777777-8888-9999-0000-111122223333',
    'Follow-up Consultation',
    'Routine follow-up visit for hypertension management',
    75.00,
    'consultation'
),
(
    'iiii2222-jjjj-3333-kkkk-444455556666',
    '88888888-9999-0000-1111-222233334444',
    'Medical Consultation',
    'Consultation for headache and blood pressure evaluation',
    120.00,
    'consultation'
),
(
    'jjjj3333-kkkk-4444-llll-555566667777',
    '99999999-0000-1111-2222-333344445555',
    'Initial Health Assessment',
    'Comprehensive initial patient evaluation and health assessment',
    150.00,
    'assessment'
) ON CONFLICT (id) DO NOTHING;