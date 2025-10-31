import api from './api.js';
import doctorAvailabilityService from './doctorAvailabilityService.js';

class QueueService {
  constructor() {
    this.baseURL = '/queue'; // Remove /api prefix since api service already includes it
  }

  // ===============================================
  // QUEUE TOKEN OPERATIONS
  // ===============================================

  /**
   * Check if doctor can accept more walk-in patients
   */
  async checkDoctorCapacity(doctorId) {
    try {
      const response = await api.get(`${this.baseURL}/doctor/${doctorId}/capacity`);
      // API service already returns the parsed JSON payload
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to check doctor capacity');
    }
  }

  /**
   * Issue a new queue token for walk-in patient
   */
  async issueToken(tokenData) {
    try {
      const response = await api.post(`${this.baseURL}/token`, tokenData);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to issue queue token');
    }
  }

  /**
   * Get comprehensive queue status for a doctor
   */
  async getDoctorQueueStatus(doctorId, date = null) {
    try {
      const params = date ? { date } : {};
      const response = await api.get(`${this.baseURL}/doctor/${doctorId}/status`, { params });
      return response; // Return the full response, not response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch queue status');
    }
  }

  /**
   * Get queue display board data (for public displays)
   */
  async getQueueDisplayBoard(doctorId) {
    try {
      const response = await api.get(`${this.baseURL}/doctor/${doctorId}/display-board`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch display board data');
    }
  }

  /**
   * Call next patient in queue
   */
  async callNextPatient(doctorId) {
    try {
      const response = await api.post(`${this.baseURL}/call-next/${doctorId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to call next patient');
    }
  }

  // ===============================================
  // QUEUE TOKEN STATUS UPDATES
  // ===============================================

  /**
   * Mark patient as ready for doctor (Nurse action)
   */
  async markPatientReady(tokenId) {
    try {
      const response = await api.put(`${this.baseURL}/token/${tokenId}/mark-ready`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to mark patient as ready');
    }
  }

  /**
   * Unmark patient ready - change back to waiting (Nurse action)
   */
  async markPatientWaiting(tokenId) {
    try {
      const response = await api.put(`${this.baseURL}/token/${tokenId}/mark-waiting`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to unmark patient ready');
    }
  }

  /**
   * Mark patient as ready for doctor (Nurse action)
   */
  async markPatientReady(tokenId) {
    try {
      const response = await api.put(`${this.baseURL}/token/${tokenId}/mark-ready`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to mark patient as ready');
    }
  }

  /**
   * Start consultation with a patient
   */
  async startConsultation(tokenId) {
    try {
      const response = await api.put(`${this.baseURL}/token/${tokenId}/start-consultation`);
      return response.data;
    } catch (error) {
      console.error('🚨 QueueService startConsultation error:', error);
      console.error('🚨 Error response:', error.response);
      console.error('🚨 Error data:', error.response?.data);
      throw new Error(error.response?.data?.message || error.message || 'Failed to start consultation');
    }
  }

  /**
   * Complete consultation
   */
  async completeConsultation(tokenId) {
    try {
      const response = await api.put(`${this.baseURL}/token/${tokenId}/complete-consultation`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to complete consultation');
    }
  }

  /**
   * Mark patient as missed/no-show
   */
  async markPatientMissed(tokenId) {
    try {
      const response = await api.put(`${this.baseURL}/token/${tokenId}/mark-missed`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to mark patient as missed');
    }
  }

  /**
   * Cancel queue token
   */
  async cancelToken(tokenId) {
    try {
      const response = await api.put(`${this.baseURL}/token/${tokenId}/cancel`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to cancel token');
    }
  }

  // ===============================================
  // PATIENT QUEUE INFORMATION
  // ===============================================

  /**
   * Get patient's queue position and wait time
   */
  async getPatientQueueInfo(patientId, doctorId) {
    try {
      const response = await api.get(`${this.baseURL}/patient/${patientId}/info`, {
        params: { doctorId }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch patient queue info');
    }
  }

  // ===============================================
  // APPOINTMENT INTEGRATION
  // ===============================================

  /**
   * Process scheduled appointments into queue
   */
  async processScheduledAppointments(doctorId, date = null) {
    try {
      const response = await api.post(`${this.baseURL}/doctor/${doctorId}/process-appointments`, {
        date
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to process scheduled appointments');
    }
  }

  // ===============================================
  // ANALYTICS AND REPORTING
  // ===============================================

  /**
   * Get queue analytics for reporting
   */
  async getQueueAnalytics(doctorId, startDate, endDate) {
    try {
      const response = await api.get(`${this.baseURL}/doctor/${doctorId}/analytics`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch queue analytics');
    }
  }

  // ===============================================
  // BULK OPERATIONS
  // ===============================================

  /**
   * Issue multiple tokens at once
   */
  async issueMultipleTokens(tokens) {
    try {
      const response = await api.post(`${this.baseURL}/bulk/issue-tokens`, { tokens });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to issue multiple tokens');
    }
  }

  /**
   * Update status for multiple tokens
   */
  async bulkUpdateStatus(updates) {
    try {
      const response = await api.put(`${this.baseURL}/bulk/update-status`, { updates });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to bulk update status');
    }
  }

  // ===============================================
  // UTILITY METHODS
  // ===============================================

  /**
   * Get all active doctors with their current queue status and availability
   */
  async getAllDoctorsQueueStatus(date = null) {
    try {
      // First get all doctors and their availability
      const [doctorsResponse, allAvailabilityResponse] = await Promise.all([
        api.get('/users?role=doctor'),
        doctorAvailabilityService.getAllDoctorAvailability()
      ]);
      
      const doctors = doctorsResponse.data || [];
      const allAvailability = allAvailabilityResponse.data || [];

      // Then get queue status for each doctor and combine with availability
      const doctorQueues = await Promise.all(
        doctors.map(async (doctor) => {
          try {
            const queueStatus = await this.getDoctorQueueStatus(doctor.id, date);
            
            // Get availability for this doctor
            const doctorAvailability = allAvailability.filter(avail => avail.doctor_id === doctor.id);
            
            // Get comprehensive status including availability
            const status = doctorAvailabilityService.getDoctorStatus(
              doctor, 
              doctorAvailability, 
              queueStatus // Pass queueStatus directly, not queueStatus.data
            );
            
            return {
              ...doctor,
              queueStatus: queueStatus.success ? queueStatus.data : {
                doctor_id: doctor.id,
                date: date || new Date().toISOString().split('T')[0],
                tokens: [],
                summary: { waiting: 0, serving: 0, completed: 0, total: 0 }
              },
              availability: doctorAvailability,
              status: status
            };
          } catch (error) {
            // Get availability for this doctor even if queue fails
            const doctorAvailability = allAvailability.filter(avail => avail.doctor_id === doctor.id);
            const status = doctorAvailabilityService.getDoctorStatus(
              doctor, 
              doctorAvailability, 
              null
            );
            
            return {
              ...doctor,
              queueStatus: {
                doctor_id: doctor.id,
                date: date || new Date().toISOString().split('T')[0],
                tokens: [],
                appointments: [],
                statistics: {
                  tokens: { total: 0, waiting: 0, completed: 0 },
                  appointments: { total: 0, queued: 0, completed: 0 },
                  combined: { totalPatients: 0, waitingPatients: 0, completedToday: 0 }
                },
                currentStatus: {
                  activeConsultation: null,
                  nextInQueue: null,
                  isAvailable: status.canAcceptPatients
                }
              },
              availability: doctorAvailability,
              status: status
            };
          }
        })
      );

      return { success: true, data: doctorQueues };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch all doctors queue status');
    }
  }

  /**
   * Get available doctors for walk-in appointments (filters out unavailable doctors)
   */
  async getAvailableDoctorsForWalkIn(date = null) {
    try {
      const allDoctors = await this.getAllDoctorsQueueStatus(date);
      
      // Filter to only include doctors who can accept patients
      const availableDoctors = allDoctors.data.filter(doctor => 
        doctor.status.canAcceptPatients
      );
      
      return { success: true, data: availableDoctors };
    } catch (error) {
      throw new Error('Failed to fetch available doctors for walk-in');
    }
  }

  /**
   * Get queue statistics summary for dashboard
   */
  async getQueueSummary(date = null) {
    try {
      const doctorQueues = await this.getAllDoctorsQueueStatus(date);
      
      if (!doctorQueues.success || !doctorQueues.data) {
        throw new Error('Invalid doctor queues data');
      }

      const summary = {
        totalDoctors: doctorQueues.data.length,
        activeDoctors: doctorQueues.data.filter(d => {
          return d.queueStatus && d.queueStatus.currentStatus && d.queueStatus.currentStatus.isAvailable;
        }).length,
        totalPatients: doctorQueues.data.reduce((sum, d) => {
          if (d.queueStatus && d.queueStatus.statistics && d.queueStatus.statistics.combined) {
            return sum + (d.queueStatus.statistics.combined.totalPatients || 0);
          }
          return sum;
        }, 0),
        waitingPatients: doctorQueues.data.reduce((sum, d) => {
          if (d.queueStatus && d.queueStatus.statistics && d.queueStatus.statistics.combined) {
            return sum + (d.queueStatus.statistics.combined.waitingPatients || 0);
          }
          return sum;
        }, 0),
        completedToday: doctorQueues.data.reduce((sum, d) => {
          if (d.queueStatus && d.queueStatus.statistics && d.queueStatus.statistics.combined) {
            return sum + (d.queueStatus.statistics.combined.completedToday || 0);
          }
          return sum;
        }, 0),
        averageWaitTime: this.calculateAverageWaitTime(doctorQueues.data),
        busyDoctors: doctorQueues.data.filter(d => {
          return d.queueStatus && d.queueStatus.currentStatus && d.queueStatus.currentStatus.activeConsultation;
        }).length
      };

      return { success: true, data: summary };
    } catch (error) {
      console.error('Error in getQueueSummary:', error);
      throw new Error('Failed to fetch queue summary');
    }
  }

  /**
   * Calculate average wait time across all doctors
   */
  calculateAverageWaitTime(doctorQueues) {
    try {
      const allTokens = doctorQueues.flatMap(d => {
        if (d.queueStatus && d.queueStatus.tokens) {
          return d.queueStatus.tokens;
        }
        return [];
      });
      
      const waitingTokens = allTokens.filter(t => t && t.status === 'waiting');
      
      if (waitingTokens.length === 0) return 0;
      
      const totalWaitTime = waitingTokens.reduce((sum, token) => {
        try {
          const waitTime = Math.floor((new Date() - new Date(token.issued_time)) / (1000 * 60));
          return sum + (waitTime || 0);
        } catch (error) {
          return sum;
        }
      }, 0);
      
      return Math.round(totalWaitTime / waitingTokens.length);
    } catch (error) {
      console.error('Error calculating average wait time:', error);
      return 0;
    }
  }

  /**
   * Get queue token status color
   */
  getStatusColor(status) {
    const statusColors = {
      waiting: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      called: 'bg-blue-100 text-blue-800 border-blue-200',
      serving: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200',
      missed: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-600 border-gray-200'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  /**
   * Get priority color
   */
  getPriorityColor(priority) {
    const priorityColors = {
      1: 'bg-green-100 text-green-800',
      2: 'bg-yellow-100 text-yellow-800',
      3: 'bg-orange-100 text-orange-800',
      4: 'bg-red-100 text-red-800',
      5: 'bg-purple-100 text-purple-800'
    };
    return priorityColors[priority] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Format wait time for display
   */
  formatWaitTime(minutes) {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Get the patient currently in active consultation with the doctor
   */
  async getActiveConsultation(doctorId) {
    try {
      const response = await api.get(`${this.baseURL}/doctor/${doctorId}/active-consultation`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get active consultation');
    }
  }

  /**
   * Force complete any active consultation for the doctor
   */
  async forceCompleteActiveConsultation(doctorId) {
    try {
      const response = await api.put(`${this.baseURL}/doctor/${doctorId}/force-complete-consultation`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to force complete consultation');
    }
  }

  // ===============================================
  // DELAY/UNDELAY FUNCTIONALITY
  // ===============================================

  /**
   * Mark an appointment queue patient as delayed (removes from active queue)
   */
  async delayAppointmentQueue(appointmentQueueId, reason = null) {
    try {
      const response = await api.put(`${this.baseURL}/appointment/${appointmentQueueId}/delay`, {
        reason
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delay patient');
    }
  }

  /**
   * Undelay an appointment queue patient (adds them back to end of queue)
   */
  async undelayAppointmentQueue(appointmentQueueId) {
    try {
      const response = await api.put(`${this.baseURL}/appointment/${appointmentQueueId}/undelay`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to undelay patient');
    }
  }

  /**
   * Mark a token-based queue patient as delayed (for walk-ins)
   */
  async delayToken(tokenId, reason = null) {
    try {
      const response = await api.put(`${this.baseURL}/token/${tokenId}/delay`, {
        reason
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delay patient');
    }
  }

  /**
   * Undelay a token-based queue patient (for walk-ins)
   */
  async undelayToken(tokenId) {
    try {
      const response = await api.put(`${this.baseURL}/token/${tokenId}/undelay`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to undelay patient');
    }
  }
}

export default new QueueService();
