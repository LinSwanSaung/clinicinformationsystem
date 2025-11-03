# Schema Testing Guide

**Purpose:** Testing procedures for `db/schema.sql` on fresh database installations  
**Last Updated:** 2025-11-03

---

## Prerequisites

- Access to a clean Supabase database (or local PostgreSQL instance)
- PostgreSQL client tools (`psql` or Supabase SQL Editor)
- `pg_dump` utility (for schema comparison)

---

## Testing Procedure

### Step 1: Prepare Clean Database

```sql
-- Option A: Create new Supabase project
-- - Go to Supabase Dashboard
-- - Create new project
-- - Wait for provisioning

-- Option B: Reset existing database (DANGER: Deletes all data!)
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO public;
```

**⚠️ Warning:** Step 1B will delete all existing data. Only use on development/test databases.

---

### Step 2: Apply Schema

1. Open Supabase SQL Editor (or connect via `psql`)
2. Copy entire contents of `db/schema.sql`
3. Paste into SQL Editor
4. Execute (should complete without errors)
5. Verify no error messages

**Expected:** All tables, indexes, functions, triggers, and RLS policies created successfully.

---

### Step 3: Run Smoke Tests

Execute the following queries to verify basic functionality:

#### 3.1 Verify Tables Exist

```sql
-- Count all tables (should match expected count)
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected tables (20):
-- audit_logs, appointments, clinic_settings, doctor_availability,
-- doctor_notes, invoice_items, invoices, medical_documents,
-- notifications, patient_allergies, patient_diagnoses, patient_documents,
-- patients, payment_transactions, prescriptions, queue_tokens,
-- services, users, visits, vitals
```

#### 3.2 Verify Extensions

```sql
SELECT extname, extversion
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- Should return both extensions
```

#### 3.3 Verify Sample Data

```sql
-- Check sample users
SELECT email, role, first_name, last_name
FROM users
ORDER BY created_at;

-- Should have at least:
-- - admin@clinic.com (admin)
-- - dr.smith@clinic.com (doctor)
-- - nurse.williams@clinic.com (nurse)
-- - reception@clinic.com (receptionist)

-- Check sample patients
SELECT patient_number, first_name, last_name
FROM patients
ORDER BY patient_number;

-- Check sample services
SELECT service_code, service_name, category, default_price
FROM services
ORDER BY category, service_name;
```

#### 3.4 Verify Functions

```sql
-- List all functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Expected functions (10+):
-- calculate_bmi, generate_invoice_number, generate_patient_number,
-- generate_token_number, get_doctor_availability_12hr,
-- is_doctor_available, update_updated_at_column, etc.
```

#### 3.5 Verify Triggers

```sql
-- Count triggers
SELECT COUNT(*) as trigger_count
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- List all triggers
SELECT trigger_name, event_object_table, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

#### 3.6 Verify Indexes

```sql
-- Count indexes
SELECT COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public';

-- List indexes by table
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

#### 3.7 Verify RLS Policies

```sql
-- List all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

#### 3.8 Test Key Operations

```sql
-- Test 1: Auto-generate patient number
INSERT INTO patients (first_name, last_name, date_of_birth, gender)
VALUES ('Test', 'Patient', '1990-01-01', 'Male')
RETURNING patient_number;
-- Should auto-generate patient_number like 'P000004'

-- Test 2: Auto-generate invoice number
INSERT INTO invoices (visit_id, patient_id, total_amount)
SELECT v.id, v.patient_id, 100.00
FROM visits v
LIMIT 1;
-- Should auto-generate invoice_number

-- Test 3: BMI calculation trigger
INSERT INTO vitals (patient_id, recorded_by, weight, height, weight_unit, height_unit)
SELECT p.id, u.id, 70.0, 175.0, 'kg', 'cm'
FROM patients p, users u
WHERE p.patient_number = 'P000001'
  AND u.role = 'nurse'
LIMIT 1
RETURNING bmi;
-- Should calculate BMI automatically

-- Test 4: Updated_at trigger
UPDATE users
SET first_name = 'Updated'
WHERE email = 'admin@clinic.com'
RETURNING updated_at;
-- Should update updated_at timestamp
```

---

### Step 4: Schema Comparison Test

This step verifies that the applied schema matches `db/schema.sql`.

#### 4.1 Export Current Schema

```bash
# Using pg_dump (replace with your connection details)
pg_dump \
  --host=your-db-host.supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --schema-only \
  --no-owner \
  --no-privileges \
  --file=exported_schema.sql
```

Or via Supabase CLI:

```bash
supabase db dump --schema public > exported_schema.sql
```

#### 4.2 Compare Schemas

```bash
# Remove sample data INSERT statements from exported schema
# (they may differ in order/format)
grep -v "INSERT INTO" exported_schema.sql > exported_schema_clean.sql
grep -v "INSERT INTO" db/schema.sql > schema_clean.sql

# Compare (ignoring whitespace and comments)
diff -u -w -B schema_clean.sql exported_schema_clean.sql
```

**Expected:** Minimal differences (only in sample data ordering, comments, or formatting).

#### 4.3 Manual Verification Checklist

Compare key aspects manually:

- [ ] All tables present with correct columns
- [ ] All constraints match
- [ ] All indexes present
- [ ] All functions defined
- [ ] All triggers created
- [ ] All RLS policies applied
- [ ] All foreign key relationships correct

---

### Step 5: Functional Testing

Run application-level tests to ensure schema supports all operations:

#### 5.1 Patient Operations

```sql
-- Create patient (should auto-generate patient_number)
INSERT INTO patients (first_name, last_name, date_of_birth, gender)
VALUES ('Functional', 'Test', '1985-05-15', 'Female')
RETURNING id, patient_number;

-- Update patient (should update updated_at)
UPDATE patients
SET phone = '+1234567890'
WHERE patient_number = 'P000005'
RETURNING updated_at;
```

#### 5.2 Appointment Operations

```sql
-- Create appointment
INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time)
SELECT p.id, u.id, CURRENT_DATE + INTERVAL '1 day', '10:00:00'
FROM patients p, users u
WHERE p.patient_number = 'P000001'
  AND u.role = 'doctor'
LIMIT 1
RETURNING id, status;
```

#### 5.3 Visit Operations

```sql
-- Create visit
INSERT INTO visits (patient_id, doctor_id, visit_date, status)
SELECT p.id, u.id, NOW(), 'in_progress'
FROM patients p, users u
WHERE p.patient_number = 'P000001'
  AND u.role = 'doctor'
LIMIT 1
RETURNING id;
```

#### 5.4 Billing Operations

```sql
-- Create invoice
INSERT INTO invoices (visit_id, patient_id, total_amount, status)
SELECT v.id, v.patient_id, 150.00, 'pending'
FROM visits v
LIMIT 1
RETURNING invoice_number, total_amount;

-- Add invoice item
INSERT INTO invoice_items (invoice_id, item_type, item_name, quantity, unit_price, total_price)
SELECT i.id, 'service', 'Consultation', 1, 150.00, 150.00
FROM invoices i
LIMIT 1
RETURNING id;
```

#### 5.5 EMR Operations

```sql
-- Add patient allergy
INSERT INTO patient_allergies (patient_id, allergy_name, allergen_type, severity)
SELECT id, 'Penicillin', 'medication', 'severe'
FROM patients
WHERE patient_number = 'P000001'
RETURNING id;

-- Add diagnosis
INSERT INTO patient_diagnoses (patient_id, diagnosed_by, diagnosis_name, diagnosed_date, status)
SELECT p.id, u.id, 'Hypertension', CURRENT_DATE, 'active'
FROM patients p, users u
WHERE p.patient_number = 'P000001'
  AND u.role = 'doctor'
LIMIT 1
RETURNING id;
```

---

### Step 6: Performance Verification

Check that indexes are being used:

```sql
-- Enable query plan analysis
EXPLAIN ANALYZE
SELECT * FROM patients
WHERE patient_number = 'P000001';
-- Should use idx_patients_patient_number

EXPLAIN ANALYZE
SELECT * FROM appointments
WHERE doctor_id = (SELECT id FROM users WHERE email = 'dr.smith@clinic.com')
  AND appointment_date = CURRENT_DATE;
-- Should use idx_appointments_doctor_id and idx_appointments_date
```

---

## Common Issues & Solutions

### Issue 1: Extension Errors

**Error:** `ERROR: extension "uuid-ossp" does not exist`

**Solution:**

```sql
-- Check available extensions
SELECT * FROM pg_available_extensions WHERE name LIKE '%uuid%';

-- Supabase uses gen_random_uuid() from pgcrypto, not uuid-ossp
-- Remove uuid-ossp extension requirement if not needed
```

### Issue 2: Constraint Violations

**Error:** `ERROR: constraint "valid_role" already exists`

**Solution:** The schema uses `CREATE TABLE IF NOT EXISTS` and `DROP CONSTRAINT IF EXISTS`, so this should not occur. If it does, manually drop the constraint first.

### Issue 3: Missing Columns

**Error:** `ERROR: column "visit_id" does not exist`

**Solution:** Verify that all ALTER TABLE statements were consolidated into table definitions. Check `db/schema.sql` for the column.

### Issue 4: RLS Policy Conflicts

**Error:** `ERROR: policy "Healthcare staff can access all data" already exists`

**Solution:** The schema uses `DROP POLICY IF EXISTS` before creating policies. If conflicts occur, manually drop the policy first.

---

## Success Criteria

✅ All tables created without errors  
✅ All indexes present and functional  
✅ All functions execute correctly  
✅ All triggers fire on appropriate events  
✅ All RLS policies allow expected access  
✅ Sample data inserted successfully  
✅ Auto-generation functions work (patient_number, invoice_number, token_number)  
✅ Schema export matches `db/schema.sql` (excluding sample data)  
✅ Functional tests pass

---

## Next Steps

After successful testing:

1. ✅ Document any issues found
2. ✅ Update `db/schema.sql` if corrections needed
3. ✅ Update this testing guide with any new test cases
4. ✅ Proceed with application integration testing
5. ✅ Deploy to staging environment

---

## Related Documents

- `db/schema.sql` - The consolidated schema file
- `db/migration-inventory.md` - Legacy migration history
- `db/usage-manifest.json` - Table usage documentation

---

**Last Updated:** 2025-11-03  
**Maintained By:** Stage 3 Refactor
