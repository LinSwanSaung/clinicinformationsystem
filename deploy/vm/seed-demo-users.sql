INSERT INTO users (email, password_hash, first_name, last_name, role, specialty, is_active)
VALUES
  (
    'admin@clinic.com',
    '$2a$12$BS4SR0hCzf0yNpdJOYoMvugmDD6BTXHvxwFiP1IqmSq.RTUcGcvNS',
    'Admin',
    'User',
    'admin',
    NULL,
    true
  ),
  (
    'lin@gmail.com',
    '$2a$12$iHUT1Lalb5rrP07F06bjGOlDnzu7TN47PVuLhDw1tIYix/vJydEFi',
    'Lin',
    'Receptionist',
    'receptionist',
    NULL,
    true
  ),
  (
    'chue@gmail.com',
    '$2a$12$BsE9hCeoWNOp6EF/fFT4zepumcUXyR/Oa.W3VQK.WkVcazhD7T1iS',
    'Chue',
    'Nurse',
    'nurse',
    NULL,
    true
  ),
  (
    'zawoo@gmail.com',
    '$2a$12$D3jSUzwfV78gX/mbmtbSDep04YnJUmCUN7C/weAPNiHjjBGdZwm8.',
    'Zaw Oo',
    'Doctor',
    'doctor',
    'General Practice',
    true
  ),
  (
    'cashier1@gmail.com',
    '$2a$12$5HCIDZ4yGQOzesdSUr2li.f42r7hX808uJtcn6mqeMHx0ddJ2EOCO',
    'Cashier',
    'User',
    'cashier',
    NULL,
    true
  ),
  (
    'adamthegreat169@gmail.com',
    '$2a$12$o3/V2OEtn0I5Quob18ytneTCyw5f8m6bpxzudNar5DvB2qjmnnEOi',
    'Adam',
    'Patient',
    'patient',
    NULL,
    true
  )
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  specialty = EXCLUDED.specialty,
  is_active = true,
  updated_at = NOW();
