# ThriveCare Development Breakdown by Timebox

## Overview
This document provides a detailed breakdown of frontend, backend, and testing activities for each development timebox.

---

## Timebox 0: Access Control Bootstrap & Role Dashboard Scaffolds

### Duration: 2-3 weeks
### Team: 2-3 developers

### Backend Development

#### Week 1: Project Setup & Authentication
- [x] **Project Initialization**
  - Express.js server setup
  - ES Modules configuration
  - Environment variable management (.env)
  - Project folder structure (routes, services, models, middleware, repositories)
  
- [x] **Database Setup**
  - Supabase PostgreSQL connection
  - Database client configuration
  - Connection pooling setup
  - Database schema planning
  
- [x] **Authentication System**
  - JWT token generation and verification
  - Password hashing with bcryptjs
  - Login endpoint (`POST /api/auth/login`)
  - Register endpoint (`POST /api/auth/register`)
  - Token refresh mechanism
  - Password reset functionality
  
- [x] **User Management**
  - User model (`User.model.js`)
  - User CRUD operations
  - User repository (`UsersRepo.js`)
  - User service (`User.service.js`)
  - User routes (`user.routes.js`)
  - Role management
  
- [x] **Middleware Development**
  - Authentication middleware (`auth.js`)
  - Authorization middleware (role-based)
  - Error handling middleware (`errorHandler.js`)
  - Request logging middleware (`requestLogger.js`)
  - Rate limiting middleware (`rateLimiter.js`)
  - CORS configuration
  - Security headers (Helmet)
  
- [x] **Core Infrastructure**
  - Logger configuration (`logger.js`) with PII protection
  - Application config (`app.config.js`)
  - Constants (roles, statuses)
  - Error classes (`ApplicationError.js`)
  - API response standardization
  - Health check endpoint (`GET /health`)

**Backend Deliverables:**
- Working Express.js API server
- JWT authentication functional
- User registration/login endpoints
- Role-based access control (7 roles)
- Error handling system
- Security middleware

#### Frontend Development

#### Week 1: Project Setup & Authentication UI
- [x] **Project Initialization**
  - React 19 + Vite setup
  - Tailwind CSS configuration
  - Project folder structure (components, features, pages, services)
  - Path aliases configuration (@/components, @/services, etc.)
  
- [x] **UI Component Library**
  - shadcn/ui components setup
  - Base UI components (Button, Input, Card, Badge, etc.)
  - Layout components (Navbar, Sidebar, PageLayout)
  - Form components
  - Modal components
  - Toast notification system
  
- [x] **Authentication UI**
  - Login page (`AdminLogin.jsx`)
  - Login form with validation (Zod)
  - Auth context (`AuthContext.jsx`)
  - Auth service (`authService.js`)
  - Protected route wrapper
  - Token storage (localStorage)
  - Auth state management (React Context + React Query)
  
- [x] **State Management Setup**
  - React Context for auth state
  - React Query setup for server state
  - API service layer (`api.js`)
  - Error handling utilities
  - Loading states management
  
- [x] **Routing**
  - React Router DOM setup
  - Route definitions (`routes.jsx`)
  - Protected routes
  - Role-based route access
  - Route guards

#### Week 2-3: Role Dashboard Scaffolds
- [x] **Admin Dashboard Scaffold**
  - Admin dashboard layout (`AdminDashboard.jsx`)
  - Dashboard navigation
  - Statistics cards (placeholder)
  - Quick actions section
  - Recent activities section
  - User management link
  - Settings link
  
- [x] **Doctor Dashboard Scaffold**
  - Doctor dashboard layout (`DoctorDashboard.jsx`)
  - Dashboard navigation
  - Today's appointments section
  - Queue status section
  - Patient list section
  - Quick actions (start consultation, view queue)
  
- [x] **Nurse Dashboard Scaffold**
  - Nurse dashboard layout (`NurseDashboard.jsx`)
  - Dashboard navigation
  - Patient queue section
  - Vitals recording section
  - Patient ready actions
  - Queue management controls
  
- [x] **Receptionist Dashboard Scaffold**
  - Receptionist dashboard layout (`ReceptionistDashboard.jsx`)
  - Dashboard navigation
  - Patient registration section
  - Appointment scheduling section
  - Check-in section
  - Token issuance section
  
- [x] **Cashier Dashboard Scaffold**
  - Cashier dashboard layout (`CashierDashboard.jsx`)
  - Dashboard navigation
  - Pending invoices section
  - Payment processing section
  - Payment history section
  - Outstanding balances section
  
- [x] **Pharmacist Dashboard Scaffold**
  - Pharmacist dashboard layout (`PharmacistDashboard.jsx`)
  - Dashboard navigation
  - Pending prescriptions section
  - Dispense section
  - Inventory section (basic)
  
- [x] **Patient Portal Dashboard Scaffold**
  - Patient portal layout (`PatientDashboard.jsx`)
  - Portal navigation
  - Appointments section (placeholder)
  - Visit history section (placeholder)
  - Prescriptions section (placeholder)
  - Invoices section (placeholder)
  
- [x] **Shared Dashboard Components**
  - Dashboard header component
  - Statistics card component
  - Quick action button component
  - Recent activity item component
  - Empty state component
  - Loading skeleton components
  - Error state component

**Frontend Deliverables:**
- Working React application
- Login page functional
- Authentication flow complete
- Protected routes working
- UI component library ready
- **All 7 role dashboards scaffolded** (Admin, Doctor, Nurse, Receptionist, Cashier, Pharmacist, Patient)
- Dashboard navigation and layouts
- Placeholder sections for future features

#### Testing (Timebox 0)

**Backend Testing:**
- [x] **Unit Tests**
  - Auth service tests (login, register, token generation)
  - User service tests (CRUD operations)
  - Password hashing tests
  - JWT token validation tests
  - Role-based authorization tests
  
- [x] **Integration Tests**
  - Authentication endpoints (`POST /api/auth/login`, `/api/auth/register`)
  - User endpoints (`GET /api/users`, `POST /api/users`)
  - Database connection tests
  - Middleware tests (auth, error handling, rate limiting)
  - Role-based access tests
  
- [x] **API Testing**
  - Postman collection for auth endpoints
  - Test cases for success scenarios
  - Test cases for error scenarios (invalid credentials, missing fields)
  - Token expiration tests
  - Role-based endpoint access tests

**Frontend Testing:**
- [x] **Component Tests**
  - Login form component tests
  - Button component tests
  - Input component tests
  - Dashboard layout tests
  - Protected route tests
  
- [x] **Integration Tests**
  - Login flow tests
  - Auth context tests
  - Protected route tests
  - Dashboard rendering tests
  - Role-based dashboard access tests
  
- [x] **E2E Tests (Manual)**
  - Complete login flow
  - Token storage verification
  - Route protection verification
  - Dashboard access by role
  - Navigation between dashboards

**Test Plan - Timebox 0:**
```
Test Coverage:
- Authentication: 90%
- User Management: 85%
- Role-Based Access: 90%
- Error Handling: 80%
- Dashboard Scaffolds: 85%
- API Endpoints: 85%

Test Scenarios:
1. User registration with valid data
2. User registration with invalid data
3. Login with valid credentials
4. Login with invalid credentials
5. Token generation and validation
6. Protected route access
7. Role-based dashboard access
8. Dashboard navigation
9. Error handling for API failures
10. Rate limiting verification
```

---

## Timebox 1 (TB1): Doctor Availability & Scheduling

### Duration: 3-4 weeks
### Team: 2-3 developers

### Backend Development

#### Week 1: Patient Management & Doctor Availability
- [x] **Patient Model**
  - Patient model (`Patient.model.js`)
  - Patient schema definition
  - Patient validation rules
  - Patient number generation logic
  
- [x] **Patient Repository**
  - Patient repository (`PatientsRepo.js`)
  - CRUD operations (create, read, update, delete)
  - Patient search functionality
  - Patient filtering and pagination
  
- [x] **Patient Service**
  - Patient service (`Patient.service.js`)
  - Business logic for patient registration
  - Patient search logic
  - Patient validation
  - Patient number uniqueness check
  
- [x] **Patient Routes**
  - Patient routes (`patient.routes.js`)
  - `GET /api/patients` - List all patients
  - `GET /api/patients/:id` - Get patient by ID
  - `POST /api/patients` - Create new patient
  - `PUT /api/patients/:id` - Update patient
  - `DELETE /api/patients/:id` - Delete patient
  - `GET /api/patients/search?q=...` - Search patients
  
- [x] **Doctor Availability Model**
  - Doctor availability model (`DoctorAvailability.model.js`)
  - Availability schema
  - Day-of-week availability
  - Time slot management
  
- [x] **Doctor Availability Service**
  - Doctor availability service (`DoctorAvailability.service.js`)
  - Availability CRUD operations
  - Time slot availability checking
  - Availability validation
  - Get availability for specific day
  
- [x] **Doctor Availability Routes**
  - Doctor availability routes (`doctorAvailability.routes.js`)
  - `GET /api/doctor-availability` - List availability
  - `POST /api/doctor-availability` - Create availability
  - `PUT /api/doctor-availability/:id` - Update availability
  - `DELETE /api/doctor-availability/:id` - Delete availability
  - `GET /api/doctor-availability/doctor/:doctorId` - Get doctor availability
  - `GET /api/doctor-availability/check` - Check time slot availability

**Backend Deliverables:**
- Complete patient CRUD API
- Patient search functionality
- Doctor availability management API
- Time slot availability checking

#### Week 2-3: Appointment System
- [x] **Appointment Model**
  - Appointment model (`Appointment.model.js`)
  - Appointment schema
  - Appointment status enum (scheduled, waiting, ready_for_doctor, consulting, completed, cancelled, no_show, late)
  - Appointment validation rules
  
- [x] **Appointment Repository**
  - Appointment repository (`AppointmentsRepo.js`)
  - Appointment CRUD operations
  - Appointment filtering by date, doctor, patient
  - Availability checking queries
  - Conflict detection queries
  
- [x] **Appointment Service**
  - Appointment service (`Appointment.service.js`)
  - Appointment creation logic
  - Doctor availability checking
  - Time slot conflict detection
  - Same-day appointment prevention
  - Appointment rescheduling logic
  - Appointment status management
  - Get available time slots
  
- [x] **Appointment Routes**
  - Appointment routes (`appointment.routes.js`)
  - `GET /api/appointments` - List appointments
  - `GET /api/appointments/:id` - Get appointment
  - `POST /api/appointments` - Create appointment
  - `PUT /api/appointments/:id` - Update appointment
  - `DELETE /api/appointments/:id` - Delete appointment
  - `PUT /api/appointments/:id/status` - Update status
  - `GET /api/appointments/available-slots` - Get available slots
  - `POST /api/appointments/:id/reschedule` - Reschedule appointment
  
- [x] **Appointment Reminders**
  - Appointment reminder cron job (`appointmentReminders.js`)
  - Email notification integration
  - Reminder scheduling logic

**Backend Deliverables:**
- Complete appointment CRUD API
- Appointment scheduling with conflict detection
- Appointment rescheduling
- Appointment reminders
- Available time slots API

#### Frontend Development

#### Week 1: Patient Management UI
- [x] **Patient Registration Form**
  - Patient registration form component
  - Form fields (name, DOB, gender, phone, email, address, emergency contacts)
  - Form validation (Zod schemas)
  - Error handling and display
  - Success notifications
  
- [x] **Patient List/Dashboard**
  - Patient list component (`PatientList.jsx`)
  - Patient card component (`PatientCard.jsx`)
  - Patient table view
  - Pagination component
  - Search functionality
  - Filter options
  
- [x] **Patient Detail View**
  - Patient detail page
  - Patient information display
  - Edit patient functionality
  - Patient history preview
  
- [x] **Patient Service**
  - Patient API service (`patientService.js`)
  - CRUD operations
  - Search function
  - Error handling
  
- [x] **Patient Hooks**
  - `usePatients` hook (React Query)
  - `usePatient` hook (single patient)
  - `useCreatePatient` hook
  - `useUpdatePatient` hook
  - `useDeletePatient` hook

#### Week 2-3: Appointment Scheduling UI
- [x] **Appointment Creation Form**
  - Appointment form component
  - Doctor selection dropdown
  - Date picker component (date-fns)
  - Time slot selection
  - Patient selection (autocomplete)
  - Appointment type selection
  - Reason for visit input
  - Form validation
  
- [x] **Calendar View**
  - Calendar component (using date-fns)
  - Month/week/day views
  - Appointment display on calendar
  - Date navigation
  - Color coding by status
  - Appointment tooltips
  
- [x] **Appointment List**
  - Appointment list component
  - Appointment card component
  - Filter by date, doctor, status
  - Appointment status badges
  - Quick actions (edit, cancel, reschedule)
  - Appointment search
  
- [x] **Doctor Availability Management**
  - Availability form component
  - Day-of-week selection
  - Time range inputs
  - Availability list view
  - Edit/delete availability
  - Availability calendar view
  
- [x] **Available Time Slots Display**
  - Available slots component
  - Time slot grid
  - Slot selection
  - Unavailable slot indication
  
- [x] **Appointment Service**
  - Appointment API service (`appointmentService.js`)
  - CRUD operations
  - Available slots function
  - Reschedule function
  - Status update function

**Frontend Deliverables:**
- Patient registration and management UI
- Appointment creation form
- Calendar view with appointments
- Appointment list and management
- Doctor availability management UI
- Available time slots display

#### Testing (TB1)

**Backend Testing:**
- [x] **Unit Tests**
  - Patient service tests
  - Patient number generation tests
  - Patient validation tests
  - Appointment service tests
  - Availability checking logic
  - Conflict detection tests
  - Same-day prevention tests
  - Rescheduling tests
  
- [x] **Integration Tests**
  - Patient CRUD endpoints
  - Patient search endpoint
  - Appointment CRUD endpoints
  - Availability endpoints
  - Time slot checking endpoint
  - Conflict detection scenarios
  
- [x] **API Testing**
  - Patient creation scenarios
  - Appointment creation scenarios
  - Conflict detection scenarios
  - Availability checking scenarios
  - Rescheduling scenarios

**Frontend Testing:**
- [x] **Component Tests**
  - Patient form tests
  - Patient list tests
  - Appointment form tests
  - Calendar component tests
  - Appointment list tests
  - Availability form tests
  
- [x] **Integration Tests**
  - Patient creation flow
  - Patient search flow
  - Appointment creation flow
  - Calendar navigation
  - Filter functionality
  - Availability management flow
  
- [x] **E2E Tests (Manual)**
  - Complete patient registration
  - Complete appointment booking
  - Conflict detection UI
  - Calendar view updates
  - Availability management

**Test Plan - TB1:**
```
Test Coverage:
- Patient CRUD: 90%
- Patient Search: 85%
- Appointment CRUD: 90%
- Availability Checking: 85%
- Conflict Detection: 90%
- Calendar View: 80%
- Form Validation: 90%

Test Scenarios:
1. Create patient with valid data
2. Search patients by name/patient number
3. Create appointment with available slot
4. Create appointment with conflict (should fail)
5. Create same-day appointment (should fail)
6. Check doctor availability
7. Reschedule appointment
8. Update appointment status
9. Cancel appointment
10. Calendar view display
11. Filter appointments
12. Manage doctor availability
```

---

## Timebox 2 (TB2): Queueing & Check-in

### Duration: 3-4 weeks
### Team: 2-3 developers

### Backend Development

#### Week 1: Queue Token System
- [x] **Queue Token Model**
  - Queue token model (`QueueToken.model.js`)
  - Token schema
  - Token status enum (waiting, called, serving, completed, missed, cancelled, delayed)
  - Token number generation
  - Priority system (1=urgent, 2=appointment, 3=walk-in)
  - Visit linking (visit_id required)
  
- [x] **Queue Repository**
  - Queue repository (`QueueRepo.js`)
  - Token CRUD operations
  - Token filtering by doctor, date, status
  - Next token retrieval logic
  - Active consultation checking
  - Queue statistics queries
  - Batch queue status queries
  
- [x] **Queue Service**
  - Queue service (`Queue.service.js`)
  - Token issuance logic (walk-in and appointment-based)
  - Active visit checking (prevents multiple concurrent visits)
  - Doctor capacity checking (for walk-ins)
  - Token status management
  - Priority-based queue ordering
  - Queue statistics
  - Stuck consultation detection
  - Auto-complete stuck tokens
  
- [x] **Queue Routes**
  - Queue routes (`queue.routes.js`)
  - `POST /api/queue/issue-token` - Issue token
  - `GET /api/queue/status/:doctorId` - Get queue status
  - `GET /api/queue/status/all` - Get all doctors queue status
  - `PUT /api/queue/token/:id/status` - Update token status
  - `POST /api/queue/call-next` - Call next patient
  - `POST /api/queue/start-consultation` - Start consultation
  - `POST /api/queue/complete-consultation` - Complete consultation
  - `POST /api/queue/mark-ready` - Mark patient ready (nurse)
  - `POST /api/queue/mark-waiting` - Mark patient waiting (nurse)
  - `GET /api/queue/can-accept-walkin/:doctorId` - Check walk-in capacity

**Backend Deliverables:**
- Queue token system
- Token issuance logic
- Queue status management
- Queue workflow endpoints
- Stuck consultation detection

#### Week 2: Visit Creation & Check-in
- [x] **Visit Model**
  - Visit model (`Visit.model.js`)
  - Visit schema
  - Visit status enum (in_progress, completed, cancelled)
  - Visit type enum (walk_in, appointment)
  - One active visit per patient rule
  - Visit start/end time tracking
  
- [x] **Visit Repository**
  - Visit repository (`VisitsRepo.js`)
  - Visit CRUD operations
  - Visit filtering
  - Active visit checking
  - Visit history queries
  
- [x] **Visit Service**
  - Visit service (`Visit.service.js`)
  - Visit creation logic (linked to queue tokens)
  - Active visit prevention
  - Visit completion logic
  - Visit cost calculation
  - Visit history retrieval
  
- [x] **Visit Routes**
  - Visit routes (`visit.routes.js`)
  - `POST /api/visits` - Create visit
  - `GET /api/visits/:id` - Get visit
  - `PUT /api/visits/:id` - Update visit
  - `GET /api/visits/patient/:patientId` - Get patient visits
  - `POST /api/visits/:id/complete` - Complete visit
  - `GET /api/visits/patient/:patientId/history` - Get visit history
  
- [x] **Appointment Check-in**
  - Check-in endpoint integration
  - Appointment status update on check-in
  - Auto-token issuance for appointments

**Backend Deliverables:**
- Visit creation API
- Active visit prevention
- Visit history endpoints
- Appointment check-in integration

#### Week 3: Queue Workflow & Real-time Updates
- [x] **Nurse Workflow**
  - Mark patient ready endpoint
  - Mark patient waiting endpoint
  - Vitals recording integration
  - Patient ready notification
  
- [x] **Doctor Workflow**
  - Call next patient endpoint
  - Call next and start endpoint (combined action)
  - Start consultation endpoint
  - End consultation endpoint
  - Force end consultation endpoint
  - Active consultation checking
  
- [x] **Queue Status Transitions**
  - Status transition validation
  - Automatic status updates
  - Queue position calculation
  - Priority-based ordering
  
- [x] **Real-time Updates**
  - Polling endpoint optimization
  - Queue status caching
  - Batch queue status endpoint
  - Skip completed items optimization
  
- [x] **Notifications Integration**
  - Queue notification service
  - Patient notifications (called, next in line)
  - Doctor notifications (patient ready)
  - Nurse notifications

**Backend Deliverables:**
- Complete queue workflow
- Nurse and doctor workflows
- Real-time queue updates
- Queue notifications

#### Frontend Development

#### Week 1: Queue Token UI & Check-in
- [x] **Token Issuance UI**
  - Token issuance form (Receptionist dashboard)
  - Walk-in token issuance
  - Appointment check-in
  - Patient selection (autocomplete)
  - Doctor selection
  - Reason for visit input
  - Token display component
  - Token number badge
  
- [x] **Check-in UI**
  - Appointment check-in page
  - Check-in button
  - Appointment list for check-in
  - Check-in confirmation
  - Status update display

#### Week 2: Queue Status Display
- [x] **Queue Status Display**
  - Queue list component
  - Queue board view
  - Token status badges
  - Patient information display
  - Queue position indicator
  - Estimated wait time
  
- [x] **Multi-Doctor Queue View**
  - All doctors queue view
  - Doctor selection
  - Batch queue status display
  - Queue comparison view

#### Week 3: Queue Management Dashboards
- [x] **Nurse Dashboard (Complete)**
  - Nurse dashboard (`NurseDashboard.jsx`)
  - Patient queue view
  - Mark patient ready button
  - Mark patient waiting button
  - Vitals recording integration
  - Patient status indicators
  - Queue statistics
  - Real-time queue updates
  
- [x] **Doctor Dashboard (Complete)**
  - Doctor dashboard (`DoctorDashboard.jsx`)
  - Queue status view
  - Call next patient button
  - Start/end consultation controls
  - Active consultation display
  - Queue statistics
  - Real-time queue updates
  
- [x] **Receptionist Dashboard (Complete)**
  - Receptionist dashboard (`ReceptionistDashboard.jsx`)
  - Token issuance section
  - Check-in section
  - Queue overview
  - Patient search
  - Quick actions
  
- [x] **Queue Board (Public Display)**
  - Public queue board view
  - Currently serving display
  - Waiting queue display
  - Token number display
  - Auto-refresh functionality

#### Week 4: Real-time Updates & Queue Analytics
- [x] **Real-time Queue Updates**
  - Polling implementation (React Query)
  - Queue status refresh
  - Live queue updates
  - Optimistic updates
  - Skip completed items optimization
  
- [x] **Queue Analytics Display**
  - Queue statistics dashboard
  - Wait time display
  - Queue metrics
  - Charts for queue data (Recharts)
  
- [x] **Queue Management Tools**
  - Stuck consultation alerts
  - Manual queue fixes
  - Queue admin tools
  - Delay/undelay token functionality

**Frontend Deliverables:**
- Token issuance UI
- Appointment check-in UI
- Complete Nurse dashboard
- Complete Doctor dashboard
- Complete Receptionist dashboard
- Queue board display
- Real-time queue updates
- Queue analytics dashboard

#### Testing (TB2)

**Backend Testing:**
- [x] **Unit Tests**
  - Queue service tests
  - Token issuance tests
  - Priority ordering tests
  - Status transition tests
  - Active visit prevention tests
  - Visit service tests
  - Stuck detection tests
  
- [x] **Integration Tests**
  - Queue token endpoints
  - Queue status endpoint
  - Visit endpoints
  - Consultation endpoints
  - Check-in endpoints
  - Batch queue endpoint
  
- [x] **Workflow Tests**
  - Complete queue workflow
  - Token issuance workflow
  - Check-in workflow
  - Status transition validation
  - Notification delivery

**Frontend Testing:**
- [x] **Component Tests**
  - Queue token component tests
  - Queue list tests
  - Queue board tests
  - Nurse dashboard tests
  - Doctor dashboard tests
  - Receptionist dashboard tests
  
- [x] **Integration Tests**
  - Token issuance flow
  - Check-in flow
  - Queue status updates
  - Consultation flow
  - Real-time updates
  - Notification display
  
- [x] **E2E Tests (Manual)**
  - Complete token issuance
  - Complete check-in workflow
  - Complete nurse workflow
  - Complete doctor workflow
  - Real-time queue updates
  - Queue board display

**Test Plan - TB2:**
```
Test Coverage:
- Queue Token System: 90%
- Token Issuance: 85%
- Queue Status: 90%
- Priority System: 85%
- Visit Creation: 90%
- Active Visit Prevention: 95%
- Queue Workflow: 90%
- Status Transitions: 85%
- Real-time Updates: 80%
- Notifications: 85%

Test Scenarios:
1. Issue token for walk-in patient
2. Issue token for appointment (check-in)
3. Prevent multiple active visits
4. Check queue status
5. Nurse marks patient ready
6. Doctor calls next patient
7. Doctor starts consultation
8. Doctor ends consultation
9. Complete queue workflow
10. Real-time queue updates
11. Queue board updates
12. Stuck consultation detection
13. Priority-based ordering
14. Token status transitions
```

---

## Timebox 3 (TB3): Encounters & EMR Core

### Duration: 3-4 weeks
### Team: 2-3 developers

### Backend Development

#### Week 1: Vitals Recording
- [x] **Vitals Model**
  - Vitals model (`Vitals.model.js`)
  - Vitals schema
  - Vital signs validation
  - Vitals history
  
- [x] **Vitals Repository**
  - Vitals repository (`VitalsRepo.js`)
  - Vitals CRUD operations
  - Vitals filtering by visit, patient
  - Latest vitals retrieval
  
- [x] **Vitals Service**
  - Vitals service (`Vitals.service.js`)
  - Vitals recording logic
  - Vitals validation
  - Vitals history retrieval
  - BMI calculation
  
- [x] **Vitals Routes**
  - Vitals routes (`vitals.routes.js`)
  - `POST /api/vitals` - Record vitals
  - `GET /api/vitals/:id` - Get vitals
  - `GET /api/vitals/visit/:visitId` - Get visit vitals
  - `GET /api/vitals/patient/:patientId` - Get patient vitals
  - `PUT /api/vitals/:id` - Update vitals

**Backend Deliverables:**
- Vitals recording API
- Vitals validation
- Vitals history endpoints

#### Week 2: Medical Records Core
- [x] **Patient Diagnosis Model**
  - Patient diagnosis model (`PatientDiagnosis.model.js`)
  - Diagnosis schema
  - ICD code support
  - Diagnosis severity levels
  
- [x] **Patient Diagnosis Service**
  - Patient diagnosis service (`PatientDiagnosis.service.js`)
  - Diagnosis CRUD operations
  - Diagnosis history
  - ICD code validation
  
- [x] **Patient Diagnosis Routes**
  - Patient diagnosis routes (`patientDiagnosis.routes.js`)
  - `POST /api/patient-diagnoses` - Create diagnosis
  - `GET /api/patient-diagnoses/visit/:visitId` - Get visit diagnoses
  - `GET /api/patient-diagnoses/patient/:patientId` - Get patient diagnoses
  
- [x] **Doctor Note Model**
  - Doctor note model (`DoctorNote.model.js`)
  - Note schema
  - Note types (progress, clinical)
  
- [x] **Doctor Note Service**
  - Doctor note service (`DoctorNote.service.js`)
  - Note CRUD operations
  - Note templates
  - Note history
  
- [x] **Doctor Note Routes**
  - Doctor note routes (`doctorNote.routes.js`)
  - `POST /api/doctor-notes` - Create note
  - `GET /api/doctor-notes/visit/:visitId` - Get visit notes
  - `PUT /api/doctor-notes/:id` - Update note
  
- [x] **Patient Allergy Model**
  - Patient allergy model (`PatientAllergy.model.js`)
  - Allergy schema
  - Allergy severity
  
- [x] **Patient Allergy Service**
  - Patient allergy service (`PatientAllergy.service.js`)
  - Allergy CRUD operations
  - Allergy alerts
  
- [x] **Patient Allergy Routes**
  - Patient allergy routes (`patientAllergy.routes.js`)
  - `POST /api/patient-allergies` - Create allergy
  - `GET /api/patient-allergies/patient/:patientId` - Get patient allergies

**Backend Deliverables:**
- Diagnosis management API
- Doctor notes API
- Allergy management API
- Medical records endpoints

#### Week 3: Visit Completion & Export
- [x] **Visit Completion Logic**
  - Visit completion workflow
  - Cost calculation
  - Payment status update
  - Visit finalization
  - Pending items detection
  
- [x] **PDF Export**
  - PDF generation (PDFKit)
  - Visit summary PDF
  - Visit history PDF
  - PDF template design
  - Professional formatting
  
- [x] **CSV Export**
  - CSV generation (json2csv)
  - Visit history CSV
  - Data formatting
  
- [x] **Visit Export Routes**
  - `GET /api/visits/:id/export/pdf` - Export visit PDF
  - `GET /api/visits/patient/:patientId/export/pdf` - Export history PDF
  - `GET /api/visits/patient/:patientId/export/csv` - Export history CSV

**Backend Deliverables:**
- Visit completion workflow
- PDF export functionality
- CSV export functionality
- Pending items detection

#### Frontend Development

#### Week 1: Vitals Recording UI
- [x] **Vitals Recording Form**
  - Vitals form component
  - Blood pressure input (systolic/diastolic)
  - Heart rate input
  - Temperature input (with unit selection)
  - Weight/height inputs (with unit selection)
  - Oxygen saturation input
  - Respiratory rate input
  - Pain level input (0-10 scale)
  - BMI auto-calculation display
  - Form validation
  
- [x] **Vitals Display**
  - Vitals display component
  - Vitals card component
  - Vitals history view
  - Vitals comparison view

#### Week 2: Medical Records UI
- [x] **Diagnosis Form**
  - Diagnosis form component
  - Diagnosis name input
  - ICD code input (autocomplete)
  - Severity selection
  - Clinical notes input
  
- [x] **Doctor Notes Form**
  - Note form component
  - Note type selection
  - Note templates
  - Rich text editor (optional)
  - Note history display
  
- [x] **Allergy Form**
  - Allergy form component
  - Allergy name input
  - Severity selection
  - Reaction description
  - Allergy alerts display
  
- [x] **Medical Records Display**
  - Medical records view
  - Diagnosis list
  - Prescription list (preview)
  - Allergy list
  - Notes display
  - Medical records timeline

#### Week 3: Visit Management & Export
- [x] **Visit Detail View**
  - Visit detail page
  - Visit information display
  - Vitals display
  - Medical records display
  - Visit timeline
  
- [x] **Visit Completion UI**
  - Complete visit button
  - Completion confirmation
  - Cost summary display
  - Payment status display
  
- [x] **Export Functionality**
  - Export PDF button
  - Export CSV button
  - Download handling
  - Export progress indicator
  - PDF preview (optional)
  
- [x] **Visit Summary Display**
  - Visit summary view
  - Cost breakdown
  - Medical records summary
  - Export options

**Frontend Deliverables:**
- Vitals recording form
- Diagnosis form
- Doctor notes form
- Allergy form
- Medical records display
- Visit detail view
- Visit completion UI
- Export functionality

#### Testing (TB3)

**Backend Testing:**
- [x] **Unit Tests**
  - Vitals service tests
  - Vitals validation tests
  - Diagnosis service tests
  - Prescription service tests
  - Allergy service tests
  - Note service tests
  - Visit completion tests
  - Cost calculation tests
  - PDF generation tests
  - CSV generation tests
  
- [x] **Integration Tests**
  - Vitals endpoints
  - Diagnosis endpoints
  - Allergy endpoints
  - Note endpoints
  - Visit completion endpoint
  - Export endpoints
  - File generation tests
  
- [x] **API Testing**
  - Vitals recording scenarios
  - Medical records CRUD operations
  - Visit completion scenarios
  - PDF export scenarios
  - CSV export scenarios

**Frontend Testing:**
- [x] **Component Tests**
  - Vitals form tests
  - Diagnosis form tests
  - Allergy form tests
  - Visit detail tests
  - Export button tests
  
- [x] **Integration Tests**
  - Vitals recording flow
  - Medical records creation flow
  - Visit completion flow
  - Export flow
  
- [x] **E2E Tests (Manual)**
  - Complete vitals recording
  - Complete medical records workflow
  - Visit completion
  - PDF export
  - CSV export
  - File download verification

**Test Plan - TB3:**
```
Test Coverage:
- Vitals Recording: 90%
- Vitals Validation: 85%
- Diagnosis Management: 90%
- Prescription Management: 90%
- Allergy Management: 85%
- Doctor Notes: 85%
- Visit Completion: 90%
- PDF Export: 85%
- CSV Export: 85%
- Cost Calculation: 90%

Test Scenarios:
1. Record vitals for visit
2. Validate vitals data
3. Create diagnosis
4. Record allergy
5. Add doctor note
6. View medical records
7. Complete visit successfully
8. Calculate visit cost
9. Generate visit PDF
10. Generate visit history PDF
11. Generate visit history CSV
12. Verify PDF content
13. Verify CSV format
14. Download files successfully
```

---

## Timebox 4 (TB4): Prescriptions, Dispensing & Billing (with Payment Holds)

### Duration: 4-5 weeks
### Team: 2-3 developers

### Backend Development

#### Week 1: Prescription System
- [x] **Prescription Model**
  - Prescription model (`Prescription.model.js`)
  - Prescription schema
  - Prescription status enum (active, completed, cancelled, expired)
  - Medication details
  - Dosage and frequency
  
- [x] **Prescription Repository**
  - Prescription repository (`PrescriptionsRepo.js`)
  - Prescription CRUD operations
  - Prescription filtering by visit, patient
  - Prescription history
  
- [x] **Prescription Service**
  - Prescription service (`Prescription.service.js`)
  - Prescription CRUD operations
  - Prescription status management
  - Prescription history
  - Prescription validation
  
- [x] **Prescription Routes**
  - Prescription routes (`prescription.routes.js`)
  - `POST /api/prescriptions` - Create prescription
  - `GET /api/prescriptions/:id` - Get prescription
  - `GET /api/prescriptions/visit/:visitId` - Get visit prescriptions
  - `GET /api/prescriptions/patient/:patientId` - Get patient prescriptions
  - `PUT /api/prescriptions/:id` - Update prescription
  - `PUT /api/prescriptions/:id/status` - Update status
  - `DELETE /api/prescriptions/:id` - Cancel prescription

**Backend Deliverables:**
- Prescription management API
- Prescription status management
- Prescription history endpoints

#### Week 2: Invoice System
- [x] **Invoice Model**
  - Invoice model (`Invoice.model.js`)
  - Invoice schema
  - Invoice status enum (pending, draft, partial_paid, paid, cancelled)
  - Invoice version field (optimistic locking)
  - Invoice number generation
  
- [x] **Invoice Item Model**
  - Invoice item model (`InvoiceItem.model.js`)
  - Item schema
  - Item types (service, medicine)
  - Quantity and pricing
  
- [x] **Invoice Repository**
  - Invoice repository (`InvoicesRepo.js`)
  - Invoice CRUD operations
  - Invoice filtering
  - Invoice calculations
  
- [x] **Invoice Service**
  - Invoice service (`Invoice.service.js`)
  - Invoice creation logic
  - Auto-invoice creation on consultation end
  - Add service items
  - Add medicine items (from prescriptions)
  - Invoice total calculation
  - Discount application
  - Tax calculation
  - Invoice version management
  - Invoice completion workflow
  
- [x] **Invoice Routes**
  - Invoice routes (`invoice.routes.js`)
  - `POST /api/invoices` - Create invoice
  - `GET /api/invoices/:id` - Get invoice
  - `GET /api/invoices/pending` - Get pending invoices
  - `POST /api/invoices/:id/items/service` - Add service item
  - `POST /api/invoices/:id/items/medicine` - Add medicine item
  - `PUT /api/invoices/:id/recalculate` - Recalculate totals
  - `PUT /api/invoices/:id/apply-discount` - Apply discount
  - `PUT /api/invoices/:id/complete` - Complete invoice
  - `GET /api/invoices/patient/:patientId` - Get patient invoices
  - `GET /api/invoices/patient/:patientId/outstanding` - Get outstanding invoices

**Backend Deliverables:**
- Invoice CRUD API
- Invoice item management
- Invoice calculations
- Optimistic locking
- Invoice completion workflow

#### Week 3: Payment Processing
- [x] **Payment Transaction Model**
  - Payment transaction model (`PaymentTransaction.model.js`)
  - Payment schema
  - Payment methods enum (cash, card, mobile_money, insurance)
  - Payment status
  - Payment reference
  
- [x] **Payment Repository**
  - Payment repository (`BillingRepo.js`)
  - Payment CRUD operations
  - Payment history queries
  - Payment totals calculation
  
- [x] **Payment Service**
  - Payment service (`Payment.service.js`)
  - Payment recording logic
  - Partial payment handling
  - Full payment handling
  - Payment method validation
  - Atomic payment operations (advisory locks)
  - Auto-complete invoice on full payment
  - Outstanding balance tracking
  
- [x] **Payment Routes**
  - Payment routes (`payment.routes.js`)
  - `POST /api/payments` - Record payment
  - `POST /api/payments/partial` - Record partial payment
  - `GET /api/payments/invoice/:invoiceId` - Get invoice payments
  - `GET /api/payments/patient/:patientId` - Get patient payments

**Backend Deliverables:**
- Payment recording API
- Partial payment support
- Atomic payment operations
- Outstanding balance tracking

#### Week 4: Dispensing & Pharmacy
- [x] **Dispense Model**
  - Dispense model (`Dispenses.model.js`)
  - Dispense schema
  - Dispense status
  - Inventory tracking (basic)
  
- [x] **Dispense Service**
  - Dispense service (`Dispenses.service.js`)
  - Dispense CRUD operations
  - Prescription fulfillment
  - Inventory tracking (basic)
  - Dispense history
  
- [x] **Dispense Routes**
  - Dispense routes (`dispense.routes.js`)
  - `POST /api/dispenses` - Create dispense
  - `GET /api/dispenses/prescription/:prescriptionId` - Get prescription dispenses
  - `PUT /api/dispenses/:id/status` - Update dispense status
  - `GET /api/dispenses/patient/:patientId` - Get patient dispenses

**Backend Deliverables:**
- Dispense management API
- Pharmacy workflow
- Inventory tracking (basic)

#### Frontend Development

#### Week 1: Prescription UI
- [x] **Prescription Form**
  - Prescription form component
  - Medication name input (autocomplete)
  - Dosage input
  - Frequency selection
  - Duration input
  - Instructions input
  - Form validation
  
- [x] **Prescription List**
  - Prescription list component
  - Prescription card component
  - Prescription status badges
  - Prescription filtering
  - Prescription history view

#### Week 2: Invoice Management UI
- [x] **Invoice Detail View**
  - Invoice detail page
  - Invoice information display
  - Invoice items list
  - Invoice totals display
  - Invoice status badge
  - Version display (for optimistic locking)
  
- [x] **Add Invoice Items**
  - Add service item form
  - Add medicine item form (from prescriptions)
  - Item selection
  - Quantity and price inputs
  - Item validation
  
- [x] **Invoice List**
  - Invoice list component
  - Invoice card component
  - Invoice filtering
  - Invoice status filters
  - Pending invoices view
  
- [x] **Discount Application**
  - Discount form component
  - Discount amount input
  - Discount percentage input
  - Discount preview

#### Week 3: Payment Processing UI
- [x] **Payment Form**
  - Payment form component
  - Payment amount input
  - Payment method selection
  - Payment reference input
  - Payment notes input
  - Payment validation
  - Balance due display
  
- [x] **Payment Processing Page**
  - Payment processing page (`InvoiceManagement.jsx`)
  - Payment confirmation
  - Payment success/error handling
  - Payment receipt display
  
- [x] **Payment History**
  - Payment history display
  - Payment list component
  - Payment details
  - Payment status indicators
  
- [x] **Invoice Completion**
  - Complete invoice button
  - Completion confirmation
  - Success message

#### Week 4: Cashier Dashboard & Pharmacy UI
- [x] **Cashier Dashboard (Complete)**
  - Cashier dashboard (`CashierDashboard.jsx`)
  - Pending invoices section
  - Payment processing section
  - Payment history section
  - Outstanding balances section
  - Quick actions
  - Statistics display
  
- [x] **Pharmacy Dashboard (Complete)**
  - Pharmacist dashboard (`PharmacistDashboard.jsx`)
  - Pending prescriptions section
  - Dispense form
  - Dispense status management
  - Inventory display (basic)
  - Prescription history
  
- [x] **Invoice PDF Export**
  - Export invoice PDF button
  - PDF download handling
  - PDF preview (optional)

**Frontend Deliverables:**
- Prescription form and management
- Invoice detail view
- Add invoice items UI
- Payment form and processing
- Complete Cashier dashboard
- Complete Pharmacist dashboard
- Invoice PDF export

#### Testing (TB4)

**Backend Testing:**
- [x] **Unit Tests**
  - Prescription service tests
  - Invoice service tests
  - Invoice calculation tests
  - Item addition tests
  - Version management tests
  - Payment service tests
  - Atomic operation tests
  - Dispense service tests
  
- [x] **Integration Tests**
  - Prescription endpoints
  - Invoice CRUD endpoints
  - Add item endpoints
  - Payment endpoints
  - Discount endpoint
  - Dispense endpoints
  - Calculation endpoints
  
- [x] **API Testing**
  - Prescription creation scenarios
  - Invoice creation scenarios
  - Item addition scenarios
  - Payment recording scenarios
  - Partial payment scenarios
  - Concurrent payment scenarios
  - Invoice completion scenarios

**Frontend Testing:**
- [x] **Component Tests**
  - Prescription form tests
  - Invoice detail tests
  - Add item form tests
  - Payment form tests
  - Cashier dashboard tests
  - Pharmacist dashboard tests
  
- [x] **Integration Tests**
  - Prescription creation flow
  - Invoice creation flow
  - Add items flow
  - Payment flow
  - Invoice completion flow
  - Dispense workflow
  
- [x] **E2E Tests (Manual)**
  - Complete prescription workflow
  - Complete invoice creation
  - Add service items
  - Add medicine items
  - Process payment
  - Complete invoice
  - Dispense workflow

**Test Plan - TB4:**
```
Test Coverage:
- Prescription Management: 90%
- Invoice CRUD: 90%
- Invoice Items: 90%
- Calculations: 95%
- Optimistic Locking: 85%
- Payment Recording: 90%
- Partial Payment: 90%
- Atomic Operations: 85%
- Dispense Management: 90%
- Pharmacy Workflow: 85%

Test Scenarios:
1. Create prescription
2. Create invoice for visit
3. Add service item to invoice
4. Add medicine item to invoice
5. Apply discount (amount/percentage)
6. Recalculate invoice totals
7. Handle concurrent updates
8. Record full payment
9. Record partial payment
10. Handle concurrent payments
11. Complete invoice on payment
12. Complete visit on invoice payment
13. Track outstanding balance
14. Create dispense record
15. Fulfill prescription
16. Update dispense status
17. Generate invoice PDF
```

---

## Timebox 5 (TB5): Patient Portal with Bilingual UI

### Duration: 2-3 weeks
### Team: 2 developers

### Backend Development

#### Week 1: Patient Portal API
- [x] **Patient Portal Routes**
  - Patient portal routes (`patientPortal.routes.js`)
  - `GET /api/me/appointments` - Get patient appointments
  - `GET /api/me/visits` - Get patient visits
  - `GET /api/me/prescriptions` - Get patient prescriptions
  - `GET /api/me/invoices` - Get patient invoices
  - `GET /api/me/profile` - Get patient profile
  - `PUT /api/me/profile` - Update patient profile
  - `GET /api/me/visit/:visitId/export/pdf` - Export visit PDF
  - `GET /api/me/visits/export/pdf` - Export visit history PDF
  - `GET /api/me/visits/export/csv` - Export visit history CSV
  
- [x] **Patient Portal Authorization**
  - Patient-only endpoints
  - Patient data access control
  - Own data only access

**Backend Deliverables:**
- Patient portal API endpoints
- Patient data access control

#### Week 2: Internationalization Backend
- [x] **i18n Support**
  - Language detection
  - Language preference storage
  - API response localization (optional)
  - Date/time localization

**Backend Deliverables:**
- i18n backend support

#### Frontend Development

#### Week 1: Patient Portal Core
- [x] **Patient Portal Layout**
  - Patient portal layout (`PatientDashboard.jsx`)
  - Portal navigation
  - Portal header
  - Portal sidebar
  
- [x] **Patient Dashboard**
  - Patient dashboard page
  - Appointments section
  - Upcoming appointments
  - Appointment history
  - Quick actions
  
- [x] **Patient Appointments View**
  - Appointments list
  - Appointment details
  - Appointment status
  - Appointment actions (view, cancel)
  
- [x] **Patient Visit History**
  - Visit history list
  - Visit details
  - Visit summary
  - Download visit PDF
  - Export visit history
  
- [x] **Patient Prescriptions View**
  - Prescriptions list
  - Prescription details
  - Prescription status
  - Medication information
  
- [x] **Patient Invoices View**
  - Invoices list
  - Invoice details
  - Payment status
  - Outstanding balances
  - Payment history
  
- [x] **Patient Profile**
  - Profile view
  - Profile edit form
  - Demographics update
  - Emergency contacts update

#### Week 2: Bilingual UI Implementation
- [x] **i18n Setup**
  - i18next configuration
  - Language detection
  - Language switcher component
  - Translation files (English, [Second Language])
  
- [x] **Translation Coverage**
  - All UI components translated
  - Form labels translated
  - Error messages translated
  - Success messages translated
  - Dashboard content translated
  
- [x] **Language Switcher**
  - Language selector dropdown
  - Language persistence
  - RTL support (if needed)

**Frontend Deliverables:**
- Complete patient portal
- Patient dashboard
- Appointments view
- Visit history view
- Prescriptions view
- Invoices view
- Profile management
- Bilingual UI (English + [Second Language])
- Language switcher

#### Testing (TB5)

**Backend Testing:**
- [x] **Unit Tests**
  - Patient portal service tests
  - Authorization tests
  
- [x] **Integration Tests**
  - Patient portal endpoints
  - Authorization checks
  - Data access control
  
- [x] **API Testing**
  - Patient portal data retrieval
  - Own data access only
  - Unauthorized access prevention

**Frontend Testing:**
- [x] **Component Tests**
  - Patient portal tests
  - Language switcher tests
  - Translation tests
  
- [x] **Integration Tests**
  - Patient portal navigation
  - Language switching
  - Data display
  
- [x] **E2E Tests (Manual)**
  - Complete patient portal
  - Language switching
  - Data access verification
  - Export functionality

**Test Plan - TB5:**
```
Test Coverage:
- Patient Portal: 90%
- Authorization: 95%
- i18n: 85%
- Language Switching: 90%

Test Scenarios:
1. Patient login to portal
2. View own appointments
3. View own visit history
4. View own prescriptions
5. View own invoices
6. Update profile
7. Download visit PDF
8. Export visit history
9. Switch language
10. Verify translations
11. Prevent access to other patients' data
12. Language persistence
```

---

## Timebox 6 (TB6): Security Hardening (RLS/Audit)

### Duration: 2 weeks
### Team: 2 developers

### Backend Development

#### Week 1: Row Level Security (RLS)
- [x] **Database RLS Policies**
  - RLS enabled on all tables
  - User-based RLS policies
  - Role-based RLS policies
  - Patient data access policies
  - Visit data access policies
  - Invoice data access policies
  
- [x] **RLS Policy Implementation**
  - Users table RLS
  - Patients table RLS
  - Appointments table RLS
  - Visits table RLS
  - Prescriptions table RLS
  - Invoices table RLS
  - Payment transactions RLS
  
- [x] **RLS Testing**
  - RLS policy testing
  - Access control verification
  - Data isolation testing

**Backend Deliverables:**
- RLS policies on all tables
- Role-based data access
- Patient data isolation

#### Week 2: Audit Logging & Security
- [x] **Audit Log Model**
  - Audit log model (`AuditLog.model.js`)
  - Audit log schema
  - Action types
  - Entity tracking
  
- [x] **Audit Log Service**
  - Audit log service (`AuditLog.service.js`)
  - Log all system actions
  - User activity logging
  - Data change tracking
  - PII protection in logs
  
- [x] **Audit Log Routes**
  - Audit log routes (`auditLog.routes.js`)
  - `GET /api/audit-logs` - Get audit logs
  - `GET /api/audit-logs/user/:userId` - Get user audit logs
  - `GET /api/audit-logs/entity/:entityType/:entityId` - Get entity audit logs
  
- [x] **Security Enhancements**
  - Input sanitization
  - SQL injection prevention
  - XSS prevention
  - CSRF protection
  - Rate limiting enhancements
  - Security headers (Helmet)
  - Password policy enforcement
  - Session management

**Backend Deliverables:**
- Complete audit logging system
- Security enhancements
- Compliance-ready logging

#### Frontend Development

#### Week 1: Security UI Enhancements
- [x] **Security Features**
  - Input validation on all forms
  - XSS prevention in displays
  - Secure token storage
  - Session timeout handling
  - Password strength indicator
  
- [x] **Error Handling**
  - Secure error messages
  - No sensitive data in errors
  - User-friendly error display

#### Week 2: Audit Log Viewer (Admin)
- [x] **Audit Log Viewer**
  - Audit log list component
  - Log filtering
  - Log details view
  - User activity tracking
  - Entity change history
  - Export audit logs

**Frontend Deliverables:**
- Security UI enhancements
- Audit log viewer (Admin)
- Secure error handling

#### Testing (TB6)

**Backend Testing:**
- [x] **Security Tests**
  - RLS policy tests
  - Access control tests
  - SQL injection tests
  - XSS tests
  - CSRF tests
  - Rate limiting tests
  - Password policy tests
  
- [x] **Audit Tests**
  - Audit log creation tests
  - Audit log retrieval tests
  - PII protection tests
  
- [x] **Penetration Testing**
  - Security vulnerability scanning
  - Access control testing
  - Data isolation testing

**Frontend Testing:**
- [x] **Security Tests**
  - Input validation tests
  - XSS prevention tests
  - Token security tests
  
- [x] **Component Tests**
  - Audit log viewer tests
  - Security UI tests

**Test Plan - TB6:**
```
Test Coverage:
- RLS Policies: 95%
- Access Control: 95%
- Audit Logging: 90%
- Security Features: 90%
- SQL Injection Prevention: 95%
- XSS Prevention: 95%

Test Scenarios:
1. Verify RLS policies on all tables
2. Test role-based data access
3. Test patient data isolation
4. Verify audit log creation
5. Test audit log retrieval
6. Verify PII protection in logs
7. Test SQL injection prevention
8. Test XSS prevention
9. Test CSRF protection
10. Test rate limiting
11. Test password policy
12. Security vulnerability scan
```

---

## Timebox 7 (TB7): Non-Functional Proof & Release Readiness

### Duration: 2-3 weeks
### Team: 2-3 developers + QA + DevOps

### Backend Development

#### Week 1: Performance Optimization
- [x] **Database Optimization**
  - Database indexing
  - Query optimization
  - Connection pooling optimization
  - Batch query optimization
  
- [x] **API Optimization**
  - Response caching
  - Query result caching
  - Pagination optimization
  - Batch endpoint optimization
  
- [x] **Performance Monitoring**
  - Performance metrics
  - Response time tracking
  - Database query monitoring
  - API endpoint monitoring

**Backend Deliverables:**
- Optimized database queries
- Cached responses
- Performance monitoring

#### Week 2: Analytics & Reporting
- [x] **Analytics Service**
  - Analytics service (`Analytics.service.js`)
  - Clinic statistics queries
  - Revenue analytics
  - Patient statistics
  - Appointment analytics
  - Visit analytics
  - Queue analytics
  
- [x] **Analytics Routes**
  - Analytics routes (`analytics.routes.js`)
  - `GET /api/analytics/clinic-stats` - Clinic statistics
  - `GET /api/analytics/revenue` - Revenue analytics
  - `GET /api/analytics/patients` - Patient statistics
  - `GET /api/analytics/appointments` - Appointment analytics
  - `GET /api/analytics/visits` - Visit analytics
  - `GET /api/analytics/queue` - Queue analytics

**Backend Deliverables:**
- Analytics API endpoints
- Statistics queries
- Reporting endpoints

#### Frontend Development

#### Week 1: Analytics Dashboard
- [x] **Admin Dashboard (Complete)**
  - Admin dashboard (`AdminDashboard.jsx`)
  - Statistics cards
  - Revenue charts (Recharts)
  - Patient statistics charts
  - Appointment charts
  - Visit charts
  - Queue analytics charts
  - Date range filters
  - Export functionality
  
- [x] **Analytics Components**
  - Chart components
  - Statistics card components
  - Date range picker
  - Filter components

#### Week 2: Final UI Polish & Documentation
- [x] **UI Polish**
  - Consistent styling
  - Loading states
  - Error states
  - Empty states
  - Responsive design
  - Mobile optimization
  
- [x] **Documentation**
  - User guides
  - Admin guide
  - API documentation
  - Deployment guide

**Frontend Deliverables:**
- Complete analytics dashboard
- Polished UI
- User documentation

#### Testing (TB7)

#### Week 1: Performance Testing
- [x] **Load Testing**
  - Concurrent user testing
  - API load testing
  - Database load testing
  - Response time testing
  
- [x] **Stress Testing**
  - Maximum capacity testing
  - Failure point testing
  - Recovery testing
  
- [x] **Performance Metrics**
  - Response time benchmarks
  - Throughput measurements
  - Resource usage monitoring

#### Week 2: User Acceptance Testing (UAT)
- [x] **UAT Scenarios**
  - Admin user testing
  - Doctor user testing
  - Nurse user testing
  - Receptionist user testing
  - Cashier user testing
  - Pharmacist user testing
  - Patient portal testing
  
- [x] **Feedback Collection**
  - User feedback forms
  - Bug reporting
  - Feature requests
  - Usability feedback

#### Week 3: Release Readiness
- [x] **Final Testing**
  - Smoke testing
  - Regression testing
  - Security testing
  - Compatibility testing
  
- [x] **Deployment Preparation**
  - Production environment setup
  - Database migration scripts
  - Deployment scripts
  - Rollback procedures
  
- [x] **Documentation**
  - Technical documentation
  - User manuals
  - Admin guides
  - API documentation

**Test Plan - TB7:**
```
Test Coverage:
- Performance: 85%
- Load Testing: 80%
- UAT: 90%
- Security: 95%
- Compatibility: 85%

Test Scenarios:
1. Load testing (100+ concurrent users)
2. Stress testing (maximum capacity)
3. Performance benchmarks
4. Admin UAT scenarios
5. Doctor UAT scenarios
6. Nurse UAT scenarios
7. Receptionist UAT scenarios
8. Cashier UAT scenarios
9. Patient portal UAT scenarios
10. Cross-browser compatibility
11. Mobile responsiveness
12. Security vulnerability scan
13. Final regression testing
14. Deployment verification
```

---

## Summary by Timebox

| Timebox | Duration | Backend Focus | Frontend Focus | Testing Focus |
|---------|----------|--------------|----------------|---------------|
| **TB0** | 2-3 weeks | Auth, User Management | **All 7 Role Dashboards** | Auth, RBAC, Dashboard scaffolds |
| **TB1** | 3-4 weeks | Patient, Appointments, Availability | Patient UI, Appointment UI, Calendar | Patient CRUD, Appointment scheduling |
| **TB2** | 3-4 weeks | Queue, Visits, Check-in | **Queue Dashboards**, Real-time updates | Queue workflow, Visit creation |
| **TB3** | 3-4 weeks | Vitals, Medical Records, Export | Vitals forms, Medical records UI | Vitals, Diagnoses, Prescriptions |
| **TB4** | 4-5 weeks | Prescriptions, Invoices, Payments, Pharmacy | **Cashier & Pharmacist Dashboards**, Payment UI | Billing, Payments, Dispensing |
| **TB5** | 2-3 weeks | Patient Portal API, i18n | **Patient Portal**, Bilingual UI | Portal, i18n, Authorization |
| **TB6** | 2 weeks | RLS, Audit Logging, Security | Security UI, Audit viewer | Security, RLS, Audit |
| **TB7** | 2-3 weeks | Analytics, Performance | **Analytics Dashboard**, UI Polish | Performance, UAT, Release |

**Total Duration**: 21-28 weeks (~5-7 months)

---

## Dashboard Development Summary

### Timebox 0: Role Dashboard Scaffolds
- ✅ **Admin Dashboard** - Scaffold with navigation and placeholder sections
- ✅ **Doctor Dashboard** - Scaffold with queue and appointment sections
- ✅ **Nurse Dashboard** - Scaffold with queue and vitals sections
- ✅ **Receptionist Dashboard** - Scaffold with registration and check-in sections
- ✅ **Cashier Dashboard** - Scaffold with invoice and payment sections
- ✅ **Pharmacist Dashboard** - Scaffold with prescription sections
- ✅ **Patient Portal Dashboard** - Scaffold with patient sections

### Timebox 2: Queue Dashboards (Complete)
- ✅ **Nurse Dashboard** - Complete with queue management and vitals
- ✅ **Doctor Dashboard** - Complete with queue and consultation controls
- ✅ **Receptionist Dashboard** - Complete with check-in and token issuance

### Timebox 4: Billing Dashboards (Complete)
- ✅ **Cashier Dashboard** - Complete with payment processing and invoices
- ✅ **Pharmacist Dashboard** - Complete with dispensing and prescriptions

### Timebox 5: Patient Portal (Complete)
- ✅ **Patient Portal Dashboard** - Complete with all patient features

### Timebox 7: Analytics Dashboard (Complete)
- ✅ **Admin Dashboard** - Complete with analytics, charts, and reporting

---

**Document Version**: 2.0  
**Last Updated**: 2025-01-XX  
**Project**: ThriveCare Clinic Information System
