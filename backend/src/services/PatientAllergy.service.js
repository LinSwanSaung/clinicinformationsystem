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
   * Get allergy by ID
   */
  async getAllergyById(id) {
    try {
      return await PatientAllergyModel.findById(id);
    } catch (error) {
      throw new Error(`Failed to fetch allergy: ${error.message}`);
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
      // Check if allergy exists
      const existingAllergy = await PatientAllergyModel.findById(id);
      if (!existingAllergy) {
        throw new Error('Allergy not found');
      }

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
      // Check if allergy exists
      const existingAllergy = await PatientAllergyModel.findById(id);
      if (!existingAllergy) {
        throw new Error('Allergy not found');
      }

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
