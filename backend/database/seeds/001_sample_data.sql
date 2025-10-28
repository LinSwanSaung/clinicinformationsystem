-- Sample data for testing
-- Note: Password hashes are for demonstration purposes only

-- Admin user (admin@clinic.com / admin123)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_active)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'admin@clinic.com',
  '$2a$10$EWxNn5CnFpKXr3BONO/XYeABOXArpS8UYj7woLBnGw5jLvfnz9XdK', -- bcrypt hash for 'admin123'
  'System',
  'Administrator',
  '555-1000',
  'admin',
  true
) ON CONFLICT (email) DO NOTHING;

-- Doctor user
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, specialty, license_number, is_active)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'doctor@clinic.com',
  '$2a$10$BNxTl9qVrUFJ5Rz9HGDDuuAYxlQVQA5iiEP5k6PLbTpOMFATLZnFe', -- bcrypt hash for 'doctor123'
  'John',
  'Smith',
  '555-2000',
  'doctor',
  'General Medicine',
  'MD12345',
  true
) ON CONFLICT (email) DO NOTHING;

-- Nurse user
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_active)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'nurse@clinic.com',
  '$2a$10$oDVT/nLoD9.GIFGbD6enfeIp/WHuZI03NwmST4jV5tIJYSMxgNyOu', -- bcrypt hash for 'nurse123'
  'Sarah',
  'Johnson',
  '555-3000',
  'nurse',
  true
) ON CONFLICT (email) DO NOTHING;

-- Receptionist user
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_active)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'receptionist@clinic.com',
  '$2a$10$hs0.VJgHi9VgCEa2OUupHehPEmhp0q.34/9zIQcgQ7WAzfpI39gOK', -- bcrypt hash for 'recept123'
  'Emily',
  'Brown',
  '555-4000',
  'receptionist',
  true
) ON CONFLICT (email) DO NOTHING;
