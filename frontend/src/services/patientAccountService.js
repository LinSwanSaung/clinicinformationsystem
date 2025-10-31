import api from './api.js';

class PatientAccountService {
  async list(params = {}) {
    const response = await api.get('/auth/patient-accounts', { params });
    return response;
  }

  async bindAccount(userId, patientId) {
    const response = await api.post(`/auth/patient-accounts/${userId}/bind`, {
      patient_id: patientId
    });
    return response;
  }

  async unbindAccount(userId) {
    const response = await api.delete(`/auth/patient-accounts/${userId}/bind`);
    return response;
  }
}

const patientAccountService = new PatientAccountService();
export default patientAccountService;
