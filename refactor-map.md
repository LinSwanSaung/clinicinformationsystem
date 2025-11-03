# Refactor Map - RealCIS Technical Debt Inventory

**Generated:** Stage 1 - Guardrails & Inventory  
**Purpose:** Comprehensive audit of code patterns requiring refactoring

---

## 📊 Summary Statistics

- **Total Source Files**: 190+ (frontend: 130+, backend: 60+)
- **Large Files (>500 lines)**: 33 files
- **Largest File**: `CashierDashboard.jsx` (2,253 lines)
- **Console.log/error Violations**: 200+ instances
- **Database Tables**: 20+ main tables
- **Migration Files**: 26+ separate migrations

---

## 🔴 Critical Issues

### 1. **Massive Page Components (>1000 lines)**

#### Frontend - Dashboards

- `frontend/src/pages/cashier/CashierDashboard.jsx` - **2,253 lines** ⚠️
  - Multiple responsibilities: invoice viewing, payment processing, history tracking
  - Embedded service logic, complex state management
  - **Recommendation**: Split into CashierLayout + InvoiceList + PaymentForm + InvoiceHistory

- `frontend/src/pages/receptionist/AppointmentsPage.jsx` - **1,331 lines**
  - Appointment booking, rescheduling, status management, slot checking
  - **Recommendation**: Extract AppointmentBookingForm, AppointmentList, TimeSlotPicker

- `frontend/src/pages/nurse/NurseDashboard.jsx` - **926 lines**
  - Queue management, vitals entry, patient list
  - **Recommendation**: Extract QueueOverview, VitalsEntryModal, PatientQueueCard

- `frontend/src/pages/doctor/DoctorDashboard.jsx` - **796 lines**
  - Queue management, consultation flow, patient records
  - **Recommendation**: Extract ConsultationPanel, QueueManager, PatientQuickView

#### Backend - Services

- `backend/src/services/Queue.service.js` - **1,237 lines**
  - Token lifecycle, queue operations, consultation management
  - **Recommendation**: Split into QueueTokenService, ConsultationService, QueueStateService

- `backend/src/services/Visit.service.js` - **1,068 lines**
  - Visit CRUD, EMR aggregation, PDF generation
  - **Recommendation**: Extract VisitRepository, EMRService, PDFGenerationService

---

## 🟡 Code Duplication Patterns

### Duplicate UI Components

#### 1. **Patient Information Cards** (4+ variants)

- `ReceptionistPatientCard.jsx` (basic info)
- `PatientCard.jsx` (medical context)
- `AppointmentPatientCard.jsx` (appointment context)
- `QueueDoctorCard.jsx` (queue context)

**Pattern**: All fetch patient data, display demographics + medical summary
**Recommendation**: Create unified `<PatientInfoCard />` with context prop

#### 2. **Data Tables** (3+ implementations)

- `DataTable.jsx` (generic)
- Custom tables in `EmployeeManagement.jsx`
- Custom tables in `PatientListPage.jsx`
- Custom tables in `InvoiceManagement.jsx`

**Pattern**: Sorting, filtering, pagination logic repeated
**Recommendation**: Single `<DataTable />` component with config object

#### 3. **Modal/Dialog Wrappers** (5+ patterns)

- `WalkInModal.jsx` (829 lines!)
- `AppointmentDetailModal.jsx`
- `ModalComponent.jsx` (generic)
- `ServiceSelector.jsx` (modal-like)
- Inline modals in CashierDashboard

**Pattern**: Similar open/close state, form handling, validation
**Recommendation**: Unified `<FormModal />` with render props or slots

#### 4. **Status Badges** (scattered across 10+ files)

```jsx
// Repeated pattern:
<Badge variant={status === "active" ? "success" : "secondary"}>{status}</Badge>
```

**Recommendation**: `<StatusBadge type="appointment|invoice|queue" value={status} />`

---

## 🟠 Repeated Fetch Logic (No Shared Hooks)

### Pattern: Direct API Calls in Components

**Examples** (150+ instances):

```jsx
// ❌ Repeated in 30+ components
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    try {
      const response = await someService.getData();
      setData(response);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, []);
```

### Recommended Fix: Shared Hooks

**Create**: `frontend/src/hooks/`

- `useApi.js` - Generic data fetching with loading/error states
- `usePatients.js` - Patient-specific operations
- `useQueue.js` - Queue/token management
- `useInvoices.js` - Billing operations
- `useAppointments.js` - Appointment booking/management

**Example**:

```jsx
// ✅ After refactor
const {
  data: patients,
  loading,
  error,
  refetch,
} = usePatients({ status: "active" });
```

---

## 🔵 Direct Supabase/Database Calls in Components

### Pattern: Service Layer Bypassed

**Found in**:

- ❌ `PatientDetailPage.jsx` - Direct API calls instead of using patientService
- ❌ `AppointmentsPage.jsx` - Inline appointment creation logic
- ❌ `InvoiceDetailsPage.jsx` - Direct invoice manipulation

**Backend Pattern**: Inconsistent use of BaseModel abstraction

**Files**: 15+ components call services directly without abstraction

**Recommendation**:

1. All DB access through service layer (backend)
2. All API calls through service modules (frontend)
3. No inline `fetch()` or `api.post()` in components

---

## 🟣 Architecture Issues

### 1. **Mixed Concerns in Services**

`appointmentService.js`:

- Appointment CRUD ✅
- Doctor availability checking ❌ (should be doctorService)
- Queue token creation ❌ (should be queueService)

### 2. **State Management Gaps**

**No Global State** for:

- Current user/auth (using localStorage directly in 10+ places)
- Active notifications (refetched in each component)
- Queue polling state (multiple intervals running)

**Recommendation**: Consider Zustand or Context API for:

- `useAuthStore`
- `useNotificationStore`
- `useQueueStore` (with real-time subscriptions)

### 3. **Prop Drilling** (5-7 levels deep)

**Example Path**:

```
ReceptionistDashboard
  → AppointmentList
    → AppointmentCard
      → ActionButtons
        → StatusUpdateModal
          → StatusSelector
```

**Passes**: `onUpdate`, `doctorId`, `settings`, `permissions` through all levels

**Recommendation**: Context API or composition pattern

---

## 🗄️ Database Schema Issues

### 1. **Multiple Schema Sources** ⚠️

- `backend/database/schema.sql` (2,258 lines - "main")
- `backend/database/v2schema.sql` (364 lines - "v2 additions")
- 26+ migration files with overlapping changes

**Problems**:

- No single source of truth
- Duplicate table definitions (e.g., `payment_transactions` appears 3 times)
- Conflicting column additions
- RLS policies scattered

**Recommendation**:

- Consolidate into SINGLE `schema.sql` baseline
- Document current production state
- Future changes via migrations only

### 2. **Migration File Chaos**

**Naming Inconsistencies**:

- `001_emr_enhancements.sql`
- `002_add_admin_override_columns.sql`
- `002_add_cashier_pharmacist_roles.sql` ⚠️ (duplicate prefix)
- `002_add_delayed_status.sql` ⚠️
- `002_payment_holds.sql` ⚠️
- `002_quick_fix.sql` ⚠️

**Recommendation**: Rename with timestamp prefix `YYYYMMDDHHMMSS_description.sql`

### 3. **Table Fragmentation**

**Examples**:

- `patients` table has both structured columns AND text fields (`allergies TEXT`, `medical_conditions TEXT`)
- `patient_allergies` table exists separately
- **Inconsistent**: Some data normalized, some not

**Recommendation**: Full normalization or full denormalization strategy

---

## 📝 Code Quality Issues

### 1. **Console.log Pollution** (200+ violations)

**Top Offenders**:

- `queueService.js` - 20+ console.log statements
- `DoctorDashboard.jsx` - 30+ debug logs
- `ReceptionistDashboard.jsx` - 25+ logs
- `AppointmentsPage.jsx` - 20+ logs

**Current Setup**: `no-console: 'error'` in new ESLint config

**Action**: Will fail on next commit - needs cleanup

### 2. **Missing Error Boundaries**

Only 1 ErrorBoundary component exists (`ErrorBoundary.jsx`)

**Not Wrapped**:

- Dashboard routes
- Form submission flows
- API-heavy components

### 3. **No PropTypes or JSDoc** (JavaScript project)

**Impact**: Hard to understand component APIs without TypeScript

**Recommendation**: Add JSDoc comments to all exported components/functions

---

## 🔧 Services Layer Issues

### Inconsistent Return Patterns

**Pattern 1** (some services):

```js
return { success: true, data: result };
```

**Pattern 2** (other services):

```js
return result; // no wrapper
```

**Pattern 3** (error handling):

```js
throw new Error(message); // some do this
return { success: false, error }; // others do this
```

**Recommendation**: Standardize on:

```js
// Success
return { data, meta: { total, page } };

// Error
throw new ApiError(message, statusCode);
```

### Missing Service Methods

**Gaps Found**:

- No `patientService.searchByMultipleCriteria()`
- No `appointmentService.bulkReschedule()`
- No `queueService.estimateWaitTime()`
- No `invoiceService.generateStatement()`

---

## 📦 Component Organization

### Current Structure:

```
frontend/src/
  components/       # Mixed: shared + page-specific
    medical/        # Medical record forms
    patient/        # Patient portal widgets
    ui/             # shadcn components
  pages/
    admin/
    doctor/
    nurse/
    receptionist/
    cashier/
    patient/
```

### Issues:

- No `shared/` or `common/` folder
- UI components mixed with feature components
- No `layouts/` folder (layouts embedded in pages)
- No `features/` modular structure

### Recommended Structure:

```
frontend/src/
  components/
    shared/         # <PatientCard>, <DataTable>, <StatusBadge>
    forms/          # <PatientForm>, <AppointmentForm>
    ui/             # shadcn only
  features/
    appointments/   # appointment-specific logic + components
    queue/
    billing/
    emr/
  layouts/
    AdminLayout
    DoctorLayout
    PatientLayout
  hooks/            # Custom hooks
  pages/            # Thin route components only
```

---

## 🎨 Style/CSS Issues

### TailwindCSS Usage

**Violations** (manual audit needed):

- Inconsistent spacing (mix of `p-4` and `px-6 py-4`)
- Color inconsistency (`bg-blue-600` vs `bg-primary`)
- Repeated complex utility strings (10+ classes)

**Recommendation**:

- Define design tokens in `tailwind.config.js`
- Create utility component wrappers for common patterns
- Use `@apply` for frequently repeated class combinations

---

## 🧪 Testing Gaps

### Current State:

- Jest configured in backend ✅
- **Zero test files** in frontend ❌
- No integration tests
- No E2E tests

### Needed:

- Unit tests for services (frontend + backend)
- Component tests (React Testing Library)
- API endpoint tests (Supertest)
- Critical flow E2E tests (Playwright/Cypress)

---

## 🚨 Risky/Fragile Code

### 1. **Hardcoded Magic Numbers**

```jsx
// Found in 20+ files:
duration_minutes: 10; // should be from clinic settings
lateThreshold: 10; // should be configurable
maxTokensPerDoctor: 50; // arbitrary limit
```

### 2. **String-Based Status Matching**

```jsx
// ❌ Brittle
if (status === 'ready_for_doctor') { ... }

// ✅ Should be
import { APPOINTMENT_STATUS } from '@/constants';
if (status === APPOINTMENT_STATUS.READY_FOR_DOCTOR) { ... }
```

### 3. **Unsafe Type Coercion**

```jsx
// Found in queue logic:
parseInt(tokenNumber); // no radix, no null check
```

### 4. **Race Conditions**

**Queue Management**:

- Multiple components polling same endpoint
- No optimistic UI updates
- Stale state when rapid actions occur

---

## 📋 Next Steps (Prioritized)

### Phase 1 - Foundation (Week 1)

1. ✅ Add ESLint/Prettier/Husky (DONE - Stage 1)
2. Clean up console.log violations (automated fix)
3. Create shared hooks (`useApi`, `useAuth`)
4. Consolidate database schema into single baseline

### Phase 2 - Component Refactor (Week 2-3)

1. Extract reusable components from large files
2. Create `<PatientCard />` family with variants
3. Build unified `<DataTable />` component
4. Add ErrorBoundary wrappers

### Phase 3 - Service Layer (Week 3-4)

1. Standardize service return patterns
2. Add missing service methods
3. Create backend service base class
4. Implement proper error handling

### Phase 4 - Architecture (Week 4-5)

1. Implement feature-based structure
2. Add global state management
3. Remove prop drilling with Context API
4. Normalize database or document denormalization strategy

### Phase 5 - Quality (Week 5-6)

1. Add unit tests (>50% coverage goal)
2. Add component tests for critical paths
3. Setup E2E tests for user flows
4. Performance audit and optimization

---

## 📊 Metrics Baseline (for tracking improvement)

| Metric               | Current   | Target     |
| -------------------- | --------- | ---------- |
| Files > 500 lines    | 33        | <10        |
| Console violations   | 200+      | 0          |
| Duplicate code (est) | ~30%      | <10%       |
| Test coverage        | 0%        | >70%       |
| Average file size    | 350 lines | <250 lines |
| Shared components    | ~15       | >50        |

---

**Notes**:

- This is a living document - update after each refactor stage
- Use `git blame` to identify authors for knowledge transfer
- Schedule code reviews for high-risk areas before changes
