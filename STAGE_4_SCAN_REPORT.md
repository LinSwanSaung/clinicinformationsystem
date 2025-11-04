# Stage 4: Repo Scan & Component Gap Analysis (Updated)

## 1. Current Library Status

### ✅ Already in Library (`frontend/src/components/library/`)

- **LoadingSpinner** (`feedback/LoadingSpinner.jsx`) - ✅ In use
- **StatusBadge** (`status/StatusBadge.jsx`) - ✅ In use
- **StatCard** (`dashboard/StatCard.jsx`) - ✅ Available
- **SearchBar** (`inputs/SearchBar.jsx`) - ✅ In use
- **DataTable** (`DataTable/DataTable.jsx`) - ✅ In use (PendingItems, AuditLogs)
- **FormModal** (`forms/FormModal.jsx`) - ✅ Available
- **FormCard** (`forms/FormCard.jsx`) - ✅ Available
- **RecordListItem** (`lists/RecordListItem.jsx`) - ✅ Available
- **EmptyState** (`feedback/EmptyState.jsx`) - ✅ Available
- **ErrorState** (`feedback/ErrorState.jsx`) - ✅ Available
- **ConfirmDialog** (`feedback/ConfirmDialog.jsx`) - ✅ Available

## 2. Pages Already Refactored

- ✅ **PendingItems.jsx** - Uses DataTable, LoadingSpinner, StatusBadge
- ✅ **AuditLogs.jsx** - Uses DataTable, StatusBadge

## 3. Refactoring Targets (Low-Risk, High-Impact)

### Target 1: PatientAccountRegistration.jsx (~1049 lines)

**Current State:**

- Manual Table implementation (lines 571-601)
- Loading/empty states inline (lines 584-595)
- Three Dialog modals: Create (line 605), Edit (line 653), Bind (line 705)
- Uses Badge for Linked/Unlinked status (lines 488-499)

**Refactoring Plan:**

- Replace Table → DataTable kit
- Replace Dialog modals → FormModal (3 instances)
- Keep existing state management (`accounts`, `loading`, `searchTerm`, modal states)
- Use StatusBadge for Linked/Unlinked badges

**Props Mapping:**

```jsx
// DataTable columns
columns: [
  { key: 'name', label: 'Name', render: (_, row) => `${row.first_name} ${row.last_name}` },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone', render: (_, row) => row.phone || 'Not provided' },
  { key: 'linked', label: 'Linked Patient', render: (_, row) => <LinkedPatientBadge account={row} /> },
  { key: 'lastLogin', label: 'Last Login', render: (_, row) => formatLastLogin(row.last_login) },
  { key: 'actions', label: 'Actions', render: (_, row) => <ActionButtons account={row} /> }
]
data: accounts (filtered by searchTerm)
isLoading: loading
emptyText: "No patient accounts found."

// FormModal instances
1. Create Account Modal: isOpen={isCreateDialogOpen}, onSubmit={handleCreateAccount}
2. Edit Account Modal: isOpen={isEditDialogOpen}, onSubmit={handleUpdateAccount}
3. Bind Account Modal: isOpen={isBindDialogOpen}, onSubmit={handleBindAccount}
```

**Risk:** Medium (multiple modals, form state management)
**State Changes:** None - modals already isolated

### Target 2: EmployeeManagement.jsx (~784 lines)

**Current State:**

- Already uses SearchBar, LoadingSpinner, StatusBadge ✅
- Uses Card grid view (not table) - lines 651-720
- Add/Edit forms are inline Card components (not modals) - lines 156-338, 339-523

**Option A:** Keep card grid (current UX is appropriate for employee cards)
**Option B:** Add table view toggle (would require more changes)

**Recommendation:** Skip for now - card grid is appropriate for this use case

### Target 3: PaymentTransactions.jsx (~452 lines)

**Current State:**

- Manual Table (needs verification)
- Custom pagination logic
- Filter state management
- Invoice view modal

**Needs:** Detailed scan to determine refactoring approach
**Risk:** Medium-High (complex pagination, filters)

### Target 4: AdminDashboard.jsx (~280 lines)

**Current State:**

- Uses Card components for stats (lines 264-277)
- Could use StatCard from library

**Refactoring Plan:**

- Replace Card stat blocks → StatCard component
- Keep state management identical

**Props Mapping:**

```jsx
statsCards.map((stat) => (
  <StatCard
    title={stat.title}
    value={stat.value}
    helperText={stat.description}
    icon={stat.icon}
  />
));
```

**Risk:** Very Low
**State Changes:** None

## 4. Component Gap Analysis

### Missing Components Needed

1. **TableToolbar** (optional)
   - Found in: Multiple pages with search + filters + actions
   - Pattern: SearchBar + filter selects + action buttons row
   - Priority: Low (can be ad-hoc for now)

2. **LinkedPatientBadge** (domain-specific)
   - Found in: PatientAccountRegistration
   - Could use StatusBadge with custom mapping
   - Priority: Low (inline render function works)

## 5. Implementation Priority

### Phase 1: Low-Risk Refactors (Do Now)

1. ✅ **AdminDashboard.jsx** → Use StatCard (very low risk)
2. ✅ **PatientAccountRegistration.jsx** → Use DataTable + FormModal (medium risk, high impact)

### Phase 2: Medium-Risk Refactors (After Phase 1)

3. **PaymentTransactions.jsx** → Scan and refactor if feasible
4. **DoctorMedicalRecord pages** → Use FormCard for form sections

## 6. Guardrails Verification

- ✅ No UI-level Supabase imports (ESLint rule `no-restricted-imports` enforced)
- ✅ No unconditional `refetch()` - pages use hooks properly
- ✅ No data mirroring - pages use React Query hooks directly
- ✅ Stable query keys - using centralized hooks (`usePatients`, `useAppointments`, etc.)
- ✅ Controlled inputs - all inputs use `value` + `onChange` handlers
- ✅ ARIA - Need to verify on new components (DataTable, FormModal have ARIA)

## 7. Manual QA Checklist Template

For each refactored page:

1. **Functionality**:
   - Verify all CRUD operations work (create, edit, delete, bind/unbind)
   - Verify search/filter functionality
   - Verify pagination (if applicable)
2. **Visual**:
   - Verify styling matches previous appearance
   - Verify responsive behavior
3. **Accessibility**:
   - Tab through interactive elements
   - Verify screen reader compatibility (ARIA labels)
   - Verify keyboard navigation
4. **Performance**:
   - Check loading states appear correctly
   - Verify no unnecessary re-renders
   - Check form submission handling
