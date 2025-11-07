# Unused Files Report - Frontend

**Generated**: Current Session  
**Purpose**: Identify unused components, files, and directories that can be safely removed

---

## 🗑️ Unused Components (Safe to Remove)

### Generic Components (Not Imported Anywhere)
1. **`components/DataList.jsx`** ❌
   - Status: Not imported anywhere
   - Recommendation: Remove or move to `library/generic/` for future use

2. **`components/LoadingCard.jsx`** ❌
   - Status: Not imported anywhere
   - Recommendation: Remove or move to `library/generic/` for future use

3. **`components/FormField.jsx`** ❌
   - Status: Not imported anywhere
   - Recommendation: Remove or move to `library/generic/` for future use

4. **`components/ActionButtons.jsx`** ❌
   - Status: Not imported anywhere
   - Recommendation: Remove or move to `library/generic/` for future use

---

## ✅ Used Components (Keep)

### Generic Components
- **`components/Alert.jsx`** ✅ - Used in 2 files:
  - `features/appointments/pages/AppointmentsPage.jsx`
  - `features/patients/pages/RegisterPatientPage.jsx`

### Services (All Used)
- ✅ `services/api.js` - Centralized API (used everywhere)
- ✅ `services/clinicSettingsService.js` - Used in 2 files
- ✅ `services/doctorService.js` - Used in 3 files
- ✅ `services/notificationService.js` - Used in 1 file
- ✅ `services/serviceService.js` - Used in 1 file

### Hooks (All Used)
- ✅ `hooks/useDebounce.js` - Used in 7 files

### Utils (All Used)
- ✅ `utils/appointmentConfig.js` - Used in 2 files
- ✅ `utils/timeUtils.js` - Used in 1 file

---

## 📁 Empty Directories (Can Be Removed)

All feature `types/` directories are empty and can be removed:

1. `features/admin/types/` - Empty
2. `features/appointments/types/` - Empty
3. `features/auth/types/` - Empty
4. `features/billing/types/` - Empty
5. `features/medical/types/` - Empty
6. `features/patient-portal/types/` - Empty
7. `features/patients/types/` - Empty
8. `features/queue/types/` - Empty
9. `features/visits/types/` - Empty

**Note**: These directories were created as placeholders for future TypeScript types or Zod schemas. They can be removed if not planning to use them soon.

---

## 🖼️ Unused Assets

1. **`assets/react.svg`** ❌
   - Status: Not imported anywhere
   - Recommendation: Remove (default Vite asset, not used)

---

## 📄 Potentially Unused Files

1. **`App.css`** ❌
   - Status: Not imported in `main.jsx` or `App.jsx`
   - Contains default Vite styles
   - Recommendation: Remove if not needed (check if styles are used elsewhere)

---

## 📊 Summary

### Files to Remove
- 4 unused generic components (`DataList`, `LoadingCard`, `FormField`, `ActionButtons`)
- 1 unused asset (`react.svg`)
- 1 potentially unused CSS file (`App.css`)

### Directories to Remove
- 9 empty `types/` directories (one per feature)

### Total Cleanup Potential
- **Files**: 6 files
- **Directories**: 9 directories

---

## 🎯 Recommendations

### Option 1: Aggressive Cleanup (Recommended)
Remove all unused files and empty directories:
```bash
# Remove unused components
rm frontend/src/components/DataList.jsx
rm frontend/src/components/LoadingCard.jsx
rm frontend/src/components/FormField.jsx
rm frontend/src/components/ActionButtons.jsx

# Remove unused assets
rm frontend/src/assets/react.svg

# Remove unused CSS
rm frontend/src/App.css

# Remove empty type directories (PowerShell)
cd frontend/src/features
Get-ChildItem -Recurse -Directory -Filter "types" | Where-Object { (Get-ChildItem $_.FullName).Count -eq 0 } | Remove-Item
```

### Option 2: Conservative Cleanup
Keep components in `library/generic/` for potential future use:
```bash
# Move unused components to library
mkdir frontend/src/components/library/generic
mv frontend/src/components/DataList.jsx frontend/src/components/library/generic/
mv frontend/src/components/LoadingCard.jsx frontend/src/components/library/generic/
mv frontend/src/components/FormField.jsx frontend/src/components/library/generic/
mv frontend/src/components/ActionButtons.jsx frontend/src/components/library/generic/

# Still remove assets and empty directories
rm frontend/src/assets/react.svg
rm frontend/src/App.css
```

---

## ⚠️ Before Removing

1. **Verify Build**: Run `npm run build` to ensure nothing breaks
2. **Check Git History**: These files might be referenced in old commits
3. **Team Approval**: Confirm with team before removing

---

## ✅ After Cleanup

After removing unused files:
- Run `npm run build` to verify
- Run `npm run lint` to check for issues
- Test key pages to ensure everything works

---

**Status**: ✅ **CLEANUP COMPLETED**

## ✅ Cleanup Actions Taken

### Components Moved (Conservative Approach)
- ✅ `components/DataList.jsx` → `components/library/generic/DataList.jsx`
- ✅ `components/LoadingCard.jsx` → `components/library/generic/LoadingCard.jsx`
- ✅ `components/FormField.jsx` → `components/library/generic/FormField.jsx`
- ✅ `components/ActionButtons.jsx` → `components/library/generic/ActionButtons.jsx`

### Files Removed
- ✅ `assets/react.svg` - Removed (unused default Vite asset)
- ✅ `App.css` - Removed (not imported anywhere)

### Directories Removed
- ✅ `features/admin/types/` - Removed (empty)
- ✅ `features/appointments/types/` - Removed (empty)
- ✅ `features/auth/types/` - Removed (empty)
- ✅ `features/billing/types/` - Removed (empty)
- ✅ `features/medical/types/` - Removed (empty)
- ✅ `features/patient-portal/types/` - Removed (empty)
- ✅ `features/patients/types/` - Removed (empty)
- ✅ `features/queue/types/` - Removed (empty)
- ✅ `features/visits/types/` - Removed (empty)

### Verification
- ✅ Build: PASS (`npm run build` - successful)
- ✅ Lint: PASS (`npm run lint` - only minor unused import warnings)
- ✅ No broken imports detected

**Cleanup Date**: Current Session

