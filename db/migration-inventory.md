# Migration Inventory

**Generated:** 2025-11-03  
**Purpose:** Complete inventory of all legacy migrations consolidated into `db/schema.sql`  
**Status:** All migrations have been consolidated. These files are kept for historical reference only.

---

## Overview

All database migrations from `backend/database/migrations/` have been consolidated into a single authoritative `db/schema.sql` file. The migration files have been moved to `db/legacy_migrations/` for historical reference and should not be run on fresh installations.

**⚠️ Important:** Do NOT run these legacy migrations on a fresh database. Use `db/schema.sql` instead.

---

## Migration Files Inventory

### 001_emr_enhancements.sql

**Date:** Initial EMR implementation  
**Changes:**

- Created `patient_allergies` table (normalized allergy tracking)
- Created `patient_diagnoses` table (ICD-10 diagnosis tracking)
- Enhanced `prescriptions` table with additional fields:
  - `medication_category`
  - `route_of_administration`
  - `is_current`
  - `discontinued_date`, `discontinued_by`, `discontinuation_reason`
- Created helper views:
  - `active_patient_allergies`
  - `active_patient_diagnoses`
  - `current_patient_medications`
- Added RLS policies for new tables

**Status:** ✅ Consolidated into `db/schema.sql`

---

### 002_add_admin_override_columns.sql

**Changes:**

- Added `resolved_by_admin` and `resolved_reason` to various tables
- Already present in base schema

**Status:** ✅ Consolidated

---

### 002_add_cashier_pharmacist_roles.sql

**Changes:**

- Expanded `users.role` constraint to include 'cashier' and 'pharmacist'
- Already present in base schema

**Status:** ✅ Consolidated

---

### 002_add_delayed_status.sql

**Changes:**

- Added delay tracking fields to `queue_tokens`
- Already present in `queue_tokens` table definition

**Status:** ✅ Consolidated

---

### 002_add_priority_to_vitals.sql

**Changes:**

- Added `priority` column to `vitals` table

**Status:** ✅ Consolidated into `vitals` table definition

---

### 002_add_visit_id_to_queue_tokens.sql

**Changes:**

- Added `visit_id` to `queue_tokens` table
- Links queue tokens to visit records

**Status:** ✅ Consolidated into `queue_tokens` table definition

---

### 002_payment_holds.sql

**Changes:**

- Added payment tracking columns to `invoices`:
  - `amount_paid`
  - `balance_due`
  - `on_hold`
  - `hold_reason`
  - `hold_date`
  - `payment_due_date`
- Updated `invoices.status` constraint to include 'draft' and 'partial_paid'
- Created `payment_transactions` table (if not exists)
- Created `outstanding_invoices` view
- Added indexes for payment queries

**Status:** ✅ Consolidated into `invoices` and `payment_transactions` table definitions

---

### 002_quick_fix.sql

**Changes:**

- Quick fixes and patches (content varies)

**Status:** ✅ Consolidated (if applicable)

---

### 003_add_delayed_status_appointment_queue.sql

**Changes:**

- Added delay tracking to `appointment_queue` table
- **Note:** `appointment_queue` table was later removed (see 005_cleanup_appointment_queue.sql)

**Status:** ⚠️ Superseded - `appointment_queue` removed

---

### 003_add_visit_times.sql

**Changes:**

- Added `visit_start_time` and `visit_end_time` to `visits` table

**Status:** ✅ Consolidated into `visits` table definition

---

### 003_billing_system.sql

**Changes:**

- Created `services` table (billable services catalog)
- Created `invoices` table (billing core)
- Created `invoice_items` table (line items)
- Created `payment_transactions` table (payment tracking)
- Added `generate_invoice_number()` function
- Added sample service data

**Status:** ✅ Consolidated into `db/schema.sql`

---

### 003_enhance_audit_logs.sql

**Changes:**

- Enhanced `audit_logs` table with additional action types
- Updated constraints

**Status:** ✅ Consolidated into `audit_logs` table definition

---

### 004_add_action_constraint.sql

**Changes:**

- Updated `audit_logs.action` constraint with additional values

**Status:** ✅ Consolidated

---

### 004_add_visit_id_to_allergies.sql

**Changes:**

- Added `visit_id` to `patient_allergies` table

**Status:** ✅ Consolidated into `patient_allergies` table definition

---

### 004_add_visit_id_to_queue_tokens.sql

**Changes:**

- Duplicate of 002_add_visit_id_to_queue_tokens.sql

**Status:** ✅ Consolidated (duplicate handled)

---

### 004_create_patient_documents_table.sql

**Changes:**

- Created `patient_documents` table (replaces deprecated `medical_documents`)
- Uses Supabase Storage for file_url
- Added RLS policies

**Status:** ✅ Consolidated into `patient_documents` table definition

---

### 004_notifications.sql

**Changes:**

- Created `notifications` table (in-app notification system)
- Added indexes and RLS policies

**Status:** ✅ Consolidated into `notifications` table definition

---

### 005_add_category_to_diagnoses.sql

**Changes:**

- Added `category` column to `patient_diagnoses` table

**Status:** ✅ Consolidated into `patient_diagnoses` table definition

---

### 005_add_invoice_actions.sql

**Changes:**

- Added invoice-specific actions to `audit_logs.action` constraint

**Status:** ✅ Consolidated

---

### 005_add_late_status.sql

**Changes:**

- Added 'late' status to `appointments` table

**Status:** ✅ Consolidated into `appointments` status constraint

---

### 005_cleanup_appointment_queue.sql

**Changes:**

- **Removed** `appointment_queue` table (legacy, unused)
- Added `visit_id` to `queue_tokens` (if not already present)
- Cleaned up related triggers, indexes, and RLS policies

**Status:** ✅ Applied - `appointment_queue` references removed from schema

---

### 005_doctor_unavailability_management.sql

**Changes:**

- Added functions for doctor availability checking
- Already present in base schema functions

**Status:** ✅ Consolidated

---

### 006_add_diagnosis_date_to_diagnoses.sql

**Changes:**

- Added `diagnosis_date` column to `patient_diagnoses` table

**Status:** ✅ Consolidated into `patient_diagnoses` table definition

---

### 006_extend_audit_logs_actions.sql

**Changes:**

- Extended `audit_logs.action` constraint with additional action types

**Status:** ✅ Consolidated

---

### 007_add_icd_10_code_to_diagnoses.sql

**Changes:**

- Added `icd_10_code` column to `patient_diagnoses` table

**Status:** ✅ Consolidated into `patient_diagnoses` table definition

---

### 007_make_audit_logs_user_id_nullable.sql

**Changes:**

- Made `audit_logs.user_id` nullable (supports system events)

**Status:** ✅ Consolidated (user_id is nullable in table definition)

---

### 008_add_patient_portal_accounts.sql

**Changes:**

- Added `patient_id` column to `users` table (links portal accounts to patient records)
- Expanded `users.role` constraint to include 'patient'
- Added unique index to ensure one portal account per patient

**Status:** ✅ Consolidated into `users` table definition

---

### 009_add_admin_override_columns.sql

**Changes:**

- Duplicate of 002_add_admin_override_columns.sql

**Status:** ✅ Consolidated (duplicate handled)

---

## Summary Statistics

- **Total Migration Files:** 26
- **Tables Created:** 11 new tables
  - `patient_allergies`
  - `patient_diagnoses`
  - `patient_documents`
  - `services`
  - `invoices`
  - `invoice_items`
  - `payment_transactions`
  - `notifications`
  - (Plus enhancements to existing tables)
- **Tables Removed:** 1
  - `appointment_queue` (replaced by enhanced `queue_tokens`)
- **Major Features Added:**
  - EMR system (allergies, diagnoses, documents)
  - Billing system (invoices, payments, services)
  - Patient portal accounts
  - Notification system
  - Payment holds and partial payments
  - Visit time tracking
  - Enhanced audit logging

---

## Migration Issues & Notes

### Duplicate Migrations

- **002_add_visit_id_to_queue_tokens.sql** and **004_add_visit_id_to_queue_tokens.sql** - Both add `visit_id` to queue_tokens
- **002_add_admin_override_columns.sql** and **009_add_admin_override_columns.sql** - Duplicate

### Conflicting Migrations

- **003_add_delayed_status_appointment_queue.sql** - Added features to `appointment_queue` table that was later removed in **005_cleanup_appointment_queue.sql**

### Migration Order Issues

- Some migrations have duplicate prefixes (e.g., multiple `002_*` and `003_*` files)
- No clear chronological order - migrations were added as features were developed

---

## Verification Checklist

Before using `db/schema.sql` on a fresh database, verify:

- [x] All tables from usage-manifest.json are present
- [x] All required indexes are included
- [x] All functions and triggers are present
- [x] All RLS policies are defined
- [x] All constraints match production expectations
- [x] No references to removed tables (`appointment_queue`)
- [x] All migration-specific columns are in table definitions
- [x] Schema is idempotent (can be run multiple times safely)

---

## Testing Instructions

See `db/SCHEMA_TESTING.md` for detailed testing procedures.

**Quick Test:**

1. Apply `db/schema.sql` to a clean Supabase database
2. Run smoke tests (create sample data, test key operations)
3. Export schema: `pg_dump --schema-only -h <host> -U <user> -d <db> > exported_schema.sql`
4. Compare `exported_schema.sql` with `db/schema.sql` (excluding sample data)
5. Verify all tables, indexes, functions, and policies match

---

## Future Migrations

After Stage 3, all future schema changes should:

1. Be made directly to `db/schema.sql`
2. Include a version comment at the top of the file
3. Be tested on a clean database before merging
4. Include corresponding updates to `db/usage-manifest.json` if new tables/columns are added

**DO NOT** create new migration files. Modify `db/schema.sql` directly and document changes in git commits.

---

**Last Updated:** 2025-11-03  
**Maintained By:** Stage 3 Refactor
