-- ThriveCare demo history
--
-- Fills the database with a year of realistic past activity so patient lists,
-- medical records, billing, dispensing and analytics have data to show:
--   * 3 extra staff accounts (2 doctors, 1 nurse) and their weekly schedules
--   * 45 patients registered over the past year
--   * completed visits with vitals, doctor notes, diagnoses, prescriptions,
--     completed queue tokens, invoices, invoice items and payments
--   * allergies, cancelled appointments and upcoming bookings
--   * staff notifications and audit log entries
--
-- It creates no in-progress visits and no active queue tokens.
--
-- New staff accounts reuse the password of an existing demo account:
--   thida@gmail.com, kyawzin@gmail.com -> same password as zawoo@gmail.com
--   hninwai@gmail.com                  -> same password as chue@gmail.com
--
-- Run after seed-demo-users.sql:
--   docker compose exec -T postgres psql -U thrivecare -d thrivecare < seed-demo-history.sql
--
-- Running it again changes nothing: it stops if the history is already loaded.

BEGIN;

-- ---------------------------------------------------------------------------
-- Extra staff
-- ---------------------------------------------------------------------------
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, specialty, license_number, is_active)
SELECT v.id::uuid, v.email, u.password_hash, v.first_name, v.last_name, v.phone, v.role, v.specialty, v.license_number, true
FROM (VALUES
  ('10000000-0000-0000-0000-000000000011', 'thida@gmail.com', 'Thida', 'Win', '+959400000011', 'doctor', 'Pediatrics', 'MDC-2026-118', 'zawoo@gmail.com'),
  ('10000000-0000-0000-0000-000000000012', 'kyawzin@gmail.com', 'Kyaw Zin', 'Htet', '+959400000012', 'doctor', 'Internal Medicine', 'MDC-2026-131', 'zawoo@gmail.com'),
  ('10000000-0000-0000-0000-000000000013', 'hninwai@gmail.com', 'Hnin', 'Wai', '+959400000013', 'nurse', NULL, 'NUR-2026-014', 'chue@gmail.com')
) AS v(id, email, first_name, last_name, phone, role, specialty, license_number, password_from)
JOIN users u ON u.email = v.password_from
ON CONFLICT (email) DO NOTHING;

INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, is_active)
SELECT u.id, v.day_of_week, v.start_time::time, v.end_time::time, true
FROM (VALUES
  ('thida@gmail.com', 'Monday', '13:00', '17:00'),
  ('thida@gmail.com', 'Wednesday', '09:00', '12:00'),
  ('thida@gmail.com', 'Saturday', '09:00', '13:00'),
  ('kyawzin@gmail.com', 'Tuesday', '13:00', '17:00'),
  ('kyawzin@gmail.com', 'Thursday', '13:00', '17:00'),
  ('kyawzin@gmail.com', 'Friday', '09:00', '12:00'),
  ('kyawzin@gmail.com', 'Saturday', '13:00', '16:00')
) AS v(email, day_of_week, start_time, end_time)
JOIN users u ON u.email = v.email
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Clinical templates used by the generator below
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE demo_conditions (
  code TEXT PRIMARY KEY,
  kind TEXT NOT NULL,              -- acute | chronic
  for_children BOOLEAN NOT NULL,
  for_adults BOOLEAN NOT NULL,
  name TEXT NOT NULL,
  icd TEXT NOT NULL,
  severity TEXT NOT NULL,
  complaint TEXT NOT NULL,
  history TEXT NOT NULL,
  assessment TEXT NOT NULL,
  plan TEXT NOT NULL,
  follow_up TEXT NOT NULL,
  extra_service TEXT,              -- services.service_code billed with the visit
  fever BOOLEAN NOT NULL,
  breathing BOOLEAN NOT NULL
) ON COMMIT DROP;

INSERT INTO demo_conditions VALUES
  ('URI', 'acute', false, true, 'Acute upper respiratory infection', 'J06.9', 'mild',
   'Sore throat, runny nose and low-grade fever for 2 days',
   'Mild dry cough. No shortness of breath. Eating and drinking well.',
   'Viral upper respiratory infection. Chest clear on auscultation.',
   'Symptomatic treatment, warm fluids and rest.',
   'Return if fever lasts more than 3 days or breathing becomes difficult.', NULL, true, false),
  ('GASTRO', 'acute', false, true, 'Acute gastroenteritis', 'A09', 'mild',
   'Loose stools and abdominal cramps since yesterday',
   'Five watery stools in 24 hours, no blood. Mild nausea.',
   'Acute gastroenteritis with mild dehydration.',
   'Oral rehydration, bland diet, antiemetic as needed.',
   'Return if blood in stool, persistent vomiting or reduced urine output.', NULL, false, false),
  ('DENGUE', 'acute', false, true, 'Dengue fever without warning signs', 'A90', 'moderate',
   'High fever, headache and body aches for 3 days',
   'Pain behind the eyes and muscle aches. No bleeding, no abdominal pain.',
   'Probable dengue fever. Platelets adequate, no warning signs.',
   'Paracetamol only, at least 2.5 L oral fluids daily, repeat CBC in 24 hours.',
   'Avoid ibuprofen and aspirin. Return immediately if bleeding, vomiting or severe abdominal pain.', 'LAB-CBC', true, false),
  ('UTI', 'acute', false, true, 'Urinary tract infection', 'N39.0', 'mild',
   'Burning on urination and frequency for 2 days',
   'Lower abdominal discomfort. No flank pain, no fever.',
   'Uncomplicated lower urinary tract infection.',
   'Oral antibiotic course and increased fluid intake.',
   'Complete the full antibiotic course. Return if fever or back pain develops.', NULL, false, false),
  ('MIGRAINE', 'acute', false, true, 'Migraine without aura', 'G43.0', 'moderate',
   'Recurrent throbbing headache with nausea',
   'One-sided headache lasting 6-8 hours, worse with light. Two episodes this month.',
   'Migraine without aura. Neurological examination normal.',
   'Pain relief at onset, headache diary, regular sleep.',
   'Return if the headache pattern changes or new neurological symptoms appear.', NULL, false, false),
  ('BACKPAIN', 'acute', false, true, 'Low back pain', 'M54.5', 'mild',
   'Lower back pain after lifting',
   'Pain started 4 days ago. No leg weakness or numbness.',
   'Mechanical low back pain, no red flags.',
   'Pain relief, gentle stretching, avoid heavy lifting for 2 weeks.',
   'Return if numbness, weakness or bladder problems develop.', NULL, false, false),
  ('PNEUMONIA', 'acute', false, true, 'Community-acquired pneumonia', 'J18.9', 'moderate',
   'Productive cough and fever for 5 days',
   'Yellow sputum, mild breathlessness on exertion, chest pain on deep breathing.',
   'Community-acquired pneumonia, right lower zone crackles. Stable for outpatient care.',
   'Oral antibiotics, chest X-ray, review in 48 hours.',
   'Return urgently if breathing worsens or confusion develops.', 'XR-CHEST', true, true),
  ('ANEMIA', 'acute', false, true, 'Iron deficiency anaemia', 'D50.9', 'mild',
   'Tiredness and dizziness for one month',
   'Fatigue and breathlessness on exertion. Low dietary iron intake.',
   'Iron deficiency anaemia likely. CBC sent.',
   'Oral iron supplement and dietary advice.',
   'Repeat CBC in 4 weeks.', 'LAB-CBC', false, false),
  ('CONJ', 'acute', true, true, 'Acute conjunctivitis', 'H10.9', 'mild',
   'Red, itchy eye with discharge',
   'Started in the right eye 2 days ago, now both eyes. Vision normal.',
   'Bacterial conjunctivitis.',
   'Antibiotic eye drops and hand hygiene.',
   'Return if eye pain or reduced vision.', NULL, false, false),
  ('TINEA', 'acute', true, true, 'Tinea corporis', 'B35.4', 'mild',
   'Itchy circular rash on the trunk',
   'Rash for 3 weeks, spreading slowly. Hot and humid environment.',
   'Tinea corporis (ringworm).',
   'Topical antifungal for 2 weeks, keep the skin dry.',
   'Return if the rash spreads despite treatment.', NULL, false, false),
  ('RHINITIS', 'acute', false, true, 'Allergic rhinitis', 'J30.4', 'mild',
   'Sneezing and itchy nose every morning',
   'Symptoms for 3 months, worse with dust.',
   'Allergic rhinitis.',
   'Daily antihistamine and allergen avoidance.',
   'Review in 1 month if symptoms persist.', NULL, false, false),
  ('URI_CHILD', 'acute', true, false, 'Acute upper respiratory infection', 'J06.9', 'mild',
   'Fever, runny nose and cough for 2 days',
   'Child active and feeding well. No breathing difficulty.',
   'Viral upper respiratory infection. Chest clear, ears normal.',
   'Paracetamol for fever, fluids, saline nasal drops.',
   'Return if fever lasts more than 3 days, fast breathing or poor feeding.', NULL, true, false),
  ('OTITIS', 'acute', true, false, 'Acute otitis media', 'H66.9', 'moderate',
   'Ear pain and fever since last night',
   'Pulling at the right ear, irritable, mild fever.',
   'Right acute otitis media, bulging eardrum.',
   'Oral antibiotics and pain relief.',
   'Review in 1 week if pain persists.', NULL, true, false),
  ('GASTRO_CHILD', 'acute', true, false, 'Acute gastroenteritis', 'A09', 'mild',
   'Vomiting and loose stools since this morning',
   'Four loose stools and two vomits. Still passing urine.',
   'Acute gastroenteritis with mild dehydration.',
   'Oral rehydration salts and zinc for 10 days.',
   'Return if drowsy, not drinking or no urine for 8 hours.', NULL, false, false),
  ('HTN', 'chronic', false, true, 'Essential hypertension', 'I10', 'moderate',
   'Blood pressure review',
   'Occasional morning headaches. Home readings around 145/92.',
   'Hypertension, control improving.',
   'Continue amlodipine, reduce salt, regular exercise.',
   'Return in 4 weeks with a home blood pressure log.', NULL, false, false),
  ('DM', 'chronic', false, true, 'Type 2 diabetes mellitus without complications', 'E11.9', 'moderate',
   'Diabetes follow-up',
   'Fasting glucose 140-170 mg/dL at home. No hypoglycaemia.',
   'Type 2 diabetes, suboptimal control.',
   'Continue metformin, diet counselling, glucose monitoring.',
   'Return in 4 weeks with a glucose log.', 'LAB-GLU', false, false),
  ('LIPID', 'chronic', false, true, 'Hyperlipidaemia', 'E78.5', 'moderate',
   'Cholesterol review',
   'Last lipid panel showed LDL 168 mg/dL. No chest pain.',
   'Hyperlipidaemia, moderate cardiovascular risk.',
   'Statin therapy and dietary changes.',
   'Repeat lipid panel in 3 months.', NULL, false, false),
  ('GASTRITIS', 'chronic', false, true, 'Chronic gastritis', 'K29.5', 'moderate',
   'Burning upper abdominal pain after meals',
   'Symptoms for 2 months, worse with spicy food. No black stools.',
   'Chronic gastritis, no alarm features.',
   'Proton pump inhibitor, avoid NSAIDs and late meals.',
   'Return if black stools or vomiting blood.', NULL, false, false),
  ('ASTHMA', 'chronic', true, true, 'Asthma', 'J45.9', 'moderate',
   'Wheezing and chest tightness at night',
   'Symptoms 2-3 nights a week, triggered by dust and cold weather.',
   'Mild persistent asthma, partly controlled.',
   'Reliever inhaler, nebulization today, trigger avoidance.',
   'Return if the reliever is needed more than twice a week.', 'NEB', false, true);

CREATE TEMP TABLE demo_medicines (
  condition_code TEXT NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  days INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  category TEXT NOT NULL,
  route TEXT NOT NULL,
  instructions TEXT,
  unit_price NUMERIC NOT NULL      -- MMK per unit
) ON COMMIT DROP;

INSERT INTO demo_medicines VALUES
  ('URI', 'Paracetamol', '500mg', '1 tablet every 6 hours as needed', 3, 12, 'analgesic', 'oral', 'Do not take more than 8 tablets a day.', 100),
  ('URI', 'Cetirizine', '10mg', 'Once daily at night', 5, 5, 'antihistamine', 'oral', 'May cause drowsiness.', 300),
  ('GASTRO', 'Oral Rehydration Salts', '1 sachet', '1 sachet in 1 L of water, sip through the day', 3, 6, 'electrolyte', 'oral', 'Drink after each loose stool.', 300),
  ('GASTRO', 'Domperidone', '10mg', 'Three times daily before meals', 3, 9, 'antiemetic', 'oral', NULL, 200),
  ('DENGUE', 'Paracetamol', '500mg', '2 tablets every 6 hours as needed', 5, 30, 'analgesic', 'oral', 'Do not take ibuprofen or aspirin.', 100),
  ('UTI', 'Ciprofloxacin', '500mg', 'Twice daily', 5, 10, 'antibiotic', 'oral', 'Complete the full course.', 450),
  ('MIGRAINE', 'Ibuprofen', '400mg', 'Every 8 hours as needed with food', 5, 15, 'NSAID', 'oral', 'Take with food.', 150),
  ('BACKPAIN', 'Diclofenac', '50mg', 'Twice daily after meals', 7, 14, 'NSAID', 'oral', 'Take after meals.', 200),
  ('BACKPAIN', 'Diclofenac gel 1%', '30g tube', 'Apply to the painful area three times daily', 7, 1, 'analgesic', 'topical', NULL, 3500),
  ('PNEUMONIA', 'Amoxicillin-clavulanate', '625mg', 'Twice daily after meals', 7, 14, 'antibiotic', 'oral', 'Complete the full course.', 700),
  ('PNEUMONIA', 'Paracetamol', '500mg', '1 tablet every 6 hours as needed', 5, 20, 'analgesic', 'oral', NULL, 100),
  ('ANEMIA', 'Ferrous sulfate', '200mg', 'Once daily after breakfast', 30, 30, 'supplement', 'oral', 'Stools may turn dark.', 100),
  ('CONJ', 'Chloramphenicol eye drops 0.5%', '10ml bottle', '1 drop four times daily', 5, 1, 'antibiotic', 'ophthalmic', 'Wash hands before and after use.', 2500),
  ('TINEA', 'Clotrimazole cream 1%', '20g tube', 'Apply thinly twice daily', 14, 1, 'antifungal', 'topical', 'Continue for 1 week after the rash clears.', 2500),
  ('RHINITIS', 'Loratadine', '10mg', 'Once daily', 14, 14, 'antihistamine', 'oral', NULL, 150),
  ('URI_CHILD', 'Paracetamol syrup', '120mg/5ml', '5 ml every 6 hours as needed', 3, 1, 'analgesic', 'oral', 'Use the measuring cup provided.', 2200),
  ('OTITIS', 'Amoxicillin syrup', '250mg/5ml', '5 ml three times daily', 7, 1, 'antibiotic', 'oral', 'Shake well. Complete the full course.', 3200),
  ('OTITIS', 'Paracetamol syrup', '120mg/5ml', '5 ml every 6 hours as needed', 3, 1, 'analgesic', 'oral', NULL, 2200),
  ('GASTRO_CHILD', 'Oral Rehydration Salts', '1 sachet', '1 sachet in 1 L of water, small sips often', 3, 6, 'electrolyte', 'oral', NULL, 300),
  ('GASTRO_CHILD', 'Zinc sulfate syrup', '20mg/5ml', '5 ml once daily', 10, 1, 'supplement', 'oral', NULL, 2000),
  ('HTN', 'Amlodipine', '5mg', 'Once daily in the morning', 30, 30, 'cardiovascular', 'oral', NULL, 200),
  ('DM', 'Metformin', '500mg', 'Twice daily after meals', 30, 60, 'antidiabetic', 'oral', 'Take with food.', 150),
  ('LIPID', 'Atorvastatin', '20mg', 'Once daily at night', 30, 30, 'lipid-lowering', 'oral', NULL, 250),
  ('GASTRITIS', 'Omeprazole', '20mg', 'Once daily before breakfast', 14, 14, 'gastrointestinal', 'oral', 'Take 30 minutes before food.', 300),
  ('ASTHMA', 'Salbutamol inhaler', '100mcg', '2 puffs every 4-6 hours as needed', 30, 1, 'bronchodilator', 'inhalation', 'Rinse mouth after use.', 6500);

CREATE TEMP TABLE demo_allergies (
  name TEXT NOT NULL,
  allergen_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  reaction TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO demo_allergies VALUES
  ('Penicillin', 'medication', 'moderate', 'Rash and facial swelling'),
  ('Sulfa drugs', 'medication', 'mild', 'Itchy skin rash'),
  ('Aspirin', 'medication', 'moderate', 'Wheezing and hives'),
  ('Peanuts', 'food', 'severe', 'Lip swelling and throat tightness'),
  ('Shellfish', 'food', 'moderate', 'Hives and vomiting'),
  ('Dust mites', 'environmental', 'mild', 'Sneezing and itchy eyes'),
  ('Latex', 'latex', 'mild', 'Contact dermatitis'),
  ('Bee sting', 'insect', 'severe', 'Swelling and dizziness');

-- ---------------------------------------------------------------------------
-- Generator
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  male_first TEXT[] := ARRAY['Aung', 'Kyaw', 'Min', 'Zaw', 'Htet', 'Thura', 'Ye', 'Naing', 'Soe', 'Hein', 'Myo', 'Phyo', 'Tun', 'Kaung', 'Pyae'];
  male_last TEXT[] := ARRAY['Min Htet', 'Zin Oo', 'Thant', 'Lin Aung', 'Naing Win', 'Ko Ko', 'Htun', 'Myat', 'Paing', 'Zaw Win', 'Sithu', 'Kyaw Swar'];
  female_first TEXT[] := ARRAY['Thandar', 'Hnin', 'Su', 'May', 'Ei', 'Khin', 'Nwe', 'Yadanar', 'Phyu', 'Wai', 'Moe', 'Thiri', 'Shwe', 'Nandar', 'Aye'];
  female_last TEXT[] := ARRAY['Myat Noe', 'Ei Phyu', 'Mon', 'Thu Zar', 'Nwe Ni', 'Hlaing', 'Khaing', 'Lwin', 'Pyae Sone', 'Sandi', 'Zin Mar', 'Htwe'];
  streets TEXT[] := ARRAY['Pyay Road', 'Kabar Aye Pagoda Road', 'Bogyoke Aung San Road', 'Anawrahta Road', 'Insein Road', 'U Wisara Road', 'Baho Road', 'Thamada Street', 'Bo Aung Kyaw Street', 'Inya Road'];
  townships TEXT[] := ARRAY['Bahan', 'Kamayut', 'Sanchaung', 'Hlaing', 'Mayangone', 'Yankin', 'Tamwe', 'Thingangyun', 'Insein', 'Dagon', 'Mingalar Taung Nyunt', 'Kyauktada'];
  blood_groups TEXT[] := ARRAY['O+', 'O+', 'O+', 'A+', 'A+', 'B+', 'B+', 'AB+', 'O-', 'A-', 'B-'];
  insurers TEXT[] := ARRAY['Self Pay', 'Self Pay', 'Self Pay', 'Self Pay', 'AIA Myanmar', 'Grand Guardian', 'Capital Life', 'IKBZ Insurance'];
  adult_relations TEXT[] := ARRAY['Wife', 'Husband', 'Mother', 'Father', 'Sister', 'Brother', 'Son', 'Daughter', 'Friend'];
  booking_reasons TEXT[] := ARRAY['General check-up', 'Blood pressure review', 'Follow-up consultation', 'Medication refill', 'Cough and cold', 'Lab result review', 'Skin rash'];
  cancel_notes TEXT[] := ARRAY['Patient called to reschedule.', 'Patient travelling out of town.', 'Cancelled by patient by phone.', 'Doctor schedule changed, patient rebooked.'];

  v_admin UUID;
  v_reception UUID;
  v_cashier UUID;
  v_gp UUID;
  v_peds UUID;
  v_im UUID;
  v_nurses UUID[];

  v_patient UUID;
  v_appt UUID;
  v_visit UUID;
  v_first_visit UUID;
  v_invoice UUID;
  v_note UUID;
  v_rx UUID;
  v_doctor UUID;
  v_nurse UUID;

  v_is_child BOOLEAN;
  v_age INT;
  v_gender TEXT;
  v_first TEXT;
  v_last TEXT;
  v_height NUMERIC;
  v_weight NUMERIC;
  v_chronic TEXT;
  v_relation TEXT;
  v_contact TEXT;
  v_insurer TEXT;
  v_reg TIMESTAMPTZ;

  v_allergy_name TEXT;
  v_allergy_type TEXT;
  v_allergy_severity TEXT;
  v_allergy_reaction TEXT;

  v_days_ago INT;
  v_visit_no INT;
  v_day DATE;
  v_ts TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_type TEXT;
  v_cond demo_conditions%ROWTYPE;
  v_med RECORD;

  v_consult_id UUID;
  v_consult_name TEXT;
  v_consult_price NUMERIC;
  v_vitals_id UUID;
  v_vitals_price NUMERIC;
  v_extra_id UUID;
  v_extra_name TEXT;
  v_extra_price NUMERIC;
  v_med_total NUMERIC;
  v_total NUMERIC;
  v_paid NUMERIC;
  v_partial BOOLEAN;
  v_method TEXT;
  v_invoice_seq INT := 0;

  v_systolic INT;
  v_diastolic INT;
  v_temp NUMERIC;

  v_av_doctor UUID;
  v_av_day TEXT;
  v_av_start TIME;
  v_av_end TIME;
  v_offset INT;
  i INT;
BEGIN
  SELECT id INTO v_admin FROM users WHERE email = 'admin@clinic.com';
  SELECT id INTO v_reception FROM users WHERE email = 'lin@gmail.com';
  SELECT id INTO v_cashier FROM users WHERE email = 'cashier1@gmail.com';
  SELECT id INTO v_gp FROM users WHERE email = 'zawoo@gmail.com';
  SELECT id INTO v_peds FROM users WHERE email = 'thida@gmail.com';
  SELECT id INTO v_im FROM users WHERE email = 'kyawzin@gmail.com';
  SELECT ARRAY(SELECT id FROM users WHERE email IN ('chue@gmail.com', 'hninwai@gmail.com') ORDER BY email) INTO v_nurses;

  IF v_gp IS NULL OR v_cashier IS NULL OR NOT EXISTS (SELECT 1 FROM services WHERE service_code = 'CONS-GP') THEN
    RAISE EXCEPTION 'Demo users and services are missing. Run seed-demo-users.sql first.';
  END IF;

  IF EXISTS (SELECT 1 FROM patients WHERE patient_number = 'P-2026-0101') THEN
    RAISE NOTICE 'Demo history is already loaded. Nothing to do.';
    RETURN;
  END IF;

  SELECT id, default_price INTO v_vitals_id, v_vitals_price FROM services WHERE service_code = 'VITALS';

  -- Patients and their completed visits
  FOR i IN 1..45 LOOP
    v_is_child := random() < 0.18;
    v_age := CASE WHEN v_is_child THEN 2 + floor(random() * 12)::int ELSE 18 + floor(random() * 60)::int END;
    v_gender := CASE WHEN random() < 0.52 THEN 'Female' ELSE 'Male' END;

    IF v_gender = 'Male' THEN
      v_first := male_first[1 + floor(random() * array_length(male_first, 1))::int];
      v_last := male_last[1 + floor(random() * array_length(male_last, 1))::int];
      v_height := 160 + round((random() * 22)::numeric, 1);
    ELSE
      v_first := female_first[1 + floor(random() * array_length(female_first, 1))::int];
      v_last := female_last[1 + floor(random() * array_length(female_last, 1))::int];
      v_height := 148 + round((random() * 20)::numeric, 1);
    END IF;

    IF v_is_child THEN
      v_height := 85 + v_age * 6 + round((random() * 8)::numeric, 1);
      v_weight := 10 + v_age * 2.6 + round((random() * 5)::numeric, 1);
      v_relation := CASE WHEN random() < 0.6 THEN 'Mother' ELSE 'Father' END;
    ELSE
      v_weight := round((v_height - 100) * (0.75 + random() * 0.45)::numeric, 1);
      v_relation := adult_relations[1 + floor(random() * array_length(adult_relations, 1))::int];
    END IF;

    v_contact := CASE
      WHEN v_relation IN ('Mother', 'Wife', 'Sister', 'Daughter') THEN
        'Daw ' || female_first[1 + floor(random() * array_length(female_first, 1))::int] || ' ' || female_last[1 + floor(random() * array_length(female_last, 1))::int]
      ELSE
        'U ' || male_first[1 + floor(random() * array_length(male_first, 1))::int] || ' ' || male_last[1 + floor(random() * array_length(male_last, 1))::int]
    END;

    v_chronic := NULL;
    IF v_is_child THEN
      IF random() < 0.25 THEN
        v_chronic := 'ASTHMA';
      END IF;
    ELSIF v_age >= 35 AND random() < 0.65 THEN
      v_chronic := (ARRAY['HTN', 'HTN', 'DM', 'DM', 'LIPID', 'GASTRITIS', 'ASTHMA'])[1 + floor(random() * 7)::int];
    ELSIF random() < 0.15 THEN
      v_chronic := (ARRAY['ASTHMA', 'GASTRITIS'])[1 + floor(random() * 2)::int];
    END IF;

    v_doctor := CASE
      WHEN v_is_child THEN v_peds
      WHEN v_chronic IN ('HTN', 'DM', 'LIPID') AND random() < 0.7 THEN v_im
      WHEN random() < 0.5 THEN v_gp
      ELSE v_im
    END;
    v_nurse := v_nurses[1 + floor(random() * array_length(v_nurses, 1))::int];

    v_allergy_name := NULL;
    IF random() < 0.3 THEN
      SELECT name, allergen_type, severity, reaction
      INTO v_allergy_name, v_allergy_type, v_allergy_severity, v_allergy_reaction
      FROM demo_allergies ORDER BY random() LIMIT 1;
    END IF;

    v_insurer := insurers[1 + floor(random() * array_length(insurers, 1))::int];

    v_days_ago := 4 + floor(random() * 330)::int;
    v_visit_no := 0;
    v_first_visit := NULL;

    LOOP
      v_visit_no := v_visit_no + 1;
      v_day := CURRENT_DATE - v_days_ago;
      IF EXTRACT(DOW FROM v_day) = 0 THEN
        v_day := v_day - 1;
      END IF;
      v_ts := (v_day + TIME '09:00' + floor(random() * 28)::int * INTERVAL '15 minutes') AT TIME ZONE 'Asia/Yangon';
      v_end := v_ts + (12 + floor(random() * 14)::int) * INTERVAL '1 minute';

      IF v_visit_no = 1 THEN
        v_reg := v_ts - INTERVAL '30 minutes';
        INSERT INTO patients (
          patient_number, first_name, last_name, date_of_birth, gender, phone, email, address,
          emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
          blood_group, allergies, medical_conditions, current_medications,
          insurance_provider, insurance_number, registration_date, is_active, created_at, updated_at
        )
        VALUES (
          'P-2026-' || lpad((100 + i)::text, 4, '0'),
          v_first,
          v_last,
          CURRENT_DATE - (v_age * 365 + floor(random() * 360)::int),
          v_gender,
          '+9594' || (21120000 + i * 37),
          lower(replace(v_first || v_last, ' ', '')) || i || '@example.com',
          (10 + floor(random() * 180)::int) || ', ' || streets[1 + floor(random() * array_length(streets, 1))::int] || ', '
            || townships[1 + floor(random() * array_length(townships, 1))::int] || ' Township, Yangon',
          v_contact,
          '+9594' || (31130000 + i * 53),
          v_relation,
          blood_groups[1 + floor(random() * array_length(blood_groups, 1))::int],
          COALESCE(v_allergy_name, 'None known'),
          COALESCE((SELECT name FROM demo_conditions WHERE code = v_chronic), 'None'),
          COALESCE((SELECT string_agg(name || ' ' || dosage, ', ') FROM demo_medicines WHERE condition_code = v_chronic), 'None'),
          v_insurer,
          CASE WHEN v_insurer = 'Self Pay' THEN 'SELF-' || lpad((100 + i)::text, 4, '0')
               ELSE upper(left(v_insurer, 3)) || '-' || (1000 + floor(random() * 9000)::int) END,
          v_reg, true, v_reg, v_reg
        )
        RETURNING id INTO v_patient;
      END IF;

      -- Pick what this visit is about
      IF v_chronic IS NOT NULL AND (v_visit_no = 1 OR random() < 0.55) THEN
        SELECT * INTO v_cond FROM demo_conditions WHERE code = v_chronic;
      ELSE
        SELECT * INTO v_cond FROM demo_conditions
        WHERE kind = 'acute'
          AND CASE WHEN v_is_child THEN for_children ELSE for_adults END
          AND NOT (COALESCE(v_allergy_name, '') = 'Penicillin' AND code IN ('PNEUMONIA', 'OTITIS'))
          AND NOT (COALESCE(v_allergy_name, '') = 'Aspirin' AND code IN ('MIGRAINE', 'BACKPAIN'))
        ORDER BY random() LIMIT 1;
      END IF;

      v_type := CASE
        WHEN v_visit_no > 1 AND v_cond.code = v_chronic THEN 'Follow-up'
        WHEN random() < 0.5 THEN 'Walk-in'
        ELSE 'Scheduled'
      END;

      -- Bill: consultation + vitals + optional lab/procedure + medicines
      SELECT id, service_name, default_price INTO v_consult_id, v_consult_name, v_consult_price
      FROM services WHERE service_code = CASE WHEN v_type = 'Follow-up' THEN 'CONS-FU' ELSE 'CONS-GP' END;

      v_extra_id := NULL;
      v_extra_name := NULL;
      v_extra_price := 0;
      IF v_cond.extra_service IS NOT NULL THEN
        SELECT id, service_name, default_price INTO v_extra_id, v_extra_name, v_extra_price
        FROM services WHERE service_code = v_cond.extra_service;
      END IF;

      SELECT COALESCE(SUM(quantity * unit_price), 0) INTO v_med_total
      FROM demo_medicines WHERE condition_code = v_cond.code;

      v_total := v_consult_price + v_vitals_price + COALESCE(v_extra_price, 0) + v_med_total;
      v_partial := v_days_ago > 10 AND random() < 0.08;
      v_paid := CASE WHEN v_partial THEN round(v_total / 2000) * 1000 ELSE v_total END;
      v_method := CASE WHEN random() < 0.6 THEN 'cash' ELSE 'online_payment' END;

      INSERT INTO appointments (
        patient_id, doctor_id, appointment_date, appointment_time, duration_minutes, appointment_type,
        reason_for_visit, status, notes, created_by, created_at, updated_at
      )
      VALUES (
        v_patient, v_doctor, v_day, (v_ts AT TIME ZONE 'Asia/Yangon')::time, 15, v_type,
        v_cond.complaint, 'completed', 'Consultation completed.', v_reception,
        CASE WHEN v_type = 'Walk-in' THEN v_ts - INTERVAL '30 minutes'
             ELSE v_ts - (1 + floor(random() * 6)::int) * INTERVAL '1 day' END,
        v_end
      )
      RETURNING id INTO v_appt;

      INSERT INTO visits (
        patient_id, doctor_id, appointment_id, visit_date, visit_type, chief_complaint,
        history_of_present_illness, diagnosis, treatment_plan, follow_up_instructions, status,
        total_cost, payment_status, visit_start_time, visit_end_time, created_at, updated_at
      )
      VALUES (
        v_patient, v_doctor, v_appt, v_ts, v_type, v_cond.complaint,
        v_cond.history, v_cond.name, v_cond.plan, v_cond.follow_up, 'completed',
        v_total, CASE WHEN v_partial THEN 'partial' ELSE 'paid' END, v_ts, v_end,
        v_ts - INTERVAL '25 minutes', v_end
      )
      RETURNING id INTO v_visit;

      IF v_first_visit IS NULL THEN
        v_first_visit := v_visit;
      END IF;

      -- Completed queue token; the trigger assigns the token number
      INSERT INTO queue_tokens (
        patient_id, doctor_id, appointment_id, visit_id, issued_date, issued_time, status, priority,
        estimated_wait_time, checkin_time, ready_at, called_at, served_at, in_consult_at, done_at,
        consult_expected_minutes, created_by, created_at, updated_at
      )
      VALUES (
        v_patient, v_doctor, v_appt, v_visit, v_day, v_ts - INTERVAL '25 minutes', 'completed',
        CASE WHEN v_cond.fever OR v_cond.breathing THEN 3 ELSE 1 END,
        10, v_ts - INTERVAL '25 minutes', v_ts - INTERVAL '12 minutes', v_ts - INTERVAL '2 minutes',
        v_ts, v_ts, v_end, 15, v_reception, v_ts - INTERVAL '25 minutes', v_end
      );

      -- Vitals
      v_temp := CASE WHEN v_cond.fever THEN 37.8 + round((random() * 1.4)::numeric, 1)
                     ELSE 36.4 + round((random() * 0.8)::numeric, 1) END;
      IF v_is_child AND v_age < 10 THEN
        v_systolic := NULL;
        v_diastolic := NULL;
      ELSIF v_cond.code = 'HTN' THEN
        v_systolic := 138 + floor(random() * 22)::int;
        v_diastolic := 86 + floor(random() * 12)::int;
      ELSE
        v_systolic := 106 + floor(random() * 26)::int;
        v_diastolic := 66 + floor(random() * 18)::int;
      END IF;

      INSERT INTO vitals (
        visit_id, patient_id, recorded_by, temperature, blood_pressure_systolic, blood_pressure_diastolic,
        heart_rate, respiratory_rate, oxygen_saturation, weight, height, pain_level, priority, notes,
        recorded_at, created_at
      )
      VALUES (
        v_visit, v_patient, v_nurse, v_temp, v_systolic, v_diastolic,
        CASE WHEN v_is_child THEN 88 + floor(random() * 30)::int ELSE 64 + floor(random() * 28)::int END
          + CASE WHEN v_cond.fever THEN 10 ELSE 0 END,
        CASE WHEN v_is_child THEN 18 + floor(random() * 8)::int ELSE 14 + floor(random() * 6)::int END
          + CASE WHEN v_cond.breathing THEN 4 ELSE 0 END,
        CASE WHEN v_cond.breathing THEN 93 + floor(random() * 3)::int ELSE 97 + floor(random() * 3)::int END,
        round(v_weight + (random() * 2 - 1)::numeric, 1),
        v_height,
        CASE WHEN v_cond.severity = 'moderate' THEN 3 + floor(random() * 3)::int ELSE floor(random() * 3)::int END,
        CASE WHEN v_cond.fever AND v_cond.breathing THEN 'high'
             WHEN v_cond.fever OR v_cond.breathing THEN 'medium'
             ELSE 'low' END,
        CASE WHEN v_cond.fever THEN 'Febrile on arrival.'
             WHEN v_cond.breathing THEN 'Mild wheeze, speaking in full sentences.'
             ELSE 'Stable vitals.' END,
        v_ts - INTERVAL '12 minutes', v_ts - INTERVAL '12 minutes'
      );

      -- Doctor notes
      INSERT INTO doctor_notes (visit_id, patient_id, doctor_id, note_type, content, is_private, created_at, updated_at)
      VALUES (v_visit, v_patient, v_doctor, 'assessment', v_cond.assessment, false,
              v_ts + INTERVAL '8 minutes', v_ts + INTERVAL '8 minutes');

      INSERT INTO doctor_notes (visit_id, patient_id, doctor_id, note_type, content, is_private, created_at, updated_at)
      VALUES (v_visit, v_patient, v_doctor, 'plan', v_cond.plan || ' ' || v_cond.follow_up, false,
              v_end - INTERVAL '2 minutes', v_end - INTERVAL '2 minutes')
      RETURNING id INTO v_note;

      -- Diagnosis: acute ones every time, chronic ones once per patient
      IF v_cond.kind = 'acute' OR NOT EXISTS (
        SELECT 1 FROM patient_diagnoses WHERE patient_id = v_patient AND icd_10_code = v_cond.icd
      ) THEN
        INSERT INTO patient_diagnoses (
          patient_id, visit_id, diagnosed_by, diagnosis_code, icd_10_code, diagnosis_name, diagnosis_type,
          category, severity, status, diagnosed_date, diagnosis_date, onset_date, resolved_date, notes,
          symptoms, treatment_plan, follow_up_required, follow_up_date, created_at, updated_at
        )
        VALUES (
          v_patient, v_visit, v_doctor, v_cond.icd, v_cond.icd, v_cond.name, v_cond.kind,
          'primary', v_cond.severity,
          CASE WHEN v_cond.kind = 'chronic' THEN 'chronic' WHEN v_days_ago > 10 THEN 'resolved' ELSE 'active' END,
          v_day, v_ts,
          CASE WHEN v_cond.kind = 'chronic' THEN v_day - (180 + floor(random() * 900)::int)
               ELSE v_day - (1 + floor(random() * 4)::int) END,
          CASE WHEN v_cond.kind = 'acute' AND v_days_ago > 10 THEN v_day + 7 END,
          v_cond.assessment, v_cond.complaint, v_cond.plan,
          v_cond.kind = 'chronic',
          CASE WHEN v_cond.kind = 'chronic' THEN v_day + 28 END,
          v_ts + INTERVAL '10 minutes', v_ts + INTERVAL '10 minutes'
        );
      END IF;

      -- Invoice
      v_invoice_seq := v_invoice_seq + 1;
      INSERT INTO invoices (
        invoice_number, visit_id, patient_id, subtotal, discount_amount, tax_amount, total_amount,
        paid_amount, amount_paid, balance, balance_due, payment_due_date, status, payment_method,
        payment_notes, created_by, created_at, completed_by, completed_at, updated_at
      )
      VALUES (
        'INV-' || to_char(v_day, 'YYYYMMDD') || '-' || lpad(v_invoice_seq::text, 4, '0'),
        v_visit, v_patient, v_total, 0, 0, v_total,
        v_paid, v_paid, v_total - v_paid, v_total - v_paid,
        CASE WHEN v_partial THEN v_day + 30 END,
        CASE WHEN v_partial THEN 'partial_paid' ELSE 'paid' END,
        v_method,
        CASE WHEN v_partial THEN 'Patient paid half. Balance due at next visit.' END,
        v_cashier, v_end + INTERVAL '2 minutes',
        CASE WHEN v_partial THEN NULL ELSE v_cashier END,
        CASE WHEN v_partial THEN NULL ELSE v_end + INTERVAL '12 minutes' END,
        v_end + INTERVAL '12 minutes'
      )
      RETURNING id INTO v_invoice;

      INSERT INTO invoice_items (invoice_id, item_type, item_id, item_name, item_description, quantity, unit_price, discount_amount, total_price, added_by, added_at)
      VALUES
        (v_invoice, 'service', v_consult_id, v_consult_name, 'Doctor consultation', 1, v_consult_price, 0, v_consult_price, v_doctor, v_end),
        (v_invoice, 'service', v_vitals_id, 'Vitals Assessment', 'Nurse triage', 1, v_vitals_price, 0, v_vitals_price, v_nurse, v_ts - INTERVAL '12 minutes');

      IF v_extra_id IS NOT NULL THEN
        INSERT INTO invoice_items (invoice_id, item_type, item_id, item_name, item_description, quantity, unit_price, discount_amount, total_price, added_by, added_at)
        VALUES (v_invoice, 'service', v_extra_id, v_extra_name, v_cond.name, 1, v_extra_price, 0, v_extra_price, v_doctor, v_end);
      END IF;

      -- Prescriptions, each billed as a medicine line
      FOR v_med IN SELECT * FROM demo_medicines WHERE condition_code = v_cond.code LOOP
        UPDATE prescriptions
        SET status = 'completed', is_current = false
        WHERE patient_id = v_patient AND medication_name = v_med.name AND status = 'active';

        INSERT INTO prescriptions (
          visit_id, patient_id, doctor_id, doctor_note_id, medication_name, dosage, frequency, duration,
          quantity, refills, instructions, status, prescribed_date, start_date, end_date,
          medication_category, route_of_administration, is_current, created_at, updated_at
        )
        VALUES (
          v_visit, v_patient, v_doctor, v_note, v_med.name, v_med.dosage, v_med.frequency, v_med.days || ' days',
          v_med.quantity, CASE WHEN v_cond.kind = 'chronic' THEN 1 ELSE 0 END, v_med.instructions,
          CASE WHEN v_day + v_med.days - 1 < CURRENT_DATE THEN 'completed' ELSE 'active' END,
          v_end - INTERVAL '2 minutes', v_day, v_day + v_med.days - 1,
          v_med.category, v_med.route, v_day + v_med.days - 1 >= CURRENT_DATE,
          v_end - INTERVAL '2 minutes', v_end - INTERVAL '2 minutes'
        )
        RETURNING id INTO v_rx;

        INSERT INTO invoice_items (invoice_id, item_type, item_id, item_name, item_description, quantity, unit_price, discount_amount, total_price, added_by, added_at)
        VALUES (v_invoice, 'medicine', v_rx, v_med.name || ' ' || v_med.dosage, v_med.frequency,
                v_med.quantity, v_med.unit_price, 0, v_med.quantity * v_med.unit_price, v_cashier, v_end + INTERVAL '5 minutes');
      END LOOP;

      INSERT INTO payment_transactions (
        invoice_id, payment_date, amount, payment_method, payment_reference, payment_notes,
        received_by, received_at, processed_by, created_at, updated_at
      )
      VALUES (
        v_invoice, v_end + INTERVAL '12 minutes', v_paid, v_method,
        'RCPT-' || to_char(v_day, 'YYMMDD') || '-' || lpad(v_invoice_seq::text, 4, '0'),
        CASE WHEN v_method = 'cash' THEN 'Paid in cash at the cashier desk.' ELSE 'Paid by mobile banking transfer.' END,
        v_cashier, v_end + INTERVAL '12 minutes', v_cashier, v_end + INTERVAL '12 minutes', v_end + INTERVAL '12 minutes'
      );

      v_days_ago := v_days_ago - (14 + floor(random() * 50)::int);
      EXIT WHEN v_days_ago < 1 OR v_visit_no >= 5;
    END LOOP;

    IF v_allergy_name IS NOT NULL THEN
      INSERT INTO patient_allergies (
        patient_id, visit_id, allergy_name, allergen_type, severity, reaction, diagnosed_date,
        diagnosed_by, verified_date, verified_by, notes, is_active, created_at, updated_at
      )
      VALUES (
        v_patient, v_first_visit, v_allergy_name, v_allergy_type, v_allergy_severity, v_allergy_reaction,
        v_reg::date, v_doctor, v_reg::date, v_nurse, 'Reported by the patient at registration.', true, v_reg, v_reg
      );
    END IF;
  END LOOP;

  -- Cancelled appointments in the past 60 days
  FOR i IN 1..14 LOOP
    SELECT id INTO v_patient FROM patients WHERE patient_number LIKE 'P-2026-01%' ORDER BY random() LIMIT 1;
    v_day := CURRENT_DATE - (1 + floor(random() * 60)::int);
    INSERT INTO appointments (
      patient_id, doctor_id, appointment_date, appointment_time, duration_minutes, appointment_type,
      reason_for_visit, status, notes, created_by, created_at, updated_at
    )
    VALUES (
      v_patient, (ARRAY[v_gp, v_im, v_peds])[1 + floor(random() * 3)::int], v_day,
      TIME '09:00' + floor(random() * 24)::int * INTERVAL '15 minutes', 15, 'Scheduled',
      booking_reasons[1 + floor(random() * array_length(booking_reasons, 1))::int], 'cancelled',
      cancel_notes[1 + floor(random() * array_length(cancel_notes, 1))::int], v_reception,
      (v_day - 4) + TIME '10:30', (v_day - 1) + TIME '15:00'
    );
  END LOOP;

  -- Upcoming bookings in the next two weeks, inside each doctor's schedule
  FOR i IN 1..16 LOOP
    SELECT doctor_id, day_of_week, start_time, end_time
    INTO v_av_doctor, v_av_day, v_av_start, v_av_end
    FROM doctor_availability
    WHERE is_active AND doctor_id IN (v_gp, v_im, v_peds)
    ORDER BY random() LIMIT 1;

    v_offset := (array_position(ARRAY['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], v_av_day) - 1
                 - EXTRACT(DOW FROM CURRENT_DATE)::int + 7) % 7;
    IF v_offset = 0 THEN
      v_offset := 7;
    END IF;
    IF random() < 0.4 THEN
      v_offset := v_offset + 7;
    END IF;

    SELECT id INTO v_patient FROM patients
    WHERE patient_number LIKE 'P-2026-01%'
      AND (v_av_doctor = v_peds) = (date_of_birth > CURRENT_DATE - INTERVAL '14 years')
    ORDER BY random() LIMIT 1;
    CONTINUE WHEN v_patient IS NULL;

    INSERT INTO appointments (
      patient_id, doctor_id, appointment_date, appointment_time, duration_minutes, appointment_type,
      reason_for_visit, status, notes, created_by, created_at, updated_at
    )
    VALUES (
      v_patient, v_av_doctor, CURRENT_DATE + v_offset,
      v_av_start + floor(random() * (EXTRACT(EPOCH FROM (v_av_end - v_av_start)) / 900))::int * INTERVAL '15 minutes',
      15, CASE WHEN random() < 0.5 THEN 'Follow-up' ELSE 'Scheduled' END,
      booking_reasons[1 + floor(random() * array_length(booking_reasons, 1))::int], 'scheduled',
      'Booked by phone.', v_reception,
      NOW() - floor(random() * 5)::int * INTERVAL '1 day', NOW()
    );
  END LOOP;

  -- Notifications ---------------------------------------------------------

  -- Doctors: lab and imaging results
  INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read, created_at, read_at)
  SELECT v.doctor_id, 'Result ready',
         ii.item_name || ' result for ' || p.first_name || ' ' || p.last_name || ' is ready to review.',
         'info', 'visit', v.id,
         v.visit_date < NOW() - INTERVAL '3 days',
         v.visit_end_time + INTERVAL '3 hours',
         CASE WHEN v.visit_date < NOW() - INTERVAL '3 days' THEN v.visit_end_time + INTERVAL '5 hours' END
  FROM visits v
  JOIN patients p ON p.id = v.patient_id
  JOIN invoices inv ON inv.visit_id = v.id
  JOIN invoice_items ii ON ii.invoice_id = inv.id
  JOIN services s ON s.id = ii.item_id AND s.category IN ('laboratory', 'imaging')
  WHERE p.patient_number LIKE 'P-2026-01%' AND v.visit_date > NOW() - INTERVAL '60 days';

  -- Doctors: chronic follow-ups coming up
  INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read, created_at)
  SELECT d.diagnosed_by, 'Follow-up due',
         p.first_name || ' ' || p.last_name || ' is due for ' || lower(d.diagnosis_name) || ' follow-up on '
           || to_char(d.follow_up_date, 'DD Mon') || '.',
         'info', 'patient', p.id, false, d.follow_up_date - INTERVAL '3 days'
  FROM patient_diagnoses d
  JOIN patients p ON p.id = d.patient_id
  WHERE p.patient_number LIKE 'P-2026-01%'
    AND d.follow_up_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 10;

  -- Cashier: recent payments and outstanding balances
  INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read, created_at, read_at)
  SELECT v_cashier, 'Payment received',
         to_char(pt.amount, 'FM999,999,999') || ' Ks received from ' || p.first_name || ' ' || p.last_name
           || ' (' || inv.invoice_number || ').',
         'success', 'invoice', inv.id,
         pt.payment_date < NOW() - INTERVAL '2 days',
         pt.payment_date,
         CASE WHEN pt.payment_date < NOW() - INTERVAL '2 days' THEN pt.payment_date + INTERVAL '1 hour' END
  FROM payment_transactions pt
  JOIN invoices inv ON inv.id = pt.invoice_id
  JOIN patients p ON p.id = inv.patient_id
  WHERE p.patient_number LIKE 'P-2026-01%' AND pt.payment_date > NOW() - INTERVAL '21 days';

  INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read, created_at, read_at)
  SELECT v_cashier, 'Outstanding balance',
         p.first_name || ' ' || p.last_name || ' still owes ' || to_char(inv.balance_due, 'FM999,999,999')
           || ' Ks on ' || inv.invoice_number || '.',
         'warning', 'invoice', inv.id, true, inv.created_at + INTERVAL '1 day', inv.created_at + INTERVAL '1 day 2 hours'
  FROM invoices inv
  JOIN patients p ON p.id = inv.patient_id
  WHERE p.patient_number LIKE 'P-2026-01%' AND inv.status = 'partial_paid';

  -- Receptionist: bookings and cancellations
  INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read, created_at, read_at)
  SELECT v_reception,
         CASE WHEN a.status = 'cancelled' THEN 'Appointment cancelled' ELSE 'New appointment booked' END,
         p.first_name || ' ' || p.last_name || ' with Dr. ' || u.first_name || ' ' || u.last_name || ' on '
           || to_char(a.appointment_date, 'DD Mon') || ' at ' || to_char(a.appointment_time, 'HH12:MI AM') || '.',
         CASE WHEN a.status = 'cancelled' THEN 'warning' ELSE 'info' END,
         'appointment', a.id,
         a.status = 'cancelled',
         a.updated_at,
         CASE WHEN a.status = 'cancelled' THEN a.updated_at + INTERVAL '30 minutes' END
  FROM appointments a
  JOIN patients p ON p.id = a.patient_id
  JOIN users u ON u.id = a.doctor_id
  WHERE p.patient_number LIKE 'P-2026-01%' AND a.status IN ('cancelled', 'scheduled');

  -- Nurses: high-priority triage in the past month
  INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read, created_at, read_at)
  SELECT vt.recorded_by, 'High-priority triage',
         p.first_name || ' ' || p.last_name || ' triaged as high priority (SpO2 ' || round(vt.oxygen_saturation)
           || '%, temp ' || vt.temperature || ' C).',
         'warning', 'visit', vt.visit_id, true, vt.recorded_at, vt.recorded_at + INTERVAL '5 minutes'
  FROM vitals vt
  JOIN patients p ON p.id = vt.patient_id
  WHERE p.patient_number LIKE 'P-2026-01%' AND vt.priority = 'high' AND vt.recorded_at > NOW() - INTERVAL '30 days';

  -- Admin: weekly summaries and new staff accounts
  INSERT INTO notifications (user_id, title, message, type, is_read, created_at, read_at)
  SELECT v_admin, 'Weekly summary',
         'Week of ' || to_char(w, 'DD Mon') || ': '
           || (SELECT COUNT(*) FROM visits WHERE visit_date >= w AND visit_date < w + 7) || ' visits completed, '
           || to_char(COALESCE((SELECT SUM(amount) FROM payment_transactions WHERE payment_date >= w AND payment_date < w + 7), 0), 'FM999,999,999')
           || ' Ks collected.',
         'info', w < CURRENT_DATE - 7, (w + 7) + TIME '08:00',
         CASE WHEN w < CURRENT_DATE - 7 THEN (w + 7) + TIME '09:30' END
  FROM (SELECT date_trunc('week', CURRENT_DATE::timestamp)::date - 7 * k AS w FROM generate_series(1, 6) AS k) weeks;

  INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read, created_at, read_at)
  SELECT v_admin, 'Staff account created',
         'Account created for ' || u.first_name || ' ' || u.last_name || ' (' || u.role || ').',
         'success', 'user', u.id, true, NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days'
  FROM users u
  WHERE u.email IN ('thida@gmail.com', 'kyawzin@gmail.com', 'hninwai@gmail.com');

  -- Audit log ---------------------------------------------------------------

  -- Staff sign-ins over the past 30 days (Monday to Saturday)
  INSERT INTO audit_logs (table_name, record_id, action, user_id, actor_role, status, ip_address, user_agent, created_at)
  SELECT 'users', u.id, 'LOGIN_SUCCESS', u.id, u.role, 'success',
         ('192.168.10.' || (20 + abs(hashtext(u.email)) % 200))::inet,
         'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
         ((CURRENT_DATE - k) + TIME '08:20' + floor(random() * 50)::int * INTERVAL '1 minute') AT TIME ZONE 'Asia/Yangon'
  FROM users u
  CROSS JOIN generate_series(1, 30) AS k
  WHERE u.role IN ('admin', 'doctor', 'nurse', 'receptionist', 'cashier')
    AND EXTRACT(DOW FROM CURRENT_DATE - k) <> 0
    AND random() < 0.85;

  INSERT INTO audit_logs (table_name, record_id, action, user_id, actor_role, status, reason, ip_address, created_at)
  SELECT 'users', u.id, 'LOGIN_FAILURE', u.id, u.role, 'failed', 'Invalid password',
         ('192.168.10.' || (20 + abs(hashtext(u.email)) % 200))::inet,
         ((CURRENT_DATE - k) + TIME '08:15') AT TIME ZONE 'Asia/Yangon'
  FROM users u
  CROSS JOIN (VALUES (3), (11), (19)) AS f(k)
  WHERE u.email IN ('lin@gmail.com', 'cashier1@gmail.com');

  -- Patient registrations
  INSERT INTO audit_logs (table_name, record_id, action, user_id, actor_role, status, reason, new_values, created_at)
  SELECT 'patients', p.id, 'CREATE', v_reception, 'receptionist', 'success', 'Patient registered',
         jsonb_build_object('patient_number', p.patient_number, 'name', p.first_name || ' ' || p.last_name),
         p.created_at
  FROM patients p
  WHERE p.patient_number LIKE 'P-2026-01%';

  -- Completed consultations
  INSERT INTO audit_logs (table_name, record_id, action, user_id, actor_role, status, reason, new_values, created_at)
  SELECT 'visits', v.id, 'UPDATE', v.doctor_id, 'doctor', 'success', 'Consultation completed',
         jsonb_build_object('status', 'completed', 'diagnosis', v.diagnosis),
         v.visit_end_time
  FROM visits v
  JOIN patients p ON p.id = v.patient_id
  WHERE p.patient_number LIKE 'P-2026-01%';

  -- Payments
  INSERT INTO audit_logs (table_name, record_id, action, user_id, actor_role, status, reason, new_values, created_at)
  SELECT 'invoices', inv.id, 'INVOICE.PAYMENT', v_cashier, 'cashier', 'success',
         CASE WHEN inv.status = 'partial_paid' THEN 'Partial payment recorded' ELSE 'Invoice paid in full' END,
         jsonb_build_object('invoice_number', inv.invoice_number, 'amount', pt.amount, 'method', pt.payment_method),
         pt.payment_date
  FROM payment_transactions pt
  JOIN invoices inv ON inv.id = pt.invoice_id
  JOIN patients p ON p.id = inv.patient_id
  WHERE p.patient_number LIKE 'P-2026-01%';

  RAISE NOTICE 'Demo history loaded.';
END $$;

COMMIT;
