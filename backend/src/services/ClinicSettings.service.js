import { BaseModel } from '../models/BaseModel.js';
import { supabase } from '../config/database.js';
import logger from '../config/logger.js';

class ClinicSettingsService {
  constructor() {
    this.model = new BaseModel('clinic_settings');
    this.tableName = 'clinic_settings';
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
          clinic_name: null,
          clinic_logo_url: null,
          clinic_phone: null,
          clinic_email: null,
          clinic_address: null,
          currency_code: 'USD',
          currency_symbol: '$',
          payment_qr_code_url: null,
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
        updated_at: new Date().toISOString()
      };

      // Check if settings exist
      const existing = await this.model.findOne({ key: 'global' });
      
      if (existing) {
        // Update existing settings using Supabase directly (since primary key is 'key', not 'id')
        const { data: updated, error } = await supabase
          .from(this.tableName)
          .update(updatedSettings)
          .eq('key', 'global')
          .select()
          .maybeSingle();

        if (error) {
          logger.error('Error updating clinic settings:', error);
          throw error;
        }

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

  async getCurrencySettings() {
    try {
      const settings = await this.getSettings();
      return {
        currency_code: settings.currency_code || 'USD',
        currency_symbol: settings.currency_symbol || '$',
      };
    } catch (error) {
      logger.error('Error in ClinicSettingsService.getCurrencySettings:', error);
      return {
        currency_code: 'USD',
        currency_symbol: '$',
      };
    }
  }

  /**
   * Upload clinic logo to Supabase Storage
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - Original file name
   * @param {string} mimeType - File MIME type
   * @returns {Promise<{publicUrl: string, filePath: string}>}
   */
  async uploadLogo(fileBuffer, fileName, mimeType) {
    try {
      const crypto = (await import('crypto')).default;
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `logo/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('clinic-assets')
        .upload(uniqueFileName, fileBuffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) {
        logger.error('Supabase upload error:', uploadError);
        throw new Error(`Failed to upload logo: ${uploadError.message}`);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('clinic-assets').getPublicUrl(uniqueFileName);

      return {
        publicUrl,
        filePath: uniqueFileName,
      };
    } catch (error) {
      logger.error('Error in ClinicSettingsService.uploadLogo:', error);
      throw error;
    }
  }

  /**
   * Upload payment QR code to Supabase Storage
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - Original file name
   * @param {string} mimeType - File MIME type
   * @returns {Promise<{publicUrl: string, filePath: string}>}
   */
  async uploadQRCode(fileBuffer, fileName, mimeType) {
    try {
      const crypto = (await import('crypto')).default;
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `qr-codes/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('clinic-assets')
        .upload(uniqueFileName, fileBuffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) {
        logger.error('Supabase upload error:', uploadError);
        throw new Error(`Failed to upload QR code: ${uploadError.message}`);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('clinic-assets').getPublicUrl(uniqueFileName);

      return {
        publicUrl,
        filePath: uniqueFileName,
      };
    } catch (error) {
      logger.error('Error in ClinicSettingsService.uploadQRCode:', error);
      throw error;
    }
  }
}

export default new ClinicSettingsService();