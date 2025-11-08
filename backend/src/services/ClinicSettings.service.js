import { BaseModel } from '../models/BaseModel.js';
import logger from '../config/logger.js';

class ClinicSettingsService {
  constructor() {
    this.model = new BaseModel('clinic_settings');
  }

  async getSettings() {
    try {
      // Get the global settings (there should only be one row with key='global')
      const settings = await this.model.findOne({ key: 'global' });
      
      if (!settings) {
        // If no settings exist, create default ones
        const defaultSettings = {
          key: 'global',
          late_threshold_minutes: 7,
          consult_expected_minutes: 15,
          updated_at: new Date()
        };
        
        const created = await this.model.create(defaultSettings);
        return created;
      }
      
      return settings;
    } catch (error) {
      logger.error('Error in ClinicSettingsService.getSettings:', error);
      throw error;
    }
  }

  async updateSettings(settingsData) {
    try {
      // Always update the global settings
      const updatedSettings = {
        ...settingsData,
        key: 'global', // Ensure we're always updating the global settings
        updated_at: new Date()
      };

      // Check if settings exist
      const existing = await this.model.findOne({ key: 'global' });
      
      if (existing) {
        // Update existing settings
        const updated = await this.model.update({ key: 'global' }, updatedSettings);
        return updated;
      } else {
        // Create new settings
        const created = await this.model.create(updatedSettings);
        return created;
      }
    } catch (error) {
      logger.error('Error in ClinicSettingsService.updateSettings:', error);
      throw error;
    }
  }

  async getConsultationDuration() {
    try {
      const settings = await this.getSettings();
      return settings.consult_expected_minutes || 15;
    } catch (error) {
      logger.error('Error in ClinicSettingsService.getConsultationDuration:', error);
      return 15; // Default fallback
    }
  }

  async getLateThreshold() {
    try {
      const settings = await this.getSettings();
      return settings.late_threshold_minutes || 7;
    } catch (error) {
      logger.error('Error in ClinicSettingsService.getLateThreshold:', error);
      return 7; // Default fallback
    }
  }
}

export default new ClinicSettingsService();