# Appointment Queue Delay/Undelay Implementation

## Overview
Extended the delay/undelay functionality to work with the `appointment_queue` table, which is the active queue system being used in production.

## Problem
The initial implementation only worked on the `queue_tokens` table, but the actual patient data was in the `appointment_queue` table. When nurses tried to undelay patients, nothing happened because the system was checking an empty table.

## Solution

### 1. Database Migration (`003_add_delayed_status_appointment_queue.sql`)

**Changes to `appointment_queue` table:**
- Added `'delayed'` to the status CHECK constraint
- Added tracking columns:
  - `delay_reason TEXT` - Why the patient was delayed
  - `delayed_at TIMESTAMPTZ` - When marked as delayed
  - `undelayed_at TIMESTAMPTZ` - When removed from delayed status
  - `previous_queue_position INTEGER` - Original position before delay

**Indexes created:**
- `idx_appointment_queue_delayed` - Fast lookup of delayed patients
- `idx_appointment_queue_active` - Fast lookup of active queue (excludes delayed)

### 2. Backend Service Methods (`Queue.service.js`)

**New Methods:**

#### `delayAppointmentQueue(appointmentQueueId, reason)`
- Validates patient can be delayed (not already delayed, completed, etc.)
- Sets status to 'delayed'
- Saves delay reason and timestamp
- Preserves original queue position
- Removes patient from active queue

#### `undelayAppointmentQueue(appointmentQueueId)`
- Validates patient is currently delayed
- Finds the highest queue position for same doctor/date
- Assigns new position at end of queue (max + 1)
- Resets status to 'queued'
- Records undelay timestamp

**Key Logic:**
```javascript
// Get max position excluding delayed patients
const maxPositionData = await this.supabase
  .from('appointment_queue')
  .select('queue_position, appointment:appointments!appointment_id(appointment_date)')
  .eq('doctor_id', currentEntry.doctor_id)
  .neq('status', 'delayed')
  .order('queue_position', { ascending: false });

// Filter by same appointment date
const sameDate = maxPositionData.filter(entry => 
  entry.appointment?.appointment_date === appointmentDate
);
const newQueuePosition = (sameDate[0]?.queue_position || 0) + 1;
```

### 3. API Routes (`queue.routes.js`)

**New Endpoints:**

#### `PUT /api/queue/appointment/:appointmentQueueId/delay`
- Body: `{ reason?: string }`
- Response: Updated appointment queue entry
- Access: Nurse, Receptionist, Admin

#### `PUT /api/queue/appointment/:appointmentQueueId/undelay`
- No body required
- Response: Updated appointment queue entry with new position
- Access: Nurse, Receptionist, Admin

### 4. Schema Updates (`schema.sql`)

Updated the `appointment_queue` table definition to match the migration:
- Added delay tracking columns
- Updated status comment to include 'delayed'
- Updated CHECK constraint to allow 'delayed' status

## How to Deploy

### 1. Run the Migration
```bash
cd backend
node -e "
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const sql = fs.readFileSync('./database/migrations/003_add_delayed_status_appointment_queue.sql', 'utf8');
(async () => {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) console.error('Error:', error);
  else console.log('Migration successful!');
})();
"
```

Or connect to your Supabase database and run the SQL file directly.

### 2. Restart Backend Server
```bash
npm start
```

## Usage

### Frontend Integration

The frontend already has the UI for delay/undelay buttons. It just needs to call the correct endpoint based on the queue type:

```javascript
// For appointment queue (current system)
const delayPatient = async (appointmentQueueId, reason) => {
  const response = await fetch(
    `${API_URL}/api/queue/appointment/${appointmentQueueId}/delay`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    }
  );
  return response.json();
};

const undelayPatient = async (appointmentQueueId) => {
  const response = await fetch(
    `${API_URL}/api/queue/appointment/${appointmentQueueId}/undelay`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.json();
};
```

### Testing

1. **Delay a patient:**
   - Find a patient in `appointment_queue` with status='queued'
   - Note their queue_position (e.g., 5)
   - Call delay endpoint
   - Verify status changed to 'delayed'
   - Verify they're no longer in active queue list

2. **Undelay a patient:**
   - Call undelay endpoint on delayed patient
   - Verify status changed back to 'queued'
   - Verify they received new queue_position at end (e.g., 15)
   - Verify they appear in active queue again

## Database Schema

### Before
```sql
status VARCHAR(20) DEFAULT 'queued',
CONSTRAINT valid_queue_status CHECK (
  status IN ('queued', 'in_progress', 'completed', 'skipped', 'cancelled')
)
```

### After
```sql
status VARCHAR(20) DEFAULT 'queued', -- includes 'delayed'
delay_reason TEXT,
delayed_at TIMESTAMPTZ,
undelayed_at TIMESTAMPTZ,
previous_queue_position INTEGER,
CONSTRAINT valid_queue_status CHECK (
  status IN ('queued', 'in_progress', 'completed', 'skipped', 'cancelled', 'delayed')
)
```

## Notes

- Both queue systems now support delay/undelay:
  - `queue_tokens` - For walk-in patients
  - `appointment_queue` - For appointment patients (currently in use)
- Delayed patients are excluded from active queue statistics
- Queue position recalculation considers same doctor and same date
- Previous queue position is preserved for audit purposes
- Undelayed patients always go to the END of the queue
