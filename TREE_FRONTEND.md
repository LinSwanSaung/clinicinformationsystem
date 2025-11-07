# Frontend Directory Tree

## Overview

React application using Vite, React Router, React Query, TailwindCSS, and shadcn/ui components. Path alias `@` maps to `src/`.

## Directory Structure (Depth ≤ 4)

```
frontend/
├── src/
│   ├── assets/                    # Static assets (images, icons)
│   │   └── react.svg
│   │
│   ├── components/                # React components (92 files)
│   │   ├── library/               # Reusable component library
│   │   │   ├── buttons/           # Button components (PdfDownloadButton)
│   │   │   ├── dashboard/         # Dashboard widgets (StatCard)
│   │   │   ├── DataTable/         # Table components (DataTable, TableToolbar, index)
│   │   │   ├── feedback/          # User feedback (LoadingSpinner, EmptyState, ErrorState, ConfirmDialog)
│   │   │   ├── forms/             # Form components (FormModal, FormCard, index)
│   │   │   ├── inputs/           # Input components (SearchBar)
│   │   │   ├── lists/            # List components (RecordListItem, index)
│   │   │   ├── modals/           # Modal components (PaymentDetailModal)
│   │   │   ├── status/           # Status indicators (StatusBadge, LinkedPatientBadge)
│   │   │   └── index.js          # Barrel export for library components
│   │   │
│   │   ├── medical/               # Medical domain components
│   │   │   ├── forms/             # Medical forms (AllergyForm, DiagnosisForm, DoctorNotesForm, MedicationForm, PrescriptionForm)
│   │   │   ├── ClinicalNotesDisplay.jsx
│   │   │   ├── MedicalInformationPanel.jsx
│   │   │   ├── PatientCard.jsx
│   │   │   ├── PatientDocumentManager.jsx
│   │   │   ├── PatientInformationHeader.jsx
│   │   │   ├── PatientSearchInterface.jsx
│   │   │   ├── PatientStats.jsx
│   │   │   ├── PatientVitalsDisplay.jsx
│   │   │   └── VisitHistoryCard.jsx
│   │   │
│   │   ├── patient/               # Patient portal components
│   │   │   ├── AIHealthBlog.jsx
│   │   │   ├── LatestVisitSummary.jsx
│   │   │   ├── PortalFiltersBar.jsx
│   │   │   ├── PortalSearchBar.jsx
│   │   │   ├── PortalSearchResults.jsx
│   │   │   ├── ProfileSummary.jsx
│   │   │   ├── UpcomingAppointments.jsx
│   │   │   ├── VitalsSnapshot.jsx
│   │   │   ├── VitalsSnapshot_ORIGINAL.jsx
│   │   │   └── VitalsSnapshot.jsx.backup
│   │   │
│   │   ├── ui/                    # shadcn/ui primitives
│   │   │   ├── alert.jsx
│   │   │   ├── badge.jsx
│   │   │   ├── button.jsx
│   │   │   ├── calendar.jsx
│   │   │   ├── card.jsx
│   │   │   ├── collapsible.jsx
│   │   │   ├── dialog.jsx
│   │   │   ├── dropdown-menu.jsx
│   │   │   ├── input.jsx
│   │   │   ├── label.jsx
│   │   │   ├── modal.jsx
│   │   │   ├── ModalComponent.jsx  # Legacy modal wrapper (being phased out)
│   │   │   ├── NavigationTabs.jsx
│   │   │   ├── popover.jsx
│   │   │   ├── SearchableSelect.jsx
│   │   │   ├── select.jsx
│   │   │   ├── separator.jsx
│   │   │   ├── skeleton.jsx
│   │   │   ├── table.jsx
│   │   │   ├── tabs.jsx
│   │   │   └── textarea.jsx
│   │   │
│   │   ├── ActionButtons.jsx
│   │   ├── Alert.jsx
│   │   ├── AppointmentCard.jsx
│   │   ├── AppointmentDetailModal.jsx
│   │   ├── AppointmentList.jsx
│   │   ├── AppointmentPatientCard.jsx
│   │   ├── AvailableDoctors.jsx
│   │   ├── Breadcrumbs.jsx
│   │   ├── DataList.jsx
│   │   ├── DataTable.jsx           # Legacy table (being replaced by library/DataTable)
│   │   ├── EmployeeCard.jsx
│   │   ├── EmptyState.jsx          # Legacy (being replaced by library/feedback/EmptyState)
│   │   ├── ErrorBoundary.jsx
│   │   ├── ErrorState.jsx          # Legacy (being replaced by library/feedback/ErrorState)
│   │   ├── FormField.jsx
│   │   ├── LanguageSwitcher.jsx
│   │   ├── LoadingCard.jsx
│   │   ├── LoadingState.jsx        # Legacy (being replaced by library/feedback/LoadingSpinner)
│   │   ├── Navbar.jsx
│   │   ├── NotificationBell.jsx
│   │   ├── PageHeader.jsx
│   │   ├── PageLayout.jsx
│   │   ├── PatientList.jsx
│   │   ├── QueueDoctorCard.jsx
│   │   ├── ReceptionistPatientCard.jsx
│   │   ├── SearchInput.jsx         # Legacy (being replaced by library/inputs/SearchBar)
│   │   ├── ServiceSelector.jsx
│   │   └── WalkInModal.jsx
│   │
│   ├── constants/                  # Application constants
│   │   ├── polling.js              # Polling interval constants
│   │   └── roles.js                # Role definitions (ROLES enum)
│   │
│   ├── contexts/                   # React contexts
│   │   └── AuthContext.jsx         # Authentication state management
│   │
│   ├── hooks/                      # Custom React hooks (10 files)
│   │   ├── useAppointments.js
│   │   ├── useCancelAppointment.js
│   │   ├── useCreateAppointment.js
│   │   ├── useInvoices.js
│   │   ├── usePatient.js
│   │   ├── usePatients.js
│   │   ├── usePrescriptions.js
│   │   ├── useUpdateAppointmentStatus.js
│   │   ├── useVisits.js
│   │   └── useVitals.js
│   │
│   ├── i18n/                       # Internationalization
│   │   ├── index.js                # i18next configuration
│   │   └── locales/
│   │       ├── en.json
│   │       └── my.json
│   │
│   ├── lib/                        # Utility libraries
│   │   └── utils.js                # Shared utilities (cn, etc.)
│   │
│   ├── pages/                      # Route pages (28 files)
│   │   ├── admin/                  # Admin role pages
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AuditLogs.jsx
│   │   │   ├── DoctorAvailability.jsx
│   │   │   ├── EmployeeManagement.jsx
│   │   │   ├── PatientAccountRegistration.jsx
│   │   │   ├── PaymentTransactions.jsx
│   │   │   └── PendingItems.jsx
│   │   │
│   │   ├── cashier/                # Cashier role pages
│   │   │   ├── CashierDashboard.jsx
│   │   │   └── InvoiceManagement.jsx
│   │   │
│   │   ├── doctor/                 # Doctor role pages
│   │   │   ├── DoctorDashboard.jsx
│   │   │   ├── PatientMedicalRecord.jsx
│   │   │   └── PatientMedicalRecordManagement.jsx
│   │   │
│   │   ├── nurse/                  # Nurse role pages
│   │   │   ├── ElectronicMedicalRecords.jsx
│   │   │   ├── NurseDashboard.jsx
│   │   │   └── NursePatientQueuePage.jsx
│   │   │
│   │   ├── patient/                # Patient portal pages
│   │   │   ├── PatientLiveQueue.jsx
│   │   │   ├── PatientMedicalRecords.jsx
│   │   │   └── PatientPortalDashboard.jsx
│   │   │
│   │   ├── receptionist/           # Receptionist role pages
│   │   │   ├── AppointmentsPage.jsx
│   │   │   ├── DoctorQueueDetailPage.jsx
│   │   │   ├── LiveQueuePage.jsx
│   │   │   ├── PatientDetailPage.jsx
│   │   │   ├── PatientListPage.jsx
│   │   │   ├── ReceptionistDashboard.jsx
│   │   │   └── RegisterPatient.jsx
│   │   │
│   │   ├── AdminLogin.jsx
│   │   ├── CashierDashboard.jsx   # Legacy duplicate (should be removed)
│   │   └── InvoiceDetailsPage.jsx
│   │
│   ├── schemas/                    # Validation schemas
│   │   └── index.js                # Zod schemas
│   │
│   ├── services/                   # API service layer (26 files)
│   │   ├── Admin.service.js
│   │   ├── allergyService.js
│   │   ├── api.js                  # Centralized API client (fetch wrapper, 401 handler, AbortController)
│   │   ├── appointmentService.js
│   │   ├── auditLogService.js
│   │   ├── authService.js
│   │   ├── clinicSettingsService.js
│   │   ├── diagnosisService.js
│   │   ├── doctorAvailabilityService.js
│   │   ├── doctorNotesService.js
│   │   ├── doctorService.js
│   │   ├── documentService.js
│   │   ├── employeeService.js
│   │   ├── invoiceService.js
│   │   ├── notificationService.js
│   │   ├── patientAccountService.js
│   │   ├── patientPortalService.js
│   │   ├── patientService.js
│   │   ├── paymentService.js
│   │   ├── prescriptionService.js
│   │   ├── queueService.js
│   │   ├── serviceService.js
│   │   ├── sessionGuard.js         # AbortController + 401 handler coordination
│   │   ├── userService.js
│   │   ├── visitService.js
│   │   └── vitalsService.js
│   │
│   ├── styles/                     # Global styles
│   │   ├── README.md
│   │   └── theme.css
│   │
│   ├── utils/                      # Utility functions
│   │   ├── appointmentConfig.js
│   │   ├── timeUtils.js
│   │   └── useDebounce.js          # Debounce hook (should be in hooks/)
│   │
│   ├── App.css
│   ├── App.jsx                     # Root component, routing, ProtectedRoute
│   ├── index.css                   # Global CSS
│   └── main.jsx                    # Entry point, React Query setup
│
├── dist/                           # Build output
├── public/                         # Public assets
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.cjs
├── tailwind.config.js
└── vite.config.js                  # Vite config with @ alias
```

## Key Observations

### Component Organization

- **Library components** (`components/library/`): Well-organized reusable components with barrel exports
- **Domain components** (`components/medical/`, `components/patient/`): Feature-specific components
- **UI primitives** (`components/ui/`): shadcn/ui components
- **Legacy components**: Several duplicate/legacy components at root level (EmptyState, ErrorState, LoadingState, DataTable, SearchInput, ModalComponent)

### Service Layer

- All API calls go through `services/api.js` (centralized fetch wrapper)
- 26 service files, one per domain (patient, visit, invoice, etc.)
- `sessionGuard.js` coordinates AbortController and 401 handling

### Pages Structure

- Role-based organization (`admin/`, `doctor/`, `nurse/`, `cashier/`, `receptionist/`, `patient/`)
- One legacy duplicate: `CashierDashboard.jsx` at root (should use `cashier/CashierDashboard.jsx`)

### Hooks

- 10 custom hooks, all domain-specific (useAppointments, useVisits, etc.)
- `useDebounce.js` is in `utils/` but should be in `hooks/`

### Constants & Config

- `constants/roles.js`: Role definitions
- `constants/polling.js`: Polling intervals
- Path alias `@` → `src/` configured in `vite.config.js`
