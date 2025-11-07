# Stage 5 Phase A — Manual QA Testing Guide

## Prerequisites

1. Backend server running
2. Database accessible
3. Test users: receptionist, doctor, cashier
4. Test patients available

## Test Scenarios

### Test 1: Token Issuance with Active Visit Check

**Goal:** Verify that creating a token for a patient with an active visit returns 409.

**Steps:**

1. Create a visit for Patient A (via token issuance or appointment)
2. Verify visit status is `in_progress`
3. Attempt to create another token for Patient A
4. **Expected:** 409 Conflict with code `ACTIVE_VISIT_EXISTS`
5. Check response includes `details.activeVisitId`

**API Call:**

```bash
POST /api/queue/issue-token
{
  "patient_id": "<patient_with_active_visit>",
  "doctor_id": "<doctor_id>"
}
```

**Expected Response:**

```json
{
  "success": false,
  "message": "Patient already has an active visit...",
  "code": "ACTIVE_VISIT_EXISTS",
  "details": {
    "activeVisitId": "...",
    "patientId": "..."
  }
}
```

---

### Test 2: Token Creation Rollback

**Goal:** Verify that if token creation fails, visit is rolled back.

**Steps:**

1. Create a visit manually (or simulate token creation failure)
2. Attempt to create token with invalid data (e.g., missing doctor_id)
3. **Expected:** Token creation fails, visit is cancelled
4. Check visit status is `cancelled`

**Note:** This may require simulating a failure or temporarily breaking token creation.

---

### Test 3: Mark Patient Missed Cancels Visit

**Goal:** Verify that marking a patient as missed cancels the associated visit.

**Steps:**

1. Create a token and visit for Patient B
2. Verify visit status is `in_progress`
3. Mark patient as missed: `POST /api/queue/tokens/:tokenId/missed`
4. **Expected:** Visit status is `cancelled`
5. Check audit log for visit cancellation entry

**API Call:**

```bash
POST /api/queue/tokens/<token_id>/missed
```

**Expected:**

- Token status: `missed`
- Visit status: `cancelled`
- Audit log entry with `action: 'UPDATE'`, `entity: 'visits'`, `new_values.status: 'cancelled'`

---

### Test 4: Complete Consultation with Orphan Token

**Goal:** Verify that completing consultation with token missing `visit_id` returns error.

**Steps:**

1. Find or create a token without `visit_id` (may require manual DB update)
2. Attempt to complete consultation: `POST /api/queue/tokens/:tokenId/complete`
3. **Expected:** 400 Bad Request with code `ORPHAN_TOKEN`
4. Check response includes `details.tokenId` and `details.tokenNumber`

**API Call:**

```bash
POST /api/queue/tokens/<token_without_visit_id>/complete
```

**Expected Response:**

```json
{
  "success": false,
  "message": "Cannot complete consultation: Token has no associated visit...",
  "code": "ORPHAN_TOKEN",
  "details": {
    "tokenId": "...",
    "tokenNumber": "..."
  }
}
```

---

### Test 5: Complete Invoice Idempotency

**Goal:** Verify that completing an already-paid invoice returns existing data.

**Steps:**

1. Complete an invoice: `POST /api/invoices/:invoiceId/complete`
2. Verify invoice status is `paid` and visit is `completed`
3. Attempt to complete the same invoice again
4. **Expected:** Returns existing invoice data (no error, no duplicate processing)
5. Check logs: "Invoice already paid, returning existing data"

**API Call:**

```bash
POST /api/invoices/<invoice_id>/complete
Body: { "completed_by": "<cashier_user_id>" }
```

**First Call Expected:**

- Invoice status: `paid`
- Visit status: `completed`
- Visit `payment_status`: `paid`

**Second Call Expected:**

- Same response as first call
- No duplicate processing
- Log message: "Invoice already paid, returning existing data"

---

### Test 6: Complete Invoice with Missing Visit

**Goal:** Verify that completing invoice without `visit_id` returns error.

**Steps:**

1. Find or create an invoice without `visit_id` (may require manual DB update)
2. Attempt to complete invoice: `POST /api/invoices/:invoiceId/complete`
3. **Expected:** 400 Bad Request with code `INVOICE_MISSING_VISIT`
4. Check response includes `details.invoiceId` and `details.invoiceNumber`

**API Call:**

```bash
POST /api/invoices/<invoice_without_visit_id>/complete
Body: { "completed_by": "<cashier_user_id>" }
```

**Expected Response:**

```json
{
  "success": false,
  "message": "Cannot complete invoice: Invoice has no associated visit...",
  "code": "INVOICE_MISSING_VISIT",
  "details": {
    "invoiceId": "...",
    "invoiceNumber": "..."
  }
}
```

---

### Test 7: Invoice Completion Rollback

**Goal:** Verify that if visit completion fails, invoice is rolled back.

**Steps:**

1. Create an invoice with valid `visit_id`
2. Simulate visit completion failure (may require temporarily breaking visit completion)
3. Attempt to complete invoice
4. **Expected:** Invoice completion fails, invoice status remains unchanged
5. Check logs for rollback message

**Note:** This may require simulating a failure or temporarily breaking visit completion.

---

### Test 8: Audit Logging

**Goal:** Verify that visit status changes are logged.

**Steps:**

1. Perform the following actions:
   - Create a token (visit created)
   - Mark patient as missed (visit cancelled)
   - Complete consultation (visit `visit_end_time` set)
   - Complete invoice (visit completed)
2. Query audit logs: `SELECT * FROM audit_logs WHERE entity = 'visits' ORDER BY created_at DESC`
3. **Expected:** Entries for each action with:
   - `action`: 'CREATE', 'UPDATE'
   - `entity`: 'visits'
   - `old_values` and `new_values` for status changes
   - `reason`: Descriptive reason for change

**SQL Query:**

```sql
SELECT
  action,
  entity,
  record_id,
  old_values,
  new_values,
  reason,
  created_at
FROM audit_logs
WHERE entity = 'visits'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Edge Cases

### Edge Case 1: Multiple Tokens for Same Patient

- Create token for Patient C
- Immediately attempt to create another token for Patient C
- **Expected:** 409 `ACTIVE_TOKEN_EXISTS` (before active visit check)

### Edge Case 2: Visit Completion Race Condition

- Complete invoice twice simultaneously
- **Expected:** Both calls succeed (idempotent), second returns existing data

### Edge Case 3: Token with Visit but Visit Deleted

- Manually delete visit from database
- Attempt to complete consultation
- **Expected:** Visit update fails, consultation completion fails with appropriate error

---

## Verification Checklist

After running all tests, verify:

- [ ] No orphaned visits (visits without tokens)
- [ ] No orphaned tokens (tokens without visits)
- [ ] No invoices without visits (if possible)
- [ ] All visit status changes logged in audit_logs
- [ ] No duplicate visit completions
- [ ] All error responses include `code` and `details`
- [ ] All 409 conflicts include `ACTIVE_VISIT_EXISTS` or `ACTIVE_TOKEN_EXISTS`
- [ ] All 400 errors include appropriate error codes (`ORPHAN_TOKEN`, `INVOICE_MISSING_VISIT`)

---

## Database Queries for Verification

### Check for Orphaned Visits

```sql
SELECT v.*
FROM visits v
LEFT JOIN queue_tokens qt ON v.id = qt.visit_id
WHERE v.status = 'in_progress'
  AND qt.id IS NULL
  AND v.created_at > NOW() - INTERVAL '7 days';
```

### Check for Orphaned Tokens

```sql
SELECT qt.*
FROM queue_tokens qt
WHERE qt.visit_id IS NULL
  AND qt.status NOT IN ('cancelled', 'missed')
  AND qt.created_at > NOW() - INTERVAL '7 days';
```

### Check for Invoices Without Visits

```sql
SELECT i.*
FROM invoices i
WHERE i.visit_id IS NULL
  AND i.status = 'paid'
  AND i.created_at > NOW() - INTERVAL '7 days';
```

### Check Visit Status Changes in Audit Logs

```sql
SELECT
  record_id,
  action,
  old_values->>'status' as old_status,
  new_values->>'status' as new_status,
  reason,
  created_at
FROM audit_logs
WHERE entity = 'visits'
  AND action = 'UPDATE'
ORDER BY created_at DESC;
```
