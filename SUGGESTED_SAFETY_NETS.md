# Suggested Safety Nets for File Moves & Consolidation

## Overview

This document proposes safety mechanisms to implement **if and when** we decide to move, rename, or consolidate files. These are **proposals only** - no changes have been made.

---

## 1. Path Aliases (Frontend)

### Current State

- **Vite config**: `@` → `src/` (already configured)
- **Usage**: `@/components/...`, `@/services/...`

### Proposed Additions

If we move files, add more specific aliases:

```javascript
// vite.config.js
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@pages": path.resolve(__dirname, "./src/pages"),
    },
  },
});
```

### Benefits

- Easier refactoring (change alias instead of all imports)
- Clearer imports (`@components/library/...` vs `../../components/library/...`)
- Less brittle to file moves

### Implementation

1. Add aliases to `vite.config.js`
2. Update ESLint to recognize aliases
3. Gradually migrate imports to use aliases

---

## 2. Re-Export Shims

### Purpose

Temporary re-exports from old locations to new locations during migration.

### Example: Moving `useDebounce.js`

```javascript
// utils/useDebounce.js (shim - temporary)
export { default } from "../hooks/useDebounce";
export { default as useDebounce } from "../hooks/useDebounce";
```

### Example: Removing Legacy Components

```javascript
// components/EmptyState.jsx (shim - temporary)
export { EmptyState } from "./library/feedback/EmptyState";
```

### Migration Strategy

1. **Phase 1**: Create shim at old location, pointing to new location
2. **Phase 2**: Update all imports to use new location
3. **Phase 3**: Remove shim after all imports updated
4. **Phase 4**: Run tests to verify no broken imports

### Benefits

- Zero-downtime migration
- Gradual migration (update imports incrementally)
- Easy rollback (keep shim if issues arise)

---

## 3. ESLint Import Rules

### Proposed Rules

Add ESLint rules to enforce import patterns:

```javascript
// eslint.config.js
rules: {
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        {
          group: ['../components/EmptyState', '../components/ErrorState', '../components/LoadingState'],
          message: 'Use library components instead: @components/library/feedback/EmptyState',
        },
        {
          group: ['../components/DataTable'],
          message: 'Use library DataTable instead: @components/library/DataTable',
        },
        {
          group: ['../components/SearchInput'],
          message: 'Use library SearchBar instead: @components/library/inputs/SearchBar',
        },
        {
          group: ['../components/ui/ModalComponent'],
          message: 'Use library FormModal instead: @components/library/forms/FormModal',
        },
      ],
    },
  ],
  'import/order': [
    'error',
    {
      groups: [
        'builtin',
        'external',
        'internal',
        ['parent', 'sibling'],
        'index',
      ],
      'newlines-between': 'always',
      pathGroups: [
        {
          pattern: '@/**',
          group: 'internal',
          position: 'before',
        },
      ],
    },
  ],
}
```

### Benefits

- Prevents new imports from old locations
- Enforces consistent import patterns
- Catches mistakes during development

### Implementation

1. Install `eslint-plugin-import` if not already installed
2. Add rules to `eslint.config.js`
3. Run `npm run lint -- --fix` to auto-fix imports

---

## 4. Codemods (Optional)

### Purpose

Automated code transformations for large-scale refactoring.

### Example: Moving `useDebounce.js`

```javascript
// codemod: move-useDebounce.js
// Transforms: import useDebounce from '../utils/useDebounce'
// To: import useDebounce from '../hooks/useDebounce'

module.exports = function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  root
    .find(j.ImportDeclaration)
    .filter((path) => path.value.source.value.includes("utils/useDebounce"))
    .replaceWith((path) => {
      const newSource = path.value.source.value.replace(
        "utils/useDebounce",
        "hooks/useDebounce",
      );
      return j.importDeclaration(path.value.specifiers, j.literal(newSource));
    });

  return root.toSource();
};
```

### Tools

- **jscodeshift**: AST-based code transformations
- **ts-migrate**: TypeScript migration tool (if we migrate to TS)
- **babel-plugin-module-resolver**: Resolve imports at build time

### Benefits

- Automated refactoring (less manual work)
- Consistent transformations (no human error)
- Can handle complex patterns

### Implementation

1. Write codemod script
2. Test on sample files
3. Run on entire codebase
4. Review changes, commit

---

## 5. TypeScript Path Mapping (If Migrating to TS)

### Purpose

TypeScript-aware path aliases with type checking.

### Proposed Config

```json
// tsconfig.json (if we migrate to TypeScript)
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@services/*": ["src/services/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"],
      "@pages/*": ["src/pages/*"]
    }
  }
}
```

### Benefits

- Type-safe imports (TypeScript checks paths)
- IDE autocomplete for aliases
- Refactoring support (rename files updates imports)

### Implementation

1. Migrate to TypeScript (separate effort)
2. Add path mappings to `tsconfig.json`
3. Update imports to use aliases

---

## 6. Barrel Export Strategy

### Current State

- **Frontend**: 4 barrel exports (`components/library/index.js`, etc.)
- **Backend**: 0 barrel exports

### Proposed Additions

If we consolidate, add barrel exports for common imports:

```javascript
// hooks/index.js (new)
export { default as useAppointments } from "./useAppointments";
export { default as useVisits } from "./useVisits";
export { default as usePatients } from "./usePatients";
export { default as useDebounce } from "./useDebounce";
// ... etc
```

```javascript
// services/index.js (new - optional)
export { default as patientService } from "./patientService";
export { default as visitService } from "./visitService";
// ... etc
```

### Benefits

- Cleaner imports (`import { useAppointments, useVisits } from '@hooks'`)
- Easier refactoring (change export, not all imports)
- Better tree-shaking (if configured)

### Trade-offs

- **Risk**: Barrel exports can cause circular dependencies
- **Risk**: Can slow down build times (if not tree-shaken)
- **Mitigation**: Use carefully, test thoroughly

---

## 7. Pre-Migration Checklist

Before moving/renaming files, verify:

### Frontend

- [ ] All imports use path aliases (`@/...`) where possible
- [ ] No circular dependencies
- [ ] All tests pass
- [ ] Build succeeds (`npm run build`)
- [ ] Linting passes (`npm run lint`)

### Backend

- [ ] All imports are relative (no path aliases yet)
- [ ] No circular dependencies
- [ ] All tests pass
- [ ] Server starts (`npm start`)
- [ ] Linting passes (`npm run lint`)

### Database

- [ ] Schema changes documented
- [ ] Migration files tested
- [ ] Rollback plan documented

---

## 8. Post-Migration Verification

After moving/renaming files, verify:

### Automated Checks

```bash
# Frontend
npm run lint          # Check for import errors
npm run build         # Verify build succeeds
npm test              # Run tests (if available)

# Backend
npm run lint          # Check for import errors
npm start             # Verify server starts
npm test              # Run tests (if available)
```

### Manual Checks

- [ ] Application starts without errors
- [ ] All pages load correctly
- [ ] API endpoints respond correctly
- [ ] No console errors
- [ ] No broken imports in IDE

---

## 9. Rollback Plan

If migration causes issues:

### Immediate Rollback

1. **Git revert**: `git revert <commit-hash>`
2. **Restore shims**: Re-add re-export shims if removed
3. **Verify**: Run automated checks, test application

### Partial Rollback

1. **Keep new structure**: Don't revert file moves
2. **Restore old imports**: Update imports back to old locations
3. **Add shims**: Re-add re-export shims temporarily

### Documentation

- Document rollback steps in migration PR
- Keep shims for 1-2 releases before removing
- Monitor for import errors after migration

---

## 10. Recommended Implementation Order

If we decide to consolidate:

### Phase 1: Preparation

1. Add ESLint import rules (prevent new bad imports)
2. Add path aliases (if not already present)
3. Document current import patterns

### Phase 2: Create Shims

1. Create re-export shims for files to be moved
2. Test shims work correctly
3. Commit shims (no behavior change)

### Phase 3: Gradual Migration

1. Update imports incrementally (one file/component at a time)
2. Test after each change
3. Commit frequently (small commits)

### Phase 4: Remove Legacy

1. Remove legacy files (after all imports updated)
2. Remove shims (after migration complete)
3. Update documentation

### Phase 5: Verification

1. Run automated checks
2. Manual testing
3. Monitor for issues

---

## Summary

### Safety Nets to Implement

1. ✅ **Path aliases** (already partially done, expand if needed)
2. ✅ **Re-export shims** (temporary during migration)
3. ✅ **ESLint import rules** (prevent bad imports)
4. ⚠️ **Codemods** (optional, for large-scale refactoring)
5. ⚠️ **TypeScript path mapping** (if migrating to TS)
6. ⚠️ **Barrel exports** (use carefully)

### When to Use

- **Path aliases**: Always (already in use)
- **Re-export shims**: During file moves/renames
- **ESLint rules**: Before migration (prevent new bad imports)
- **Codemods**: For large-scale refactoring (100+ files)
- **TypeScript**: If migrating to TypeScript
- **Barrel exports**: If consolidating many exports

### Risk Level

- **Low risk**: Path aliases, ESLint rules, re-export shims
- **Medium risk**: Codemods (test thoroughly)
- **High risk**: Barrel exports (watch for circular deps)

---

**Note**: These are **proposals only**. Implement only when ready to perform file moves/consolidation. Test thoroughly before applying to production codebase.
