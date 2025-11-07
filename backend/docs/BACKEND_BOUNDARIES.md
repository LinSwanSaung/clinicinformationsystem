# Backend Architecture Boundaries

This document defines the import boundaries and architectural layers in the RealCIS backend.

## Layer Structure

```
┌─────────────────────────────────────┐
│         Routes (HTTP Layer)         │  ← Only imports: services, middleware, validators
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      Services (Business Logic)      │  ← Only imports: repositories, models, utils, errors
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│   Repositories (Data Access Layer)  │  ← Only imports: database config, zod
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      Database (Supabase Client)     │  ← Exported from config/database.js
└─────────────────────────────────────┘
```

## Import Rules

### Routes (`src/routes/`)

**Can import:**

- ✅ Services (`src/services/*.service.js`)
- ✅ Middleware (`src/middleware/*`)
- ✅ Validators (`src/validators/*`)
- ✅ Constants (`src/constants/*`)
- ✅ Errors (`src/errors/*`)

**Cannot import:**

- ❌ Repositories directly
- ❌ Models directly (use services instead)
- ❌ Database client (`supabase` from `config/database.js`)
- ❌ Utils (unless route-specific)

**Example:**

```javascript
// ✅ Good
import PatientService from '../services/Patient.service.js';
import { authenticate, authorize } from '../middleware/auth.js';

// ❌ Bad
import { supabase } from '../config/database.js';
import PatientModel from '../models/Patient.model.js';
```

### Services (`src/services/*.service.js`)

**Can import:**

- ✅ Repositories (`src/services/repositories/*`)
- ✅ Models (`src/models/*`) - for backward compatibility during migration
- ✅ Other services (for orchestration)
- ✅ Utils (`src/utils/*`)
- ✅ Errors (`src/errors/*`)
- ✅ Logger (`src/config/logger.js`)

**Cannot import:**

- ❌ Database client directly (use repositories)
- ❌ Routes
- ❌ Middleware (except for internal use)

**Example:**

```javascript
// ✅ Good
import { listPatients, getPatientById } from './repositories/PatientsRepo.js';
import logger from '../config/logger.js';

// ❌ Bad
import { supabase } from '../config/database.js';
```

### Repositories (`src/services/repositories/*`)

**Can import:**

- ✅ Database client (`src/config/database.js`)
- ✅ Zod (for validation)
- ✅ Other repositories (for joins/complex queries)

**Cannot import:**

- ❌ Services (circular dependency)
- ❌ Routes
- ❌ Middleware
- ❌ Models (repositories replace models)

**Example:**

```javascript
// ✅ Good
import { supabase } from '../../config/database.js';
import { z } from 'zod';

// ❌ Bad
import PatientService from '../Patient.service.js';
```

### Models (`src/models/*`)

**Status:** Legacy - being phased out in favor of repositories

**Current usage:**

- Some services still use models (during migration)
- Models internally use supabase (acceptable for now)
- New code should use repositories instead

## Database Access Rules

### Rule 1: Only Repositories Access Database

**Direct database access is ONLY allowed in:**

- `src/services/repositories/*.js`
- `src/config/database.js` (client export)
- `scripts/*.js` (utility scripts)

**Forbidden everywhere else:**

- ❌ Services cannot import `supabase` directly
- ❌ Routes cannot import `supabase` directly
- ❌ Middleware cannot import `supabase` directly (except auth.js for user lookup)

### Rule 2: Supabase Import Pattern

**Correct:**

```javascript
// In repositories
import { supabase } from '../../config/database.js';
```

**Incorrect:**

```javascript
// In services (should use repository)
import { supabase } from '../config/database.js';
```

## ESLint Enforcement

The following ESLint rules enforce these boundaries:

```javascript
// .eslintrc.cjs
'no-restricted-imports': [
  'error',
  {
    paths: [
      {
        name: '@supabase/supabase-js',
        message: 'Import Supabase only from src/config/database.js or within src/services/repositories/**. Create/extend a repo instead.',
      },
    ],
  },
],
```

## Migration Path

### Current State

- Some services use models (legacy)
- Some services use supabase directly (needs migration)
- Repositories exist for: Appointments, Billing, Invoices, Patients, Prescriptions, Visits, Vitals

### Target State

- All services use repositories only
- All repositories follow consistent patterns
- Models deprecated (or kept only for backward compatibility)

### Migration Steps

1. ✅ Create repository for service
2. ✅ Extract data access functions to repository
3. ✅ Update service to use repository
4. ✅ Remove direct supabase imports from service
5. ✅ Test (no behavior changes)

## Examples

### ✅ Correct: Service Using Repository

```javascript
// src/services/Patient.service.js
import { listPatients, getPatientById } from './repositories/PatientsRepo.js';

class PatientService {
  async getAllPatients(options) {
    return await listPatients(options);
  }
}
```

### ❌ Incorrect: Service Using Database Directly

```javascript
// src/services/Patient.service.js
import { supabase } from '../config/database.js'; // ❌ Forbidden

class PatientService {
  async getAllPatients() {
    const { data } = await supabase.from('patients').select('*'); // ❌ Should use repository
    return data;
  }
}
```

### ✅ Correct: Repository Accessing Database

```javascript
// src/services/repositories/PatientsRepo.js
import { supabase } from '../../config/database.js'; // ✅ Allowed

export async function listPatients(options) {
  const { data, error } = await supabase.from('patients').select('*');
  if (error) throw error;
  return data;
}
```

## Summary

- **Routes** → Services → Repositories → Database
- **No skipping layers** (e.g., routes cannot call repositories directly)
- **Database access only in repositories** (and config/scripts)
- **ESLint enforces boundaries** via `no-restricted-imports`
