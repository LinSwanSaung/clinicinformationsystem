import api from '@/services/api';

class PatientPortalService {
  async getProfile() {
    return api.get('/me/profile');
  }

  async getQueueStatus() {
    return api.get('/me/queue');
  }

  async getVisits(limit = 10, offset = 0) {
    return api.get('/me/visits', {
      params: { limit, offset },
    });
  }

  async getLatestVitals() {
    return api.get('/me/vitals/latest');
  }

  async getPrescriptions(includeInactive = false) {
    return api.get('/me/prescriptions', {
      params: { includeInactive },
    });
  }

  async getUpcomingAppointments(limit = 2) {
    return api.get('/me/appointments/upcoming', {
      params: { limit },
    });
  }

  async getRemainingCredit() {
    return api.get('/me/billing/remaining-credit');
  }

  async getOutstandingBalance() {
    return api.get('/me/billing/outstanding-balance');
  }
}

export default new PatientPortalService();
