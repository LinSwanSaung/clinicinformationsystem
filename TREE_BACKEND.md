# Backend Directory Tree

## Overview

Node.js/Express API with Supabase (PostgreSQL) backend. ES modules, structured as routes → services → models/repositories.

## Directory Structure (Depth ≤ 4)

```
backend/
├── src/
│   ├── app.js                      # Express app setup, middleware, route registration
│   │
│   ├── config/                     # Configuration
│   │   ├── app.config.js           # App-level config
│   │   └── database.js             # Supabase client initialization
│   │
│   ├── constants/                  # Application constants
│   │   └── roles.js                # Role definitions (ROLES enum)
│   │
│   ├── errors/                     # Custom error classes
│   │   └── ApplicationError.js    # Structured error class (statusCode, code, details)
│   │
│   ├── jobs/                       # Scheduled jobs (cron)
│   │   └── autoCancelAppointments.js  # End-of-day appointment auto-cancel
│   │
│   ├── middleware/                  # Express middleware (5 files)
│   │   ├── activeVisitCheck.js     # Validates active visit exists
│   │   ├── auth.js                 # JWT authentication (app + Supabase tokens)
│   │   ├── errorHandler.js         # Centralized error handling
│   │   ├── rateLimiter.js          # Rate limiting
│   │   └── requestLogger.js        # Request logging (morgan)
│   │
│   ├── models/                     # Data models (17 files)
│   │   ├── Appointment.model.js
│   │   ├── BaseModel.js             # Base class for all models (Supabase operations)
│   │   ├── DoctorAvailability.model.js
│   │   ├── DoctorNote.model.js
│   │   ├── Invoice.model.js
│   │   ├── InvoiceItem.model.js
│   │   ├── Notification.model.js
│   │   ├── Patient.model.js
│   │   ├── PatientAllergy.model.js
│   │   ├── PatientDiagnosis.model.js
│   │   ├── PaymentTransaction.model.js
│   │   ├── Prescription.model.js
│   │   ├── QueueToken.model.js
│   │   ├── Service.model.js
│   │   ├── User.model.js
│   │   ├── Visit.model.js
│   │   └── Vitals.model.js
│   │
│   ├── routes/                     # Express route handlers (23 files)
│   │   ├── admin.routes.js
│   │   ├── ai.routes.js             # OpenAI integration
│   │   ├── appointment.routes.js
│   │   ├── auditLog.routes.js
│   │   ├── auth.routes.js
│   │   ├── clinicSettings.routes.js
│   │   ├── doctorAvailability.routes.js
│   │   ├── doctorNote.routes.js
│   │   ├── document.routes.js
│   │   ├── invoice.routes.js
│   │   ├── medicalRecord.routes.js
│   │   ├── notification.routes.js
│   │   ├── patient.routes.js
│   │   ├── patientAllergy.routes.js
│   │   ├── patientDiagnosis.routes.js
│   │   ├── patientPortal.routes.js
│   │   ├── payment.routes.js
│   │   ├── prescription.routes.js
│   │   ├── queue.routes.js
│   │   ├── service.routes.js
│   │   ├── user.routes.js
│   │   ├── visit.routes.js
│   │   └── vitals.routes.js
│   │
│   ├── services/                    # Business logic layer (28 files)
│   │   ├── repositories/           # Data access layer (7 files)
│   │   │   ├── AppointmentsRepo.js
│   │   │   ├── BillingRepo.js
│   │   │   ├── InvoicesRepo.js
│   │   │   ├── PatientsRepo.js
│   │   │   ├── PrescriptionsRepo.js
│   │   │   ├── VisitsRepo.js
│   │   │   └── VitalsRepo.js
│   │   │
│   │   ├── transactions/           # Transaction utilities
│   │   │   └── TransactionRunner.js  # Compensation-based transaction runner
│   │   │
│   │   ├── Appointment.service.js
│   │   ├── AuditLog.service.js
│   │   ├── Auth.service.js
│   │   ├── ClinicSettings.service.js
│   │   ├── DoctorAvailability.service.js
│   │   ├── DoctorNote.service.js
│   │   ├── Invoice.service.js      # Large file (~400+ lines), handles invoice lifecycle
│   │   ├── Notification.service.js
│   │   ├── OpenAI.service.js        # OpenAI integration
│   │   ├── Patient.service.js
│   │   ├── PatientAllergy.service.js
│   │   ├── PatientDiagnosis.service.js
│   │   ├── PatientPortal.service.js
│   │   ├── Payment.service.js
│   │   ├── Prescription.service.js
│   │   ├── Queue.service.js         # Large file (~1,400+ lines), queue/visit/token management
│   │   ├── Service.service.js
│   │   ├── TokenScheduler.service.js  # Token expiration scheduler
│   │   ├── Visit.service.js         # Large file (~1,000+ lines), visit CRUD + EMR + PDF
│   │   └── Vitals.service.js
│   │
│   ├── utils/                      # Utility functions (4 files)
│   │   ├── auditLogger.js          # Audit log helper
│   │   ├── dateHelper.js            # Date utilities
│   │   ├── fileLogger.js           # File logging
│   │   └── responseHelper.js       # Response formatting
│   │
│   └── validators/                 # Request validation (4 files)
│       ├── auth.validator.js
│       ├── base.validator.js
│       ├── patient.validator.js
│       └── queue.validator.js
│
├── database/                       # Database files
│   ├── migrations/                 # SQL migration files (31 files)
│   │   ├── 001_emr_enhancements.sql
│   │   ├── 002_add_admin_override_columns.sql
│   │   ├── 002_add_cashier_pharmacist_roles.sql
│   │   ├── 002_add_delayed_status.sql
│   │   ├── 002_add_priority_to_vitals.sql
│   │   ├── 002_add_visit_id_to_queue_tokens.sql
│   │   ├── 002_payment_holds.sql
│   │   ├── 002_quick_fix.sql
│   │   ├── 003_add_delayed_status_appointment_queue.sql
│   │   ├── 003_add_visit_times.sql
│   │   ├── 003_billing_system.sql
│   │   ├── 003_enhance_audit_logs.sql
│   │   ├── 004_add_action_constraint.sql
│   │   ├── 004_add_visit_id_to_allergies.sql
│   │   ├── 004_add_visit_id_to_queue_tokens.sql
│   │   ├── 004_create_patient_documents_table.sql
│   │   ├── 004_notifications.sql
│   │   ├── 005_add_category_to_diagnoses.sql
│   │   ├── 005_add_invoice_actions.sql
│   │   ├── 005_add_late_status.sql
│   │   ├── 005_cleanup_appointment_queue.sql
│   │   ├── 005_doctor_unavailability_management.sql
│   │   ├── 006_add_diagnosis_date_to_diagnoses.sql
│   │   ├── 006_extend_audit_logs_actions.sql
│   │   ├── 007_add_icd_10_code_to_diagnoses.sql
│   │   ├── 007_make_audit_logs_user_id_nullable.sql
│   │   ├── 008_add_patient_portal_accounts.sql
│   │   ├── 009_add_admin_override_columns.sql
│   │   ├── 010_backfill_invoices_without_visit.sql
│   │   ├── 010_backfill_tokens_without_visit.sql
│   │   ├── 010_lifecycle_integrity.sql
│   │   ├── BILLING_REUSE_GUIDE.md
│   │   ├── README_LIFECYCLE_MIGRATION.md
│   │   └── README_PAYMENT_MIGRATION.md
│   │
│   ├── seeds/                      # Seed data
│   │   ├── 001_sample_data.sql
│   │   └── 002_visit_history.sql
│   │
│   ├── DOCTOR_AVAILABILITY.md
│   ├── README.md
│   ├── schema.sql                  # Main schema file (2,200+ lines)
│   └── v2schema.sql               # Legacy schema (should be consolidated)
│
├── scripts/                        # Utility scripts
│   ├── backfill-null-visit-ids.js
│   └── cleanup-test-tokens.js
│
├── AI_MIGRATION_GUIDE.md
├── AUDIT_LOGGING_SUMMARY.md
├── DOCTOR_UNAVAILABILITY_SYSTEM.md
├── package.json
├── README.md
├── setup.js
└── SUPABASE_SETUP.md
```

## Key Observations

### Architecture Layers

- **Routes** → **Services** → **Models/Repositories**: Clear separation
- **Repositories** (`services/repositories/`): Data access abstraction (7 repos, not all services use them)
- **Services**: Business logic (28 files, some very large: Queue.service.js ~1,400 lines, Visit.service.js ~1,000 lines)
- **Models**: Data models extending `BaseModel` (17 files)

### Large Files

- `Queue.service.js`: ~1,400 lines (token lifecycle, queue operations, consultation management)
- `Visit.service.js`: ~1,000 lines (visit CRUD, EMR aggregation, PDF generation)
- `Invoice.service.js`: ~400+ lines (invoice lifecycle, payment processing)

### Database

- **Migrations**: 31 SQL files (some duplicate numbering: multiple 002*\*, 003*\*, etc.)
- **Schema files**: `schema.sql` (main) + `v2schema.sql` (legacy, should be consolidated)
- **Seeds**: Sample data for development

### Middleware

- `auth.js`: JWT authentication (app + Supabase tokens)
- `errorHandler.js`: Centralized error handling (ApplicationError support)
- `activeVisitCheck.js`: Validates active visit exists
- `rateLimiter.js`: Rate limiting
- `requestLogger.js`: Request logging

### Jobs

- `autoCancelAppointments.js`: Scheduled job (node-cron) for end-of-day appointment cleanup

### Utilities

- `TransactionRunner.js`: Compensation-based transaction runner (used in Queue/Invoice services)
- `auditLogger.js`: Audit log helper
- `responseHelper.js`: Response formatting

### Validators

- 4 validator files (auth, patient, queue, base)
- Uses express-validator/joi
