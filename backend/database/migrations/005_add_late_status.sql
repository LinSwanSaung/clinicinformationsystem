-- Add 'late' status to appointments table
-- This allows receptionists to manually mark appointments as late

-- Drop the old constraint
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS valid_status;

-- Add new constraint with 'late' status
ALTER TABLE appointments ADD CONSTRAINT valid_status 
  CHECK (status IN ('scheduled', 'waiting', 'ready_for_doctor', 'consulting', 'completed', 'cancelled', 'no_show', 'late'));

-- Comment explaining the late status
COMMENT ON COLUMN appointments.status IS 
'Appointment status: 
- scheduled: Initial state when appointment is booked
- late: Patient arrived more than 10 minutes late (manually marked by receptionist)
- waiting: Patient checked in and in queue (has token)
- ready_for_doctor: After vitals taken, ready for consultation
- consulting: Doctor currently consulting
- completed: Consultation finished
- cancelled: Appointment cancelled
- no_show: Patient did not show up';
