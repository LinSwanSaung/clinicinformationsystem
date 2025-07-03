# RealCIS Database Schema

This directory contains the complete database schema and migration files for the RealCIS Clinic Information System.

## Database Structure

### Core Tables

1. **users** - System users (doctors, nurses, admins, receptionists)
2. **patients** - Patient demographics and information
3. **appointments** - Scheduled patient appointments
4. **visits** - Medical encounters and consultations
5. **vitals** - Patient vital signs and measurements
6. **prescriptions** - Medication prescriptions
7. **medical_documents** - Patient documents and files
8. **doctor_notes** - Clinical notes and observations
9. **audit_logs** - System audit trail and change tracking

## Files

- `schema.sql` - Complete database schema with all tables, indexes, triggers, and sample data
- `migrate.js` - Migration tool for setting up the database
- `migrations/` - Individual migration files for each table
- `seeds/` - Sample data for development and testing

## Setup Instructions

### Option 1: Run Complete Schema (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `schema.sql`
4. Click **"Run"**

### Option 2: Run Individual Migrations

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run each file in the `migrations/` folder in order:
   - `001_create_users_table.sql`
   - `002_create_patients_table.sql`
   - `003_create_appointments_table.sql`
   - `004_create_visits_table.sql`
   - `005_create_vitals_table.sql`
   - `006_create_prescriptions_table.sql`
   - `007_create_medical_documents_table.sql`
   - `008_create_doctor_notes_table.sql`
   - `009_create_audit_logs_table.sql`

4. Then run the seed data:
   - `seeds/001_sample_data.sql`

## Testing

After running the migrations, you can test the database connection:

```bash
npm run db:test
```

## Sample Data

The schema includes sample data for development:

### Default Users
- **Admin**: admin@clinic.com / admin123
- **Doctor**: dr.smith@clinic.com / doctor123
- **Doctor**: dr.johnson@clinic.com / doctor123
- **Nurse**: nurse.williams@clinic.com / nurse123
- **Nurse**: nurse.brown@clinic.com / nurse123
- **Receptionist**: reception@clinic.com / reception123

### Sample Patients
- Alice Anderson (A+, Hypertension)
- Robert Wilson (O-, Diabetes Type 2)
- Maria Garcia (B+, No conditions)
- James Taylor (AB+, Asthma)
- Linda Martinez (A-, High cholesterol)

## Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Password hashing** with bcrypt
- **Role-based access control**
- **Audit logging** for all changes
- **Data validation** with constraints

## Performance Features

- **Indexes** on frequently queried columns
- **Triggers** for automatic timestamp updates
- **Views** for common queries
- **Functions** for calculated fields (BMI, age)

## Backup and Maintenance

Supabase automatically handles:
- Daily backups
- Point-in-time recovery
- Database monitoring
- Performance optimization

## Support

For issues with the database schema or migrations, check:
1. Supabase Dashboard logs
2. Backend server logs
3. Network connectivity
4. Environment variables (.env file)
