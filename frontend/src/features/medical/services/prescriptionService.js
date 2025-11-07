import api from '@/services/api';

/**
 * Prescription Service
 * Handles prescription-related API calls
 */

// Create a new prescription
export const createPrescription = async (prescriptionData) => {
  try {
    const response = await api.post('/prescriptions', prescriptionData);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error creating prescription:', error);
    throw error;
  }
};

// Get prescriptions for a patient
export const getPrescriptionsByPatient = async (patientId, includeInactive = false) => {
  try {
    const response = await api.get(`/prescriptions/patient/${patientId}`, {
      params: { includeInactive }
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    throw error;
  }
};

// Get prescriptions for a visit
export const getPrescriptionsByVisit = async (visitId) => {
  try {
    const response = await api.get(`/prescriptions/visit/${visitId}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error fetching visit prescriptions:', error);
    throw error;
  }
};

// Update prescription status
export const updatePrescriptionStatus = async (prescriptionId, status) => {
  try {
    const response = await api.patch(`/prescriptions/${prescriptionId}/status`, { status });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error updating prescription status:', error);
    throw error;
  }
};

// Cancel a prescription
export const cancelPrescription = async (prescriptionId) => {
  try {
    const response = await api.delete(`/prescriptions/${prescriptionId}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error cancelling prescription:', error);
    throw error;
  }
};

export default {
  createPrescription,
  getPrescriptionsByPatient,
  getPrescriptionsByVisit,
  updatePrescriptionStatus,
  cancelPrescription
};
