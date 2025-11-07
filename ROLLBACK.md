# Stage 6 Structure Consolidation - Rollback Plan

## Immediate Rollback

If critical issues are discovered, rollback using:

```bash
git revert <commit-hash>
```

### Commits to Revert (in reverse order)
1. `abc0933` - STAGE_6_MOVE_PLAN.md
2. `cd1bffc` - Update ErrorState imports
3. `e0c5c29` - Update useDebounce imports
4. `fe00770` - Remove legacy CashierDashboard
5. `636a59e` - Move useDebounce to hooks/
6. `18562b7` - Create shims
7. `105f449` - Add path aliases and ESLint guardrails

### Full Rollback
```bash
git revert --no-commit abc0933 cd1bffc e0c5c29 fe00770 636a59e 18562b7 105f449
git commit -m "Rollback: Stage 6 structure consolidation"
```

## Partial Rollback

### Rollback Import Updates Only
If import updates cause issues but shims work:

```bash
# Revert import update commits
git revert --no-commit cd1bffc e0c5c29
git commit -m "Rollback: Import updates, keep shims"
```

### Rollback File Moves Only
If file moves cause issues:

```bash
# Revert file move commits
git revert --no-commit fe00770 636a59e
git commit -m "Rollback: File moves, keep shims and config"
```

### Rollback ESLint Rules Only
If ESLint rules are too strict:

```bash
# Revert ESLint config
git revert --no-commit 105f449
git commit -m "Rollback: ESLint guardrails"
```

## Restore Shims

If shims were removed but need to be restored:

### useDebounce Shim
```javascript
// frontend/src/utils/useDebounce.js
export { default, default as useDebounce } from '../hooks/useDebounce';
```

### ErrorState Shim
```javascript
// frontend/src/components/ErrorState.jsx
export { ErrorState, ErrorState as default } from './library/feedback/ErrorState';
```

### LoadingState Shim
```javascript
// frontend/src/components/LoadingState.jsx
export { LoadingSpinner, LoadingSpinner as default } from './library/feedback/LoadingSpinner';
```

### EmptyState Shim
```javascript
// frontend/src/components/EmptyState.jsx
export { EmptyState, EmptyState as default } from './library/feedback/EmptyState';
```

### DataTable Shim
```javascript
// frontend/src/components/DataTable.jsx
export { DataTable, DataTable as default } from './library/DataTable/DataTable';
```

### SearchInput Shim
```javascript
// frontend/src/components/SearchInput.jsx
export { SearchBar, SearchBar as default } from './library/inputs/SearchBar';
```

### ModalComponent Shim
```javascript
// frontend/src/components/ui/ModalComponent.jsx
export { FormModal, FormModal as default } from '../library/forms/FormModal';
```

## Restore Legacy Files

If legacy files need to be restored:

### CashierDashboard.jsx
```bash
git show fe00770:frontend/src/pages/CashierDashboard.jsx > frontend/src/pages/CashierDashboard.jsx
```

### useDebounce.js (from utils/)
```bash
git show 636a59e^:frontend/src/utils/useDebounce.js > frontend/src/utils/useDebounce.js
```

## Verification After Rollback

1. **Build**: `cd frontend && npm run build`
2. **Lint**: `cd frontend && npm run lint`
3. **Start**: `cd frontend && npm run dev`
4. **Test**: Verify all pages load correctly

## Emergency Contacts

If rollback doesn't resolve issues:
1. Check git log for exact commit hashes
2. Verify no uncommitted changes
3. Consider cherry-picking specific fixes
4. Document issues for follow-up

## Prevention

To prevent future issues:
1. Test thoroughly before removing shims
2. Monitor for indirect usage of legacy components
3. Keep shims for at least 1-2 releases
4. Document all file moves in MOVE_PLAN.md

