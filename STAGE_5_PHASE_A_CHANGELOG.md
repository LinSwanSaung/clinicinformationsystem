# Stage 5 Phase A — Service Layer Lifecycle Fixes

## Summary

Implemented service-layer transactions, validation, and audit logging to fix lifecycle bugs around appointments → tokens → visits → invoices. This ensures atomic operations, prevents orphaned records, and maintains data integrity.

## Changes

### 1. New Infrastructure

#### `backend/src/errors/ApplicationError.js`

- Structured error class with `code` and `details` for client handling
- Extends standard Error with status codes and error codes
- Supports error codes: `ACTIVE_VISIT_EXISTS`, `ORPHAN_TOKEN`, `INVOICE_MISSING_VISIT`, etc.

#### `backend/src/services/transactions/TransactionRunner.js`

- Compensation-based transaction pattern for Supabase
- Ensures atomicity: if any operation fails, previous operations are rolled back
- Used for visit+token creation and invoice+visit completion

#### `backend/src/middleware/errorHandler.js`

- Enhanced to handle `ApplicationError` with structured responses
- Returns error codes and details to clients for proper handling

### 2. QueueService Fixes

#### `issueToken()` — Transaction + Active Visit Check

- **Before:** Visit creation could fail silently, leaving orphaned tokens
- **After:**
  - Checks for existing active visit (returns 409 `ACTIVE_VISIT_EXISTS`)
  - Uses transaction pattern: visit creation → token creation (with rollback)
  - Ensures token always has `visit_id`
  - Returns structured errors with codes

#### `markPatientMissed()` — Cancel Visit

- **Before:** Visit stayed `in_progress` after patient marked as missed
- **After:**
  - Cancels associated visit (`status: 'cancelled'`)
  - Logs visit status change for audit
  - Handles missing visit gracefully

#### `completeConsultation()` — Validation

- **Before:** Silently proceeded if token had no `visit_id`
- **After:**
  - Throws `ApplicationError` with code `ORPHAN_TOKEN` if `visit_id` missing
  - Logs visit update for audit
  - Ensures visit `visit_end_time` is set

### 3. InvoiceService Fixes

#### `completeInvoice()` — Transaction + Idempotency

- **Before:** Invoice could complete but visit fail, or duplicate completions
- **After:**
  - Idempotent: returns existing data if invoice already paid
  - Validates invoice has `visit_id` (throws `INVOICE_MISSING_VISIT` if missing)
  - Uses transaction pattern: invoice completion → visit completion (with rollback)
  - Logs visit status change for audit
  - Ensures visit is only completed when invoice is paid

### 4. Audit Logging

- Visit status changes logged to `audit_logs`:
  - Visit creation (from token issuance)
  - Visit cancellation (from missed patient)
  - Visit end time update (from consultation completion)
  - Visit completion (from invoice payment)

## Error Codes

| Code                    | Status | Description                      |
| ----------------------- | ------ | -------------------------------- |
| `ACTIVE_VISIT_EXISTS`   | 409    | Patient already has active visit |
| `ACTIVE_TOKEN_EXISTS`   | 409    | Patient already has active token |
| `ORPHAN_TOKEN`          | 400    | Token has no associated visit    |
| `INVOICE_MISSING_VISIT` | 400    | Invoice has no associated visit  |
| `TOKEN_NOT_FOUND`       | 404    | Token not found                  |
| `INVOICE_NOT_FOUND`     | 404    | Invoice not found                |
| `VALIDATION_ERROR`      | 400    | Validation failed                |
| `CAPACITY_EXCEEDED`     | 400    | Doctor capacity exceeded         |

## Files Changed

- `backend/src/errors/ApplicationError.js` (new)
- `backend/src/services/transactions/TransactionRunner.js` (new)
- `backend/src/services/Queue.service.js` (modified)
- `backend/src/services/Invoice.service.js` (modified)
- `backend/src/middleware/errorHandler.js` (modified)

## Testing Checklist

### 1. Token Issuance

- [ ] Create token for patient without active visit → succeeds
- [ ] Create token for patient with active visit → returns 409 `ACTIVE_VISIT_EXISTS`
- [ ] Token creation fails → visit is rolled back (cancelled)
- [ ] Visit creation fails → token is not created

### 2. Mark Patient Missed

- [ ] Mark patient as missed → visit is cancelled
- [ ] Mark patient as missed (no visit) → succeeds without error
- [ ] Check audit log → visit cancellation logged

### 3. Complete Consultation

- [ ] Complete consultation with valid token → visit `visit_end_time` set
- [ ] Complete consultation with token missing `visit_id` → returns 400 `ORPHAN_TOKEN`
- [ ] Check audit log → visit update logged

### 4. Complete Invoice

- [ ] Complete invoice (first time) → invoice and visit completed
- [ ] Complete invoice (already paid) → returns existing data (idempotent)
- [ ] Complete invoice with missing `visit_id` → returns 400 `INVOICE_MISSING_VISIT`
- [ ] Visit completion fails → invoice is rolled back
- [ ] Check audit log → visit completion logged

## Behavior Changes

### Breaking Changes

- **None** — All changes are backward compatible. Existing flows continue to work.

### New Behaviors

1. **409 Conflict on Active Visit:** `issueToken()` now returns 409 if patient has active visit (instead of generic error)
2. **Structured Errors:** All errors now include `code` and optional `details` for client handling
3. **Automatic Rollback:** Failed operations automatically roll back previous steps
4. **Visit Cancellation on Missed:** `markPatientMissed()` now cancels associated visit

### Preserved Behaviors

- Visit only completes when invoice is paid (not when consultation ends)
- All existing API contracts maintained
- No UI changes required

## Next Steps (Phase B & C)

- **Phase B:** Database constraints (FKs, unique index) with backfill scripts
- **Phase C:** Auto-cancel end-of-day appointments job
