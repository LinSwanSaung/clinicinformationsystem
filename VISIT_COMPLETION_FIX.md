# Visit Completion Logic Fix

## Problem

Visits were being completed when consultations ended, but they should only be completed when invoices are paid. This caused:

- Visits marked as `completed` before payment
- Inconsistent billing workflow
- Multiple active visits bug
- Premature visit completion

## Solution

**Business Rule:** Visits are only completed when invoices are paid, not when consultations end.

## Changes Made

### 1. `QueueService.completeConsultation()` ✅

**File:** `backend/src/services/Queue.service.js`

**Before:**

- Completed visit when consultation ended
- Set `visit_end_time` and `status: 'completed'`

**After:**

- Only sets `visit_end_time`
- Visit status remains `in_progress` until invoice is paid
- Added JSDoc documentation explaining business rule

### 2. `QueueService.forceEndActiveConsultation()` ✅

**File:** `backend/src/services/Queue.service.js`

**Before:**

- Completed visit when force-ending consultation

**After:**

- Only sets `visit_end_time`
- Visit status remains `in_progress` until invoice is paid

### 3. `InvoiceService.completeInvoice()` ✅

**File:** `backend/src/services/Invoice.service.js`

**Before:**

- Used `updateVisitStatus()` which only changed status
- Didn't calculate costs

**After:**

- Uses `completeVisit()` to properly calculate costs
- This is now the ONLY place visits are completed
- Added JSDoc documentation
- Better error handling

### 4. `VisitModel.completeVisit()` ✅

**File:** `backend/src/models/Visit.model.js`

**Before:**

- No idempotency check
- Could fail if visit already completed

**After:**

- Idempotent: returns existing data if already completed
- Validates only `in_progress` visits can be completed
- Better error messages
- Added JSDoc documentation

## New Workflow

```
CONSULTATION ENDS:
  ✅ Token: completed
  ✅ Visit: in_progress (payment_status: pending)
  ✅ visit_end_time: set
  ✅ Appointment: completed

INVOICE PAID:
  ✅ Invoice: paid
  ✅ Visit: completed (payment_status: paid) ← ONLY HERE
  ✅ total_cost: calculated
```

## Benefits

1. **Correct Business Logic:** Visits only complete when paid
2. **Cost Calculation:** Properly calculated when invoice is paid
3. **No Premature Completion:** Visits stay `in_progress` until payment
4. **Idempotent:** Safe to call `completeVisit()` multiple times
5. **Better Documentation:** Clear JSDoc comments explain business rules
6. **Error Prevention:** Validates visit status before completion

## Testing Checklist

- [ ] Consultation ends → visit stays `in_progress`
- [ ] Invoice paid → visit becomes `completed`
- [ ] Multiple invoice completions → idempotent (no errors)
- [ ] Visit already completed → returns existing data
- [ ] Visit cancelled → cannot be completed
- [ ] Cost calculation works correctly

## Files Modified

1. `backend/src/services/Queue.service.js`
2. `backend/src/services/Invoice.service.js`
3. `backend/src/models/Visit.model.js`
