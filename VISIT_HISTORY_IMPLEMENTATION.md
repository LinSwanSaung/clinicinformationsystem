# Database Migration for Visit Services

## What You Need to Add to Your Database

To implement the comprehensive visit history feature, you'll need to add a few optional tables and enhancements to your existing schema:

### 1. **Visit Services Table** (Optional - for detailed service tracking)

```sql
-- Create visit_services table for detailed service tracking
CREATE TABLE IF NOT EXISTS visit_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    service_name VARCHAR(200) NOT NULL,
    service_category VARCHAR(100), -- consultation, procedure, test, medication_admin
    description TEXT,
    cost DECIMAL(10,2),
    duration_minutes INTEGER,
    performed_by UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'completed', -- pending, in_progress, completed, cancelled
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_service_status CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_visit_services_visit_id ON visit_services(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_services_category ON visit_services(service_category);
```

### 2. **Enhanced Visit Completion Workflow**

```sql
-- Add columns to visits table if they don't exist
ALTER TABLE visits 
ADD COLUMN IF NOT EXISTS consultation_fee DECIMAL(10,2) DEFAULT 50.00,
ADD COLUMN IF NOT EXISTS services_total DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS completion_notes TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_visits_completed_by ON visits(completed_by);
CREATE INDEX IF NOT EXISTS idx_visits_total_cost ON visits(total_cost);
```

### 3. **Sample Data for Testing**

```sql
-- Insert sample visit services for existing visits
INSERT INTO visit_services (visit_id, service_name, service_category, description, cost, performed_by) 
SELECT 
    v.id,
    'General Consultation',
    'consultation',
    'Standard medical consultation and examination',
    50.00,
    v.doctor_id
FROM visits v 
WHERE v.status = 'completed'
LIMIT 5;

-- Add some additional services
INSERT INTO visit_services (visit_id, service_name, service_category, description, cost) 
VALUES 
((SELECT id FROM visits WHERE status = 'completed' LIMIT 1), 'Blood Pressure Check', 'procedure', 'Vital signs measurement', 15.00),
((SELECT id FROM visits WHERE status = 'completed' LIMIT 1), 'Medication Administration', 'medication_admin', 'Injectable medication', 25.00);
```

## Implementation Status

### ✅ **Completed Backend Implementation:**
1. **Visit Model** (`Visit.model.js`) - Enhanced with comprehensive data loading
2. **Visit Service** (`Visit.service.js`) - Business logic for visit management
3. **Visit Routes** (`visit.routes.js`) - API endpoints for visit operations
4. **Route Registration** - Added to `app.js`

### ✅ **Completed Frontend Implementation:**
1. **VisitHistoryCard Component** - Comprehensive visit display
2. **Visit Service** (`visitService.js`) - Frontend API integration with caching
3. **EMR Integration** - Updated ElectronicMedicalRecords.jsx

### 🎯 **Current Features:**
- ✅ Complete visit history with allergies, diagnoses, prescriptions
- ✅ Visit cost calculation and payment status tracking
- ✅ Expandable visit cards with detailed information
- ✅ Real-time data loading with caching
- ✅ Service and cost breakdown display
- ✅ Doctor and patient information integration

### 🔧 **Backend API Endpoints:**
```
GET    /api/visits/patient/:patientId/history  - Get patient visit history
GET    /api/visits/:id/details                 - Get single visit details
POST   /api/visits                             - Create new visit
PUT    /api/visits/:id                         - Update visit
POST   /api/visits/:id/complete                - Complete visit with costs
GET    /api/visits/statistics                  - Get visit statistics
DELETE /api/visits/:id                         - Delete visit (admin only)
```

## Next Steps

### 1. **Run the Database Migration**
Execute the SQL commands above in your Supabase SQL editor to add the optional enhancements.

### 2. **Test the Implementation**
```bash
# Backend
cd backend
npm start

# Frontend  
cd frontend
npm run dev
```

### 3. **Create Sample Visits**
Use the doctor dashboard to complete some patient visits, which will automatically:
- Calculate consultation fees
- Track services provided
- Generate comprehensive visit records
- Display in the visit history

### 4. **Optional Enhancements**
- **Payment Processing**: Add payment gateway integration
- **Billing Module**: Create detailed billing and invoicing
- **Insurance Integration**: Add insurance claim processing
- **Reporting**: Generate visit and revenue reports
- **Mobile App**: Extend to mobile platforms

## Visit Data Structure

Each visit record now includes:
```javascript
{
  id: "uuid",
  visit_date: "2024-01-15T10:30:00Z",
  patient_id: "uuid", 
  doctor_id: "uuid",
  doctor_name: "Dr. Smith",
  visit_type: "consultation",
  status: "completed",
  chief_complaint: "Patient complaint",
  diagnosis: "Primary diagnosis",
  treatment_plan: "Treatment details",
  total_cost: 125.00,
  consultation_fee: 50.00,
  services_total: 75.00,
  payment_status: "paid",
  
  // Related data
  allergies: [...],           // Allergies recorded during visit
  visit_diagnoses: [...],     // Diagnoses from this visit  
  prescriptions: [...],       // Medications prescribed
  vitals: {...},             // Vital signs recorded
  services: [...]            // Services provided
}
```

This implementation provides a comprehensive foundation for visit history management that can be extended based on your specific clinic needs!