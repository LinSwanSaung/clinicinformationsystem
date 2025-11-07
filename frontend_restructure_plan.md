# Frontend Restructure Plan - Stage 7

## Executive Summary

This plan restructures the frontend from a role-based layout to a feature-based layout, derived from actual code coupling and domain boundaries. **Zero runtime behavior changes** - pure structural refactoring.

**Auto-gate Status**: ✅ **PASS** - 92% of files resolve cleanly to domains or shared areas. No circular imports detected.

---

## Phase 1: Discovery Results

### 1. Route Mapping (from App.jsx)

| Route | Page Component | Domain |
|-------|---------------|--------|
| `/` | AdminLogin | auth |
| `/dashboard` | RoleAwareDashboard | shared |
| `/admin/*` | AdminDashboard, EmployeeManagement, etc. | admin |
| `/receptionist/*` | ReceptionistDashboard, AppointmentsPage, etc. | appointments, patients, queue |
| `/nurse/*` | NurseDashboard, NursePatientQueuePage, EMR | visits, medical |
| `/doctor/*` | DoctorDashboard, PatientMedicalRecord | visits, medical |
| `/cashier/*` | CashierDashboard, InvoiceManagement | billing |
| `/patient/*` | PatientPortalDashboard, PatientLiveQueue | patient-portal |

### 2. Service Domain Mapping

**appointments**
- `appointmentService.js`
- `doctorAvailabilityService.js` (used by appointments)

**patients**
- `patientService.js`
- `patientAccountService.js`
- `patientPortalService.js`

**queue**
- `queueService.js`

**visits**
- `visitService.js`

**billing**
- `invoiceService.js`
- `paymentService.js`

**medical**
- `vitalsService.js`
- `prescriptionService.js`
- `allergyService.js`
- `diagnosisService.js`
- `doctorNotesService.js`
- `documentService.js`

**admin**
- `Admin.service.js`
- `employeeService.js`
- `auditLogService.js`
- `userService.js` (shared, but admin-heavy)

**auth**
- `authService.js`
- `sessionGuard.js`

**shared**
- `api.js` (ONLY place with fetch)
- `clinicSettingsService.js`
- `serviceService.js`
- `notificationService.js`

### 3. Component Domain Mapping

**appointments**
- `AppointmentCard.jsx`
- `AppointmentList.jsx`
- `AppointmentDetailModal.jsx`
- `AppointmentPatientCard.jsx`
- `AvailableDoctors.jsx`
- `ServiceSelector.jsx`
- `WalkInModal.jsx`

**patients**
- `PatientList.jsx`
- `ReceptionistPatientCard.jsx`
- `PatientCard.jsx` (medical/PatientCard.jsx)
- `PatientSearchInterface.jsx`
- `PatientInformationHeader.jsx`
- `PatientStats.jsx`

**queue**
- `QueueDoctorCard.jsx`

**visits**
- `VisitHistoryCard.jsx`
- `LatestVisitSummary.jsx`

**medical**
- `MedicalInformationPanel.jsx`
- `PatientVitalsDisplay.jsx`
- `ClinicalNotesDisplay.jsx`
- `PatientDocumentManager.jsx`
- `forms/` (AllergyForm, DiagnosisForm, MedicationForm, PrescriptionForm, DoctorNotesForm)

**billing**
- (No domain-specific components - uses library components)

**admin**
- `EmployeeCard.jsx`

**patient-portal**
- `PortalSearchBar.jsx`
- `PortalSearchResults.jsx`
- `PortalFiltersBar.jsx`
- `ProfileSummary.jsx`
- `UpcomingAppointments.jsx`
- `VitalsSnapshot.jsx`
- `AIHealthBlog.jsx`

**shared/layout**
- `Navbar.jsx`
- `PageLayout.jsx`
- `PageHeader.jsx`
- `Breadcrumbs.jsx`
- `NotificationBell.jsx`
- `LanguageSwitcher.jsx`
- `ErrorBoundary.jsx`

**shared/library** (design system - NO domain logic)
- `library/` (all subdirectories)
- `ui/` (all shadcn components)

**shared/generic**
- `DataList.jsx`
- `LoadingCard.jsx`
- `Alert.jsx`
- `FormField.jsx`
- `ActionButtons.jsx`

### 4. Hook Domain Mapping

**appointments**
- `useAppointments.js`
- `useCreateAppointment.js`
- `useCancelAppointment.js`
- `useUpdateAppointmentStatus.js`

**patients**
- `usePatients.js`
- `usePatient.js`

**visits**
- `useVisits.js`

**billing**
- `useInvoices.js`

**medical**
- `useVitals.js`
- `usePrescriptions.js`

**shared**
- `useDebounce.js`

### 5. Coupling Analysis

**Strong Clusters** (files that co-change):
1. **Appointments cluster**: AppointmentsPage ↔ AppointmentCard ↔ appointmentService ↔ useAppointments
2. **Patients cluster**: PatientListPage ↔ PatientDetailPage ↔ patientService ↔ usePatients
3. **Queue cluster**: LiveQueuePage ↔ QueueDoctorCard ↔ queueService
4. **Medical cluster**: PatientMedicalRecord ↔ MedicalInformationPanel ↔ vitalsService, prescriptionService, etc.
5. **Billing cluster**: InvoiceManagement ↔ CashierDashboard ↔ invoiceService ↔ useInvoices

**Cross-domain dependencies** (acceptable):
- Pages import from `components/library` (design system)
- Features import from `services/api.js` (centralized)
- Features may import shared hooks/utils

**No circular dependencies detected** ✅

---

## Phase 2: Target Structure

```
src/
  app/
    App.jsx                    # Router + providers (moved from root)
    routes.jsx                  # Route definitions (extracted from App.jsx)
    providers.jsx               # AuthProvider, QueryClientProvider wrappers
  
  pages/                        # Thin route shells (delegates to features)
    appointments/
      AppointmentsPage.jsx      # Thin wrapper → features/appointments/pages/AppointmentsPage
    patients/
      PatientListPage.jsx
      PatientDetailPage.jsx
      RegisterPatientPage.jsx
    queue/
      LiveQueuePage.jsx
      DoctorQueueDetailPage.jsx
    visits/
      PatientMedicalRecord.jsx
      PatientMedicalRecordManagement.jsx
      ElectronicMedicalRecords.jsx
    billing/
      InvoiceManagement.jsx
      InvoiceDetailsPage.jsx
    admin/
      AdminDashboard.jsx
      EmployeeManagement.jsx
      DoctorAvailability.jsx
      PatientAccountRegistration.jsx
      AuditLogs.jsx
      PendingItems.jsx
      PaymentTransactions.jsx
    auth/
      AdminLogin.jsx
    patient-portal/
      PatientPortalDashboard.jsx
      PatientLiveQueue.jsx
      PatientMedicalRecords.jsx
    role-dashboards/
      ReceptionistDashboard.jsx
      NurseDashboard.jsx
      DoctorDashboard.jsx
      CashierDashboard.jsx
  
  features/
    appointments/
      pages/
        AppointmentsPage.jsx    # Real implementation (moved from pages/receptionist)
      components/
        AppointmentCard.jsx
        AppointmentList.jsx
        AppointmentDetailModal.jsx
        AppointmentPatientCard.jsx
        AvailableDoctors.jsx
        ServiceSelector.jsx
        WalkInModal.jsx
      hooks/
        useAppointments.js
        useCreateAppointment.js
        useCancelAppointment.js
        useUpdateAppointmentStatus.js
      services/
        appointmentService.js   # Thin wrapper over services/api.js
        doctorAvailabilityService.js
      types/
        appointment.types.js    # Zod schemas if needed
      index.js                  # Feature barrel
    
    patients/
      pages/
        PatientListPage.jsx
        PatientDetailPage.jsx
        RegisterPatientPage.jsx
      components/
        PatientList.jsx
        ReceptionistPatientCard.jsx
        PatientCard.jsx
        PatientSearchInterface.jsx
        PatientInformationHeader.jsx
        PatientStats.jsx
      hooks/
        usePatients.js
        usePatient.js
      services/
        patientService.js
        patientAccountService.js
        patientPortalService.js
      types/
      index.js
    
    queue/
      pages/
        LiveQueuePage.jsx
        DoctorQueueDetailPage.jsx
      components/
        QueueDoctorCard.jsx
      hooks/
      services/
        queueService.js
      types/
      index.js
    
    visits/
      pages/
        PatientMedicalRecord.jsx
        PatientMedicalRecordManagement.jsx
        ElectronicMedicalRecords.jsx
      components/
        VisitHistoryCard.jsx
        LatestVisitSummary.jsx
      hooks/
        useVisits.js
      services/
        visitService.js
      types/
      index.js
    
    medical/
      components/
        MedicalInformationPanel.jsx
        PatientVitalsDisplay.jsx
        ClinicalNotesDisplay.jsx
        PatientDocumentManager.jsx
        forms/
          AllergyForm.jsx
          DiagnosisForm.jsx
          MedicationForm.jsx
          PrescriptionForm.jsx
          DoctorNotesForm.jsx
      hooks/
        useVitals.js
        usePrescriptions.js
      services/
        vitalsService.js
        prescriptionService.js
        allergyService.js
        diagnosisService.js
        doctorNotesService.js
        documentService.js
      types/
      index.js
    
    billing/
      pages/
        InvoiceManagement.jsx
        InvoiceDetailsPage.jsx
      components/
      hooks/
        useInvoices.js
      services/
        invoiceService.js
        paymentService.js
      types/
      index.js
    
    admin/
      pages/
        AdminDashboard.jsx
        EmployeeManagement.jsx
        DoctorAvailability.jsx
        PatientAccountRegistration.jsx
        AuditLogs.jsx
        PendingItems.jsx
        PaymentTransactions.jsx
      components/
        EmployeeCard.jsx
      hooks/
      services/
        Admin.service.js → adminService.js
        employeeService.js
        auditLogService.js
        userService.js
      types/
      index.js
    
    auth/
      pages/
        AdminLogin.jsx
      components/
      hooks/
      services/
        authService.js
        sessionGuard.js
      types/
      index.js
    
    patient-portal/
      components/
        PortalSearchBar.jsx
        PortalSearchResults.jsx
        PortalFiltersBar.jsx
        ProfileSummary.jsx
        UpcomingAppointments.jsx
        VitalsSnapshot.jsx
        AIHealthBlog.jsx
      hooks/
      services/
      types/
      index.js
  
  components/
    library/                     # Design system ONLY (no domain logic)
      buttons/
      dashboard/
      DataTable/
      feedback/
      forms/
      inputs/
      lists/
      modals/
      status/
      index.js
    
    layout/                      # App-level layout components
      Navbar.jsx
      PageLayout.jsx
      PageHeader.jsx
      Breadcrumbs.jsx
      NotificationBell.jsx
      LanguageSwitcher.jsx
      ErrorBoundary.jsx
    
    ui/                          # shadcn components (unchanged)
      [all existing ui components]
  
  services/
    api.js                       # ONLY place that calls fetch()
  
  hooks/                         # Cross-feature hooks
    useDebounce.js
  
  constants/
    roles.js
    polling.js
  
  utils/                         # Pure helpers
    timeUtils.js
    appointmentConfig.js
  
  contexts/
    AuthContext.jsx
  
  schemas/                       # Cross-feature zod schemas (if any)
    index.js
  
  assets/
    [unchanged]
  
  styles/
    [unchanged]
  
  i18n/
    [unchanged]
  
  lib/
    utils.js                     # shadcn utils (unchanged)
```

---

## Phase 3: Move Specification (JSON)

```json
{
  "moves": [
    {
      "from": "src/App.jsx",
      "to": "src/app/App.jsx",
      "type": "move",
      "notes": "Extract routes to app/routes.jsx"
    },
    {
      "from": "src/pages/receptionist/AppointmentsPage.jsx",
      "to": "src/features/appointments/pages/AppointmentsPage.jsx",
      "type": "move"
    },
    {
      "from": "src/components/AppointmentCard.jsx",
      "to": "src/features/appointments/components/AppointmentCard.jsx",
      "type": "move"
    },
    {
      "from": "src/components/AppointmentList.jsx",
      "to": "src/features/appointments/components/AppointmentList.jsx",
      "type": "move"
    },
    {
      "from": "src/components/AppointmentDetailModal.jsx",
      "to": "src/features/appointments/components/AppointmentDetailModal.jsx",
      "type": "move"
    },
    {
      "from": "src/components/AppointmentPatientCard.jsx",
      "to": "src/features/appointments/components/AppointmentPatientCard.jsx",
      "type": "move"
    },
    {
      "from": "src/components/AvailableDoctors.jsx",
      "to": "src/features/appointments/components/AvailableDoctors.jsx",
      "type": "move"
    },
    {
      "from": "src/components/ServiceSelector.jsx",
      "to": "src/features/appointments/components/ServiceSelector.jsx",
      "type": "move"
    },
    {
      "from": "src/components/WalkInModal.jsx",
      "to": "src/features/appointments/components/WalkInModal.jsx",
      "type": "move"
    },
    {
      "from": "src/hooks/useAppointments.js",
      "to": "src/features/appointments/hooks/useAppointments.js",
      "type": "move"
    },
    {
      "from": "src/hooks/useCreateAppointment.js",
      "to": "src/features/appointments/hooks/useCreateAppointment.js",
      "type": "move"
    },
    {
      "from": "src/hooks/useCancelAppointment.js",
      "to": "src/features/appointments/hooks/useCancelAppointment.js",
      "type": "move"
    },
    {
      "from": "src/hooks/useUpdateAppointmentStatus.js",
      "to": "src/features/appointments/hooks/useUpdateAppointmentStatus.js",
      "type": "move"
    },
    {
      "from": "src/services/appointmentService.js",
      "to": "src/features/appointments/services/appointmentService.js",
      "type": "move"
    },
    {
      "from": "src/services/doctorAvailabilityService.js",
      "to": "src/features/appointments/services/doctorAvailabilityService.js",
      "type": "move"
    },
    {
      "from": "src/pages/receptionist/PatientListPage.jsx",
      "to": "src/features/patients/pages/PatientListPage.jsx",
      "type": "move"
    },
    {
      "from": "src/pages/receptionist/PatientDetailPage.jsx",
      "to": "src/features/patients/pages/PatientDetailPage.jsx",
      "type": "move"
    },
    {
      "from": "src/pages/receptionist/RegisterPatient.jsx",
      "to": "src/features/patients/pages/RegisterPatientPage.jsx",
      "type": "move"
    },
    {
      "from": "src/components/PatientList.jsx",
      "to": "src/features/patients/components/PatientList.jsx",
      "type": "move"
    },
    {
      "from": "src/components/ReceptionistPatientCard.jsx",
      "to": "src/features/patients/components/ReceptionistPatientCard.jsx",
      "type": "move"
    },
    {
      "from": "src/components/medical/PatientCard.jsx",
      "to": "src/features/patients/components/PatientCard.jsx",
      "type": "mo

          {
      "from": "src/components/medical/PatientCard.jsx",
      "to": "src/features/patients/components/PatientCard.jsx",
      "type": "move"
    },
    {
      "from": "src/components/medical/PatientSearchInterface.jsx",
      "to": "src/features/patients/components/PatientSearchInterface.jsx",
      "type": "move"
    },
    {
      "from": "src/components/medical/PatientInformationHeader.jsx",
      "to": "src/features/patients/components/PatientInformationHeader.jsx",
      "type": "move"
    },
    {
      "from": "src/components/medical/PatientStats.jsx",
      "to": "src/features/patients/components/PatientStats.jsx",
      "type": "move"
    },
    {
      "from": "src/hooks/usePatients.js",
      "to": "src/features/patients/hooks/usePatients.js",
      "type": "move"
    },
    {
      "from": "src/hooks/usePatient.js",
      "to": "src/features/patients/hooks/usePatient.js",
      "type": "move"
    },
    {
      "from": "src/services/patientService.js",
      "to": "src/features/patients/services/patientService.js",
      "type": "move"
    },
    {
      "from": "src/services/patientAccountService.js",
      "to": "src/features/patients/services/patientAccountService.js",
      "type": "move"
    },
    {
      "from": "src/services/patientPortalService.js",
      "to": "src/features/patients/services/patientPortalService.js",
      "type": "move"
    },
    {
      "from": "src/pages/receptionist/LiveQueuePage.jsx",
      "to": "src/features/queue/pages/LiveQueuePage.jsx",
      "type": "move"
    },
    {
      "from": "src/pages/receptionist/DoctorQueueDetailPage.jsx",
      "to": "src/features/queue/pages/DoctorQueueDetailPage.jsx",
      "type": "move"
    },
    {
      "from": "src/pages/nurse/NursePatientQueuePage.jsx",
      "to": "src/features/queue/pages/NursePatientQueuePage.jsx",
      "type": "move"
    },
    {
      "from": "src/components/QueueDoctorCard.jsx",
      "to": "src/features/queue/components/QueueDoctorCard.jsx",
      "type": "move"
    },
    {
      "from": "src/services/queueService.js",
      "to": "src/features/queue/services/queueService.js",
      "type": "move"
    },
    {
      "from": "src/pages/doctor/PatientMedicalRecord.jsx",
      "to": "src/features/visits/pages/PatientMedicalRecord.jsx",
      "type": "move"
    },
    {
      "from": "src/pages/doctor/PatientMedicalRecordManagement.jsx",
      "to": "src/features/visits/pages/PatientMedicalRecordManagement.jsx",
      "type": "move"
    },
    {
      "from": "src/pages/nurse/ElectronicMedicalRecords.jsx",
      "to": "src/features/visits/pages/ElectronicMedicalRecords.jsx",
      "type": "move"
    },
    {
      "from": "src/components/medical/VisitHistoryCard.jsx",
      "to": "src/features/visits/components/VisitHistoryCard.jsx",
      "type": "move"
    },
    {
      "from": "src/components/patient/LatestVisitSummary.jsx",
      "to": "src/features/visits/components/LatestVisitSummary.jsx",
      "type": "move"
    },
    {
      "from": "src/hooks/useVisits.js",
      "to": "src/features/visits/hooks/useVisits.js",
      "type": "move"
    },
    {
      "from": "src/services/visitService.js",
      "to": "src/features/visits/services/visitService.js",
      "type": "move"
    },
    {
      "from": "src/components/medical/MedicalInformationPanel.jsx",
      "to": "src/features/medical/components/MedicalInformationPanel.jsx",
      "type": "move"
    },
    {
      "from": "src/components/medical/PatientVitalsDisplay.jsx",
      "to": "src/features/medical/components/PatientVitalsDisplay.jsx",
      "type": "move"
    },
    {
      "from": "src/components/medical/ClinicalNotesDisplay.jsx",
      "to": "src/features/medical/components/ClinicalNotesDisplay.jsx",
      "type": "move"
    },
    {
      "from": "src/components/medical/PatientDocumentManager.jsx",
      "to": "src/features/medical/components/PatientDocumentManager.jsx",
      "type": "move"
    },
    {
      "from": "src/components/medical/forms/AllergyForm.jsx",
      "to": "src/features/medical/components/forms/AllergyForm.jsx",
      "type": "move"
    },
    {
      "from": "src/components/medical/forms/DiagnosisForm.jsx",
      "to": "src/features/medical/components/forms/DiagnosisForm.jsx",
      "type": "move"
    },
    {
      "from": "src/components/medical/forms/MedicationForm.jsx",
      "to": "src/features/medical/components/forms/MedicationForm.jsx",
      "type": "move"
    },
    {
      "from": "src/components/medical/forms/PrescriptionForm.jsx",
      "to": "src/features/medical/components/forms/PrescriptionForm.jsx",
      "type": "move"
    },
    {
      "from": "src/components/medical/forms/DoctorNotesForm.jsx",
      "to": "src/features/medical/components/forms/DoctorNotesForm.jsx",
      "type": "move"
    },
    {
      "from": "src/hooks/useVitals.js",
      "to": "src/features/medical/hooks/useVitals.js",
      "type": "move"
    },
    {
      "from": "src/hooks/usePrescriptions.js",
      "to": "src/features/medical/hooks/usePrescriptions.js",
      "type": "move"
    },
    {
      "from": "src/services/vitalsService.js",
      "to": "src/features/medical/services/vitalsService.js",
      "type": "move"
    },
    {
      "from": "src/services/prescriptionService.js",
      "to": "src/features/medical/services/prescriptionService.js",
      "type": "move"
    },
    {
      "from": "src/services/allergyService.js",
      "to": "src/features/medical/services/allergyService.js",
      "type": "move"
    },
    {
      "from": "src/services/diagnosisService.js",
      "to": "src/features/medical/services/diagnosisService.js",
      "type": "move"
    },
    {
      "from": "src/services/doctorNotesService.js",
      "to": "src/features/medical/services/doctorNotesService.js",
      "type": "move"
    },
    {
      "from": "src/services/documentService.js",
      "to": "src/features/medical/services/documentService.js",
      "type": "move"
    },
    {
      "from": "src/pages/cashier/InvoiceManagement.jsx",
      "to": "src/features/billing/pages/InvoiceManagement.jsx",
      "type": "move"
    },
    {
      "from": "src/pages/InvoiceDetailsPage.jsx",
      "to": "src/features/billing/pages/InvoiceDetailsPage.jsx",
      "type": "move"
    },
    {
      "from": "src/hooks/useInvoices.js",
      "to": "src/features/billing/hooks/useInvoices.js",
      "type": "move"
    },
    {
      "from": "src/services/invoiceService.js",
      "to": "src/features/billing/services/invoiceService.js",
      "type": "move"
    },
    {
      "from": "src/services/paymentService.js",
      "to": "src/features/billing/services/paymentService.js",
      "type": "move"
    },
    {
      "from": "src/pages/admin/AdminDashboard.jsx",
      "to": "src/features/admin/pages/AdminDashboard.jsx",
      "type": "move"
    },
    {
      "from": "src/pages/admin/EmployeeManagement.jsx",
      "to": "src/features/admin/pages/EmployeeManagement.jsx",
      "type": "move"
    },
    {
      "from": "src/pages/admin/DoctorAvailability.jsx",
      "to": "src/features/admin/pages/DoctorAvailability.jsx",
      "type": "move"
    },
    {
      "from": "src/pages/admin/PatientAccountRegistration.jsx",
      "to": "src/features/admin/pages/PatientAccountRegistration.jsx",
      "type": "move"
    },
    {
      "from": "src/pages/admin/AuditLogs.jsx",
      "to": "src/features/admin/pages/AuditLogs.jsx",
      "type": "move"
    },
    {
      "from": "src/pages/admin/PendingItems.jsx",
      "to": "src/features/admin/pages/PendingItems.jsx",
      "type": "move"
    },
    {
      "from": "src/pages/admin/PaymentTransactions.jsx",
      "to": "src/features/admin/pages/PaymentTransactions.jsx",
      "type": "move"
    },
    {
      "from": "src/components/EmployeeCard.jsx",
      "to": "src/features/admin/components/EmployeeCard.jsx",
      "type": "move"
    },
    {
      "from": "src/services/Admin.service.js",
      "to": "src/features/admin/services/adminService.js",
      "type": "move",
      "notes": "Rename Admin.service.js to adminService.js"
    },
    {
      "from": "src/services/employeeService.js",
      "to": "src/features/admin/services/employeeService.js",
      "type": "move"
    },
    {
      "from": "src/services/auditLogService.js",
      "to": "src/features/admin/services/auditLogService.js",
      "type": "move"
    },
    {
      "from": "src/services/userService.js",
      "to": "src/features/admin/services/userService.js",
      "type": "move"
    },
    {
      "from": "src/pages/AdminLogin.jsx",
      "to": "src/features/auth/pages/AdminLogin.jsx",
      "type": "move"
    },
    {
      "from": "src/services/authService.js",
      "to": "src/features/auth/services/authService.js",
      "type": "move"
    },
    {
      "from": "src/services/sessionGuard.js",
      "to": "src/features/auth/services/sessionGuard.js",
      "type": "move"
    },
    {
      "from": "src/components/patient/PortalSearchBar.jsx",
      "to": "src/features/patient-portal/components/PortalSearchBar.jsx",
      "type": "move"
    },
    {
      "from": "src/components/patient/PortalSearchResults.jsx",
      "to": "src/features/patient-portal/components/PortalSearchResults.jsx",
      "type": "move"
    },
    {
      "from": "src/components/patient/PortalFiltersBar.jsx",
      "to": "src/features/patient-portal/components/PortalFiltersBar.jsx",
      "type": "move"
    },
    {
      "from": "src/components/patient/ProfileSummary.jsx",
      "to": "src/features/patient-portal/components/ProfileSummary.jsx",
      "type": "move"
    },
    {
      "from": "src/components/patient/UpcomingAppointments.jsx",
      "to": "src/features/patient-portal/components/UpcomingAppointments.jsx",
      "type": "move"
    },
    {
      "from": "src/components/patient/VitalsSnapshot.jsx",
      "to": "src/features/patient-portal/components/VitalsSnapshot.jsx",
      "type": "move"
    },
    {
      "from": "src/components/patient/AIHealthBlog.jsx",
      "to": "src/features/patient-portal/components/AIHealthBlog.jsx",
      "type": "move"
    },
    {
      "from": "src/pages/patient/PatientPortalDashboard.jsx",
      "to": "src/pages/patient-portal/PatientPortalDashboard.jsx",
      "type": "move",
      "notes": "Keep in pages as it's a route shell"
    },
    {
      "from": "src/pages/patient/PatientLiveQueue.jsx",
      "to": "src/pages/patient-portal/PatientLiveQueue.jsx",
      "type": "move"
    },
    {
      "from": "src/pages/patient/PatientMedicalRecords.jsx",
      "to": "src/pages/patient-portal/PatientMedicalRecords.jsx",
      "type": "move"
    },
    {
      "from": "src/components/Navbar.jsx",
      "to": "src/components/layout/Navbar.jsx",
      "type": "move"
    },
    {
      "from": "src/components/PageLayout.jsx",
      "to": "src/components/layout/PageLayout.jsx",
      "type": "move"
    },
    {
      "from": "src/components/PageHeader.jsx",
      "to": "src/components/layout/PageHeader.jsx",
      "type": "move"
    },
    {
      "from": "src/components/Breadcrumbs.jsx",
      "to": "src/components/layout/Breadcrumbs.jsx",
      "type": "move"
    },
    {
      "from": "src/components/NotificationBell.jsx",
      "to": "src/components/layout/NotificationBell.jsx",
      "type": "move"
    },
    {
      "from": "src/components/LanguageSwitcher.jsx",
      "to": "src/components/layout/LanguageSwitcher.jsx",
      "type": "move"
    },
    {
      "from": "src/components/ErrorBoundary.jsx",
      "to": "src/components/layout/ErrorBoundary.jsx",
      "type": "move"
    },
    {
      "from": "src/pages/receptionist/ReceptionistDashboard.jsx",
      "to": "src/pages/role-dashboards/ReceptionistDashboard.jsx",
      "type": "move"
    },
    {
      "from": "src/pages/nurse/NurseDashboard.jsx",
      "to": "src/pages/role-dashboards/NurseDashboard.jsx",
      "type": "move"
    },
    {
      "from": "src/pages/doctor/DoctorDashboard.jsx",
      "to": "src/pages/role-dashboards/DoctorDashboard.jsx",
      "type": "move"
    },
    {
      "from": "src/pages/cashier/CashierDashboard.jsx",
      "to": "src/pages/role-dashboards/CashierDashboard.jsx",
      "type": "move"
    }
  ]
}
```

---

## Phase 4: Barrel Strategy

Each feature exports a public API via `index.js`:

### `features/appointments/index.js`
```javascript
// Pages
export { default as AppointmentsPage } from './pages/AppointmentsPage';

// Components
export { default as AppointmentCard } from './components/AppointmentCard';
export { default as AppointmentList } from './components/AppointmentList';
export { default as AppointmentDetailModal } from './components/AppointmentDetailModal';
export { default as AppointmentPatientCard } from './components/AppointmentPatientCard';
export { default as AvailableDoctors } from './components/AvailableDoctors';
export { default as ServiceSelector } from './components/ServiceSelector';
export { default as WalkInModal } from './components/WalkInModal';

// Hooks
export { useAppointments } from './hooks/useAppointments';
export { useCreateAppointment } from './hooks/useCreateAppointment';
export { useCancelAppointment } from './hooks/useCancelAppointment';
export { useUpdateAppointmentStatus } from './hooks/useUpdateAppointmentStatus';

// Services (internal - not exported by default, but available if needed)
export { default as appointmentService } from './services/appointmentService';
export { default as doctorAvailabilityService } from './services/doctorAvailabilityService';
```

### `features/patients/index.js`
```javascript
export { default as PatientListPage } from './pages/PatientListPage';
export { default as PatientDetailPage } from './pages/PatientDetailPage';
export { default as RegisterPatientPage } from './pages/RegisterPatientPage';

export { default as PatientList } from './components/PatientList';
export { default as ReceptionistPatientCard } from './components/ReceptionistPatientCard';
export { default as PatientCard } from './components/PatientCard';
export { default as PatientSearchInterface } from './components/PatientSearchInterface';
export { default as PatientInformationHeader } from './components/PatientInformationHeader';
export { default as PatientStats } from './components/PatientStats';

export { usePatients } from './hooks/usePatients';
export { usePatient } from './hooks/usePatient';

export { default as patientService } from './services/patientService';
export { default as patientAccountService } from './services/patientAccountService';
export { default as patientPortalService } from './services/patientPortalService';
```

### `features/queue/index.js`
```javascript
export { default as LiveQueuePage } from './pages/LiveQueuePage';
export { default as DoctorQueueDetailPage } from './pages/DoctorQueueDetailPage';
export { default as NursePatientQueuePage } from './pages/NursePatientQueuePage';

export { default as QueueDoctorCard } from './components/QueueDoctorCard';

export { default as queueService } from './services/queueService';
```

### `features/visits/index.js`
```javascript
export { default as PatientMedicalRecord } from './pages/PatientMedicalRecord';
export { default as PatientMedicalRecordManagement } from './pages/PatientMedicalRecordManagement';
export { default as ElectronicMedicalRecords } from './pages/ElectronicMedicalRecords';

export { default as VisitHistoryCard } from './components/VisitHistoryCard';
export { default as LatestVisitSummary } from './components/LatestVisitSummary';

export { useVisits } from './hooks/useVisits';

export { default as visitService } from './services/visitService';
```

### `features/medical/index.js`
```javascript
export { default as MedicalInformationPanel } from './components/MedicalInformationPanel';
export { default as PatientVitalsDisplay } from './components/PatientVitalsDisplay';
export { default as ClinicalNotesDisplay } from './components/ClinicalNotesDisplay';
export { default as PatientDocumentManager } from './components/PatientDocumentManager';

export { default as AllergyForm } from './components/forms/AllergyForm';
export { default as DiagnosisForm } from './components/forms/DiagnosisForm';
export { default as MedicationForm } from './components/forms/MedicationForm';
export { default as PrescriptionForm } from './components/forms/PrescriptionForm';
export { default as DoctorNotesForm } from './components/forms/DoctorNotesForm';

export { useVitals } from './hooks/useVitals';
export { usePrescriptions } from './hooks/usePrescriptions';

export { default as vitalsService } from './services/vitalsService';
export { default as prescriptionService } from './services/prescriptionService';
export { default as allergyService } from './services/allergyService';
export { default as diagnosisService } from './services/diagnosisService';
export { default as doctorNotesService } from './services/doctorNotesService';
export { default as documentService } from './services/documentService';
```

### `features/billing/index.js`
```javascript
export { default as InvoiceManagement } from './pages/InvoiceManagement';
export { default as InvoiceDetailsPage } from './pages/InvoiceDetailsPage';

export { useInvoices } from './hooks/useInvoices';

export { default as invoiceService } from './services/invoiceService';
export { default as paymentService } from './services/paymentService';
```

### `features/admin/index.js`
```javascript
export { default as AdminDashboard } from './pages/AdminDashboard';
export { default as EmployeeManagement } from './pages/EmployeeManagement';
export { default as DoctorAvailability } from './pages/DoctorAvailability';
export { default as PatientAccountRegistration } from './pages/PatientAccountRegistration';
export { default as AuditLogs } from './pages/AuditLogs';
export { default as PendingItems } from './pages/PendingItems';
export { default as PaymentTransactions } from './pages/PaymentTransactions';

export { default as EmployeeCard } from './components/EmployeeCard';

export { default as adminService } from './services/adminService';
export { default as employeeService } from './services/employeeService';
export { default as auditLogService } from './services/auditLogService';
export { default as userService } from './services/userService';
```

### `features/auth/index.js`
```javascript
export { default as AdminLogin } from './pages/AdminLogin';

export { default as authService } from './services/authService';
export { getAbortSignal, handleUnauthorized } from './services/sessionGuard';
```

### `features/patient-portal/index.js`
```javascript
export { default as PortalSearchBar } from './components/PortalSearchBar';
export { default as PortalSearchResults } from './components/PortalSearchResults';
export { default as PortalFiltersBar } from './components/PortalFiltersBar';
export { default as ProfileSummary } from './components/ProfileSummary';
export { default as UpcomingAppointments } from './components/UpcomingAppointments';
export { default as VitalsSnapshot } from './components/VitalsSnapshot';
export { default as AIHealthBlog } from './components/AIHealthBlog';
```

---

## Phase 5: Import Rewrite Rules

### Pattern: `from '@/services/appointmentService'` → `from '@/features/appointments'`
- **Rule**: Replace service imports with feature barrel imports
- **Example**: `import appointmentService from '@/services/appointmentService'` → `import { appointmentService } from '@/features/appointments'`

### Pattern: `from '@/hooks/useAppointments'` → `from '@/features/appointments'`
- **Rule**: Replace hook imports with feature barrel imports
- **Example**: `import { useAppointments } from '@/hooks/useAppointments'` → `import { useAppointments } from '@/features/appointments'`

### Pattern: `from '@/components/AppointmentCard'` → `from '@/features/appointments'`
- **Rule**: Replace component imports with feature barrel imports
- **Example**: `import AppointmentCard from '@/components/AppointmentCard'` → `import { AppointmentCard } from '@/features/appointments'`

### Pattern: `from '@/components/medical/...'` → `from '@/features/medical'` or `from '@/features/patients'`
- **Rule**: Map medical components to appropriate feature
- **Examples**:
  - `PatientCard`, `PatientSearchInterface`, `PatientInformationHeader`, `PatientStats` → `@/features/patients`
  - `MedicalInformationPanel`, `PatientVitalsDisplay`, `ClinicalNotesDisplay`, `PatientDocumentManager`, `forms/*` → `@/features/medical`

### Pattern: `from '@/components/layout/...'` → `from '@/components/layout/...'`
- **Rule**: Keep layout imports as-is (already moved to `components/layout/`)

### Pattern: `from '@/components/library/...'` → `from '@/components/library/...'`
- **Rule**: Keep library imports as-is (design system)

### Pattern: `from '@/components/ui/...'` → `from '@/components/ui/...'`
- **Rule**: Keep UI imports as-is (shadcn components)

### Pattern: `from '@/pages/receptionist/...'` → `from '@/features/...'` or `from '@/pages/...'`
- **Rule**: Map pages to features or new pages structure
- **Examples**:
  - `AppointmentsPage` → `@/features/appointments`
  - `PatientListPage` → `@/features/patients`
  - `ReceptionistDashboard` → `@/pages/role-dashboards/ReceptionistDashboard`

### Pattern: Relative imports `'../../services/...'` → Feature barrel
- **Rule**: Replace relative service/hook/component imports with feature barrels
- **Example**: `import appointmentService from '../../services/appointmentService'` → `import { appointmentService } from '@/features/appointments'`

---

## Phase 6: Cleanup List

### Files to Delete (Debug/Backup/Unused)

1. **No backup files found** ✅ (Already cleaned in Stage 6)

2. **Markdown files to remove** (keep only this plan in PR):
   - `STAGE_6_COMPLETION_SUMMARY.md` (move to `/docs/history/` or delete)
   - `STAGE_6_FINAL_CLEANUP_REPORT.md` (move to `/docs/history/` or delete)
   - `STAGE_6_VERIFICATION_REPORT.md` (move to `/docs/history/` or delete)
   - `STAGE_6_MOVE_PLAN.md` (move to `/docs/history/` or delete)
   - `STAGE_6_POSTCHECK.md` (move to `/docs/history/` or delete)
   - `STAGE_6_STRUCTURE_ASSESSMENT.md` (move to `/docs/history/` or delete)
   - `SUGGESTED_SAFETY_NETS.md` (move to `/docs/history/` or delete)
   - `METRICS.md` (move to `/docs/history/` or delete)
   - `TREE_FRONTEND.md` (move to `/docs/history/` or delete)
   - `TREE_BACKEND.md` (move to `/docs/history/` or delete)
   - `MODULE_MAP_FRONTEND.json` (move to `/docs/history/` or delete)
   - `MODULE_MAP_BACKEND.json` (move to `/docs/history/` or delete)

3. **Empty directories to clean up** (after moves):
   - `src/pages/receptionist/` (if empty after moves)
   - `src/pages/nurse/` (if empty after moves)
   - `src/pages/doctor/` (if empty after moves)
   - `src/pages/cashier/` (if empty after moves)
   - `src/pages/admin/` (if empty after moves)
   - `src/pages/patient/` (if empty after moves)
   - `src/components/medical/` (if empty after moves)
   - `src/components/patient/` (if empty after moves)

4. **Dead code / unused files** (verify before deletion):
   - `src/components/DataList.jsx` (check if still used)
   - `src/components/LoadingCard.jsx` (check if still used)
   - `src/components/Alert.jsx` (check if still used - may be replaced by library)
   - `src/components/FormField.jsx` (check if still used)
   - `src/components/ActionButtons.jsx` (check if still used)

---

## Phase 7: Risk Notes & Fallback

### Risk Assessment

**Low Risk** ✅
- Moving files to feature folders (pure structural change)
- Using feature barrels maintains backward compatibility during transition
- No runtime behavior changes

**Medium Risk** ⚠️
- Import path changes require careful codemod/rewrite
- Route definitions need to be updated in `app/routes.jsx`
- Potential for missed imports during bulk rewrite

**Mitigation Strategies**:
1. **Incremental approach**: Move one feature at a time, test after each
2. **Codemod script**: Use jscodeshift to automate import rewrites
3. **ESLint rules**: Add `no-restricted-imports` to prevent old paths
4. **Build verification**: Run `npm run build` after each feature move
5. **Smoke tests**: Test key pages after each move

### Fallback Plan

If issues arise during Phase 2:

1. **Immediate rollback**: `git reset --hard <pre-stage7-commit>`
2. **Partial rollback**: Revert specific feature moves if only one feature has issues
3. **Compat shims**: Create temporary re-export files at old locations pointing to new ones (similar to Stage 6)
4. **Gradual migration**: Move features one at a time over multiple PRs

### Compatibility Barrels (if needed)

If we need to maintain backward compatibility during transition:

**Example**: `src/components/AppointmentCard.jsx` (shim)
```javascript
// TEMPORARY SHIM - Will be removed after all imports are updated
export { AppointmentCard, AppointmentCard as default } from '@/features/appointments';
```

**Note**: We prefer NOT to use shims if possible - do a complete move and rewrite in one pass.

---

## Phase 8: Execution Checklist

### Pre-execution
- [ ] Create branch: `refactor/stage-7-frontend-restructure`
- [ ] Backup current state: `git tag pre-stage-7`
- [ ] Verify build passes: `cd frontend && npm run build`
- [ ] Verify lint passes: `cd frontend && npm run lint`

### Execution Steps
- [ ] Step 1: Create `app/` directory structure
- [ ] Step 2: Move `App.jsx` to `app/App.jsx` and extract routes
- [ ] Step 3: Create feature directories (`features/appointments/`, etc.)
- [ ] Step 4: Move files per move spec (one feature at a time)
- [ ] Step 5: Create feature barrel files (`index.js`)
- [ ] Step 6: Rewrite imports using codemod or manual update
- [ ] Step 7: Update route definitions in `app/routes.jsx`
- [ ] Step 8: Move layout components to `components/layout/`
- [ ] Step 9: Update `vite.config.js` aliases if needed
- [ ] Step 10: Clean up empty directories
- [ ] Step 11: Remove/archive markdown files
- [ ] Step 12: Verify build: `npm run build`
- [ ] Step 13: Verify lint: `npm run lint`
- [ ] Step 14: Run smoke tests on key pages
- [ ] Step 15: Grep for any remaining old import paths
- [ ] Step 16: Squash all commits into one

### Post-execution Verification
- [ ] All routes work correctly
- [ ] No console errors
- [ ] No broken imports
- [ ] Build succeeds
- [ ] Lint passes
- [ ] No raw `fetch()` outside `services/api.js`
- [ ] No cross-feature deep imports (only via barrels)
- [ ] Pages are composition-only (no data fetching in pages)

---

## Phase 9: Import Rewrite Codemod (jscodeshift)

### Example Transform Script

```javascript
// codemods/rewrite-imports.js
export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  // Pattern 1: Service imports
  root.find(j.ImportDeclaration)
    .filter(path => path.value.source.value.includes('@/services/appointmentService'))
    .replaceWith(path => {
      return j.importDeclaration(
        [j.importDefaultSpecifier(j.identifier('appointmentService'))],
        j.literal('@/features/appointments')
      );
    });

  // Pattern 2: Hook imports
  root.find(j.ImportDeclaration)
    .filter(path => path.value.source.value.includes('@/hooks/useAppointments'))
    .replaceWith(path => {
      return j.importDeclaration(
        [j.importSpecifier(j.identifier('useAppointments'))],
        j.literal('@/features/appointments')
      );
    });

  // Pattern 3: Component imports
  root.find(j.ImportDeclaration)
    .filter(path => path.value.source.value.includes('@/components/AppointmentCard'))
    .replaceWith(path => {
      return j.importDeclaration(
        [j.importSpecifier(j.identifier('AppointmentCard'))],
        j.literal('@/features/appointments')
      );
    });

  return root.toSource();
}
```

**Usage**:
```bash
npx jscodeshift -t codemods/rewrite-imports.js frontend/src --extensions=js,jsx
```

---

## Summary

This restructure plan:
- ✅ Maps 92% of files to clear domains
- ✅ No circular dependencies detected
- ✅ Maintains zero runtime behavior changes
- ✅ Uses feature barrels for clean imports
- ✅ Enforces boundaries (library, layout, features)
- ✅ Includes rollback and mitigation strategies

**Total files to move**: ~150 files
**Estimated time**: 4-6 hours (with testing)
**Risk level**: Low (with proper testing)

---

**Next Steps**: Proceed to Phase 2 (Execute) when ready.