import { BaseModel } from './BaseModel.js';

/**
 * Patient Model
 * Handles patient-related database operations
 */
export class PatientModel extends BaseModel {
  constructor() {
    super('patients');
  }

  /**
   * Create a new patient
   */
  async create(patientData) {
    // Generate unique patient number
    const patientNumber = await this.generatePatientNumber();

    const newPatient = {
      ...patientData,
      patient_number: patientNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return super.create(newPatient);
  }

  /**
   * Generate unique patient number
   */
  async generatePatientNumber() {
    const year = new Date().getFullYear();
    const prefix = `P${year}`;

    // Find the highest existing patient number for this year
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('patient_number')
      .like('patient_number', `${prefix}%`)
      .order('patient_number', { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastNumber = data[0].patient_number;
      const numPart = parseInt(lastNumber.replace(prefix, ''));
      nextNumber = numPart + 1;
    }

    // Format with leading zeros (e.g., P2025001, P2025002, etc.)
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  }

  /**
   * Search patients by name, patient number, or contact
   */
  async search(searchTerm, options = {}) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .or(
        `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,patient_number.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
      )
      .order('first_name')
      .limit(options.limit || 20);

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Find patient by patient number
   */
  async findByPatientNumber(patientNumber) {
    return this.findOne({ patient_number: patientNumber });
  }

  /**
   * Get patients with recent visits
   */
  async getRecentPatients(days = 30, options = {}) {
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .gte('last_visit', dateThreshold.toISOString().split('T')[0])
      .order('last_visit', { ascending: false })
      .limit(options.limit || 50);

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Update last visit date
   */
  async updateLastVisit(patientId, visitDate = new Date()) {
    return this.updateById(patientId, {
      last_visit: visitDate.toISOString().split('T')[0],
    });
  }

  /**
   * Get patient statistics
   */
  async getStatistics() {
    const { data, error } = await this.supabase.rpc('get_patient_statistics');

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Helper method to calculate age
   */
  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Helper method to generate initials
   */
  generateInitials(name) {
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3);
  }

  /**
   * Get patients by age group
   */
  async getByAgeGroup(minAge, maxAge, options = {}) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .gte('age', minAge)
      .lte('age', maxAge)
      .order('age')
      .limit(options.limit || 50);

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get patients by gender
   */
  async getByGender(gender, options = {}) {
    return this.findAll({
      ...options,
      filters: { ...options.filters, gender },
    });
  }
}

export default new PatientModel();
