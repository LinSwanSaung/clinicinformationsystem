import { supabase } from '../src/config/database.js';

/**
 * Database migration script
 * Creates all necessary tables for RealCIS
 */

const createTables = async () => {
  console.log('🔧 Starting database migration...');

  try {
    // Create Users table
    console.log('Creating users table...');
    const { error: usersError } = await supabase.rpc('create_users_table');
    if (usersError && !usersError.message.includes('already exists')) {
      throw usersError;
    }

    // Create Patients table  
    console.log('Creating patients table...');
    const { error: patientsError } = await supabase.rpc('create_patients_table');
    if (patientsError && !patientsError.message.includes('already exists')) {
      throw patientsError;
    }

    // Create Appointments table
    console.log('Creating appointments table...');
    const { error: appointmentsError } = await supabase.rpc('create_appointments_table');
    if (appointmentsError && !appointmentsError.message.includes('already exists')) {
      throw appointmentsError;
    }

    // Create other tables...
    console.log('Creating additional tables...');

    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// SQL Functions for table creation (these would be created in Supabase)
const sqlFunctions = `
-- Function to create users table
CREATE OR REPLACE FUNCTION create_users_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    role VARCHAR CHECK (role IN ('admin', 'doctor', 'nurse', 'receptionist')) NOT NULL,
    phone VARCHAR,
    specialty VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
END;
$$ LANGUAGE plpgsql;

-- Function to create patients table
CREATE OR REPLACE FUNCTION create_patients_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    photo VARCHAR,
    date_of_birth DATE NOT NULL,
    id_number VARCHAR UNIQUE,
    age INTEGER,
    gender VARCHAR CHECK (gender IN ('Male', 'Female', 'Other')) NOT NULL,
    contact VARCHAR,
    email VARCHAR,
    address TEXT,
    last_visit DATE,
    medical_history TEXT[],
    allergies TEXT[],
    medications TEXT,
    avatar_color VARCHAR,
    initials VARCHAR(5),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
  CREATE INDEX IF NOT EXISTS idx_patients_id_number ON patients(id_number);
  CREATE INDEX IF NOT EXISTS idx_patients_last_visit ON patients(last_visit);
END;
$$ LANGUAGE plpgsql;
`;

console.log('SQL Functions that should be created in Supabase:');
console.log(sqlFunctions);

// Run migration if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  createTables();
}
