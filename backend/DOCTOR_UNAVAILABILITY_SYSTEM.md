# Doctor Unavailability Management - Implementation Summary

## Overview
Automatic token management system that handles patient queue tokens when doctors are unavailable.

## Key Features

### 1. Smart Token Status Management
- ✅ **During breaks**: Tokens remain **ACTIVE** (doctor will return)
- ✅ **After day finished**: Tokens marked as **MISSED** (no more availability)
- ✅ **Automatic checking**: Runs every 5 minutes via scheduler

### 2. Database Functions (Supabase)
Located in: `backend/database/migrations/005_doctor_unavailability_management.sql`

#### Functions Created:
1. **`is_doctor_currently_available(doctor_id, check_time)`**
   - Checks if doctor is within working hours right now
   - Returns: BOOLEAN

2. **`get_doctor_next_available_time(doctor_id, check_time)`**
   - Finds the next available time slot for today
   - Returns: TIME

3. **`doctor_has_remaining_availability_today(doctor_id, check_time)`**
   - Checks if doctor has any more slots remaining today
   - Returns: BOOLEAN

4. **`mark_tokens_missed_during_unavailability(doctor_id, check_time)`**
   - Automatically processes tokens based on doctor availability
   - Only marks tokens as MISSED when doctor is completely finished for the day
   - Skips tokens during breaks (keeps them active)
   - Updates related visits to 'cancelled'
   - Creates audit log entries
   - Returns: TABLE of processed tokens

5. **`cancel_doctor_remaining_tokens(doctor_id, reason, performed_by)`**
   - Manually cancel all remaining tokens for a doctor
   - Useful for emergencies or unexpected situations
   - Returns: TABLE of cancelled tokens

### 3. Backend Services

#### TokenScheduler Service
- **File**: `backend/src/services/TokenScheduler.service.js`
- **Schedule**: Every 5 minutes (`*/5 * * * *`)
- **Purpose**: Automatically calls `checkAndMarkMissedTokens()` to process all doctors
- **Lifecycle**: Starts automatically when backend server starts

#### DoctorAvailability Service (Extended)
- **File**: `backend/src/services/DoctorAvailability.service.js`
- **New Methods**:
  - `checkAndMarkMissedTokens()` - Check all doctors
  - `checkDoctorMissedTokens(doctorId)` - Check specific doctor
  - `cancelDoctorRemainingTokens(doctorId, reason, performedBy)` - Manual cancellation
  - `isDoctorCurrentlyAvailable(doctorId)` - Check current status
  - `getDoctorAvailabilityStatus(doctorId)` - Get detailed status

### 4. API Endpoints
Located in: `backend/src/routes/doctorAvailability.routes.js`

```javascript
// Automatic token checking
POST /api/doctor-availability/check-missed-tokens
// Check all doctors and mark tokens as missed

POST /api/doctor-availability/check-missed-tokens/:doctorId
// Check specific doctor

// Manual token cancellation
POST /api/doctor-availability/cancel-remaining-tokens/:doctorId
Body: { reason: "Emergency", performedBy: "admin-uuid" }

// Status checking
GET /api/doctor-availability/status/:doctorId
// Get detailed availability status

GET /api/doctor-availability/scheduler-status
// Get scheduler status
```

## Deployment Steps

### Step 1: Run Migration in Supabase
1. Open Supabase Dashboard → SQL Editor
2. Copy entire content of `backend/database/migrations/005_doctor_unavailability_management.sql`
3. Paste and click **RUN**
4. Verify: Should see ✅ Success (no errors)

### Step 2: Verify Backend is Running
The TokenScheduler starts automatically when you run:
```bash
cd backend
npm start
```

You should see:
```
[TokenScheduler] ✓ Started - Running every 5 minutes
[TokenScheduler] Will automatically mark tokens as "missed" during doctor breaks and after working hours
```

## How It Works

### Example Scenario: Dr. Kaung Su Lin
**Wednesday Schedule:**
- 06:00 - 12:00 (Morning shift)
- 12:10 - 12:59 (Short shift)
- 13:00 - 23:45 (Afternoon/Evening shift)

**Token Behavior:**

| Time | Doctor Status | Token Status | Action |
|------|---------------|--------------|--------|
| 9:00 AM | Working | ACTIVE | ✅ No change |
| 12:05 PM | On break (12:00-12:10) | ACTIVE | ✅ No change (will return) |
| 11:50 PM | Finished (last slot 23:45) | MISSED | ❌ Marked as missed |

### Audit Trail
Every automatic token status change creates an audit log:
```json
{
  "action": "TOKEN.MISSED_AUTO",
  "table_name": "queue_tokens",
  "record_id": "token-uuid",
  "performed_by": null,
  "details": {
    "token_number": 1001,
    "doctor_id": "doctor-uuid",
    "doctor_name": "Dr. Kaung Su Lin",
    "patient_name": "John Doe",
    "reason": "Doctor has finished for the day. No remaining availability.",
    "previous_status": "waiting",
    "auto_marked_at": "2025-11-03T23:50:00Z"
  }
}
```

## Testing

The system has been tested with:
- ✅ Tokens during working hours (stay active)
- ✅ Tokens during breaks (stay active)
- ✅ Tokens after doctor finishes (marked as missed)
- ✅ Multiple doctor schedules
- ✅ Edge cases (midnight crossover, multiple breaks)

## Files Modified

### Database
- ✅ `backend/database/migrations/005_doctor_unavailability_management.sql` (NEW)
- ✅ `backend/database/schema.sql` (Updated with functions)

### Backend Services
- ✅ `backend/src/services/TokenScheduler.service.js` (NEW)
- ✅ `backend/src/services/DoctorAvailability.service.js` (Extended)

### Backend Routes
- ✅ `backend/src/routes/doctorAvailability.routes.js` (Added endpoints)

### Backend App
- ✅ `backend/src/app.js` (Integrated scheduler)

### Dependencies
- ✅ `backend/package.json` (Added `node-cron: ^3.0.3`)

## Maintenance Notes

### Adjusting Check Frequency
Edit `backend/src/services/TokenScheduler.service.js`:
```javascript
// Current: Every 5 minutes
this.scheduledTask = cron.schedule('*/5 * * * *', async () => {

// For every minute (testing):
this.scheduledTask = cron.schedule('* * * * *', async () => {

// For every 10 minutes:
this.scheduledTask = cron.schedule('*/10 * * * *', async () => {
```

### Manual Trigger
Use the API endpoint to manually check:
```bash
POST /api/doctor-availability/check-missed-tokens
```

### Emergency Stop
If needed to stop automatic checking:
```javascript
// In your code or via API
tokenScheduler.stop();
```

## Security Considerations

1. **RPC Functions**: Protected by Supabase RLS policies
2. **Service Role**: Backend uses service role key for administrative operations
3. **Audit Logs**: All automated actions are logged with NULL performer (system action)
4. **Manual Actions**: Require `performedBy` UUID for accountability

## Support

For issues or questions:
1. Check audit logs for token status changes
2. Verify doctor availability schedules in `doctor_availability` table
3. Check scheduler status via `/api/doctor-availability/scheduler-status`
4. Review console logs for `[TokenScheduler]` and `[DoctorAvailability]` messages
