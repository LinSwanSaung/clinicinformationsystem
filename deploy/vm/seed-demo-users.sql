BEGIN;

-- Staff and portal accounts. Passwords match the login screen test credentials.
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, specialty, license_number, is_active)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'admin@clinic.com', '$2a$12$BS4SR0hCzf0yNpdJOYoMvugmDD6BTXHvxwFiP1IqmSq.RTUcGcvNS', 'Admin', 'User', '+959400000001', 'admin', NULL, NULL, true),
  ('10000000-0000-0000-0000-000000000002', 'lin@gmail.com', '$2a$12$iHUT1Lalb5rrP07F06bjGOlDnzu7TN47PVuLhDw1tIYix/vJydEFi', 'Lin', 'Receptionist', '+959400000002', 'receptionist', NULL, NULL, true),
  ('10000000-0000-0000-0000-000000000003', 'chue@gmail.com', '$2a$12$BsE9hCeoWNOp6EF/fFT4zepumcUXyR/Oa.W3VQK.WkVcazhD7T1iS', 'Chue', 'Nurse', '+959400000003', 'nurse', NULL, 'NUR-2026-001', true),
  ('10000000-0000-0000-0000-000000000004', 'zawoo@gmail.com', '$2a$12$D3jSUzwfV78gX/mbmtbSDep04YnJUmCUN7C/weAPNiHjjBGdZwm8.', 'Zaw Oo', 'Doctor', '+959400000004', 'doctor', 'General Practice', 'MDC-2026-104', true),
  ('10000000-0000-0000-0000-000000000005', 'cashier1@gmail.com', '$2a$12$5HCIDZ4yGQOzesdSUr2li.f42r7hX808uJtcn6mqeMHx0ddJ2EOCO', 'Cashier', 'User', '+959400000005', 'cashier', NULL, NULL, true),
  ('10000000-0000-0000-0000-000000000006', 'adamthegreat169@gmail.com', '$2a$12$o3/V2OEtn0I5Quob18ytneTCyw5f8m6bpxzudNar5DvB2qjmnnEOi', 'Adam', 'Patient', '+959400000006', 'patient', NULL, NULL, true)
ON CONFLICT (email) DO UPDATE SET
  id = EXCLUDED.id,
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  specialty = EXCLUDED.specialty,
  license_number = EXCLUDED.license_number,
  is_active = true,
  updated_at = NOW();

-- Patients for search, queue, EMR, portal, and billing workflows.
INSERT INTO patients (
  id, patient_number, first_name, last_name, date_of_birth, gender, phone, email, address,
  emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
  blood_group, allergies, medical_conditions, current_medications, insurance_provider, insurance_number, is_active
)
VALUES
  ('20000000-0000-0000-0000-000000000001', 'P-2026-0001', 'Adam', 'Patient', '1998-07-26', 'Male', '+959421111001', 'adamthegreat169@gmail.com', 'Sanchaung Township, Yangon', 'Daw Mya', '+959421111901', 'Mother', 'O+', 'Penicillin', 'Mild asthma', 'Salbutamol inhaler as needed', 'Self Pay', 'SELF-001', true),
  ('20000000-0000-0000-0000-000000000002', 'P-2026-0002', 'May', 'Hnin', '1985-03-12', 'Female', '+959421111002', 'may.hnin@example.com', 'Ahlone Township, Yangon', 'Ko Min', '+959421111902', 'Husband', 'A+', 'None known', 'Hypertension', 'Amlodipine 5mg daily', 'AIA Myanmar', 'AIA-4582', true),
  ('20000000-0000-0000-0000-000000000003', 'P-2026-0003', 'Ko', 'Min Thu', '1976-11-03', 'Male', '+959421111003', 'min.thu@example.com', 'Kamayut Township, Yangon', 'Ma Ei', '+959421111903', 'Sister', 'B+', 'Seafood', 'Type 2 diabetes', 'Metformin 500mg twice daily', 'Self Pay', 'SELF-003', true),
  ('20000000-0000-0000-0000-000000000004', 'P-2026-0004', 'Su', 'Yadanar', '2012-09-18', 'Female', '+959421111004', 'su.yadanar@example.com', 'Tamwe Township, Yangon', 'U Hla', '+959421111904', 'Father', 'AB+', 'Dust mites', 'Allergic rhinitis', 'Cetirizine as needed', 'Family Care', 'FC-7712', true),
  ('20000000-0000-0000-0000-000000000005', 'P-2026-0005', 'Aung', 'Kyaw', '1964-01-21', 'Male', '+959421111005', 'aung.kyaw@example.com', 'Thingangyun Township, Yangon', 'Daw Khin', '+959421111905', 'Wife', 'O-', 'Aspirin sensitivity', 'Chronic gastritis', 'Omeprazole 20mg daily', 'Self Pay', 'SELF-005', true),
  ('20000000-0000-0000-0000-000000000006', 'P-2026-0006', 'Nandar', 'Win', '1992-05-07', 'Female', '+959421111006', 'nandar.win@example.com', 'Bahan Township, Yangon', 'Ma Phyo', '+959421111906', 'Friend', 'A-', 'None known', 'Pregnancy - second trimester', 'Prenatal vitamins', 'MotherCare', 'MC-1020', true)
ON CONFLICT (id) DO UPDATE SET
  patient_number = EXCLUDED.patient_number,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  date_of_birth = EXCLUDED.date_of_birth,
  gender = EXCLUDED.gender,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  address = EXCLUDED.address,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
  blood_group = EXCLUDED.blood_group,
  allergies = EXCLUDED.allergies,
  medical_conditions = EXCLUDED.medical_conditions,
  current_medications = EXCLUDED.current_medications,
  insurance_provider = EXCLUDED.insurance_provider,
  insurance_number = EXCLUDED.insurance_number,
  is_active = true,
  updated_at = NOW();

UPDATE users
SET patient_id = '20000000-0000-0000-0000-000000000001', updated_at = NOW()
WHERE id = '10000000-0000-0000-0000-000000000006';

UPDATE clinic_settings
SET
  clinic_name = 'ThriveCare Demo Clinic',
  clinic_phone = '+95 9 400 000 000',
  clinic_email = 'hello@thrivecare.local',
  clinic_address = 'No. 21, Pyay Road, Yangon',
  currency_code = 'MMK',
  currency_symbol = 'Ks',
  late_threshold_minutes = 7,
  consult_expected_minutes = 15,
  updated_at = NOW()
WHERE key = 'global';

INSERT INTO doctor_availability (id, doctor_id, day_of_week, start_time, end_time, is_active)
VALUES
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'Monday', '09:00', '12:00', true),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'Tuesday', '09:00', '12:00', true),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'Wednesday', '13:00', '17:00', true),
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'Thursday', '09:00', '12:00', true),
  ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004', 'Friday', '09:00', '15:00', true)
ON CONFLICT (id) DO UPDATE SET
  day_of_week = EXCLUDED.day_of_week,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  is_active = true,
  updated_at = NOW();

INSERT INTO services (id, service_code, service_name, description, category, default_price, is_active)
VALUES
  ('40000000-0000-0000-0000-000000000001', 'CONS-GP', 'General Consultation', 'Standard outpatient doctor consultation', 'consultation', 15000, true),
  ('40000000-0000-0000-0000-000000000002', 'CONS-FU', 'Follow-up Consultation', 'Follow-up visit within 14 days', 'consultation', 8000, true),
  ('40000000-0000-0000-0000-000000000003', 'VITALS', 'Vitals Assessment', 'Nurse triage and vital signs assessment', 'procedure', 3000, true),
  ('40000000-0000-0000-0000-000000000004', 'LAB-CBC', 'Complete Blood Count', 'CBC laboratory test', 'laboratory', 18000, true),
  ('40000000-0000-0000-0000-000000000005', 'LAB-GLU', 'Blood Glucose Test', 'Random or fasting glucose test', 'laboratory', 7000, true),
  ('40000000-0000-0000-0000-000000000006', 'XR-CHEST', 'Chest X-Ray', 'Basic chest radiography', 'imaging', 25000, true),
  ('40000000-0000-0000-0000-000000000007', 'NEB', 'Nebulization', 'Nebulizer treatment session', 'procedure', 10000, true),
  ('40000000-0000-0000-0000-000000000008', 'MED-OTC', 'Medication Charge', 'Manual medication billing item', 'pharmacy', 5000, true)
ON CONFLICT (id) DO UPDATE SET
  service_code = EXCLUDED.service_code,
  service_name = EXCLUDED.service_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  default_price = EXCLUDED.default_price,
  is_active = true,
  updated_at = NOW();

-- Today's appointment and queue board.
INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, duration_minutes, appointment_type, reason_for_visit, status, notes, created_by)
VALUES
  ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', CURRENT_DATE, '09:00', 15, 'Walk-in', 'Cough and wheezing for 3 days', 'ready_for_doctor', 'Vitals completed; ready for consultation.', '10000000-0000-0000-0000-000000000002'),
  ('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', CURRENT_DATE, '09:20', 15, 'Scheduled', 'Blood pressure follow-up', 'waiting', 'Checked in and waiting.', '10000000-0000-0000-0000-000000000002'),
  ('50000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', CURRENT_DATE, '09:40', 20, 'Scheduled', 'Diabetes review and medication refill', 'consulting', 'Doctor currently consulting.', '10000000-0000-0000-0000-000000000002'),
  ('50000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', CURRENT_DATE, '10:10', 15, 'Walk-in', 'Sneezing and itchy eyes', 'scheduled', 'Not checked in yet.', '10000000-0000-0000-0000-000000000002'),
  ('50000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004', CURRENT_DATE - INTERVAL '1 day', '14:00', 20, 'Scheduled', 'Gastritis review', 'completed', 'Completed yesterday.', '10000000-0000-0000-0000-000000000002'),
  ('50000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000004', CURRENT_DATE + INTERVAL '1 day', '10:00', 20, 'Antenatal', 'Routine antenatal check', 'scheduled', 'Tomorrow booking.', '10000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO UPDATE SET
  appointment_date = EXCLUDED.appointment_date,
  appointment_time = EXCLUDED.appointment_time,
  duration_minutes = EXCLUDED.duration_minutes,
  appointment_type = EXCLUDED.appointment_type,
  reason_for_visit = EXCLUDED.reason_for_visit,
  status = EXCLUDED.status,
  notes = EXCLUDED.notes,
  updated_at = NOW();

INSERT INTO visits (id, patient_id, doctor_id, appointment_id, visit_date, visit_type, chief_complaint, history_of_present_illness, diagnosis, treatment_plan, follow_up_instructions, status, total_cost, payment_status, visit_start_time, visit_end_time)
VALUES
  ('60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000001', NOW() - INTERVAL '45 minutes', 'Walk-in', 'Cough and wheezing', 'Dry cough, mild wheeze, no fever.', NULL, NULL, NULL, 'in_progress', 28000, 'pending', NOW() - INTERVAL '45 minutes', NULL),
  ('60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000003', NOW() - INTERVAL '25 minutes', 'Scheduled', 'Diabetes review', 'Fasting sugar elevated at home.', 'Type 2 diabetes mellitus', 'Continue metformin, add diet counselling, check glucose.', 'Follow up in 4 weeks with glucose log.', 'in_progress', 30000, 'pending', NOW() - INTERVAL '25 minutes', NULL),
  ('60000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000005', NOW() - INTERVAL '1 day', 'Scheduled', 'Epigastric pain', 'Burning pain after meals, no bleeding symptoms.', 'Chronic gastritis', 'Continue PPI and avoid NSAIDs.', 'Return if black stool, vomiting blood, or worsening pain.', 'completed', 23000, 'paid', NOW() - INTERVAL '1 day 30 minutes', NOW() - INTERVAL '1 day 5 minutes')
ON CONFLICT (id) DO UPDATE SET
  visit_date = EXCLUDED.visit_date,
  chief_complaint = EXCLUDED.chief_complaint,
  history_of_present_illness = EXCLUDED.history_of_present_illness,
  diagnosis = EXCLUDED.diagnosis,
  treatment_plan = EXCLUDED.treatment_plan,
  follow_up_instructions = EXCLUDED.follow_up_instructions,
  status = EXCLUDED.status,
  total_cost = EXCLUDED.total_cost,
  payment_status = EXCLUDED.payment_status,
  visit_start_time = EXCLUDED.visit_start_time,
  visit_end_time = EXCLUDED.visit_end_time,
  updated_at = NOW();

INSERT INTO queue_tokens (id, token_number, patient_id, doctor_id, appointment_id, visit_id, issued_date, issued_time, status, priority, estimated_wait_time, checkin_time, ready_at, called_at, served_at, in_consult_at, created_by)
VALUES
  ('70000000-0000-0000-0000-000000000001', 1, '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', CURRENT_DATE, NOW() - INTERVAL '50 minutes', 'called', 3, 5, NOW() - INTERVAL '50 minutes', NOW() - INTERVAL '35 minutes', NOW() - INTERVAL '10 minutes', NULL, NULL, '10000000-0000-0000-0000-000000000002'),
  ('70000000-0000-0000-0000-000000000002', 2, '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000002', NULL, CURRENT_DATE, NOW() - INTERVAL '30 minutes', 'waiting', 2, 12, NOW() - INTERVAL '30 minutes', NULL, NULL, NULL, NULL, '10000000-0000-0000-0000-000000000002'),
  ('70000000-0000-0000-0000-000000000003', 3, '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000002', CURRENT_DATE, NOW() - INTERVAL '25 minutes', 'serving', 4, 0, NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '18 minutes', NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes', '10000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO UPDATE SET
  issued_date = EXCLUDED.issued_date,
  issued_time = EXCLUDED.issued_time,
  status = EXCLUDED.status,
  priority = EXCLUDED.priority,
  estimated_wait_time = EXCLUDED.estimated_wait_time,
  checkin_time = EXCLUDED.checkin_time,
  ready_at = EXCLUDED.ready_at,
  called_at = EXCLUDED.called_at,
  served_at = EXCLUDED.served_at,
  in_consult_at = EXCLUDED.in_consult_at,
  updated_at = NOW();

INSERT INTO vitals (id, visit_id, patient_id, recorded_by, temperature, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, respiratory_rate, oxygen_saturation, weight, height, bmi, pain_level, priority, notes, recorded_at)
VALUES
  ('80000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 37.2, 118, 76, 92, 20, 97.0, 68.5, 172.0, 23.2, 3, 'medium', 'Mild wheeze noted. No respiratory distress.', NOW() - INTERVAL '35 minutes'),
  ('80000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 36.8, 136, 84, 78, 16, 98.0, 81.0, 170.0, 28.0, 1, 'high', 'Patient reports fasting glucose 168 mg/dL this morning.', NOW() - INTERVAL '20 minutes'),
  ('80000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 36.7, 128, 82, 74, 16, 99.0, 70.0, 168.0, 24.8, 4, 'low', 'Stable vitals.', NOW() - INTERVAL '1 day 25 minutes')
ON CONFLICT (id) DO UPDATE SET
  temperature = EXCLUDED.temperature,
  blood_pressure_systolic = EXCLUDED.blood_pressure_systolic,
  blood_pressure_diastolic = EXCLUDED.blood_pressure_diastolic,
  heart_rate = EXCLUDED.heart_rate,
  respiratory_rate = EXCLUDED.respiratory_rate,
  oxygen_saturation = EXCLUDED.oxygen_saturation,
  weight = EXCLUDED.weight,
  height = EXCLUDED.height,
  bmi = EXCLUDED.bmi,
  pain_level = EXCLUDED.pain_level,
  priority = EXCLUDED.priority,
  notes = EXCLUDED.notes,
  recorded_at = EXCLUDED.recorded_at;

INSERT INTO doctor_notes (id, visit_id, patient_id, doctor_id, note_type, content, is_private)
VALUES
  ('90000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'assessment', 'Diabetes control suboptimal. No acute complications today.', false),
  ('90000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004', 'plan', 'Continue omeprazole and lifestyle modification. Avoid aspirin/NSAIDs.', false)
ON CONFLICT (id) DO UPDATE SET
  note_type = EXCLUDED.note_type,
  content = EXCLUDED.content,
  is_private = EXCLUDED.is_private,
  updated_at = NOW();

INSERT INTO patient_allergies (id, patient_id, visit_id, allergy_name, allergen_type, severity, reaction, diagnosed_date, diagnosed_by, notes, is_active)
VALUES
  ('91000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', 'Penicillin', 'medication', 'moderate', 'Rash and facial swelling', CURRENT_DATE - INTERVAL '2 years', '10000000-0000-0000-0000-000000000004', 'Avoid penicillin-class antibiotics.', true),
  ('91000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', NULL, 'Seafood', 'food', 'mild', 'Itchy rash', CURRENT_DATE - INTERVAL '5 years', '10000000-0000-0000-0000-000000000004', 'Patient avoids shrimp and crab.', true)
ON CONFLICT (id) DO UPDATE SET
  allergy_name = EXCLUDED.allergy_name,
  severity = EXCLUDED.severity,
  reaction = EXCLUDED.reaction,
  notes = EXCLUDED.notes,
  is_active = true,
  updated_at = NOW();

INSERT INTO patient_diagnoses (id, patient_id, visit_id, diagnosed_by, diagnosis_code, icd_10_code, diagnosis_name, diagnosis_type, category, severity, status, diagnosed_date, onset_date, notes, symptoms, treatment_plan, follow_up_required, follow_up_date)
VALUES
  ('92000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'E11.9', 'E11.9', 'Type 2 diabetes mellitus without complications', 'chronic', 'primary', 'moderate', 'chronic', CURRENT_DATE, CURRENT_DATE - INTERVAL '5 years', 'Needs diet and medication adherence review.', 'Elevated home glucose readings', 'Continue metformin, add glucose log and diet counseling.', true, CURRENT_DATE + INTERVAL '28 days'),
  ('92000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'K29.5', 'K29.5', 'Chronic gastritis', 'chronic', 'primary', 'mild', 'active', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE - INTERVAL '3 months', 'Symptoms controlled on PPI.', 'Epigastric burning after meals', 'Continue omeprazole and avoid NSAIDs.', false, NULL)
ON CONFLICT (id) DO UPDATE SET
  diagnosis_name = EXCLUDED.diagnosis_name,
  severity = EXCLUDED.severity,
  status = EXCLUDED.status,
  notes = EXCLUDED.notes,
  symptoms = EXCLUDED.symptoms,
  treatment_plan = EXCLUDED.treatment_plan,
  follow_up_required = EXCLUDED.follow_up_required,
  follow_up_date = EXCLUDED.follow_up_date,
  updated_at = NOW();

INSERT INTO prescriptions (id, visit_id, patient_id, doctor_id, doctor_note_id, medication_name, dosage, frequency, duration, quantity, refills, instructions, status, start_date, end_date, medication_category, route_of_administration, is_current)
VALUES
  ('93000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', '90000000-0000-0000-0000-000000000001', 'Metformin', '500mg', 'Twice daily after meals', '30 days', 60, 1, 'Take with food. Bring glucose log next visit.', 'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 'antidiabetic', 'oral', true),
  ('93000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004', '90000000-0000-0000-0000-000000000002', 'Omeprazole', '20mg', 'Once daily before breakfast', '14 days', 14, 0, 'Avoid spicy food and NSAIDs.', 'active', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '13 days', 'gastrointestinal', 'oral', true)
ON CONFLICT (id) DO UPDATE SET
  medication_name = EXCLUDED.medication_name,
  dosage = EXCLUDED.dosage,
  frequency = EXCLUDED.frequency,
  duration = EXCLUDED.duration,
  quantity = EXCLUDED.quantity,
  instructions = EXCLUDED.instructions,
  status = EXCLUDED.status,
  is_current = true,
  updated_at = NOW();

INSERT INTO invoices (id, invoice_number, visit_id, patient_id, subtotal, discount_amount, tax_amount, total_amount, paid_amount, amount_paid, balance, balance_due, status, payment_method, created_by, completed_by, completed_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'INV-DEMO-0001', '60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 28000, 0, 0, 28000, 0, 0, 28000, 28000, 'pending', NULL, '10000000-0000-0000-0000-000000000005', NULL, NULL),
  ('a0000000-0000-0000-0000-000000000002', 'INV-DEMO-0002', '60000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', 30000, 0, 0, 30000, 0, 0, 30000, 30000, 'pending', NULL, '10000000-0000-0000-0000-000000000005', NULL, NULL),
  ('a0000000-0000-0000-0000-000000000003', 'INV-DEMO-0003', '60000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000005', 23000, 0, 0, 23000, 23000, 23000, 0, 0, 'paid', 'cash', '10000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO UPDATE SET
  subtotal = EXCLUDED.subtotal,
  total_amount = EXCLUDED.total_amount,
  paid_amount = EXCLUDED.paid_amount,
  amount_paid = EXCLUDED.amount_paid,
  balance = EXCLUDED.balance,
  balance_due = EXCLUDED.balance_due,
  status = EXCLUDED.status,
  payment_method = EXCLUDED.payment_method,
  completed_by = EXCLUDED.completed_by,
  completed_at = EXCLUDED.completed_at,
  updated_at = NOW();

INSERT INTO invoice_items (id, invoice_id, item_type, item_id, item_name, item_description, quantity, unit_price, discount_amount, total_price, added_by, notes)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'service', '40000000-0000-0000-0000-000000000001', 'General Consultation', 'Doctor consultation', 1, 15000, 0, 15000, '10000000-0000-0000-0000-000000000004', NULL),
  ('a1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'service', '40000000-0000-0000-0000-000000000007', 'Nebulization', 'Nebulizer treatment', 1, 10000, 0, 10000, '10000000-0000-0000-0000-000000000004', NULL),
  ('a1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'service', '40000000-0000-0000-0000-000000000003', 'Vitals Assessment', 'Nurse triage', 1, 3000, 0, 3000, '10000000-0000-0000-0000-000000000003', NULL),
  ('a1000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'service', '40000000-0000-0000-0000-000000000001', 'General Consultation', 'Doctor consultation', 1, 15000, 0, 15000, '10000000-0000-0000-0000-000000000004', NULL),
  ('a1000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'service', '40000000-0000-0000-0000-000000000005', 'Blood Glucose Test', 'Random glucose test', 1, 7000, 0, 7000, '10000000-0000-0000-0000-000000000003', NULL),
  ('a1000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 'medicine', '93000000-0000-0000-0000-000000000001', 'Metformin 500mg', 'Medication charge', 1, 8000, 0, 8000, '10000000-0000-0000-0000-000000000005', NULL),
  ('a1000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000003', 'service', '40000000-0000-0000-0000-000000000002', 'Follow-up Consultation', 'Follow-up doctor visit', 1, 8000, 0, 8000, '10000000-0000-0000-0000-000000000004', NULL),
  ('a1000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000003', 'medicine', '93000000-0000-0000-0000-000000000002', 'Omeprazole 20mg', 'Medication charge', 1, 15000, 0, 15000, '10000000-0000-0000-0000-000000000005', NULL)
ON CONFLICT (id) DO UPDATE SET
  item_name = EXCLUDED.item_name,
  item_description = EXCLUDED.item_description,
  quantity = EXCLUDED.quantity,
  unit_price = EXCLUDED.unit_price,
  discount_amount = EXCLUDED.discount_amount,
  total_price = EXCLUDED.total_price,
  notes = EXCLUDED.notes;

INSERT INTO payment_transactions (id, invoice_id, amount, payment_method, payment_reference, payment_notes, received_by, processed_by)
VALUES
  ('a2000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 23000, 'cash', 'RCPT-DEMO-0001', 'Paid in cash at cashier desk.', '10000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005')
ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  payment_method = EXCLUDED.payment_method,
  payment_reference = EXCLUDED.payment_reference,
  payment_notes = EXCLUDED.payment_notes,
  processed_by = EXCLUDED.processed_by,
  updated_at = NOW();

INSERT INTO notifications (id, user_id, title, message, type, related_entity_type, related_entity_id, is_read)
VALUES
  ('b0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Vitals pending', 'May Hnin is waiting for vitals assessment.', 'warning', 'appointment', '50000000-0000-0000-0000-000000000002', false),
  ('b0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'Patient ready', 'Adam Patient is ready for consultation.', 'info', 'queue_token', '70000000-0000-0000-0000-000000000001', false),
  ('b0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000005', 'Invoice pending', 'Two invoices are waiting for cashier review.', 'warning', 'invoice', 'a0000000-0000-0000-0000-000000000001', false)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  message = EXCLUDED.message,
  type = EXCLUDED.type,
  related_entity_type = EXCLUDED.related_entity_type,
  related_entity_id = EXCLUDED.related_entity_id,
  is_read = EXCLUDED.is_read;

INSERT INTO audit_logs (id, table_name, record_id, action, user_id, actor_role, status, reason, new_values)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'patients', '20000000-0000-0000-0000-000000000001', 'CREATE', '10000000-0000-0000-0000-000000000002', 'receptionist', 'success', 'Demo patient registration', '{"source":"seed"}'),
  ('c0000000-0000-0000-0000-000000000002', 'queue_tokens', '70000000-0000-0000-0000-000000000003', 'UPDATE', '10000000-0000-0000-0000-000000000004', 'doctor', 'success', 'Demo consultation started', '{"source":"seed"}'),
  ('c0000000-0000-0000-0000-000000000003', 'invoices', 'a0000000-0000-0000-0000-000000000003', 'INVOICE.PAYMENT', '10000000-0000-0000-0000-000000000005', 'cashier', 'success', 'Demo invoice paid', '{"source":"seed"}')
ON CONFLICT (id) DO UPDATE SET
  reason = EXCLUDED.reason,
  new_values = EXCLUDED.new_values,
  created_at = NOW();

COMMIT;
