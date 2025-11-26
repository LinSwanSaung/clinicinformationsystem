# ThriveCare Clinic Information System - Comprehensive Project Analysis

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Core Services](#core-services)
5. [Workflows](#workflows)
6. [Database Schema](#database-schema)
7. [Role-Based Access Control](#role-based-access-control)
8. [Key Features](#key-features)
9. [Security Features](#security-features)
10. [Deployment & Infrastructure](#deployment--infrastructure)

---

## Project Overview

**ThriveCare** is a modern, comprehensive Clinic Information System (CIS) designed for low-resource healthcare settings. It provides end-to-end management of patient care, from appointment scheduling to billing and prescription management.

### Key Characteristics
- **Full-stack application** with separate frontend and backend
- **Multi-role system** supporting 7 different user roles
- **Real-time queue management** for patient flow
- **Integrated billing and payment** processing
- **Medical records management** with prescriptions and diagnoses
- **Audit logging** for compliance and tracking

---

## Technology Stack

### Frontend
- **Framework**: React 19.1.0
- **Build Tool**: Vite 7.0.0
- **Styling**: Tailwind CSS 3.3.0
- **UI Components**: 
  - Radix UI (Accessible component primitives)
  - shadcn/ui (Component library)
  - Lucide React (Icons)
- **State Management**: 
  - React Query (TanStack Query) 5.59.0 - Server state & caching
  - React Context API - Global state (Auth, etc.)
- **Routing**: React Router DOM 7.6.3
- **Internationalization**: i18next 25.6.0
- **Charts**: Recharts 3.3.0
- **Animations**: Framer Motion 12.23.19
- **Validation**: Zod 3.23.8
- **Date Handling**: date-fns 4.1.0

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 4.18.2
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcryptjs 2.4.3
- **Validation**: 
  - Joi 17.12.1
  - express-validator 7.2.1
- **Security**:
  - Helmet 7.1.0 (Security headers)
  - CORS 2.8.5
  - express-rate-limit 7.1.5
- **File Upload**: Multer 2.0.0-alpha.7
- **PDF Generation**: PDFKit 0.17.2
- **CSV Export**: json2csv 6.0.0-alpha.2
- **Email**: Nodemailer 6.10.1
- **Scheduling**: node-cron 3.0.3
- **AI Integration**: OpenAI 6.7.0
- **Logging**: Morgan 1.10.0 + Custom logger

### Infrastructure & Deployment
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Railway / Render
- **Database**: Supabase (PostgreSQL)
- **Version Control**: Git
- **CI/CD**: GitHub Actions

---

## System Architecture

### Architecture Pattern: Layered Architecture

```
┌─────────────────────────────────────┐
│         Routes (HTTP Layer)         │  ← HTTP requests/responses, validation
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      Services (Business Logic)      │  ← Business rules, orchestration
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│   Repositories (Data Access Layer)  │  ← Database queries, data abstraction
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      Database (Supabase Client)     │  ← PostgreSQL database
└─────────────────────────────────────┘
```

### Frontend Architecture: Feature-Based

```
src/
├── app/                    # App-level configuration
│   ├── App.jsx            # Root component
│   ├── providers.jsx      # Context providers
│   └── routes.jsx         # Route definitions
├── components/            # Shared components
│   ├── layout/           # Layout components
│   ├── library/          # Reusable component library
│   └── ui/               # Base UI components
├── features/             # Feature modules (self-contained)
│   ├── appointments/     # Appointment management
│   ├── patients/         # Patient management
│   ├── queue/            # Queue management
│   ├── billing/           # Invoice & payment
│   └── medical/          # Medical records
├── pages/                # Page components
├── services/             # API services
├── hooks/                # Custom React hooks
└── utils/                # Utility functions
```

### Key Architectural Principles

1. **Separation of Concerns**: Clear boundaries between layers
2. **Single Responsibility**: Each service handles one domain
3. **Dependency Injection**: Services can import other services
4. **Repository Pattern**: Data access abstracted from business logic
5. **Transaction Pattern**: Atomic operations for data consistency
6. **Optimistic Locking**: Version checking for concurrent updates

---

## Core Services

### Backend Services (23 Services)

#### 1. **Appointment Service** (`Appointment.service.js`)
- Create, read, update, delete appointments
- Check doctor availability
- Prevent same-day appointments
- Reschedule appointments
- Get available time slots
- Appointment status management (scheduled, waiting, consulting, completed, cancelled, no_show, late)

#### 2. **Visit Service** (`Visit.service.js`)
- Create and manage medical visits
- Prevent multiple concurrent visits per patient
- Complete visits (with cost calculation)
- Get patient visit history
- Export visit history (PDF/CSV)
- Track visit status (in_progress, completed, cancelled)
- Pending items detection for admin review

#### 3. **Queue Service** (`Queue.service.js`)
- Issue queue tokens (walk-in or appointment-based)
- Manage queue status (waiting, called, serving, completed, missed, cancelled)
- Call next patient
- Start/end consultations
- Mark patients as ready (nurse action)
- Detect and fix stuck consultations
- Queue analytics and reporting
- Batch queue status for multiple doctors

#### 4. **Invoice Service** (`Invoice.service.js`)
- Create invoices for visits
- Add service items to invoices
- Add medicine items to invoices
- Apply discounts
- Recalculate invoice totals
- Complete invoices (triggers visit completion)
- Cancel invoices
- Get patient invoices and outstanding balances
- Optimistic locking for concurrent updates

#### 5. **Payment Service** (`Payment.service.js`)
- Record payments (full or partial)
- Support multiple payment methods (cash, card, mobile money, insurance)
- Atomic payment recording with advisory locks
- Auto-complete invoices when fully paid
- Payment transaction history

#### 6. **Prescription Service** (`Prescription.service.js`)
- Create prescriptions
- Get patient prescriptions
- Get visit prescriptions
- Update prescription status (active, completed, cancelled, expired)
- Cancel prescriptions

#### 7. **Patient Service** (`Patient.service.js`)
- Patient registration and management
- Search patients
- Update patient information
- Patient demographics management

#### 8. **Vitals Service** (`Vitals.service.js`)
- Record patient vital signs
- Get visit vitals
- Get patient vitals history
- Vital signs validation

#### 9. **Doctor Availability Service** (`DoctorAvailability.service.js`)
- Manage doctor schedules
- Check time slot availability
- Get doctor availability for specific days
- Prevent double-booking

#### 10. **Notification Service** (`Notification.service.js`)
- In-app notifications
- Notify patients, doctors, nurses, cashiers
- Notification preferences
- Mark notifications as read

#### 11. **Analytics Service** (`Analytics.service.js`)
- Clinic statistics
- Revenue analytics
- Patient statistics
- Appointment analytics
- Visit analytics

#### 12. **Auth Service** (`Auth.service.js`)
- User authentication (login/logout)
- JWT token generation
- Password hashing and verification
- Session management

#### 13. **Audit Log Service** (`AuditLog.service.js`)
- Track all system actions
- User activity logging
- Data change tracking
- Compliance reporting

#### 14. **Clinic Settings Service** (`ClinicSettings.service.js`)
- Manage clinic configuration
- Consultation duration settings
- Business hours
- System preferences

#### 15. **Document Service** (`Document.service.js`)
- Upload and manage documents
- Patient document storage
- Document retrieval

#### 16. **Email Service** (`Email.service.js`)
- Send email notifications
- Appointment reminders
- System notifications

#### 17. **OpenAI Service** (`OpenAI.service.js`)
- AI-powered features
- Medical note generation
- Clinical decision support

#### 18. **Patient Allergy Service** (`PatientAllergy.service.js`)
- Record patient allergies
- Allergy management
- Allergy alerts

#### 19. **Patient Diagnosis Service** (`PatientDiagnosis.service.js`)
- Record diagnoses
- Diagnosis history
- ICD code management

#### 20. **Doctor Note Service** (`DoctorNote.service.js`)
- Clinical notes
- Progress notes
- Note templates

#### 21. **Dispense Service** (`Dispenses.service.js`)
- Medicine dispensing
- Inventory tracking
- Dispense records

#### 22. **Service Service** (`Service.service.js`)
- Manage clinic services
- Service pricing
- Service categories

#### 23. **Token Scheduler Service** (`TokenScheduler.service.js`)
- Automatic token processing
- Missed token detection
- Queue maintenance

---

## Workflows

### 1. Appointment Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    APPOINTMENT WORKFLOW                      │
└─────────────────────────────────────────────────────────────┘

1. SCHEDULING (Receptionist/Admin)
   ├─ Patient selects doctor and date/time
   ├─ System checks doctor availability
   ├─ Prevents same-day appointments
   ├─ Validates time slot availability
   └─ Creates appointment with status: 'scheduled'
      └─ Patient receives notification

2. CHECK-IN (Receptionist)
   ├─ Patient arrives at clinic
   ├─ Receptionist checks in appointment
   ├─ Status changes: 'scheduled' → 'waiting'
   └─ Queue token issued (if not already issued)

3. QUEUE PROCESSING
   ├─ Appointment linked to queue token
   ├─ Token status: 'waiting'
   └─ Patient enters queue system

4. VITALS RECORDING (Nurse)
   ├─ Nurse records patient vitals
   ├─ Token status: 'waiting' → 'called' (ready for doctor)
   └─ Patient marked as ready

5. CONSULTATION (Doctor)
   ├─ Doctor calls next patient
   ├─ Token status: 'called' → 'serving'
   ├─ Appointment status: 'waiting' → 'consulting'
   └─ Consultation begins

6. COMPLETION
   ├─ Doctor ends consultation
   ├─ Token status: 'serving' → 'completed'
   ├─ Appointment status: 'consulting' → 'completed'
   └─ Visit created/updated

STATUS TRANSITIONS:
scheduled → waiting → ready_for_doctor → consulting → completed
                ↓
            cancelled / no_show / late
```

### 2. Visit Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                       VISIT WORKFLOW                        │
└─────────────────────────────────────────────────────────────┘

1. VISIT CREATION
   ├─ Created when queue token is issued
   ├─ Status: 'in_progress'
   ├─ Visit type: 'walk_in' or 'appointment'
   └─ Linked to patient, doctor, and optional appointment

2. VITALS RECORDING (Nurse)
   ├─ Nurse records vital signs
   ├─ Vitals linked to visit
   └─ Patient marked ready for doctor

3. CONSULTATION (Doctor)
   ├─ visit_start_time set when consultation begins
   ├─ Doctor records:
   │  ├─ Chief complaint
   │  ├─ History of present illness
   │  ├─ Diagnoses (via PatientDiagnosis service)
   │  ├─ Prescriptions (via Prescription service)
   │  └─ Clinical notes (via DoctorNote service)
   └─ visit_end_time set when consultation ends

4. INVOICE CREATION
   ├─ Auto-created when consultation ends
   ├─ Consultation fee added
   ├─ Services added (by doctor or cashier)
   ├─ Medicines added (from prescriptions)
   └─ Invoice status: 'pending'

5. PAYMENT PROCESSING (Cashier)
   ├─ Cashier processes payment
   ├─ Payment recorded
   ├─ Invoice status: 'pending' → 'paid' (or 'partial_paid')
   └─ Visit completion triggered

6. VISIT COMPLETION
   ├─ Triggered when invoice is paid (full or partial)
   ├─ Status: 'in_progress' → 'completed'
   ├─ Total cost calculated
   ├─ Payment status updated
   └─ Patient can now have new visits

STATUS TRANSITIONS:
in_progress → completed
         ↓
     cancelled

BUSINESS RULES:
- Only one active visit per patient at a time
- Visit completion requires invoice payment
- Visits can be completed with partial payment
- Visit history preserved for medical records
```

### 3. Queue Management Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    QUEUE MANAGEMENT WORKFLOW                │
└─────────────────────────────────────────────────────────────┘

1. TOKEN ISSUANCE
   ├─ Walk-in: Receptionist issues token
   ├─ Appointment: Token auto-issued on check-in
   ├─ System checks:
   │  ├─ No active visit for patient
   │  ├─ Doctor capacity (for walk-ins)
   │  └─ Doctor availability
   ├─ Visit created automatically
   ├─ Token created with visit_id
   └─ Status: 'waiting'

2. QUEUE STATUSES
   ├─ waiting: Patient in queue
   ├─ called: Patient marked ready by nurse
   ├─ serving: Currently in consultation
   ├─ completed: Consultation finished
   ├─ missed: Patient no-show
   ├─ cancelled: Token cancelled
   └─ delayed: Patient delayed (removed from active queue)

3. NURSE WORKFLOW
   ├─ Record vitals
   ├─ Mark patient as ready (waiting → called)
   └─ Patient enters doctor's queue

4. DOCTOR WORKFLOW
   ├─ View queue status
   ├─ Call next patient (called → serving)
   ├─ Start consultation
   ├─ End consultation (serving → completed)
   └─ Auto-create invoice if missing

5. PRIORITY SYSTEM
   ├─ Priority 1: Urgent cases
   ├─ Priority 2: Appointments
   ├─ Priority 3: Walk-ins
   └─ Queue sorted by: priority → token number

6. STUCK CONSULTATION DETECTION
   ├─ Auto-detects consultations from previous days
   ├─ Auto-completes stuck tokens
   └─ Admin notifications for manual review

QUEUE FLOW:
waiting → called → serving → completed
    ↓         ↓
missed   cancelled
```

### 4. Billing & Payment Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                  BILLING & PAYMENT WORKFLOW                 │
└─────────────────────────────────────────────────────────────┘

1. INVOICE CREATION
   ├─ Auto-created when consultation ends
   ├─ Or manually created by cashier
   ├─ Initial status: 'pending'
   ├─ Initial amount: $0.00
   └─ Linked to visit

2. ADDING ITEMS
   ├─ Consultation Fee (auto-added)
   ├─ Services (added by doctor or cashier)
   │  ├─ Service name
   │  ├─ Quantity
   │  └─ Unit price
   ├─ Medicines (from prescriptions)
   │  ├─ Medicine name
   │  ├─ Quantity
   │  └─ Unit price
   └─ Invoice totals recalculated automatically

3. DISCOUNT APPLICATION (Optional)
   ├─ Discount amount or percentage
   ├─ Applied to subtotal
   └─ Final total recalculated

4. PAYMENT PROCESSING
   ├─ Cashier selects invoice
   ├─ Payment method selected:
   │ 
   │  ├─ Card
   │  ├─ Mobile Money
   │  
   ├─ Payment amount entered
   ├─ Payment recorded atomically
   └─ Invoice balance updated

5. PAYMENT SCENARIOS
   ├─ Full Payment:
   │  ├─ Payment amount = Total amount
   │  ├─ Invoice status: 'pending' → 'paid'
   │  ├─ Visit status: 'in_progress' → 'completed'
   │  └─ Patient can have new visits
   │
   ├─ Partial Payment:
   │  ├─ Payment amount < Total amount
   │  ├─ Invoice status: 'pending' → 'partial_paid'
   │  ├─ Balance due tracked
   │  ├─ Visit can be completed
   │  └─ Patient can have new visits (with outstanding balance)
   │
   └─ Multiple Payments:
      ├─ Multiple payment transactions
      ├─ Total paid tracked
      └─ Invoice completed when balance = 0

6. INVOICE COMPLETION
   ├─ Triggered when invoice fully paid
   ├─ Visit automatically completed
   ├─ Payment status updated
   └─ Medical records finalized

INVOICE STATUSES:
pending → partial_paid → paid
    ↓
cancelled

PAYMENT METHODS:
- Cash
- Card (Credit/Debit)
- Mobile Money
- Insurance
```

### 5. Overall Clinic Workflow (End-to-End)

```
┌─────────────────────────────────────────────────────────────┐
│              COMPLETE CLINIC PATIENT JOURNEY                │
└─────────────────────────────────────────────────────────────┘

PHASE 1: APPOINTMENT SCHEDULING
┌─────────────────────────────────────────────────────────┐
│ 1. Patient contacts clinic                               │
│ 2. Receptionist schedules appointment                     │
│    ├─ Checks doctor availability                          │
│    ├─ Prevents same-day appointments                      │
│    └─ Sends confirmation notification                     │
└─────────────────────────────────────────────────────────┘

PHASE 2: PATIENT ARRIVAL
┌─────────────────────────────────────────────────────────┐
│ 3. Patient arrives at clinic                            │
│ 4. Receptionist checks in appointment                    │
│    ├─ Updates appointment status: 'scheduled' → 'waiting'│
│    ├─ Issues queue token                                 │
│    └─ Creates visit record                               │
└─────────────────────────────────────────────────────────┘

PHASE 3: TRIAGE & VITALS
┌─────────────────────────────────────────────────────────┐
│ 5. Nurse records vital signs                            │
│    ├─ Blood pressure, heart rate, temperature, etc.     │
│    └─ Vitals linked to visit                            │
│ 6. Nurse marks patient as ready                         │
│    └─ Token status: 'waiting' → 'called'                │
└─────────────────────────────────────────────────────────┘

PHASE 4: CONSULTATION
┌─────────────────────────────────────────────────────────┐
│ 7. Doctor calls next patient                            │
│    └─ Token status: 'called' → 'serving'               │
│ 8. Consultation begins                                  │
│    ├─ visit_start_time recorded                         │
│    ├─ Doctor records chief complaint                    │
│    ├─ Doctor records diagnoses                          │
│    ├─ Doctor creates prescriptions                      │
│    └─ Doctor adds clinical notes                        │
│ 9. Consultation ends                                    │
│    ├─ visit_end_time recorded                           │
│    └─ Token status: 'serving' → 'completed'            │
└─────────────────────────────────────────────────────────┘

PHASE 5: BILLING
┌─────────────────────────────────────────────────────────┐
│ 10. Invoice auto-created                                │
│     ├─ Consultation fee added                           │
│     ├─ Services added (if any)                          │
│     └─ Medicines added (from prescriptions)           │
│ 11. Cashier processes payment                           │
│     ├─ Records payment transaction                     │
│     ├─ Updates invoice status                           │
│     └─ Completes visit                                  │
└─────────────────────────────────────────────────────────┘

PHASE 6: PHARMACY (If applicable)
┌─────────────────────────────────────────────────────────┐
│ 12. Pharmacist dispenses medicines                      │
│     ├─ Checks prescription                              │
│     ├─ Updates dispense status                          │
│     └─ Records inventory changes                       │
└─────────────────────────────────────────────────────────┘

PHASE 7: COMPLETION
┌─────────────────────────────────────────────────────────┐
│ 13. Visit completed                                     │
│     ├─ Status: 'in_progress' → 'completed'             │
│     ├─ Medical records finalized                        │
│     └─ Patient can schedule new appointments            │
└─────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables

#### 1. **users**
- System users (doctors, nurses, receptionists, etc.)
- Roles: admin, doctor, nurse, receptionist, cashier, pharmacist, patient
- Links to patients table for patient portal accounts

#### 2. **patients**
- Patient demographics and medical information
- Patient number (unique identifier)
- Emergency contacts
- Insurance information

#### 3. **appointments**
- Appointment scheduling
- Status: scheduled, waiting, ready_for_doctor, consulting, completed, cancelled, no_show, late
- Linked to patient and doctor

#### 4. **visits**
- Medical encounters
- Status: in_progress, completed, cancelled
- Payment status: pending, partial, paid, insurance_pending
- Tracks visit start/end times
- One active visit per patient at a time

#### 5. **queue_tokens**
- Queue management tokens
- Status: waiting, called, serving, completed, missed, cancelled, delayed
- Linked to visit, appointment, patient, doctor
- Priority system (1=urgent, 2=appointment, 3=walk-in)

#### 6. **vitals**
- Patient vital signs
- Blood pressure, heart rate, temperature, weight, etc.
- Linked to visit and patient

#### 7. **prescriptions**
- Medication prescriptions
- Status: active, completed, cancelled, expired
- Linked to visit, patient, doctor

#### 8. **patient_diagnoses**
- Patient diagnoses
- ICD codes
- Linked to visit

#### 9. **invoices**
- Billing invoices
- Status: pending, draft, partial_paid, paid, cancelled
- Version field for optimistic locking
- Linked to visit and patient

#### 10. **invoice_items**
- Invoice line items
- Types: service, medicine
- Quantity, unit price, total price

#### 11. **payment_transactions**
- Payment records
- Payment methods: cash, card, mobile_money, insurance
- Linked to invoice

#### 12. **notifications**
- In-app notifications
- Types: info, warning, error, success
- Linked to users and entities

#### 13. **audit_logs**
- System audit trail
- Tracks all user actions
- Compliance and security

#### 14. **doctor_availability**
- Doctor schedules
- Day of week, start time, end time
- Active/inactive status

#### 15. **services**
- Clinic services catalog
- Service names and pricing

### Key Relationships

```
patients (1) ──→ (N) appointments
patients (1) ──→ (N) visits
patients (1) ──→ (N) prescriptions
patients (1) ──→ (N) vitals

visits (1) ──→ (1) invoices
visits (1) ──→ (N) vitals
visits (1) ──→ (N) prescriptions
visits (1) ──→ (N) patient_diagnoses

appointments (1) ──→ (1) visits (optional)
appointments (1) ──→ (1) queue_tokens (optional)

queue_tokens (1) ──→ (1) visits
queue_tokens (1) ──→ (0..1) appointments

invoices (1) ──→ (N) invoice_items
invoices (1) ──→ (N) payment_transactions
```

---

## Role-Based Access Control

### Roles and Permissions

#### 1. **Admin**
- Full system access
- User management
- System configuration
- Audit log access
- Pending items resolution
- Analytics and reporting

#### 2. **Doctor**
- Patient records access
- Create/update diagnoses
- Create prescriptions
- Add clinical notes
- View queue status
- Start/end consultations
- View patient visit history

#### 3. **Nurse**
- Record vital signs
- Mark patients as ready
- View queue status
- Patient information access
- Update patient status

#### 4. **Receptionist**
- Patient registration
- Appointment scheduling
- Check-in appointments
- Issue queue tokens
- Patient search
- Appointment management

#### 5. **Cashier**
- Process payments
- View invoices
- Add services to invoices
- Apply discounts
- Complete invoices
- Payment history

#### 6. **Pharmacist**
- View prescriptions
- Dispense medicines
- Update prescription status
- Inventory management

#### 7. **Patient** (Portal)
- View own appointments
- View own visit history
- View own prescriptions
- View own invoices
- Download visit summaries

### Authentication & Authorization

- **JWT-based authentication**: Stateless token system
- **Role-based middleware**: `authorize()` middleware checks user roles
- **Route protection**: Routes protected with `authenticate` middleware
- **Development bypass**: Optional dev token for testing (disabled in production)

---

## Key Features

### 1. **Real-Time Queue Management**
- Live queue status updates
- Priority-based queue ordering
- Automatic stuck consultation detection
- Batch queue status for multiple doctors
- Patient notifications

### 2. **Comprehensive Appointment System**
- Doctor availability checking
- Prevents same-day appointments
- Appointment status tracking
- Rescheduling capabilities
- Appointment reminders (cron jobs)

### 3. **Integrated Billing System**
- Automatic invoice creation
- Multiple payment methods
- Partial payment support
- Discount application
- Outstanding balance tracking
- Optimistic locking for concurrent updates

### 4. **Medical Records Management**
- Complete visit history
- Prescription management
- Diagnosis tracking (ICD codes)
- Vital signs recording
- Clinical notes
- PDF/CSV export capabilities

### 5. **Notification System**
- In-app notifications
- Patient notifications
- Doctor notifications
- Cashier notifications
- Appointment reminders

### 6. **Analytics & Reporting**
- Clinic statistics
- Revenue analytics
- Patient statistics
- Appointment analytics
- Visit analytics
- Queue analytics

### 7. **Audit Trail**
- Complete action logging
- User activity tracking
- Data change history
- Compliance support

### 8. **Document Management**
- Patient document uploads
- Document storage
- Document retrieval

### 9. **AI Integration**
- OpenAI service integration
- Medical note generation
- Clinical decision support

### 10. **Patient Portal**
- Patient self-service
- View appointments
- View visit history
- Download visit summaries
- View prescriptions

---

## Security Features

### 1. **Authentication Security**
- JWT tokens with expiration
- Password hashing (bcrypt)
- Secure password storage
- Session management

### 2. **API Security**
- Rate limiting (100 req/15min general, 5 req/15min auth)
- CORS configuration
- Helmet security headers
- Input validation (Joi, express-validator)
- SQL injection prevention (parameterized queries)

### 3. **Data Security**
- PII protection in logs
- Audit logging
- Role-based access control
- Data encryption (database level)

### 4. **Error Handling**
- Centralized error handling
- Environment-specific error messages
- Detailed logging for debugging
- Graceful error recovery

### 5. **Transaction Safety**
- Atomic operations
- Advisory locks for concurrent updates
- Optimistic locking (version checking)
- Transaction rollback on errors

---

## Deployment & Infrastructure

### Frontend Deployment (Vercel)
- **Build**: Vite production build
- **Static Assets**: CDN delivery
- **Environment Variables**: Configured in Vercel dashboard
- **Preview Deployments**: Automatic for pull requests

### Backend Deployment (Railway/Render)
- **Runtime**: Node.js
- **Process**: PM2 or native Node.js
- **Environment Variables**: Configured in platform
- **Database**: Supabase PostgreSQL connection
- **Health Check**: `/health` endpoint

### Database (Supabase)
- **Type**: PostgreSQL
- **Extensions**: uuid-ossp, pgcrypto
- **Row Level Security**: Configured
- **Backups**: Automatic (Supabase managed)

### CI/CD
- **GitHub Actions**: Automated testing and deployment
- **Linting**: ESLint + Prettier
- **Pre-commit Hooks**: Husky + lint-staged

### Monitoring & Logging
- **Application Logging**: Custom logger with PII protection
- **Request Logging**: Morgan middleware
- **Error Tracking**: Error handler middleware
- **Health Checks**: `/health` endpoint with DB connectivity check

### Scheduled Jobs (Cron)
- **Appointment Reminders**: Every 5 minutes
- **Auto-Cancel Appointments**: Configurable schedule
- **Pending Items Notifications**: Periodic checks
- **Token Scheduler**: Every 5 minutes

---

## Development Workflow

### Local Development Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd clinicinformationsystem
   ```

2. **Install Dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Configuration**
   - Copy `.env.example` to `.env` in both frontend and backend
   - Configure Supabase credentials
   - Set JWT secret
   - Configure other environment variables

4. **Database Setup**
   ```bash
   cd backend
   npm run db:migrate
   npm run db:seed
   ```

5. **Start Development Servers**
   ```bash
   # Terminal 1: Frontend
   cd frontend
   npm run dev

   # Terminal 2: Backend
   cd backend
   npm run dev
   ```

### Code Quality
- **Linting**: ESLint with custom rules
- **Formatting**: Prettier
- **Type Checking**: Zod for runtime validation
- **Git Hooks**: Pre-commit linting and formatting

---

## Performance Optimizations

### Frontend
- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Component lazy loading
- **React Query Caching**: Server state caching
- **Polling Optimization**: Skip completed items during polling
- **Batch Operations**: Batch API calls where possible

### Backend
- **Database Indexing**: Indexes on frequently queried fields
- **Batch Queries**: Batch fetching for multiple doctors
- **Connection Pooling**: Supabase connection pooling
- **Caching**: React Query caching on frontend
- **Compression**: Response compression (gzip)

---

## Future Enhancements

### Planned Features
- Mobile app (React Native)
- Telemedicine integration
- Laboratory integration
- Imaging system integration
- Advanced analytics dashboard
- Multi-language support (i18n infrastructure ready)
- Patient self-check-in kiosk
- SMS notifications
- Insurance claim processing

---

## Conclusion

ThriveCare is a comprehensive, modern Clinic Information System that provides end-to-end management of patient care. With its layered architecture, robust security, and feature-rich workflows, it serves as a complete solution for healthcare facilities in low-resource settings.

The system's modular design, clear separation of concerns, and extensive documentation make it maintainable and scalable for future enhancements.

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Project**: ThriveCare Clinic Information System




