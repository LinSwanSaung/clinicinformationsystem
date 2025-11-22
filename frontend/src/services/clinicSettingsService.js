import api from './api';
import logger from '@/utils/logger';

class ClinicSettingsService {
  async getSettings() {
    try {
      const response = await api.get('/clinic-settings');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Error fetching clinic settings:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch clinic settings'
      };
    }
  }

  async updateSettings(settings) {
    try {
      const response = await api.put('/clinic-settings', settings);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Error updating clinic settings:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update clinic settings'
      };
    }
  }

  // Get specific setting value
  async getConsultationDuration() {
    try {
      const result = await this.getSettings();
      if (result.success && result.data) {
        return result.data.consult_expected_minutes || 15; // Default fallback
      }
      return 15; // Default fallback
    } catch (error) {
      logger.error('Error fetching consultation duration:', error);
      return 15; // Default fallback
    }
  }

  // Get late threshold
  async getLateThreshold() {
    try {
      const result = await this.getSettings();
      if (result.success && result.data) {
        return result.data.late_threshold_minutes || 7; // Default fallback
      }
      return 7; // Default fallback
    } catch (error) {
      logger.error('Error fetching late threshold:', error);
      return 7; // Default fallback
    }
  }

  // Upload clinic logo
  async uploadLogo(file) {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await api.post('/clinic-settings/upload-logo', formData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Error uploading logo:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to upload logo'
      };
    }
  }

  // Upload payment QR code
  async uploadQRCode(file) {
    try {
      const formData = new FormData();
      formData.append('qr_code', file);
      
      const response = await api.post('/clinic-settings/upload-qr-code', formData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      logger.error('Error uploading QR code:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to upload QR code'
      };
    }
  }
}

export default new ClinicSettingsService();