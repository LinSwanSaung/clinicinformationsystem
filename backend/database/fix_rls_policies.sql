-- ===============================================
-- QUICK FIX: DISABLE RLS FOR DEVELOPMENT
-- Run this in Supabase SQL Editor to fix RLS policy issues
-- ===============================================

-- Disable RLS temporarily for development
ALTER TABLE patient_allergies DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_diagnoses DISABLE ROW LEVEL SECURITY;

-- Alternative: Update policies to allow service role access
-- (If you prefer to keep RLS enabled, uncomment below)

/*
-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read allergies" ON patient_allergies;
DROP POLICY IF EXISTS "Allow doctors and nurses to insert allergies" ON patient_allergies;
DROP POLICY IF EXISTS "Allow doctors and nurses to update allergies" ON patient_allergies;

DROP POLICY IF EXISTS "Allow authenticated users to read diagnoses" ON patient_diagnoses;
DROP POLICY IF EXISTS "Allow doctors to insert diagnoses" ON patient_diagnoses;
DROP POLICY IF EXISTS "Allow doctors to update diagnoses" ON patient_diagnoses;

-- Create new policies that allow service role access
CREATE POLICY "Allow service role full access to allergies"
    ON patient_allergies
    FOR ALL
    USING (true);

CREATE POLICY "Allow service role full access to diagnoses"
    ON patient_diagnoses
    FOR ALL
    USING (true);
*/

-- Verify RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('patient_allergies', 'patient_diagnoses');