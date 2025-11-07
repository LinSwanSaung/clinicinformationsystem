# Backend Architecture

This document describes the architecture, design patterns, and implementation details of the RealCIS backend API.

## 🏗️ Architecture Overview

The backend follows a layered architecture with clear separation of concerns:

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

## 📦 Layer Responsibilities

### Routes (`src/routes/`)

- Handle HTTP requests and responses
- Validate input using validators
- Apply authentication/authorization middleware
- Call services for business logic
- Return standardized responses

**Can import:**

- ✅ Services (`src/services/*.service.js`)
- ✅ Middleware (`src/middleware/*`)
- ✅ Validators (`src/validators/*`)
- ✅ Constants (`src/constants/*`)
- ✅ Errors (`src/errors/*`)

**Cannot import:**

- ❌ Repositories directly
- ❌ Models directly (use services instead)
- ❌ Database client

### Services (`src/services/*.service.js`)

- Contain business logic
- Orchestrate multiple repositories
- Handle transactions
- Transform data
- Apply business rules

**Can import:**

- ✅ Repositories (`src/services/repositories/*`)
- ✅ Models (`src/models/*`) - for backward compatibility
- ✅ Other services (for orchestration)
- ✅ Utils (`src/utils/*`)
- ✅ Errors (`src/errors/*`)
- ✅ Logger (`src/config/logger.js`)

**Cannot import:**

- ❌ Database client directly (use repositories)
- ❌ Routes
- ❌ Middleware (except for internal use)

### Repositories (`src/services/repositories/*`)

- Handle all database operations
- Abstract database implementation details
- Provide data access functions
- Handle query optimization

**Can import:**

- ✅ Database client (`src/config/database.js`)
- ✅ Zod (for validation)
- ✅ Other repositories (for joins/complex queries)

**Cannot import:**

- ❌ Services (circular dependency)
- ❌ Routes
- ❌ Middleware

## 🔒 Import Rules & Boundaries

### Database Access Rule

**Direct database access is ONLY allowed in:**

- `src/services/repositories/*.js`
- `src/config/database.js` (client export)
- `scripts/*.js` (utility scripts)

**Forbidden everywhere else:**

- ❌ Services cannot import `supabase` directly
- ❌ Routes cannot import `supabase` directly
- ❌ Middleware cannot import `supabase` directly (except auth.js for user lookup)

### ESLint Enforcement

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
    patterns: [
      {
        group: ['\\.\\./\\.\\./\\.\\./.*'],
        message: 'Use path aliases instead of deep relative imports (../../../).',
      },
    ],
  },
],
```

### Path Aliases

The project uses Node.js `imports` for cleaner imports:

```javascript
// package.json
"imports": {
  "#src/*": "./src/*",
  "#routes/*": "./src/routes/*",
  "#services/*": "./src/services/*",
  "#repos/*": "./src/services/repositories/*",
  "#middleware/*": "./src/middleware/*",
  "#config/*": "./src/config/*",
  "#utils/*": "./src/utils/*"
}
```

## 🔄 Middleware Execution Order

The middleware is applied in the following order:

1. **CORS** - Enable Cross-Origin Resource Sharing
2. **Body Parsing** - Parse JSON and URL-encoded bodies
3. **Request Logging** - Log incoming requests
4. **Rate Limiting** - Per-route rate limiting
5. **Authentication** (`authenticate`) - Verify JWT token, attach user to `req.user`
6. **Authorization** (`authorize`) - Check user roles (varargs: `authorize('admin', 'doctor')`)
7. **Route Handlers** - Business logic
8. **404 Handler** - Handle unmatched routes
9. **Error Handler** - Global error handling

### Example Route Configuration

```javascript
// Public route
router.post(
  '/login',
  authRateLimiter,
  validateLogin,
  asyncHandler(async (req, res) => {
    // Handler
  })
);

// Protected route
router.get(
  '/profile',
  authenticate,
  asyncHandler(async (req, res) => {
    // req.user is available
  })
);

// Protected route with role requirement
router.delete(
  '/users/:id',
  authenticate,
  authorize('admin'), // varargs, not array
  asyncHandler(async (req, res) => {
    // req.user is available and role is 'admin'
  })
);
```

### Important Notes

1. **`authenticate` must come before `authorize`** - Authorization requires authentication
2. **`authorize` uses varargs** - Use `authorize('admin', 'doctor')` not `authorize(['admin', 'doctor'])`
3. **Rate limiting is per-route** - Not applied globally
4. **Error handler is last** - Catches all errors from previous middleware and routes

## 📝 Logging System

### Overview

The backend uses a centralized logger located at `src/config/logger.js` with structured logging and PII protection.

### Usage

```javascript
import logger from '../config/logger.js';

// Error logging
logger.error('Failed to fetch user:', error);

// Warning logging
logger.warn('Rate limit approaching:', { userId, requests: count });

// Info logging
logger.info('User logged in:', { userId, role });

// Debug logging
logger.debug('Processing request:', { method: req.method, url: req.url });
```

### Log Levels

1. **ERROR** - Critical errors that require attention
2. **WARN** - Warnings about potential issues
3. **INFO** - General informational messages
4. **DEBUG** - Detailed debugging information

### Configuration

The log level is controlled by the `LOG_LEVEL` environment variable:

- **Production:** Defaults to `info` (logs ERROR, WARN, INFO)
- **Development:** Defaults to `debug` (logs all levels)

```env
LOG_LEVEL=debug  # or error, warn, info, debug
```

### PII Protection

The logger automatically sanitizes sensitive fields:

- `password`, `password_hash`
- `token`, `access_token`, `refresh_token`
- `ssn`, `credit_card`

When these fields are detected, they are replaced with `[REDACTED]`.

### Best Practices

1. **Use appropriate log levels:**
   - `error` - For exceptions and critical failures
   - `warn` - For recoverable issues or deprecations
   - `info` - For important business events (login, creation, etc.)
   - `debug` - For detailed troubleshooting information

2. **Include context:**

   ```javascript
   // Good
   logger.error('Failed to create appointment:', { error, patientId, doctorId });

   // Less useful
   logger.error('Failed');
   ```

3. **Use structured data:**
   ```javascript
   // Good - structured
   logger.info('Appointment created:', { appointmentId, patientId, doctorId });
   ```

## 🔐 Authentication & Authorization

### JWT-based Authentication

- Stateless authentication using JSON Web Tokens
- Token expiration and refresh handling
- Secure password hashing with bcrypt

### Role-based Access Control

- **Admin**: Full system access, user management
- **Doctor**: Patient records, medical notes, prescriptions
- **Nurse**: Vitals recording, patient status updates
- **Receptionist**: Patient registration, appointment scheduling
- **Cashier**: Payment processing, invoice management
- **Pharmacist**: Prescription management

### Development Token Bypass

In development (when `USE_DEV_TOKEN=true`), the `authenticate` middleware accepts a special token:

- Token: `test-token`
- Role: Can be set via `x-dev-role` header (defaults to 'nurse')
- **Security:** Only works when `NODE_ENV !== 'production'`

This bypass is **opt-in only** and disabled by default.

## 🛡️ Security Features

### Rate Limiting

- General API rate limiting (100 requests/15 minutes)
- Strict authentication rate limiting (5 attempts/15 minutes)
- Upload-specific rate limiting

### Input Validation

- Joi schema validation for all inputs
- SQL injection prevention
- XSS protection with helmet

### Error Handling

- Centralized error handling
- Environment-specific error responses
- Detailed logging for debugging

## 📊 Database Schema

The backend uses Supabase (PostgreSQL) with the following core tables:

- `users` - System users with role-based access
- `patients` - Patient demographics and medical information
- `appointments` - Appointment scheduling and status tracking
- `visits` - Medical encounters
- `vitals` - Patient vital signs
- `prescriptions` - Medications and prescriptions
- `invoices` - Billing and invoicing
- `payment_transactions` - Payment tracking
- `notifications` - In-app notifications
- `audit_logs` - Audit trail

See `database/README.md` for complete schema documentation.

## 🔄 Migration Path

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

## 📚 Examples

### ✅ Correct: Service Using Repository

```javascript
// src/services/Patient.service.js
import { listPatients, getPatientById } from './repositories/PatientsRepo.js';
import logger from '../config/logger.js';

class PatientService {
  async getAllPatients(options) {
    try {
      return await listPatients(options);
    } catch (error) {
      logger.error('Error fetching patients:', error);
      throw error;
    }
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

## 📖 Summary

- **Routes** → Services → Repositories → Database
- **No skipping layers** (e.g., routes cannot call repositories directly)
- **Database access only in repositories** (and config/scripts)
- **ESLint enforces boundaries** via `no-restricted-imports`
- **Middleware order is critical** - authentication before authorization
- **Structured logging** with PII protection
- **Role-based access control** with JWT authentication
