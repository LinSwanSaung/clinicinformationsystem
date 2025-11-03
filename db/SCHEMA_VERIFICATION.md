# Schema Verification Checklist

**Purpose:** Verify that `db/schema.sql` contains everything needed for a fresh install  
**Last Updated:** 2025-11-03

---

## ✅ Tables Verification (20 Required)

### Core Tables

- [x] `users` - System users with patient portal support
- [x] `patients` - Patient demographics
- [x] `appointments` - Appointment scheduling
- [x] `visits` - Medical encounters (with visit_start_time, visit_end_time)
- [x] `vitals` - Vital signs (with priority field)
- [x] `prescriptions` - Medications (with enhanced fields: medication_category, route_of_administration, is_current, discontinued_date, discontinued_by, discontinuation_reason)
- [x] `doctor_notes` - Clinical notes
- [x] `medical_documents` - Legacy document storage
- [x] `audit_logs` - Audit trail (user_id nullable)
- [x] `doctor_availability` - Doctor schedules
- [x] `queue_tokens` - Queue management (with visit_id, delay tracking)
- [x] `clinic_settings` - Global settings

### EMR Tables

- [x] `patient_allergies` - Normalized allergies (with visit_id)
- [x] `patient_diagnoses` - ICD-10 diagnoses (with category, icd_10_code, diagnosis_date)
- [x] `patient_documents` - Document metadata (Supabase Storage)

### Billing Tables

- [x] `services` - Billable services catalog
- [x] `invoices` - Billing core (with payment holds: on_hold, hold_reason, hold_date, payment_due_date, amount_paid, balance_due)
- [x] `invoice_items` - Invoice line items
- [x] `payment_transactions` - Payment tracking (merged from both migrations)

### Other Tables

- [x] `notifications` - In-app notifications

**Total:** 20 tables ✅

---

## ✅ Extensions

- [x] `uuid-ossp` - UUID generation
- [x] `pgcrypto` - Cryptography functions (gen_random_uuid, crypt)

---

## ✅ Key Constraints

- [x] `users.valid_role` - Includes: admin, doctor, nurse, receptionist, cashier, pharmacist, patient
- [x] `users.valid_email` - Email format validation
- [x] `patients.valid_gender` - Male, Female, Other
- [x] `patients.valid_blood_group` - All blood types
- [x] `appointments.valid_status` - All appointment statuses including 'late'
- [x] `appointments.valid_duration` - Duration validation
- [x] `invoices.valid_invoice_status` - draft, pending, partial_paid, paid, cancelled, refunded
- [x] `queue_tokens.valid_token_status` - Including 'delayed'
- [x] `audit_logs.valid_action` - All action types from migrations
- [x] Foreign key constraints on all relationships

---

## ✅ Indexes

### Users

- [x] `idx_users_email`
- [x] `idx_users_role`
- [x] `idx_users_active`
- [x] `idx_users_patient_id` (NEW - from migration 008)
- [x] `uniq_patient_portal_per_patient` (NEW - from migration 008)

### Patients

- [x] `idx_patients_patient_number`
- [x] `idx_patients_name`
- [x] `idx_patients_phone`
- [x] `idx_patients_active`

### Appointments

- [x] `idx_appointments_patient_id`
- [x] `idx_appointments_doctor_id`
- [x] `idx_appointments_date`
- [x] `idx_appointments_status`

### Visits

- [x] `idx_visits_patient_id`
- [x] `idx_visits_doctor_id`
- [x] `idx_visits_date`
- [x] `idx_visits_start_time` (NEW)
- [x] `idx_visits_end_time` (NEW)

### Vitals

- [x] `idx_vitals_visit_id`
- [x] `idx_vitals_patient_id`
- [x] `idx_vitals_recorded_at`

### Prescriptions

- [x] `idx_prescriptions_patient_id`
- [x] `idx_prescriptions_doctor_id`
- [x] `idx_prescriptions_status`
- [x] `idx_prescriptions_current` (NEW)
- [x] `idx_prescriptions_category` (NEW)
- [x] `idx_prescriptions_route` (NEW)

### Queue Tokens

- [x] `idx_queue_tokens_patient_id`
- [x] `idx_queue_tokens_doctor_id`
- [x] `idx_queue_tokens_date`
- [x] `idx_queue_tokens_status`
- [x] `idx_queue_tokens_number`
- [x] `idx_queue_tokens_visit_id` (NEW)
- [x] `idx_queue_tokens_doctor_status`

### Billing

- [x] `idx_invoices_visit_id`
- [x] `idx_invoices_patient_id`
- [x] `idx_invoices_status`
- [x] `idx_invoices_invoice_number`
- [x] `idx_invoices_on_hold` (NEW)
- [x] `idx_invoices_balance_due` (NEW)
- [x] `idx_invoices_payment_due` (NEW)
- [x] `idx_payment_transactions_invoice_id`
- [x] `idx_payment_transactions_invoice` (NEW - from payment_holds)
- [x] `idx_payment_transactions_date` (NEW)
- [x] `idx_invoice_items_invoice_id`
- [x] `idx_services_category`
- [x] `idx_services_is_active`

### EMR

- [x] `idx_patient_allergies_patient_id`
- [x] `idx_patient_allergies_active`
- [x] `idx_patient_allergies_severity`
- [x] `idx_patient_allergies_name`
- [x] `idx_patient_allergies_visit_id` (NEW)
- [x] `idx_patient_diagnoses_patient_id`
- [x] `idx_patient_diagnoses_visit`
- [x] `idx_patient_diagnoses_status`
- [x] `idx_patient_diagnoses_date`
- [x] `idx_patient_diagnoses_code`
- [x] `idx_patient_diagnoses_doctor`

### Audit Logs

- [x] `idx_audit_logs_table_name`
- [x] `idx_audit_logs_record_id`
- [x] `idx_audit_logs_user_id`
- [x] `idx_audit_logs_actor_role`
- [x] `idx_audit_logs_status`
- [x] `idx_audit_logs_action_status`
- [x] `idx_audit_logs_created_at`

### Notifications

- [x] `idx_notifications_user_id`
- [x] `idx_notifications_is_read`
- [x] `idx_notifications_created_at`

---

## ✅ Functions

- [x] `update_updated_at_column()` - Auto-update timestamps
- [x] `generate_patient_number()` - Auto-generate patient numbers
- [x] `calculate_bmi()` - BMI calculation
- [x] `generate_token_number()` - Auto-generate queue tokens
- [x] `generate_invoice_number()` - Auto-generate invoice numbers
- [x] `set_invoice_number()` - Trigger function for invoices
- [x] `is_doctor_available()` - Check doctor availability
- [x] `validate_doctor_availability()` - Validate doctor role
- [x] `convert_12hr_to_24hr()` - Time conversion
- [x] `convert_24hr_to_12hr()` - Time conversion
- [x] `get_doctor_availability_12hr()` - Get availability in 12hr format
- [x] `is_doctor_currently_available()` - Check current availability
- [x] `get_doctor_next_available_time()` - Get next slot
- [x] `doctor_has_remaining_availability_today()` - Check remaining slots
- [x] `mark_tokens_missed_during_unavailability()` - Auto-mark missed tokens
- [x] `cancel_doctor_remaining_tokens()` - Cancel tokens for unavailable doctor

---

## ✅ Triggers

- [x] `update_users_updated_at`
- [x] `update_patients_updated_at`
- [x] `update_appointments_updated_at`
- [x] `update_visits_updated_at`
- [x] `update_prescriptions_updated_at`
- [x] `update_doctor_notes_updated_at`
- [x] `update_doctor_availability_updated_at`
- [x] `update_queue_tokens_updated_at`
- [x] `update_services_updated_at`
- [x] `update_invoices_updated_at`
- [x] `update_patient_allergies_updated_at`
- [x] `update_patient_diagnoses_updated_at`
- [x] `auto_generate_patient_number`
- [x] `calculate_vitals_bmi`
- [x] `auto_generate_token_number`
- [x] `trigger_set_invoice_number`
- [x] `validate_doctor_availability_trigger`

---

## ✅ Views

- [x] `active_patient_allergies`
- [x] `active_patient_diagnoses`
- [x] `current_patient_medications`
- [x] `outstanding_invoices`

---

## ✅ RLS Policies

All tables have RLS enabled with appropriate policies:

- [x] users
- [x] patients
- [x] appointments
- [x] visits
- [x] vitals
- [x] prescriptions
- [x] doctor_notes
- [x] medical_documents
- [x] audit_logs
- [x] doctor_availability
- [x] queue_tokens
- [x] clinic_settings
- [x] patient_allergies
- [x] patient_diagnoses
- [x] patient_documents
- [x] services
- [x] invoices
- [x] invoice_items
- [x] payment_transactions
- [x] notifications

**Note:** `appointment_queue` table and its RLS policies have been removed (replaced by enhanced `queue_tokens`).

---

## ✅ Sample Data

- [x] Default admin user (admin@clinic.com)
- [x] Sample doctor (dr.smith@clinic.com)
- [x] Sample nurse (nurse.williams@clinic.com)
- [x] Sample receptionist (reception@clinic.com)
- [x] Sample patients (P000001, P000002, P000003)
- [x] Sample doctor availability slots
- [x] Sample appointments
- [x] Sample queue tokens
- [x] Sample services (10 common services)

---

## ✅ Migration Consolidation Status

All 26 migrations have been reviewed and consolidated:

- ✅ Table definitions include all columns from migrations
- ✅ All constraints updated
- ✅ All indexes added
- ✅ All functions included
- ✅ All triggers configured
- ✅ All RLS policies applied
- ✅ Duplicate table definitions removed
- ✅ Redundant ALTER TABLE statements cleaned up (kept for idempotency)
- ✅ Comments and documentation added

---

## ✅ Key Improvements Made

1. **Merged duplicate `payment_transactions`** - Combined fields from both billing_system and payment_holds migrations
2. **Added enhanced prescription fields** - medication_category, route_of_administration, is_current, discontinued_date, etc.
3. **Added patient portal indexes** - idx_users_patient_id and uniq_patient_portal_per_patient
4. **Consolidated invoice payment fields** - All payment hold fields in table definition
5. **Added visit time tracking** - visit_start_time and visit_end_time in visits table
6. **Added priority to vitals** - Priority field in vitals table
7. **Made audit_logs.user_id nullable** - Supports system events
8. **Removed appointment_queue references** - Table was removed in migration 005

---

## ⚠️ Known Issues Resolved

- ✅ Duplicate payment_transactions table → Merged into single complete definition
- ✅ Missing prescription enhanced fields → Added to table definition
- ✅ Missing users.patient_id indexes → Added
- ✅ Redundant ALTER TABLE statements → Cleaned up (kept for idempotency)
- ✅ appointment_queue references → Removed

---

## 🎯 Fresh Install Readiness

**Status:** ✅ READY

The `db/schema.sql` file is complete and ready for fresh database installations. It includes:

- All 20 required tables
- All extensions
- All indexes (60+)
- All functions (17)
- All triggers (17)
- All views (4)
- All RLS policies
- Sample data for testing

**Next Steps:**

1. Apply to clean Supabase database
2. Run smoke tests (see `db/SCHEMA_TESTING.md`)
3. Verify schema matches expectations
4. Proceed with application deployment

---

**Last Updated:** 2025-11-03  
**Verified By:** Stage 3 Refactor
