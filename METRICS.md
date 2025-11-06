# Code Metrics & Analysis

## Overview

This document provides quantitative metrics for the frontend and backend codebases, including file counts, line counts, large files, duplication patterns, and dependency analysis.

---

## Frontend Metrics

### File Counts

- **Total JSX/JS files**: ~166 files (118 JSX + 48 JS)
- **Components**: 92 files
- **Pages**: 28 files
- **Services**: 26 files
- **Hooks**: 10 files
- **Barrel exports (index.js)**: 4 files
  - `components/library/index.js`
  - `components/library/DataTable/index.js`
  - `components/library/forms/index.js`
  - `components/library/lists/index.js`

### Lines of Code (Estimated)

Based on file analysis and refactor-map.md:

| Folder        | Estimated LOC | File Count |
| ------------- | ------------- | ---------- |
| `pages/`      | ~15,000       | 28         |
| `components/` | ~20,000       | 92         |
| `services/`   | ~3,000        | 26         |
| `hooks/`      | ~1,500        | 10         |
| `utils/`      | ~300          | 3          |
| `contexts/`   | ~200          | 1          |
| **Total**     | **~40,000**   | **166**    |

### Large Files (>400 lines)

Based on refactor-map.md and codebase analysis:

1. **`pages/cashier/CashierDashboard.jsx`** - **~2,253 lines** ⚠️
   - Multiple responsibilities: invoice viewing, payment processing, history tracking
   - Embedded service logic, complex state management

2. **`pages/receptionist/AppointmentsPage.jsx`** - **~1,331 lines**
   - Appointment booking, rescheduling, status management, slot checking

3. **`pages/doctor/PatientMedicalRecord.jsx`** - **~1,000 lines**
   - Patient medical record management, tabs, forms, document handling

4. **`pages/nurse/NurseDashboard.jsx`** - **~926 lines**
   - Queue management, vitals entry, patient list

5. **`pages/doctor/DoctorDashboard.jsx`** - **~796 lines**
   - Queue management, consultation flow, patient records

6. **`components/WalkInModal.jsx`** - **~829 lines**
   - Walk-in patient registration modal

### Duplication Hotspots

#### 1. **Patient Card Components** (4+ variants)

- `ReceptionistPatientCard.jsx`
- `PatientCard.jsx` (medical context)
- `AppointmentPatientCard.jsx`
- `QueueDoctorCard.jsx`
- **Pattern**: All fetch patient data, display demographics + medical summary

#### 2. **Legacy Components** (being phased out)

- `components/EmptyState.jsx` → `components/library/feedback/EmptyState.jsx`
- `components/ErrorState.jsx` → `components/library/feedback/ErrorState.jsx`
- `components/LoadingState.jsx` → `components/library/feedback/LoadingSpinner.jsx`
- `components/DataTable.jsx` → `components/library/DataTable/DataTable.jsx`
- `components/SearchInput.jsx` → `components/library/inputs/SearchBar.jsx`
- `components/ui/ModalComponent.jsx` → `components/library/forms/FormModal.jsx`

#### 3. **Duplicate Pages**

- `pages/CashierDashboard.jsx` (legacy) vs `pages/cashier/CashierDashboard.jsx` (active)

### Import Patterns

- **Total import statements**: ~826 across 158 files
- **Barrel exports used**: 4 barrel files
- **Deep imports**: Common pattern (e.g., `@/components/library/forms/FormModal`)
- **Path alias usage**: `@` alias configured in `vite.config.js` → `src/`

### Circular Dependencies

No obvious circular dependencies detected in import analysis. All imports follow a clear hierarchy:

- Pages → Components → Services → API
- Components → Library Components → UI Primitives

---

## Backend Metrics

### File Counts

- **Total JS files**: ~87 files
- **Routes**: 23 files
- **Services**: 28 files (including 7 repositories)
- **Models**: 17 files
- **Middleware**: 5 files
- **Validators**: 4 files
- **Utils**: 4 files
- **Barrel exports**: 0 files (no barrel exports in backend)

### Lines of Code (Estimated)

Based on file analysis and refactor-map.md:

| Folder        | Estimated LOC | File Count |
| ------------- | ------------- | ---------- |
| `services/`   | ~12,000       | 28         |
| `routes/`     | ~3,000        | 23         |
| `models/`     | ~2,500        | 17         |
| `middleware/` | ~800          | 5          |
| `validators/` | ~600          | 4          |
| `utils/`      | ~400          | 4          |
| **Total**     | **~19,300**   | **87**     |

### Large Files (>400 lines)

1. **`services/Queue.service.js`** - **~1,400 lines** ⚠️
   - Token lifecycle, queue operations, consultation management
   - Multiple responsibilities: token creation, queue state, consultation flow

2. **`services/Visit.service.js`** - **~1,000 lines** ⚠️
   - Visit CRUD, EMR aggregation, PDF generation
   - Multiple responsibilities: visit management, EMR assembly, PDF creation

3. **`services/Invoice.service.js`** - **~400+ lines**
   - Invoice lifecycle, payment processing

### Duplication Hotspots

#### 1. **Repository Pattern Inconsistency**

- Some services use repositories (`services/repositories/`): 7 repos
- Other services use models directly
- **Pattern**: Mixed approach - not all services have repositories

#### 2. **Schema Fragmentation**

- `database/schema.sql` (main, 2,200+ lines)
- `database/v2schema.sql` (legacy)
- `database/migrations/` (31 SQL files, some duplicate numbering)
- **Issue**: No single source of truth for schema

#### 3. **Migration Numbering Duplicates**

- Multiple `002_*` migrations (7 files)
- Multiple `003_*` migrations (4 files)
- Multiple `004_*` migrations (4 files)
- **Issue**: Migration numbering is not sequential/unique

### Import Patterns

- **Total import statements**: ~277 across 80 files
- **Barrel exports**: 0 (no barrel exports in backend)
- **Deep imports**: Common pattern (e.g., `../models/Patient.model.js`)
- **Dependency flow**: Routes → Services → Models/Repositories

### Circular Dependencies

No obvious circular dependencies detected. Clear layering:

- Routes → Services → Models/Repositories
- Services → Utils → Config
- Middleware → Services (for auth checks)

---

## Cross-Cutting Concerns

### Shared Constants

- **Frontend**: `constants/roles.js`, `constants/polling.js`
- **Backend**: `constants/roles.js`
- **Issue**: Role definitions duplicated (should be shared or synced)

### API Service Layer

- **Frontend**: All API calls go through `services/api.js` (centralized)
- **Backend**: Routes delegate to services
- **Pattern**: Clean separation, no direct Supabase calls in frontend components

### Error Handling

- **Frontend**: Error handling in `services/api.js` (401 handler, AbortController)
- **Backend**: Centralized in `middleware/errorHandler.js` (ApplicationError support)

---

## Code Quality Indicators

### Positive Patterns

1. ✅ **Centralized API client** (`frontend/src/services/api.js`)
2. ✅ **Clear layering** (routes → services → models)
3. ✅ **Reusable component library** (`components/library/`)
4. ✅ **Custom hooks** for data fetching
5. ✅ **Structured errors** (`ApplicationError` class)
6. ✅ **Transaction support** (`TransactionRunner`)

### Areas for Improvement

1. ⚠️ **Large files** (>1,000 lines): 5 frontend, 2 backend
2. ⚠️ **Legacy components**: 6 duplicate/legacy components in frontend
3. ⚠️ **Schema fragmentation**: 3 schema sources (schema.sql, v2schema.sql, migrations)
4. ⚠️ **Migration numbering**: Duplicate numbering in migration files
5. ⚠️ **Repository pattern**: Inconsistent use (some services use repos, others use models directly)
6. ⚠️ **Role constants**: Duplicated between frontend and backend

---

## Dependency Analysis

### Frontend Dependencies

- **React**: 19.1.0
- **React Router**: 7.6.3
- **React Query**: 5.59.0
- **TailwindCSS**: Via PostCSS
- **shadcn/ui**: UI component library
- **i18next**: Internationalization

### Backend Dependencies

- **Express**: 4.18.2
- **Supabase**: 2.39.7 (PostgreSQL client)
- **JWT**: 9.0.2
- **node-cron**: 3.0.3 (scheduled jobs)
- **OpenAI**: 6.7.0 (AI integration)

### External Services

- **Supabase**: Database + Auth
- **OpenAI**: AI health blog generation

---

## Recommendations

### High Priority

1. **Split large files**: Queue.service.js, Visit.service.js, CashierDashboard.jsx, AppointmentsPage.jsx
2. **Remove legacy components**: Delete duplicate/legacy components once migration is complete
3. **Consolidate schemas**: Merge v2schema.sql into schema.sql, document migration history
4. **Fix migration numbering**: Rename migrations to be sequential (001-031)

### Medium Priority

1. **Standardize repository pattern**: Either use repos everywhere or remove them
2. **Share role constants**: Create shared package or sync mechanism
3. **Move useDebounce**: Move `utils/useDebounce.js` to `hooks/useDebounce.js`

### Low Priority

1. **Add barrel exports to backend**: Consider adding index.js files for services/models if beneficial
2. **Document import patterns**: Add ESLint rules to enforce import patterns
