# Stage 6 Structure Consolidation - Move Plan

## Summary

This document tracks all file moves, renames, and shims created during Stage 6 structure consolidation.

## File Moves

### 1. useDebounce.js

- **From**: `frontend/src/utils/useDebounce.js`
- **To**: `frontend/src/hooks/useDebounce.js`
- **Reason**: Hooks belong in `hooks/` directory, not `utils/`
- **Shim**: Created at old location pointing to new location
- **Status**: ✅ Moved, shim created, imports updated (7 files)

## File Deletions

### 1. CashierDashboard.jsx (legacy duplicate)

- **File**: `frontend/src/pages/CashierDashboard.jsx`
- **Reason**: Duplicate of `pages/cashier/CashierDashboard.jsx`
- **Status**: ✅ Deleted (no imports found)

## Legacy Component Shims

All legacy components have been replaced with shims pointing to library versions:

### 1. EmptyState.jsx

- **Old**: `frontend/src/components/EmptyState.jsx`
- **New**: `frontend/src/components/library/feedback/EmptyState.jsx`
- **Shim**: ✅ Created
- **Imports Updated**: Pending (shim still in use)

### 2. ErrorState.jsx

- **Old**: `frontend/src/components/ErrorState.jsx`
- **New**: `frontend/src/components/library/feedback/ErrorState.jsx`
- **Shim**: ✅ Created
- **Imports Updated**: ✅ 4 files updated (ProfileSummary, UpcomingAppointments, LatestVisitSummary, VitalsSnapshot)

### 3. LoadingState.jsx

- **Old**: `frontend/src/components/LoadingState.jsx`
- **New**: `frontend/src/components/library/feedback/LoadingSpinner.jsx`
- **Shim**: ✅ Created
- **Imports Updated**: Pending (shim still in use)

### 4. DataTable.jsx

- **Old**: `frontend/src/components/DataTable.jsx`
- **New**: `frontend/src/components/library/DataTable/DataTable.jsx`
- **Shim**: ✅ Created
- **Imports Updated**: Pending (shim still in use)

### 5. SearchInput.jsx

- **Old**: `frontend/src/components/SearchInput.jsx`
- **New**: `frontend/src/components/library/inputs/SearchBar.jsx`
- **Shim**: ✅ Created
- **Imports Updated**: Pending (shim still in use)

### 6. ModalComponent.jsx

- **Old**: `frontend/src/components/ui/ModalComponent.jsx`
- **New**: `frontend/src/components/library/forms/FormModal.jsx`
- **Shim**: ✅ Created
- **Imports Updated**: Pending (shim still in use)

## Import Updates

### useDebounce (✅ Complete)

- ✅ `pages/receptionist/ReceptionistDashboard.jsx`
- ✅ `pages/receptionist/LiveQueuePage.jsx`
- ✅ `pages/nurse/NursePatientQueuePage.jsx`
- ✅ `pages/admin/PatientAccountRegistration.jsx`
- ✅ `pages/cashier/CashierDashboard.jsx`
- ✅ `pages/admin/EmployeeManagement.jsx`
- ✅ `components/WalkInModal.jsx`

### ErrorState (✅ Complete)

- ✅ `components/patient/ProfileSummary.jsx`
- ✅ `components/patient/UpcomingAppointments.jsx`
- ✅ `components/patient/LatestVisitSummary.jsx`
- ✅ `components/patient/VitalsSnapshot.jsx`

### Remaining Legacy Component Imports

- **EmptyState**: Still using shim (no direct imports found, may be used via DataTable shim)
- **LoadingState**: Still using shim (no direct imports found)
- **DataTable**: Still using shim (may have indirect usage)
- **SearchInput**: Still using shim (no direct imports found)
- **ModalComponent**: Still using shim (no direct imports found)

## Shim Removal Plan

Shims can be removed once:

1. All imports are updated to use library versions
2. Build passes without errors
3. No runtime errors observed

**Note**: Some shims may remain temporarily if they're used indirectly (e.g., DataTable shim may be used by other components).

## Diffstat

```
frontend/src/
  components/
    EmptyState.jsx          (shim created, 3 lines)
    ErrorState.jsx          (shim created, 3 lines)
    LoadingState.jsx        (shim created, 3 lines)
    DataTable.jsx           (shim created, 3 lines)
    SearchInput.jsx         (shim created, 3 lines)
    ui/
      ModalComponent.jsx    (shim created, 3 lines)
  hooks/
    useDebounce.js          (moved from utils/, 13 lines)
  pages/
    CashierDashboard.jsx    (deleted, 251 lines)
  utils/
    useDebounce.js          (shim created, 2 lines)
```

## Next Steps

1. ✅ Step 0: Path aliases and ESLint guardrails
2. ✅ Step 1: Create shims
3. ✅ Step 2: Move useDebounce, remove legacy CashierDashboard
4. 🔄 Step 3: Update imports (in progress)
   - ✅ useDebounce imports (7 files)
   - ✅ ErrorState imports (4 files)
   - ⏳ Remaining legacy component imports (if any)
5. ⏳ Step 4: Remove shims (after all imports updated)
6. ⏳ Step 5: Create deliverables (MOVE_PLAN, POSTCHECK, ROLLBACK)
