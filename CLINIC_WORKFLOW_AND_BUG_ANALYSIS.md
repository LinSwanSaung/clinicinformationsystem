# Clinic Workflow: Visits, Tokens, and Appointments Lifecycle

## Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    APPOINTMENT CREATION                          │
│  Receptionist creates scheduled appointment                     │
│  Status: 'scheduled'                                            │
│  No visit or token created yet                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Patient arrives
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              APPOINTMENT → TOKEN CONVERSION                      │
│  Receptionist marks appointment as arrived/ready                  │
│  → Queue token created (status: 'waiting')                      │
│  → Visit created (status: 'in_progress', visit_type: 'appointment')│
│  → Token linked to visit via visit_id                           │
│  → Appointment status → 'waiting'                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ OR (Walk-in)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WALK-IN REGISTRATION                          │
│  Receptionist registers walk-in patient                          │
│  → Queue token created (status: 'waiting')                      │
│  → Visit created (status: 'in_progress', visit_type: 'walk_in') │
│  → Token linked to visit via visit_id                           │
│  → Token status → 'ready' (immediate)                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Doctor calls next
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              CONSULTATION STARTS                                 │
│  Doctor calls next patient (callNextAndStart)                   │
│  → Token: 'waiting' → 'called' → 'serving'                     │
│  → Visit: visit_start_time set, status: 'in_progress'         │
│  → Appointment (if linked): status → 'in_progress'             │
│                                                                  │
│  During consultation:                                           │
│  ✅ Medical data can be added (requires active visit):          │
│     - Vitals (nurse)                                             │
│     - Allergies, Diagnoses, Notes (doctor)                      │
│     - Prescriptions (doctor)                                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Consultation ends
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              CONSULTATION ENDS                                   │
│  Doctor completes consultation (completeConsultation)            │
│  → Token: 'serving' → 'completed'                              │
│  → Visit: visit_end_time set, status: 'in_progress' ⚠️        │
│     (Visit stays in_progress until invoice is paid)             │
│  → Appointment (if linked): status → 'completed'               │
│                                                                  │
│  ⚠️ IMPORTANT: Visit is NOT completed here!                      │
│     It remains 'in_progress' until payment                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Invoice created & paid
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              INVOICE PAYMENT                                     │
│  Cashier processes payment (completeInvoice)                    │
│  → Invoice: status → 'paid'                                     │
│  → Visit: status → 'completed' ✅                               │
│     payment_status → 'paid'                                     │
│     total_cost calculated (consultation fee + services)         │
│  → Notification sent to receptionists                           │
│                                                                  │
│  ✅ THIS IS THE ONLY PLACE VISITS ARE COMPLETED                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Entity Lifecycle Details

### 1. APPOINTMENT Lifecycle

| Status        | When                          | Trigger                               | Associated Entities          |
| ------------- | ----------------------------- | ------------------------------------- | ---------------------------- |
| `scheduled`   | Created by receptionist       | `POST /api/appointments`              | None yet                     |
| `waiting`     | Patient arrives, token issued | `QueueService.issueToken()`           | Token created, Visit created |
| `in_progress` | Doctor calls patient          | `QueueService.callNextAndStart()`     | Token: 'serving'             |
| `completed`   | Consultation ends             | `QueueService.completeConsultation()` | Token: 'completed'           |
| `cancelled`   | Cancelled manually            | Admin/Receptionist                    | Token/Visit cancelled        |
| `no_show`     | Patient marked as missed      | `QueueService.markPatientMissed()`    | Token: 'missed'              |

**Creation:**

- **When:** Receptionist creates scheduled appointment
- **Where:** `AppointmentService.createAppointment()`
- **No visit/token created yet**

**Conversion to Token:**

- **When:** Patient arrives for appointment
- **Where:** `QueueService.issueToken()` with `appointment_id`
- **Creates:** Token + Visit (both linked)

---

### 2. QUEUE TOKEN Lifecycle

| Status      | When                     | Trigger                               | Visit Status                         |
| ----------- | ------------------------ | ------------------------------------- | ------------------------------------ |
| `waiting`   | Token issued             | `QueueService.issueToken()`           | `in_progress` (created)              |
| `ready`     | Walk-in or patient ready | Auto or manual                        | `in_progress`                        |
| `called`    | Doctor calls next        | `QueueService.callNextAndStart()`     | `in_progress`                        |
| `serving`   | Consultation starts      | `QueueService.callNextAndStart()`     | `in_progress` (visit_start_time set) |
| `completed` | Consultation ends        | `QueueService.completeConsultation()` | `in_progress` (visit_end_time set)   |
| `missed`    | Patient no-show          | `QueueService.markPatientMissed()`    | `cancelled` (if visit exists)        |
| `cancelled` | Token cancelled          | `QueueService.cancelToken()`          | `cancelled` (if visit exists)        |

**Creation:**

- **When:**
  - Walk-in registration
  - Appointment patient arrives
- **Where:** `QueueService.issueToken()`
- **Creates Visit:** Yes, automatically
- **Links:** `token.visit_id = visit.id`

**Completion:**

- **When:** Doctor ends consultation
- **Where:** `QueueService.completeConsultation()`
- **Does NOT complete visit:** Only sets `visit_end_time`

---

### 3. VISIT Lifecycle

| Status        | When                   | Trigger                                      | Can Add Medical Data?      |
| ------------- | ---------------------- | -------------------------------------------- | -------------------------- |
| `in_progress` | Token issued           | `QueueService.issueToken()`                  | ✅ Yes                     |
| `in_progress` | Consultation ends      | `QueueService.completeConsultation()`        | ❌ No (visit_end_time set) |
| `completed`   | Invoice paid           | `InvoiceService.completeInvoice()`           | ❌ No                      |
| `cancelled`   | Token cancelled/missed | `QueueService.cancelToken()` or DB functions | ❌ No                      |

**Creation:**

- **When:** Token is issued (walk-in or appointment)
- **Where:** `QueueService.issueToken()` → `VisitService.createVisit()`
- **Initial Status:** `in_progress`
- **Initial Payment Status:** `pending`

**Completion:**

- **When:** Invoice is paid
- **Where:** `InvoiceService.completeInvoice()` → `VisitService.completeVisit()`
- **Calculates:** `total_cost = consultation_fee + services_total`
- **Sets:** `status: 'completed'`, `payment_status: 'paid'`

**⚠️ CRITICAL:** Visit is ONLY completed when invoice is paid, NOT when consultation ends!

---

## Potential Bug Scenarios

### Bug #1: Token has no `visit_id` ❌

**Location:** `QueueService.completeConsultation()` line 669

**When it happens:**

- Token created before visit creation was implemented
- Visit creation failed silently during token creation
- Token created manually without visit
- Database inconsistency

**Impact:**

- Visit never gets `visit_end_time` set
- Visit stays `in_progress` forever
- No way to track consultation end time

**Current handling:**

```javascript
if (token.visit_id) {
  // Update visit
} else {
  console.warn("[QUEUE] ⚠️ Token has no visit_id, skipping visit update");
  // ⚠️ Visit never gets updated
}
```

**Fix needed:**

- Ensure all tokens have `visit_id` (backfill script)
- Fail token creation if visit creation fails
- Add validation: token cannot be created without visit

---

### Bug #2: Visit update fails silently ❌

**Location:** `QueueService.completeConsultation()` line 665-667

**When it happens:**

- Database connection issues
- Visit already deleted
- Permission errors
- Validation errors

**Impact:**

- `visit_end_time` never set
- Visit stays `in_progress` without end time
- Can't track consultation duration

**Current handling:**

```javascript
try {
  await this.visitService.updateVisit(token.visit_id, {...});
} catch (visitError) {
  console.error('[QUEUE] ❌ Failed to update visit end time:', visitError.message);
  // ⚠️ Error logged but operation continues
  // Don't fail the entire operation if visit update fails
}
```

**Fix needed:**

- Retry mechanism for transient errors
- Alert/notification when visit update fails
- Consider failing consultation completion if visit update fails

---

### Bug #3: Invoice has no `visit_id` ❌

**Location:** `InvoiceService.completeInvoice()` line 357

**When it happens:**

- Invoice created without `visit_id`
- Visit deleted before invoice creation
- Manual invoice creation without visit link

**Impact:**

- Invoice paid but visit never completed
- Visit stays `in_progress` forever
- Billing inconsistency

**Current handling:**

```javascript
if (invoice.visit_id) {
  await this.visitService.completeVisit(invoice.visit_id, {...});
} else {
  console.warn('[InvoiceService] ⚠️ Invoice has no visit_id, skipping visit completion');
  // ⚠️ Visit never gets completed
}
```

**Fix needed:**

- Ensure all invoices have `visit_id` (validation on creation)
- Fail invoice creation if visit doesn't exist
- Add admin tool to link invoices to visits

---

### Bug #4: Visit completion fails but invoice completes ❌

**Location:** `InvoiceService.completeInvoice()` line 350-354

**When it happens:**

- Visit already completed (race condition)
- Visit deleted
- Database error during visit completion
- Cost calculation fails

**Impact:**

- Invoice marked as paid
- Visit stays `in_progress`
- Money received but visit not closed

**Current handling:**

```javascript
try {
  await this.visitService.completeVisit(invoice.visit_id, {...});
} catch (visitError) {
  console.error('[InvoiceService] ❌ Failed to complete visit:', visitError.message);
  throw new Error(`Invoice completed but visit completion failed: ${visitError.message}`);
  // ⚠️ Invoice already completed, but visit failed
}
```

**Fix needed:**

- Transaction/rollback: if visit completion fails, rollback invoice completion
- Or: Complete visit first, then invoice (atomic operation)
- Retry mechanism for transient errors

---

### Bug #5: Multiple visits for same patient ❌

**Location:** `QueueService.issueToken()` line 113-207

**When it happens:**

- Patient gets multiple tokens (bug in validation)
- Each token creates a new visit
- Only one token completes → other visits stay `in_progress`

**Impact:**

- Multiple `in_progress` visits for same patient
- Warning doesn't show correctly
- Billing confusion

**Current handling:**

- Checks for existing active token, but doesn't prevent multiple visits
- Visit created for each token

**Fix needed:**

- Check for existing `in_progress` visit before creating new one
- Reuse existing visit if patient already has active visit
- Validation: one active visit per patient at a time

---

### Bug #6: `markPatientMissed()` doesn't cancel visit ❌

**Location:** `QueueService.markPatientMissed()` line 684-703

**When it happens:**

- Patient marked as missed/no-show
- Visit exists but not cancelled

**Impact:**

- Visit stays `in_progress` forever
- Can't add medical data for new visits (active visit check fails)

**Current handling:**

```javascript
async markPatientMissed(tokenId) {
  const updatedToken = await this.queueTokenModel.updateStatus(tokenId, 'missed');
  // ⚠️ No visit handling!
  // Only updates appointment if linked
}
```

**Fix needed:**

```javascript
if (updatedToken.visit_id) {
  await this.visitService.updateVisit(updatedToken.visit_id, {
    status: "cancelled",
  });
}
```

**Note:** Database functions handle this, but service method doesn't!

---

### Bug #7: Visit created but token creation fails ❌

**Location:** `QueueService.issueToken()` line 136-179

**When it happens:**

- Visit created successfully
- Token creation fails (validation, database error)
- Visit has no associated token
- No way to complete it through normal flow

**Impact:**

- Orphaned `in_progress` visit
- Can't complete via consultation flow
- Must be manually completed

**Current handling:**

```javascript
// Create visit first
const visitResponse = await this.visitService.createVisit(visitData);
visitRecord = visitResponse.data;

// Then create token
const newToken = await this.queueTokenModel.createToken({
  visit_id: visitRecord?.id || null,
  // ⚠️ If token creation fails, visit is orphaned
});
```

**Fix needed:**

- Transaction: if token creation fails, rollback visit creation
- Or: Create token first, then visit (but then visit might fail)
- Better: Use database transaction to ensure both succeed or both fail

---

### Bug #8: Visit completion called multiple times (race condition) ❌

**Location:** `InvoiceService.completeInvoice()` + `VisitModel.completeVisit()`

**When it happens:**

- Multiple invoice completion requests simultaneously
- Network retry causes duplicate calls
- User clicks "Complete" multiple times

**Impact:**

- First call completes visit
- Second call might fail or cause errors
- Inconsistent state

**Current handling:**

- `completeVisit()` is now idempotent (returns existing data if already completed)
- ✅ This is FIXED!

---

### Bug #9: Visit completed but invoice never created ❌

**Location:** Manual visit completion or edge case

**When it happens:**

- Visit manually completed via `POST /api/visits/:id/complete`
- Invoice never created
- Payment never processed

**Impact:**

- Visit marked as `completed` but unpaid
- Billing inconsistency
- Revenue tracking issues

**Current handling:**

- Manual completion allowed (doctor/admin)
- No validation that invoice exists

**Fix needed:**

- Prevent manual completion if invoice exists and unpaid
- Or: Allow manual completion but mark as unpaid
- Add validation/alert

---

### Bug #10: Visit status changed externally ❌

**Location:** Direct database updates or external systems

**When it happens:**

- Database migration changes status
- External system updates visit
- Manual SQL update
- Admin panel direct edit

**Impact:**

- Visit status inconsistent with business logic
- Billing workflow breaks
- Data integrity issues

**Current handling:**

- No protection against external changes

**Fix needed:**

- Database triggers to log status changes
- Validation in update methods
- Audit logging for all status changes

---

## Bug Prevention Checklist

### ✅ Already Fixed

- [x] Visit completion idempotency
- [x] Visit only completes when invoice paid (not when consultation ends)
- [x] Cost calculation in `completeVisit()`

### ⚠️ Needs Fixing

- [ ] `markPatientMissed()` should cancel visit
- [ ] Transaction handling for visit+token creation
- [ ] Validation: one active visit per patient
- [ ] Invoice completion should use transaction (visit + invoice)
- [ ] Ensure all tokens have `visit_id` (backfill)
- [ ] Ensure all invoices have `visit_id` (validation)

### 🔍 Monitoring Needed

- [ ] Alert when visits stay `in_progress` > 24 hours
- [ ] Alert when tokens have no `visit_id`
- [ ] Alert when invoices have no `visit_id`
- [ ] Dashboard showing stuck visits
- [ ] Audit log for all visit status changes

---

## Summary: When Bugs Occur

### Most Likely Scenarios:

1. **Token has no `visit_id`** → Visit never gets `visit_end_time`
2. **Invoice has no `visit_id`** → Visit never gets completed
3. **`markPatientMissed()` bug** → Visit stays `in_progress`
4. **Multiple visits per patient** → Warning doesn't show correctly
5. **Visit completion fails** → Invoice paid but visit not completed

### Prevention Strategy:

1. **Validation:** Ensure all tokens/invoices have `visit_id`
2. **Transactions:** Use DB transactions for atomic operations
3. **Idempotency:** All completion methods should be idempotent ✅
4. **Monitoring:** Alert on stuck visits
5. **Testing:** Test all edge cases and failure scenarios
