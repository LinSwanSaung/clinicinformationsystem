import api from '@/services/api';

class PatientAccountService {
  async list(params = {}) {
    const response = await api.get('/auth/patient-accounts', { params });
    return response;
  }

  async bindAccount(userId, patientId) {
    const response = await api.post(`/auth/patient-accounts/${userId}/bind`, {
      patient_id: patientId,
    });
    return response;
  }

  async unbindAccount(userId) {
    const response = await api.delete(`/auth/patient-accounts/${userId}/bind`);
    return response;
  }

  async deactivate(userId) {
    const response = await api.put(`/auth/patient-accounts/${userId}/deactivate`);
    return response;
  }

  async activate(userId) {
    const response = await api.put(`/auth/patient-accounts/${userId}/activate`);
    return response;
  }

  async softDelete(userId) {
    const response = await api.delete(`/auth/patient-accounts/${userId}`);
    return response;
  }
}

const patientAccountService = new PatientAccountService();
export default patientAccountService;
