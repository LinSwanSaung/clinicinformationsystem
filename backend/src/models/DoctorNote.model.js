import { supabase } from '../config/database.js';

class DoctorNote {
  static async create(noteData) {
    const { data, error } = await supabase
      .from('doctor_notes')
      .insert([noteData])
      .select('*')
      .single();
    if (error) {
      throw error;
    }
    return data;
  }

  static async findByVisit(visitId) {
    const { data, error } = await supabase
      .from('doctor_notes')
      .select('*')
      .eq('visit_id', visitId)
      .order('created_at', { ascending: false });
    if (error) {
      throw error;
    }
    return data;
  }

  static async findByPatient(patientId) {
    const { data, error } = await supabase
      .from('doctor_notes')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) {
      throw error;
    }
    return data;
  }

  static async update(noteId, noteData) {
    const { data, error } = await supabase
      .from('doctor_notes')
      .update(noteData)
      .eq('id', noteId)
      .select('*')
      .single();
    if (error) {
      throw error;
    }
    return data;
  }

  static async delete(noteId) {
    const { data, error } = await supabase
      .from('doctor_notes')
      .delete()
      .eq('id', noteId)
      .select('*')
      .single();
    if (error) {
      throw error;
    }
    return data;
  }
}

export default DoctorNote;
