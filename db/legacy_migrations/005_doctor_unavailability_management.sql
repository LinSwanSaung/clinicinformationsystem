-- ===============================================
-- MIGRATION: Doctor Unavailability Management
-- Description: Add functions to automatically handle tokens when doctor is unavailable
-- Date: 2025-11-03
-- 
-- Features:
-- 1. Check if doctor is currently available (within working hours)
-- 2. Get doctor's next available time slot
-- 3. Check if doctor has remaining availability today
-- 4. Automatically mark tokens as MISSED when doctor finishes for the day
-- 5. Tokens remain ACTIVE during breaks (doctor will return)
-- 
-- Usage: Run this migration in Supabase SQL Editor
-- ===============================================

-- Function to check if doctor is currently available (not on break, within working hours)
CREATE OR REPLACE FUNCTION is_doctor_currently_available(
    p_doctor_id UUID,
    p_check_time TIMESTAMPTZ DEFAULT NOW()
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_day VARCHAR;
    v_current_time TIME;
    v_is_available BOOLEAN;
BEGIN
    -- Get current day and time
    v_current_day := TO_CHAR(p_check_time, 'Day');
    v_current_day := TRIM(INITCAP(v_current_day)); -- Format: 'Monday', 'Tuesday', etc.
    v_current_time := p_check_time::TIME;
    
    -- Check if doctor has an active availability slot for current time
    SELECT EXISTS (
        SELECT 1
        FROM doctor_availability
        WHERE doctor_id = p_doctor_id
        AND day_of_week = v_current_day
        AND start_time <= v_current_time
        AND end_time > v_current_time
        AND is_active = true
    ) INTO v_is_available;
    
    RETURN v_is_available;
END;
$$ LANGUAGE plpgsql;

-- Function to get doctor's next available time slot for today
CREATE OR REPLACE FUNCTION get_doctor_next_available_time(
    p_doctor_id UUID,
    p_check_time TIMESTAMPTZ DEFAULT NOW()
) RETURNS TIME AS $$
DECLARE
    v_current_day VARCHAR;
    v_current_time TIME;
    v_next_start_time TIME;
BEGIN
    v_current_day := TO_CHAR(p_check_time, 'Day');
    v_current_day := TRIM(INITCAP(v_current_day));
    v_current_time := p_check_time::TIME;
    
    -- Get the next availability slot start time after current time
    SELECT start_time INTO v_next_start_time
    FROM doctor_availability
    WHERE doctor_id = p_doctor_id
    AND day_of_week = v_current_day
    AND start_time > v_current_time
    AND is_active = true
    ORDER BY start_time ASC
    LIMIT 1;
    
    RETURN v_next_start_time;
END;
$$ LANGUAGE plpgsql;

-- Function to check if doctor has any remaining availability today
CREATE OR REPLACE FUNCTION doctor_has_remaining_availability_today(
    p_doctor_id UUID,
    p_check_time TIMESTAMPTZ DEFAULT NOW()
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_day VARCHAR;
    v_current_time TIME;
    v_has_availability BOOLEAN;
BEGIN
    v_current_day := TO_CHAR(p_check_time, 'Day');
    v_current_day := TRIM(INITCAP(v_current_day));
    v_current_time := p_check_time::TIME;
    
    -- Check if there are any availability slots remaining today
    SELECT EXISTS (
        SELECT 1
        FROM doctor_availability
        WHERE doctor_id = p_doctor_id
        AND day_of_week = v_current_day
        AND end_time > v_current_time  -- Any slot that hasn't ended yet
        AND is_active = true
    ) INTO v_has_availability;
    
    RETURN v_has_availability;
END;
$$ LANGUAGE plpgsql;

-- Function to mark tokens as missed when doctor is unavailable
CREATE OR REPLACE FUNCTION mark_tokens_missed_during_unavailability(
    p_doctor_id UUID DEFAULT NULL,  -- If NULL, check all doctors
    p_check_time TIMESTAMPTZ DEFAULT NOW()
) RETURNS TABLE (
    updated_token_id UUID,
    token_number INTEGER,
    patient_name TEXT,
    reason TEXT
) AS $$
DECLARE
    token_record RECORD;
    v_is_currently_available BOOLEAN;
    v_has_more_availability BOOLEAN;
    v_next_available TIME;
    v_missed_reason TEXT;
    v_current_date DATE;
BEGIN
    v_current_date := p_check_time::DATE;
    
    -- Loop through all active tokens for the day
    FOR token_record IN
        SELECT 
            qt.id,
            qt.token_number,
            qt.doctor_id,
            qt.status,
            qt.issued_date,
            qt.visit_id,
            p.first_name || ' ' || p.last_name AS patient_name,
            u.first_name || ' ' || u.last_name AS doctor_name
        FROM queue_tokens qt
        JOIN patients p ON qt.patient_id = p.id
        JOIN users u ON qt.doctor_id = u.id
        WHERE qt.issued_date = v_current_date
        AND qt.status IN ('waiting', 'called', 'delayed')  -- Only active statuses
        AND (p_doctor_id IS NULL OR qt.doctor_id = p_doctor_id)
        AND u.is_active = true  -- Only check active doctors
    LOOP
        -- Check doctor's current availability
        v_is_currently_available := is_doctor_currently_available(
            token_record.doctor_id, 
            p_check_time
        );
        
        -- If doctor is not currently available, check if they're done for the day
        IF NOT v_is_currently_available THEN
            v_has_more_availability := doctor_has_remaining_availability_today(
                token_record.doctor_id,
                p_check_time
            );
            
            -- Only mark as missed if doctor has NO remaining availability (finished for the day)
            -- If doctor is just on break, skip this token (keep it active)
            IF NOT v_has_more_availability THEN
                -- Doctor has no more availability today - mark as missed
                v_missed_reason := 'Doctor ' || token_record.doctor_name || 
                    ' has finished for the day. No remaining availability.';
            ELSE
                -- Doctor is on break but will return - skip, keep token active
                CONTINUE;
            END IF;
            
            -- Update token status to missed
            UPDATE queue_tokens
            SET 
                status = 'missed',
                updated_at = p_check_time,
                previous_status = token_record.status,
                delay_reason = v_missed_reason
            WHERE id = token_record.id;
            
            -- Update related visit if exists
            IF token_record.visit_id IS NOT NULL THEN
                UPDATE visits
                SET 
                    status = 'cancelled',
                    updated_at = p_check_time
                WHERE id = token_record.visit_id
                AND status = 'in_progress';
            END IF;
            
            -- Log audit event
            INSERT INTO audit_logs (
                action,
                table_name,
                record_id,
                performed_by,
                details
            ) VALUES (
                'TOKEN.MISSED_AUTO',
                'queue_tokens',
                token_record.id,
                NULL,  -- System action
                jsonb_build_object(
                    'token_number', token_record.token_number,
                    'doctor_id', token_record.doctor_id,
                    'doctor_name', token_record.doctor_name,
                    'patient_name', token_record.patient_name,
                    'reason', v_missed_reason,
                    'previous_status', token_record.status,
                    'auto_marked_at', p_check_time
                )
            );
            
            -- Return updated token info
            RETURN QUERY SELECT 
                token_record.id,
                token_record.token_number,
                token_record.patient_name,
                v_missed_reason;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to manually mark all waiting tokens as missed for a specific doctor
CREATE OR REPLACE FUNCTION cancel_doctor_remaining_tokens(
    p_doctor_id UUID,
    p_reason TEXT DEFAULT 'Doctor unavailable for the rest of the day',
    p_performed_by UUID DEFAULT NULL
) RETURNS TABLE (
    cancelled_token_id UUID,
    token_number INTEGER,
    patient_name TEXT
) AS $$
DECLARE
    token_record RECORD;
    v_current_date DATE;
BEGIN
    v_current_date := CURRENT_DATE;
    
    -- Update all active tokens for the doctor today
    FOR token_record IN
        SELECT 
            qt.id,
            qt.token_number,
            qt.visit_id,
            p.first_name || ' ' || p.last_name AS patient_name
        FROM queue_tokens qt
        JOIN patients p ON qt.patient_id = p.id
        WHERE qt.doctor_id = p_doctor_id
        AND qt.issued_date = v_current_date
        AND qt.status IN ('waiting', 'called', 'delayed')
    LOOP
        -- Update token to missed
        UPDATE queue_tokens
        SET 
            status = 'missed',
            updated_at = NOW(),
            delay_reason = p_reason
        WHERE id = token_record.id;
        
        -- Update related visit if exists
        IF token_record.visit_id IS NOT NULL THEN
            UPDATE visits
            SET 
                status = 'cancelled',
                updated_at = NOW()
            WHERE id = token_record.visit_id
            AND status = 'in_progress';
        END IF;
        
        -- Log audit event
        INSERT INTO audit_logs (
            action,
            table_name,
            record_id,
            performed_by,
            details
        ) VALUES (
            'TOKEN.CANCELLED_DOCTOR_UNAVAILABLE',
            'queue_tokens',
            token_record.id,
            p_performed_by,
            jsonb_build_object(
                'token_number', token_record.token_number,
                'doctor_id', p_doctor_id,
                'patient_name', token_record.patient_name,
                'reason', p_reason,
                'cancelled_at', NOW()
            )
        );
        
        RETURN QUERY SELECT 
            token_record.id,
            token_record.token_number,
            token_record.patient_name;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION is_doctor_currently_available IS 'Check if a doctor is currently available (within working hours, not on break)';
COMMENT ON FUNCTION get_doctor_next_available_time IS 'Get the next available time slot for a doctor today';
COMMENT ON FUNCTION doctor_has_remaining_availability_today IS 'Check if doctor has any remaining availability slots today';
COMMENT ON FUNCTION mark_tokens_missed_during_unavailability IS 'Automatically mark tokens as missed when doctor is on break or finished for the day';
COMMENT ON FUNCTION cancel_doctor_remaining_tokens IS 'Manually cancel all remaining tokens for a doctor with a reason';
