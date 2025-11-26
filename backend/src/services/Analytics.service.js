import { supabase } from '../config/database.js';
import logger from '../config/logger.js';
import clinicSettingsService from './ClinicSettings.service.js';

/**
 * Analytics Service
 * Provides analytics data for admin dashboard
 */
class AnalyticsService {
  /**
   * Get revenue trends for a date range
   * @param {Object} options - { startDate, endDate }
   * @returns {Promise<Object>} Revenue data by date
   */
  async getRevenueTrends(options = {}) {
    try {
      const { startDate, endDate } = options;

      let query = supabase
        .from('invoices')
        .select('completed_at, total_amount')
        .eq('status', 'paid');

      if (startDate && endDate) {
        // Ensure dates are in ISO format with time
        const startDateTime = new Date(startDate).toISOString();
        const endDateTime = new Date(endDate + 'T23:59:59.999Z').toISOString();
        query = query.gte('completed_at', startDateTime).lte('completed_at', endDateTime);
      }

      const { data, error } = await query.order('completed_at', { ascending: true });

      if (error) {
        throw error;
      }

      // Group by date
      const revenueByDate = {};
      (data || []).forEach((invoice) => {
        const date = new Date(invoice.completed_at).toISOString().split('T')[0];
        revenueByDate[date] = (revenueByDate[date] || 0) + parseFloat(invoice.total_amount || 0);
      });

      // Convert to array format for charts
      const trends = Object.entries(revenueByDate)
        .map(([date, revenue]) => ({ date, revenue: parseFloat(revenue.toFixed(2)) }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        success: true,
        data: trends,
        totalRevenue: trends.reduce((sum, item) => sum + item.revenue, 0),
      };
    } catch (error) {
      logger.error('[Analytics] Error getting revenue trends:', error);
      throw error;
    }
  }

  /**
   * Get visit status breakdown
   * @param {Object} options - { startDate, endDate }
   * @returns {Promise<Object>} Visit counts by status
   */
  async getVisitStatusBreakdown(options = {}) {
    try {
      const { startDate, endDate } = options;

      let query = supabase.from('visits').select('status');

      if (startDate && endDate) {
        const startDateTime = new Date(startDate).toISOString();
        const endDateTime = new Date(endDate + 'T23:59:59.999Z').toISOString();
        query = query.gte('visit_date', startDateTime).lte('visit_date', endDateTime);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Count by status
      const breakdown = {
        completed: 0,
        in_progress: 0,
        cancelled: 0,
      };

      (data || []).forEach((visit) => {
        const status = visit.status || 'in_progress';
        if (breakdown[status] !== undefined) {
          breakdown[status]++;
        }
      });

      // Convert to array format for charts
      const chartData = Object.entries(breakdown).map(([status, count]) => ({
        status: status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        count,
      }));

      return {
        success: true,
        data: chartData,
        total: Object.values(breakdown).reduce((sum, count) => sum + count, 0),
      };
    } catch (error) {
      logger.error('[Analytics] Error getting visit status breakdown:', error);
      throw error;
    }
  }

  /**
   * Get top doctors by visits and revenue
   * @param {Object} options - { limit, startDate, endDate }
   * @returns {Promise<Object>} Top doctors data
   */
  async getTopDoctors(options = {}) {
    try {
      const { limit = 5, startDate, endDate } = options;

      let visitsQuery = supabase
        .from('visits')
        .select('doctor_id, id, doctor:users!visits_doctor_id_fkey(first_name, last_name)');

      if (startDate && endDate) {
        const startDateTime = new Date(startDate).toISOString();
        const endDateTime = new Date(endDate + 'T23:59:59.999Z').toISOString();
        visitsQuery = visitsQuery.gte('visit_date', startDateTime).lte('visit_date', endDateTime);
      }

      const { data: visits, error: visitsError } = await visitsQuery;

      if (visitsError) {
        throw visitsError;
      }

      // Get invoices for revenue calculation
      const visitIds = (visits || []).map((v) => v.id);

      let invoices = [];
      if (visitIds.length > 0) {
        let invoicesQuery = supabase
          .from('invoices')
          .select('visit_id, total_amount')
          .in('visit_id', visitIds)
          .eq('status', 'paid');

        if (startDate && endDate) {
          const startDateTime = new Date(startDate).toISOString();
          const endDateTime = new Date(endDate + 'T23:59:59.999Z').toISOString();
          invoicesQuery = invoicesQuery
            .gte('completed_at', startDateTime)
            .lte('completed_at', endDateTime);
        }

        const { data: invoicesData, error: invoicesError } = await invoicesQuery;

        if (invoicesError) {
          throw invoicesError;
        }
        invoices = invoicesData || [];
      }

      // Aggregate by doctor
      const doctorStats = {};

      (visits || []).forEach((visit) => {
        const doctorId = visit.doctor_id;
        if (!doctorStats[doctorId]) {
          doctorStats[doctorId] = {
            doctorId,
            doctorName: visit.doctor
              ? `${visit.doctor.first_name || ''} ${visit.doctor.last_name || ''}`.trim()
              : 'Unknown',
            visits: 0,
            revenue: 0,
          };
        }
        doctorStats[doctorId].visits++;
      });

      // Add revenue
      const invoiceMap = {};
      (invoices || []).forEach((invoice) => {
        invoiceMap[invoice.visit_id] = parseFloat(invoice.total_amount || 0);
      });

      (visits || []).forEach((visit) => {
        if (invoiceMap[visit.id]) {
          doctorStats[visit.doctor_id].revenue += invoiceMap[visit.id];
        }
      });

      // Convert to array and sort by visits
      const topDoctors = Object.values(doctorStats)
        .sort((a, b) => b.visits - a.visits)
        .slice(0, limit)
        .map((doc) => ({
          ...doc,
          revenue: parseFloat(doc.revenue.toFixed(2)),
        }));

      return {
        success: true,
        data: topDoctors,
      };
    } catch (error) {
      logger.error('[Analytics] Error getting top doctors:', error);
      throw error;
    }
  }

  /**
   * Get payment methods breakdown
   * @param {Object} options - { startDate, endDate }
   * @returns {Promise<Object>} Payment data by method
   */
  async getPaymentMethodsBreakdown(options = {}) {
    try {
      const { startDate, endDate } = options;

      let query = supabase.from('payment_transactions').select('payment_method, amount');

      if (startDate && endDate) {
        const startDateTime = new Date(startDate).toISOString();
        const endDateTime = new Date(endDate + 'T23:59:59.999Z').toISOString();
        // Use received_at which is confirmed to exist in the database
        query = query.gte('received_at', startDateTime).lte('received_at', endDateTime);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Aggregate by payment method
      const breakdown = {};

      (data || []).forEach((transaction) => {
        const method = transaction.payment_method || 'unknown';
        breakdown[method] = (breakdown[method] || 0) + parseFloat(transaction.amount || 0);
      });

      // Convert to array format for charts
      const chartData = Object.entries(breakdown).map(([method, amount]) => ({
        method:
          method === 'cash' ? 'Cash' : method === 'online_payment' ? 'Online Payment' : method,
        amount: parseFloat(amount.toFixed(2)),
      }));

      return {
        success: true,
        data: chartData,
        total: chartData.reduce((sum, item) => sum + item.amount, 0),
      };
    } catch (error) {
      logger.error('[Analytics] Error getting payment methods breakdown:', error);
      throw error;
    }
  }

  /**
   * Export DHIS2 CSV data for a specific month
   * @param {Object} options - { year, month }
   * @returns {Promise<Object>} CSV data
   */
  async exportDHIS2CSV(options = {}) {
    try {
      const { year, month } = options;

      if (!year || !month) {
        throw new Error('Year and month are required');
      }

      // Get clinic settings
      const settings = await clinicSettingsService.getSettings();
      const clinicName = settings?.data?.clinic_name || settings?.clinic_name || 'Clinic';
      const clinicId = 'CLINIC001'; // Can be configured in settings later

      // Calculate date range for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      const startDateISO = startDate.toISOString();
      const endDateISO = endDate.toISOString();

      // For date-only queries (diagnosed_date), use date strings
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // 1. Total Visits
      const { data: visits, error: visitsError } = await supabase
        .from('visits')
        .select('id, visit_date, patient_id, patients!patient_id(gender, date_of_birth)')
        .gte('visit_date', startDateISO)
        .lte('visit_date', endDateISO);

      if (visitsError) {
        throw visitsError;
      }

      const totalVisits = (visits || []).length;

      // 2. New Patients
      const { count: newPatientsCount, error: newPatientsError } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .gte('registration_date', startDateISO)
        .lte('registration_date', endDateISO);

      if (newPatientsError) {
        throw newPatientsError;
      }

      // 3. Female Patients (visits in month)
      const femalePatients = (visits || []).filter(
        (v) => v.patients && v.patients.gender === 'Female'
      ).length;

      // 4. Under 5 Patients (visits in month)
      const under5Patients = (visits || []).filter((v) => {
        if (!v.patients || !v.patients.date_of_birth) {
          return false;
        }
        const birthDate = new Date(v.patients.date_of_birth);
        const ageInYears = (new Date() - birthDate) / (1000 * 60 * 60 * 24 * 365);
        return ageInYears < 5;
      }).length;

      // 5. Diagnoses Recorded
      const { count: diagnosesCount, error: diagnosesError } = await supabase
        .from('patient_diagnoses')
        .select('*', { count: 'exact', head: true })
        .gte('diagnosed_date', startDateStr)
        .lte('diagnosed_date', endDateStr);

      if (diagnosesError) {
        throw diagnosesError;
      }

      // 6. Drugs Dispensed (from invoice_items where item_type = 'medicine')
      const { count: drugsDispensedCount, error: drugsError } = await supabase
        .from('invoice_items')
        .select('*', { count: 'exact', head: true })
        .eq('item_type', 'medicine')
        .gte('added_at', startDateISO)
        .lte('added_at', endDateISO);

      if (drugsError) {
        throw drugsError;
      }

      // Format reporting month as YYYY-MM
      const reportingMonth = `${year}-${String(month).padStart(2, '0')}`;

      // Build CSV row (only include columns with actual data)
      const csvData = {
        Clinic_ID: clinicId,
        Clinic_Name: clinicName,
        Reporting_Month: reportingMonth,
        Total_Visits: totalVisits,
        New_Patients: newPatientsCount || 0,
        Female_Patients: femalePatients,
        Under5_Patients: under5Patients,
        Diagnoses_Recorded: diagnosesCount || 0,
        Drugs_Dispensed: drugsDispensedCount || 0,
      };

      return {
        success: true,
        data: csvData,
      };
    } catch (error) {
      logger.error('[Analytics] Error exporting DHIS2 CSV:', error);
      throw error;
    }
  }
}

export default AnalyticsService;
