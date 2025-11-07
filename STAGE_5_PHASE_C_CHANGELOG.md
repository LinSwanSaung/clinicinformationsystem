# Stage 5 Phase C — Auto-Cancel End-of-Day Appointments

## Summary

Implemented an automated job that cancels stale appointments from past days that have no paid invoice. This prevents appointments from remaining in `scheduled` or `waiting` status indefinitely and ensures data cleanliness.

## Changes

### 1. New Job: `autoCancelAppointments.js`

**Location:** `backend/src/jobs/autoCancelAppointments.js`

**Features:**

- Runs nightly at 23:55 local time (configurable via `AUTOCANCEL_CRON`)
- Scans appointments from past days (configurable via `AUTOCANCEL_LOOKBACK_DAYS`, default: 1 day)
- Cancels appointments that:
  - Are not already `cancelled` or `completed`
  - Have no associated paid invoice
  - Were not manually marked as missed/no-show
- Idempotent: can be run multiple times safely
- Dry-run mode: test without making changes (`AUTOCANCEL_DRY_RUN=true`)
- Comprehensive logging and audit trail

**Methods:**

- `start()` - Start the scheduled job
- `stop()` - Stop the scheduled job
- `getStatus()` - Get current job status
- `triggerManualCheck()` - Manually trigger a check (for testing)
- `processStaleAppointments()` - Main processing logic
- `checkHasPaidInvoice()` - Check if appointment has paid invoice
- `cancelAppointment()` - Cancel an appointment with audit logging

### 2. Integration

**Location:** `backend/src/app.js`

- Imported `appointmentAutoCancel` job
- Started job automatically when server starts
- Logs startup message with schedule description

### 3. Configuration

**Location:** `STAGE_5_PHASE_C_CONFIG.md`

- Complete configuration guide
- Environment variables documentation
- Cron schedule examples
- Troubleshooting guide
- Best practices

## Environment Variables

| Variable                   | Default       | Description                             |
| -------------------------- | ------------- | --------------------------------------- |
| `AUTOCANCEL_CRON`          | `55 23 * * *` | Cron schedule (daily at 23:55)          |
| `AUTOCANCEL_LOOKBACK_DAYS` | `1`           | Days back to check (default: yesterday) |
| `AUTOCANCEL_DRY_RUN`       | `false`       | Dry-run mode (no actual cancellation)   |
| `TZ`                       | `UTC`         | Timezone for cron schedule              |

## Behavior

### What Gets Cancelled

Appointments that:

1. Have `appointment_date` before cutoff (today - `LOOKBACK_DAYS`)
2. Status is NOT `cancelled` or `completed`
3. Have NO associated paid invoice (checked via visit → invoice chain)

### What Gets Skipped

Appointments that:

1. Are already `cancelled` or `completed`
2. Have a paid invoice (even if status is still `scheduled`)
3. Were manually marked as missed/no-show (status `no_show`)

### Audit Logging

All cancelled appointments are logged to `audit_logs`:

- `action`: `UPDATE`
- `entity`: `appointments`
- `old_values`: Previous status
- `new_values`: `{ status: 'cancelled', reason: 'auto_end_of_day' }`
- `reason`: `Auto-cancelled by end-of-day job - appointment from past day with no paid invoice`

## Safety Features

1. **Idempotency:** Safe to run multiple times
2. **Invoice Check:** Never cancels appointments with paid invoices
3. **Dry Run Mode:** Test without making changes
4. **Error Handling:** Continues processing even if one appointment fails
5. **Audit Logging:** All cancellations are logged

## Testing

### Manual Trigger

```javascript
import appointmentAutoCancel from "./jobs/autoCancelAppointments.js";
const result = await appointmentAutoCancel.triggerManualCheck();
```

### Dry Run Mode

```bash
AUTOCANCEL_DRY_RUN=true npm start
```

### Verify Results

- Check console logs for processing summary
- Query `audit_logs` for cancelled appointments
- Verify appointment statuses in database

## Files Changed

**New Files:**

- `backend/src/jobs/autoCancelAppointments.js`
- `STAGE_5_PHASE_C_CONFIG.md`
- `STAGE_5_PHASE_C_CHANGELOG.md`

**Modified Files:**

- `backend/src/app.js`

## Next Steps

- Monitor job execution in production
- Adjust `LOOKBACK_DAYS` based on workflow needs
- Review cancelled appointments periodically
- Consider adding API endpoint for manual trigger

## Related

- Stage 5 Phase A: Service-layer lifecycle fixes
- Stage 5 Phase B: Database lifecycle integrity constraints
- `CLINIC_WORKFLOW_AND_BUG_ANALYSIS.md` - Workflow documentation
