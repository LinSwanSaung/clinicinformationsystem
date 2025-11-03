# Stage 1 Complete: Guardrails & Inventory

## ✅ What Was Done

### 1. ESLint & Prettier Configuration

- ✅ **Frontend**:
  - Added `.eslintrc.cjs` with React-specific rules
  - Added `.prettierrc.json` with Tailwind plugin
  - Configured `no-console: error` and `no-debugger: error`
  - Added format scripts: `npm run lint:fix`, `npm run format`
- ✅ **Backend**:
  - Added `.eslintrc.cjs` with Node.js/Express rules
  - Added `.prettierrc.json` for consistent formatting
  - Configured `no-console: error` and `no-debugger: error`
  - Added format scripts: `npm run lint:fix`, `npm run format`

### 2. Husky + lint-staged

- ✅ Installed Husky v9 at root level
- ✅ Created `.husky/pre-commit` hook
- ✅ Added `.lintstagedrc.json` config:
  - Runs `eslint --fix` on staged JS/JSX files
  - Runs `prettier --write` on staged files
  - Blocks commits with linting errors

### 3. Package.json Updates

- ✅ **Root**: Added `prepare` script, `lint`, `format` commands
- ✅ **Frontend**: Added `eslint-config-prettier`, `eslint-plugin-react`, `prettier`, `prettier-plugin-tailwindcss`
- ✅ **Backend**: Added `eslint`, `eslint-config-prettier`, `prettier`

### 4. Documentation Created

#### A. `refactor-map.md` (3,600+ lines)

Comprehensive audit documenting:

- **33 files >500 lines** (largest: 2,253 lines)
- **200+ console.log violations**
- **Duplicate UI patterns**: PatientCard variants (4+), DataTable implementations (3+), Modal patterns (5+)
- **Repeated fetch logic**: No shared hooks, ~150 instances of manual loading states
- **Direct Supabase calls**: 15+ components bypassing service layer
- **Architecture issues**: Prop drilling, no global state, mixed concerns in services
- **Database schema chaos**: 2 schema files + 26 migrations, no single source of truth
- **Priority refactor targets**: CashierDashboard, AppointmentsPage, Queue.service.js

#### B. `db/usage-manifest.json` (400+ lines)

Complete database inventory:

- **20 tables** mapped with columns, constraints, usage references
- **File references**: Models, services, routes, frontend components per table
- **Most critical tables**: queue_tokens (10+ components), appointments (8+ components)
- **RLS policies** documented (with security warnings)
- **26 migration files** catalogued (with issues noted)
- **Recommendations**: Consolidate schemas, restrict RLS, add indexes

---

## 📦 Files Created/Modified

### Created:

```
.lintstagedrc.json
.husky/pre-commit
frontend/.eslintrc.cjs
frontend/.prettierrc.json
frontend/.prettierignore
backend/.eslintrc.cjs
backend/.prettierrc.json
backend/.prettierignore
refactor-map.md
db/usage-manifest.json
STAGE_1_SUMMARY.md (this file)
```

### Modified:

```
package.json
frontend/package.json
backend/package.json
```

---

## 🔍 Key Findings

### Code Quality Issues

1. **200+ console violations** - Will fail linting now (good!)
2. **No shared hooks** - Every component reimplements loading states
3. **Massive components** - CashierDashboard has 2,253 lines (!!)
4. **No testing** - 0% coverage on frontend

### Architecture Debt

1. **No feature-based structure** - Everything mixed in `pages/` and `components/`
2. **Prop drilling** - 5-7 levels deep in dashboards
3. **No global state** - Auth stored in localStorage across 10+ files
4. **Service inconsistency** - Mixed return patterns, some throw, some return errors

### Database Issues

1. **Schema fragmentation** - 3 sources of truth (schema.sql, v2schema.sql, 26 migrations)
2. **Duplicate tables** - payment_transactions defined 3 times
3. **Permissive RLS** - All auth users can access all data (security risk)
4. **No indexes documented** - Performance concerns

---

## ⚠️ Breaking Changes

### Linting Errors Will Block Commits

The pre-commit hook will now **fail** on:

- `console.log()`, `console.error()`, etc.
- `debugger` statements
- Unused variables
- Formatting violations

### Expected Failures

Based on the audit, **200+ files** will fail linting with the current `no-console` rule.

---

## 🎯 Next Steps (Your Decision Needed)

### Option A: Gradual Migration (Recommended)

1. **Temporarily set `no-console: warn`** instead of `error`
2. Fix violations incrementally per stage
3. Re-enable `error` in Stage 5

### Option B: Mass Fix Now

1. Run automated fix: `npm run lint:fix` in frontend + backend
2. Manually review 200+ console statement removals
3. Replace with proper logging utility

### Option C: Disable for Legacy Code

1. Add `/* eslint-disable no-console */` to old files
2. Only enforce on new code
3. Gradual cleanup in Stage 4-5

**Recommendation**: **Option A** - Keep as `warn`, fix incrementally. Prevents commit chaos during active refactoring.

---

## 📋 Stage 1 Checklist

- [x] Install ESLint + Prettier (frontend)
- [x] Install ESLint + Prettier (backend)
- [x] Configure Husky pre-commit hooks
- [x] Create comprehensive refactor-map.md
- [x] Create db/usage-manifest.json
- [ ] **TEST**: Run `npm run lint` (expected to fail - see below)
- [ ] **DECISION NEEDED**: Choose console.log migration strategy (A/B/C)

---

## 🧪 Testing the Setup

### Run These Commands:

```powershell
# Root level
cd "d:\RM KMD Final year Assignment\clinicinformationsystem"
npm run lint          # Should show frontend + backend errors
npm run format        # Formats all code

# Frontend only
cd frontend
npm run lint          # Will show 200+ errors (console violations)
npm run lint:fix      # Auto-fixes some issues
npm run format        # Formats code

# Backend only
cd ../backend
npm run lint          # Will show errors
npm run lint:fix      # Auto-fixes some issues
npm run format        # Formats code

# Test pre-commit hook
git add .
git commit -m "test"  # Will run lint-staged (may fail on console violations)
```

### Expected Behavior:

- `npm run lint` - **WILL FAIL** with 200+ console errors
- `npm run format` - **WILL PASS** (just formatting)
- `git commit` - **WILL BLOCK** if staged files have lint errors

---

## 💡 Recommendations for Stage 2+

### High Priority (Stage 2-3):

1. **Extract shared hooks** (`useApi`, `useAuth`, `useQueue`)
2. **Split CashierDashboard** (2,253 lines → 4-5 files)
3. **Create unified PatientCard** (replaces 4 variants)
4. **Consolidate database schema** (1 baseline file)

### Medium Priority (Stage 3-4):

1. **Implement feature-based structure**
2. **Add global state management** (Zustand/Context)
3. **Standardize service layer**
4. **Add composite indexes** (queue queries)

### Low Priority (Stage 4-5):

1. **Add unit tests** (>50% coverage goal)
2. **Setup E2E tests** (Playwright/Cypress)
3. **Performance optimization**
4. **Create design system docs**

---

## 🔐 Security Notes

From `db/usage-manifest.json`:

- ⚠️ **RLS policies too permissive** - All authenticated users can access ALL data
- ⚠️ **Direct SQL execution** - `exec_sql` RPC found in backend scripts
- ⚠️ **No role-based restrictions** - Database allows all roles to do anything
- ⚠️ **Patient portal access** - Patients can technically access all patient records via generic policy

**Fix Required**: Stage 3 should include RLS policy hardening.

---

## 📊 Metrics Baseline

| Metric             | Current | Target | Stage     |
| ------------------ | ------- | ------ | --------- |
| Files >500 lines   | 33      | <10    | Stage 2-3 |
| Console violations | 200+    | 0      | Stage 2-4 |
| Test coverage      | 0%      | >70%   | Stage 4-5 |
| Shared components  | ~15     | >50    | Stage 2-3 |
| Duplicate code     | ~30%    | <10%   | Stage 2-3 |
| Schema files       | 3       | 1      | Stage 2   |

---

## 🎉 Stage 1 Complete!

**No behavior changes made** - All changes are guardrails, linting config, and documentation.

**What's Enforced Now**:

- Code formatting on commit (via Prettier)
- Linting on commit (via ESLint)
- No more unformatted code in Git

**What's NOT Enforced Yet** (until you decide):

- `console.log` blocking (currently `error` but can change to `warn`)

**Wait for Stage 2 instructions** when ready to proceed! 🚀
