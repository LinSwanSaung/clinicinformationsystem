# Queue Delay/Undelay Implementation

## Overview
Implemented functionality for nurses to mark patients as "delayed" which removes them from the active queue. When undelayed, patients are automatically moved to the end of the queue with a new token number.

## Database Changes

### Migration File: `002_add_delayed_status.sql`

Added:
- 'delayed' status to queue_tokens table
- `delay_reason` TEXT - reason for delay
- `delayed_at` TIMESTAMPTZ - timestamp when delayed
- `undelayed_at` TIMESTAMPTZ - timestamp when undelayed
- `previous_status` VARCHAR(20) - status before being delayed

## Backend Implementation

### Queue.service.js

#### New Method: `delayToken(tokenId, reason)`
- Marks patient as delayed
- Stores previous status
- Records delay reason and timestamp
- Cannot delay patients who are currently being served or completed

**Flow:**
1. Check if token exists and is not serving/completed
2. Update status to 'delayed'
3. Store previous_status, delay_reason, delayed_at
4. Remove from active queue (status change handles this)

#### New Method: `undelayToken(tokenId)`
- Undelays patient
- Assigns NEW token number at END of queue
- Resets status to 'waiting'

**Flow:**
1. Check if token is currently delayed
2. Get highest token number for doctor/date
3. Assign newTokenNumber = maxTokenNumber + 1
4. Update status to 'waiting' with new token_number
5. Record undelayed_at timestamp

### API Routes (queue.routes.js)

#### PUT /api/queue/token/:tokenId/delay
**Access:** Nurse, Receptionist, Admin
**Body:**
```json
{
  "reason": "Patient stepped out"
}
```
**Response:**
```json
{
  "success": true,
  "data": {<updated_token>},
  "message": "Patient marked as delayed"
}
```

#### PUT /api/queue/token/:tokenId/undelay
**Access:** Nurse, Receptionist, Admin
**Response:**
```json
{
  "success": true,
  "data": {<updated_token>},
  "message": "Patient undelayed and moved to position #X in queue",
  "newTokenNumber": 15
}
```

## Queue Behavior

### Delayed Patients:
- ✅ Removed from active queue count
- ✅ Status shows as 'delayed'
- ✅ Delay reason displayed
- ✅ Not called for consultation
- ✅ Token number preserved (for reference)

### Undelayed Patients:
- ✅ Get NEW token number (highest + 1)
- ✅ Placed at END of queue
- ✅ Status reset to 'waiting'
- ✅ Will be called in new position
- ✅ Old token number is replaced

### Example Flow:
```
Initial Queue: #1, #2, #3, #4, #5

Nurse delays #3 (reason: "Waiting for lab results")
Queue becomes: #1, #2, #4, #5
Delayed: #3 (not in active queue)

Nurse undelays #3
Queue becomes: #1, #2, #4, #5, #6 (formerly #3)
#3's token number changed to #6
```

## Frontend Integration Needed

### Nurse Dashboard
1. Add "Delay Patient" button to patient cards
2. Add delay reason dialog
3. Show delayed patients in separate section
4. Add "Undelay" button for delayed patients
5. Update queue display to exclude delayed patients from count

### Patient Portal
1. Queue display should hide delayed patients
2. If patient is delayed, show appropriate message
3. Update estimated wait time calculation

## Database Migration

To apply this feature, run:
```bash
psql -h [host] -U [user] -d [database] -f backend/database/migrations/002_add_delayed_status.sql
```

Or use Supabase dashboard SQL editor to execute the migration file.

## Testing Checklist

- [ ] Run database migration
- [ ] Test delay endpoint with valid token
- [ ] Test delay with serving/completed token (should fail)
- [ ] Test undelay endpoint
- [ ] Verify new token number is highest + 1
- [ ] Check queue counts exclude delayed patients
- [ ] Test multiple delay/undelay cycles
- [ ] Verify delay reason is stored and displayed
- [ ] Test with multiple doctors' queues simultaneously

## Notes

- Delayed patients are NOT counted in "Total in Queue"
- Token numbers are reassigned on undelay to maintain queue order
- Delay reason is optional but recommended for tracking
- Previous status is stored but currently not used (future feature: restore to previous state)
- Delayed patients can be found by filtering status='delayed'
