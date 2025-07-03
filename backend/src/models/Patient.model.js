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
    // Calculate age from date of birth
    const age = this.calculateAge(patientData.date_of_birth);
    
    // Generate initials from name
    const initials = this.generateInitials(patientData.name);
    
    const newPatient = {
      ...patientData,
      age,
      initials,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return super.create(newPatient);
  }

  /**
   * Search patients by name, ID number, or contact
   */
  async search(searchTerm, options = {}) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .or(`name.ilike.%${searchTerm}%,id_number.ilike.%${searchTerm}%,contact.ilike.%${searchTerm}%`)
      .order('name')
      .limit(options.limit || 20);

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Find patient by ID number
   */
  async findByIdNumber(idNumber) {
    return this.findOne({ id_number: idNumber });
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
      last_visit: visitDate.toISOString().split('T')[0]
    });
  }

  /**
   * Get patient statistics
   */
  async getStatistics() {
    const { data, error } = await this.supabase
      .rpc('get_patient_statistics');

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
      .map(word => word.charAt(0).toUpperCase())
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
      filters: { ...options.filters, gender }
    });
  }
}

export default new PatientModel();
