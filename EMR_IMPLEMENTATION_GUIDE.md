# EMR Implementation Guide

## 📋 Step-by-Step Implementation Plan

This guide walks you through implementing the complete EMR (Electronic Medical Records) system with database persistence.

---

## 🎯 Phase 1: Database Setup

### Step 1: Run Database Migration

1. **Open Supabase SQL Editor**
2. **Run the migration script:**
   - File: `backend/database/migrations/001_emr_enhancements.sql`
   - This creates:
     - `patient_allergies` table
     - `patient_diagnoses` table
     - Enhances `prescriptions` table
     - Creates helper views
     - Sets up RLS policies

3. **Verify tables created:**
   ```sql
   -- Check if tables exist
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('patient_allergies', 'patient_diagnoses');
   ```

---

## 🎯 Phase 2: Backend Implementation

### Step 2: Create Models

#### A. PatientAllergy Model

**File:** `backend/src/models/PatientAllergy.model.js`

```javascript
import { supabase } from '../config/database.js';
import BaseModel from './BaseModel.js';

class PatientAllergyModel extends BaseModel {
  constructor() {
    super('patient_allergies');
  }

  /**
   * Get all allergies for a patient
   */
  async getByPatientId(patientId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('patient_id', patientId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Create new allergy
   */
  async create(allergyData) {
    const { data, error } = await supabase
      .from(this.table)
      .insert(allergyData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update allergy
   */
  async update(id, allergyData) {
    const { data, error } = await supabase
      .from(this.table)
      .update({ ...allergyData, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Soft delete allergy (mark as inactive)
   */
  async softDelete(id) {
    const { data, error } = await supabase
      .from(this.table)
      .update({ 
        is_active: false, 
        deleted_at: new Date(),
        updated_at: new Date() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get active allergies with patient info
   */
  async getActiveAllergies() {
    const { data, error } = await supabase
      .from('active_patient_allergies')
      .select('*');

    if (error) throw error;
    return data;
  }
}

export default new PatientAllergyModel();
```

#### B. PatientDiagnosis Model

**File:** `backend/src/models/PatientDiagnosis.model.js`

```javascript
import { supabase } from '../config/database.js';
import BaseModel from './BaseModel.js';

class PatientDiagnosisModel extends BaseModel {
  constructor() {
    super('patient_diagnoses');
  }

  /**
   * Get all diagnoses for a patient
   */
  async getByPatientId(patientId, includeResolved = false) {
    let query = supabase
      .from(this.table)
      .select('*')
      .eq('patient_id', patientId)
      .is('deleted_at', null)
      .order('diagnosed_date', { ascending: false });

    if (!includeResolved) {
      query = query.in('status', ['active', 'chronic', 'in_remission', 'recurring']);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Get diagnoses for a specific visit
   */
  async getByVisitId(visitId) {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('visit_id', visitId)
      .is('deleted_at', null);

    if (error) throw error;
    return data;
  }

  /**
   * Create new diagnosis
   */
  async create(diagnosisData) {
    const { data, error } = await supabase
      .from(this.table)
      .insert(diagnosisData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update diagnosis
   */
  async update(id, diagnosisData) {
    const { data, error } = await supabase
      .from(this.table)
      .update({ ...diagnosisData, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update diagnosis status
   */
  async updateStatus(id, status, resolvedDate = null) {
    const updateData = { 
      status, 
      updated_at: new Date() 
    };
    
    if (status === 'resolved' && resolvedDate) {
      updateData.resolved_date = resolvedDate;
    }

    const { data, error } = await supabase
      .from(this.table)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get active diagnoses
   */
  async getActiveDiagnoses() {
    const { data, error } = await supabase
      .from('active_patient_diagnoses')
      .select('*');

    if (error) throw error;
    return data;
  }
}

export default new PatientDiagnosisModel();
```

### Step 3: Create Services

#### A. PatientAllergy Service

**File:** `backend/src/services/PatientAllergy.service.js`

```javascript
import PatientAllergyModel from '../models/PatientAllergy.model.js';

class PatientAllergyService {
  /**
   * Get all allergies for a patient
   */
  async getAllergiesByPatient(patientId) {
    try {
      return await PatientAllergyModel.getByPatientId(patientId);
    } catch (error) {
      throw new Error(`Failed to fetch allergies: ${error.message}`);
    }
  }

  /**
   * Create new allergy
   */
  async createAllergy(allergyData) {
    try {
      // Validate required fields
      if (!allergyData.patient_id || !allergyData.allergy_name) {
        throw new Error('patient_id and allergy_name are required');
      }

      return await PatientAllergyModel.create(allergyData);
    } catch (error) {
      throw new Error(`Failed to create allergy: ${error.message}`);
    }
  }

  /**
   * Update allergy
   */
  async updateAllergy(id, allergyData) {
    try {
      return await PatientAllergyModel.update(id, allergyData);
    } catch (error) {
      throw new Error(`Failed to update allergy: ${error.message}`);
    }
  }

  /**
   * Delete allergy (soft delete)
   */
  async deleteAllergy(id) {
    try {
      return await PatientAllergyModel.softDelete(id);
    } catch (error) {
      throw new Error(`Failed to delete allergy: ${error.message}`);
    }
  }

  /**
   * Get all active allergies
   */
  async getAllActiveAllergies() {
    try {
      return await PatientAllergyModel.getActiveAllergies();
    } catch (error) {
      throw new Error(`Failed to fetch active allergies: ${error.message}`);
    }
  }
}

export default new PatientAllergyService();
```

#### B. PatientDiagnosis Service

**File:** `backend/src/services/PatientDiagnosis.service.js`

```javascript
import PatientDiagnosisModel from '../models/PatientDiagnosis.model.js';

class PatientDiagnosisService {
  /**
   * Get all diagnoses for a patient
   */
  async getDiagnosesByPatient(patientId, includeResolved = false) {
    try {
      return await PatientDiagnosisModel.getByPatientId(patientId, includeResolved);
    } catch (error) {
      throw new Error(`Failed to fetch diagnoses: ${error.message}`);
    }
  }

  /**
   * Get diagnoses for a visit
   */
  async getDiagnosesByVisit(visitId) {
    try {
      return await PatientDiagnosisModel.getByVisitId(visitId);
    } catch (error) {
      throw new Error(`Failed to fetch visit diagnoses: ${error.message}`);
    }
  }

  /**
   * Create new diagnosis
   */
  async createDiagnosis(diagnosisData) {
    try {
      // Validate required fields
      if (!diagnosisData.patient_id || !diagnosisData.diagnosis_name || !diagnosisData.diagnosed_by) {
        throw new Error('patient_id, diagnosis_name, and diagnosed_by are required');
      }

      // Set diagnosed_date to today if not provided
      if (!diagnosisData.diagnosed_date) {
        diagnosisData.diagnosed_date = new Date().toISOString().split('T')[0];
      }

      return await PatientDiagnosisModel.create(diagnosisData);
    } catch (error) {
      throw new Error(`Failed to create diagnosis: ${error.message}`);
    }
  }

  /**
   * Update diagnosis
   */
  async updateDiagnosis(id, diagnosisData) {
    try {
      return await PatientDiagnosisModel.update(id, diagnosisData);
    } catch (error) {
      throw new Error(`Failed to update diagnosis: ${error.message}`);
    }
  }

  /**
   * Update diagnosis status
   */
  async updateDiagnosisStatus(id, status, resolvedDate = null) {
    try {
      return await PatientDiagnosisModel.updateStatus(id, status, resolvedDate);
    } catch (error) {
      throw new Error(`Failed to update diagnosis status: ${error.message}`);
    }
  }

  /**
   * Get all active diagnoses
   */
  async getAllActiveDiagnoses() {
    try {
      return await PatientDiagnosisModel.getActiveDiagnoses();
    } catch (error) {
      throw new Error(`Failed to fetch active diagnoses: ${error.message}`);
    }
  }
}

export default new PatientDiagnosisService();
```

### Step 4: Create Routes

#### A. PatientAllergy Routes

**File:** `backend/src/routes/patientAllergy.routes.js`

```javascript
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import patientAllergyService from '../services/PatientAllergy.service.js';

const router = express.Router();

/**
 * @route   GET /api/patient-allergies/patient/:patientId
 * @desc    Get all allergies for a patient
 * @access  Private (Doctor, Nurse)
 */
router.get(
  '/patient/:patientId',
  authenticate,
  authorize('doctor', 'nurse', 'receptionist'),
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const allergies = await patientAllergyService.getAllergiesByPatient(patientId);
      
      res.json({
        success: true,
        data: allergies
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/patient-allergies
 * @desc    Create new allergy
 * @access  Private (Doctor, Nurse)
 */
router.post(
  '/',
  authenticate,
  authorize('doctor', 'nurse'),
  async (req, res) => {
    try {
      const allergyData = {
        ...req.body,
        diagnosed_by: req.body.diagnosed_by || req.user.id
      };
      
      const allergy = await patientAllergyService.createAllergy(allergyData);
      
      res.status(201).json({
        success: true,
        data: allergy
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route   PUT /api/patient-allergies/:id
 * @desc    Update allergy
 * @access  Private (Doctor, Nurse)
 */
router.put(
  '/:id',
  authenticate,
  authorize('doctor', 'nurse'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const allergy = await patientAllergyService.updateAllergy(id, req.body);
      
      res.json({
        success: true,
        data: allergy
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route   DELETE /api/patient-allergies/:id
 * @desc    Delete allergy (soft delete)
 * @access  Private (Doctor, Nurse)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('doctor', 'nurse'),
  async (req, res) => {
    try {
      const { id } = req.params;
      await patientAllergyService.deleteAllergy(id);
      
      res.json({
        success: true,
        message: 'Allergy deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

export default router;
```

#### B. PatientDiagnosis Routes

**File:** `backend/src/routes/patientDiagnosis.routes.js`

```javascript
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import patientDiagnosisService from '../services/PatientDiagnosis.service.js';

const router = express.Router();

/**
 * @route   GET /api/patient-diagnoses/patient/:patientId
 * @desc    Get all diagnoses for a patient
 * @access  Private (Doctor, Nurse)
 */
router.get(
  '/patient/:patientId',
  authenticate,
  authorize('doctor', 'nurse', 'receptionist'),
  async (req, res) => {
    try {
      const { patientId } = req.params;
      const { includeResolved } = req.query;
      
      const diagnoses = await patientDiagnosisService.getDiagnosesByPatient(
        patientId, 
        includeResolved === 'true'
      );
      
      res.json({
        success: true,
        data: diagnoses
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route   GET /api/patient-diagnoses/visit/:visitId
 * @desc    Get diagnoses for a visit
 * @access  Private (Doctor, Nurse)
 */
router.get(
  '/visit/:visitId',
  authenticate,
  authorize('doctor', 'nurse'),
  async (req, res) => {
    try {
      const { visitId } = req.params;
      const diagnoses = await patientDiagnosisService.getDiagnosesByVisit(visitId);
      
      res.json({
        success: true,
        data: diagnoses
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/patient-diagnoses
 * @desc    Create new diagnosis
 * @access  Private (Doctor only)
 */
router.post(
  '/',
  authenticate,
  authorize('doctor'),
  async (req, res) => {
    try {
      const diagnosisData = {
        ...req.body,
        diagnosed_by: req.body.diagnosed_by || req.user.id
      };
      
      const diagnosis = await patientDiagnosisService.createDiagnosis(diagnosisData);
      
      res.status(201).json({
        success: true,
        data: diagnosis
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route   PUT /api/patient-diagnoses/:id
 * @desc    Update diagnosis
 * @access  Private (Doctor only)
 */
router.put(
  '/:id',
  authenticate,
  authorize('doctor'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const diagnosis = await patientDiagnosisService.updateDiagnosis(id, req.body);
      
      res.json({
        success: true,
        data: diagnosis
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route   PATCH /api/patient-diagnoses/:id/status
 * @desc    Update diagnosis status
 * @access  Private (Doctor only)
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize('doctor'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, resolved_date } = req.body;
      
      const diagnosis = await patientDiagnosisService.updateDiagnosisStatus(
        id, 
        status, 
        resolved_date
      );
      
      res.json({
        success: true,
        data: diagnosis
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

export default router;
```

### Step 5: Register Routes in app.js

**File:** `backend/src/app.js`

Add these imports and route registrations:

```javascript
// Add imports
import patientAllergyRoutes from './routes/patientAllergy.routes.js';
import patientDiagnosisRoutes from './routes/patientDiagnosis.routes.js';

// Add routes (after existing routes)
app.use('/api/patient-allergies', patientAllergyRoutes);
app.use('/api/patient-diagnoses', patientDiagnosisRoutes);
```

---

## 🎯 Phase 3: Frontend Implementation

### Step 6: Create Frontend Services

#### A. Allergy Service

**File:** `frontend/src/services/allergyService.js`

```javascript
import api from './api';

class AllergyService {
  /**
   * Get all allergies for a patient
   */
  async getAllergiesByPatient(patientId) {
    const response = await api.get(`/patient-allergies/patient/${patientId}`);
    return response.data.data;
  }

  /**
   * Create new allergy
   */
  async createAllergy(allergyData) {
    const response = await api.post('/patient-allergies', allergyData);
    return response.data.data;
  }

  /**
   * Update allergy
   */
  async updateAllergy(id, allergyData) {
    const response = await api.put(`/patient-allergies/${id}`, allergyData);
    return response.data.data;
  }

  /**
   * Delete allergy
   */
  async deleteAllergy(id) {
    const response = await api.delete(`/patient-allergies/${id}`);
    return response.data;
  }
}

export const allergyService = new AllergyService();
```

#### B. Diagnosis Service

**File:** `frontend/src/services/diagnosisService.js`

```javascript
import api from './api';

class DiagnosisService {
  /**
   * Get all diagnoses for a patient
   */
  async getDiagnosesByPatient(patientId, includeResolved = false) {
    const response = await api.get(`/patient-diagnoses/patient/${patientId}`, {
      params: { includeResolved }
    });
    return response.data.data;
  }

  /**
   * Get diagnoses for a visit
   */
  async getDiagnosesByVisit(visitId) {
    const response = await api.get(`/patient-diagnoses/visit/${visitId}`);
    return response.data.data;
  }

  /**
   * Create new diagnosis
   */
  async createDiagnosis(diagnosisData) {
    const response = await api.post('/patient-diagnoses', diagnosisData);
    return response.data.data;
  }

  /**
   * Update diagnosis
   */
  async updateDiagnosis(id, diagnosisData) {
    const response = await api.put(`/patient-diagnoses/${id}`, diagnosisData);
    return response.data.data;
  }

  /**
   * Update diagnosis status
   */
  async updateDiagnosisStatus(id, status, resolvedDate = null) {
    const response = await api.patch(`/patient-diagnoses/${id}/status`, {
      status,
      resolved_date: resolvedDate
    });
    return response.data.data;
  }
}

export const diagnosisService = new DiagnosisService();
```

---

## 🎯 Phase 4: Update EMR Components

### Step 7: Update ElectronicMedicalRecords.jsx

Replace dummy data handlers with real API calls.

**Key Changes:**
1. Import services at the top
2. Load allergies and diagnoses when patient is selected
3. Implement save handlers with API calls
4. Add loading states and error handling

---

## ✅ Implementation Checklist

### Database
- [ ] Run `001_emr_enhancements.sql` in Supabase
- [ ] Verify tables created successfully
- [ ] Test RLS policies

### Backend
- [ ] Create `PatientAllergy.model.js`
- [ ] Create `PatientDiagnosis.model.js`
- [ ] Create `PatientAllergy.service.js`
- [ ] Create `PatientDiagnosis.service.js`
- [ ] Create `patientAllergy.routes.js`
- [ ] Create `patientDiagnosis.routes.js`
- [ ] Register routes in `app.js`
- [ ] Test endpoints with Postman/Thunder Client

### Frontend
- [ ] Create `allergyService.js`
- [ ] Create `diagnosisService.js`
- [ ] Update `ElectronicMedicalRecords.jsx` to use real APIs
- [ ] Update `MedicalInformationPanel.jsx` if needed
- [ ] Test in browser

---

## 🧪 Testing

### API Testing
```bash
# Test allergy endpoints
GET    http://localhost:5000/api/patient-allergies/patient/:patientId
POST   http://localhost:5000/api/patient-allergies
PUT    http://localhost:5000/api/patient-allergies/:id
DELETE http://localhost:5000/api/patient-allergies/:id

# Test diagnosis endpoints
GET    http://localhost:5000/api/patient-diagnoses/patient/:patientId
POST   http://localhost:5000/api/patient-diagnoses
PUT    http://localhost:5000/api/patient-diagnoses/:id
PATCH  http://localhost:5000/api/patient-diagnoses/:id/status
```

---

Would you like me to proceed with creating these files?

