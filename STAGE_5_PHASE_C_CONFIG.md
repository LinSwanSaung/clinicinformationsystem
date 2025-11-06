# Stage 5 Phase C — Auto-Cancel End-of-Day Appointments Configuration

## Overview

The auto-cancel job automatically cancels appointments from past days that:

- Are not already `cancelled` or `completed`
- Have no associated paid invoice
- Were not manually marked as missed/no-show

This prevents stale appointments from cluttering the system and ensures data cleanliness.

## Environment Variables

### Required

None (uses sensible defaults)

### Optional

| Variable                   | Default       | Description                                                           |
| -------------------------- | ------------- | --------------------------------------------------------------------- |
| `AUTOCANCEL_CRON`          | `55 23 * * *` | Cron schedule (runs daily at 23:55)                                   |
| `AUTOCANCEL_LOOKBACK_DAYS` | `1`           | How many days back to check (default: yesterday)                      |
| `AUTOCANCEL_DRY_RUN`       | `false`       | If `true`, only logs what would be cancelled (no actual cancellation) |
| `TZ`                       | `UTC`         | Timezone for cron schedule (e.g., `America/New_York`, `Asia/Yangon`)  |

## Configuration Examples

### Default (Recommended)

```bash
# Runs daily at 23:55 local time
AUTOCANCEL_CRON="55 23 * * *"
AUTOCANCEL_LOOKBACK_DAYS=1
```

### Custom Schedule

```bash
# Run at midnight
AUTOCANCEL_CRON="0 0 * * *"

# Run at 11:30 PM
AUTOCANCEL_CRON="30 23 * * *"

# Run every 6 hours (for testing)
AUTOCANCEL_CRON="0 */6 * * *"
```

### Timezone Configuration

```bash
# Myanmar timezone
TZ="Asia/Yangon"
AUTOCANCEL_CRON="55 23 * * *"  # 23:55 Myanmar time

# US Eastern timezone
TZ="America/New_York"
AUTOCANCEL_CRON="55 23 * * *"  # 23:55 Eastern time
```

### Dry Run Mode (Testing)

```bash
# Enable dry run to test without cancelling
AUTOCANCEL_DRY_RUN=true
AUTOCANCEL_LOOKBACK_DAYS=7  # Check last 7 days
```

## Cron Schedule Format

The cron schedule uses standard cron syntax:

```
* * * * *
│ │ │ │ │
│ │ │ │ └── Day of week (0-7, 0 or 7 = Sunday)
│ │ │ └──── Month (1-12)
│ │ └────── Day of month (1-31)
│ └──────── Hour (0-23)
└────────── Minute (0-59)
```

### Common Schedules

| Schedule      | Description                    |
| ------------- | ------------------------------ |
| `55 23 * * *` | Daily at 23:55 (default)       |
| `0 0 * * *`   | Daily at midnight              |
| `0 */6 * * *` | Every 6 hours                  |
| `0 0 * * 0`   | Weekly on Sunday at midnight   |
| `0 0 1 * *`   | Monthly on the 1st at midnight |

## How It Works

1. **Query Stale Appointments:**
   - Finds appointments with `appointment_date` before cutoff (today - `LOOKBACK_DAYS`)
   - Excludes appointments with status `cancelled` or `completed`
   - Orders by date (oldest first)

2. **Check for Paid Invoice:**
   - For each appointment, checks if there's a linked visit
   - If visit exists, checks if it has a paid invoice
   - If paid invoice exists, appointment is skipped

3. **Cancel Appointment:**
   - Updates appointment status to `cancelled`
   - Logs audit event with reason `auto_end_of_day`
   - Skips if in dry-run mode

4. **Report Results:**
   - Logs total scanned, cancelled, and skipped
   - Includes appointment IDs for cancelled appointments

## Disabling the Job

### Method 1: Environment Variable (Recommended)

```bash
# Don't set AUTOCANCEL_CRON or set to empty
AUTOCANCEL_CRON=""
```

### Method 2: Code Modification

In `backend/src/app.js`, comment out:

```javascript
// appointmentAutoCancel.start();
```

### Method 3: Stop at Runtime

```javascript
// Via API or code
appointmentAutoCancel.stop();
```

## Manual Trigger (Testing)

You can manually trigger the job for testing:

```javascript
// In Node.js console or API endpoint
import appointmentAutoCancel from "./jobs/autoCancelAppointments.js";

const result = await appointmentAutoCancel.triggerManualCheck();
console.log(result);
```

Or via API (if endpoint is added):

```bash
POST /api/admin/appointments/auto-cancel/trigger
```

## Monitoring

### Logs

The job logs to console:

```
[AppointmentAutoCancel] Running end-of-day auto-cancel check...
[AppointmentAutoCancel] Scanning appointments before 2025-01-20...
[AppointmentAutoCancel] Found 5 stale appointments to process
[AppointmentAutoCancel] ✓ Cancelled appointment abc12345 (2025-01-19)
[AppointmentAutoCancel] ✓ Processed 5 appointments
[AppointmentAutoCancel]   - Cancelled: 3
[AppointmentAutoCancel]   - Skipped: 2
```

### Audit Logs

All cancelled appointments are logged in `audit_logs`:

- `action`: `UPDATE`
- `entity`: `appointments`
- `old_values`: `{ status: 'scheduled' }`
- `new_values`: `{ status: 'cancelled', reason: 'auto_end_of_day' }`
- `reason`: `Auto-cancelled by end-of-day job - appointment from past day with no paid invoice`

### Status Check

```javascript
const status = appointmentAutoCancel.getStatus();
console.log(status);
// {
//   isRunning: true,
//   schedule: '55 23 * * *',
//   scheduleDescription: 'Daily at 23:55',
//   lookbackDays: 1,
//   dryRun: false,
//   description: 'Automatically cancels stale appointments from past days'
// }
```

## Safety Features

1. **Idempotency:** Can be run multiple times safely (won't cancel already-cancelled appointments)
2. **Invoice Check:** Never cancels appointments with paid invoices
3. **Dry Run Mode:** Test without making changes
4. **Error Handling:** Continues processing even if one appointment fails
5. **Audit Logging:** All cancellations are logged for accountability

## Troubleshooting

### Job Not Running

- Check if `AUTOCANCEL_CRON` is set correctly
- Verify timezone (`TZ` env var)
- Check server logs for startup messages
- Verify `appointmentAutoCancel.start()` is called in `app.js`

### Too Many Cancellations

- Increase `AUTOCANCEL_LOOKBACK_DAYS` to give more time
- Check if appointments are being marked as completed properly
- Review audit logs to see why appointments were cancelled

### Not Cancelling Enough

- Decrease `AUTOCANCEL_LOOKBACK_DAYS` to check more recent appointments
- Verify appointment statuses are correct
- Check if invoices are being created properly

### Timezone Issues

- Set `TZ` environment variable to your local timezone
- Verify cron schedule matches your timezone
- Check server logs for actual execution times

## Best Practices

1. **Start with Dry Run:** Test with `AUTOCANCEL_DRY_RUN=true` first
2. **Monitor Logs:** Check logs after first few runs
3. **Review Audit Logs:** Periodically review cancelled appointments
4. **Adjust Lookback:** Set `LOOKBACK_DAYS` based on your workflow (default 1 day is usually sufficient)
5. **Timezone Awareness:** Always set `TZ` to match your clinic's timezone

## Related Files

- `backend/src/jobs/autoCancelAppointments.js` - Main job implementation
- `backend/src/app.js` - Job initialization
- `backend/src/utils/auditLogger.js` - Audit logging utility
- `backend/src/models/Appointment.model.js` - Appointment data access
