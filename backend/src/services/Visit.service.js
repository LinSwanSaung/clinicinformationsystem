/* eslint-disable no-useless-catch */
import VisitModel from '../models/Visit.model.js';
import {
  listVisitsWithRelations,
  getVisitStatistics as repoVisitStats,
  updateVisitStatus as repoUpdateVisitStatus,
} from './repositories/VisitsRepo.js';

/**
 * Visit Service
 * Handles visit-related business logic including comprehensive visit history
 */
class VisitService {
  constructor() {
    this.visitModel = new VisitModel();
  }

  /**
   * Get comprehensive patient visit history
   */
  async getPatientVisitHistory(patientId, options = {}) {
    try {
      if (!patientId) {
        throw new Error('Patient ID is required');
      }

      const visits = await this.visitModel.getPatientVisitHistory(patientId, options);

      return {
        success: true,
        data: visits,
        total: visits.length,
        patient_id: patientId,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get single visit with all details
   */
  async getVisitDetails(visitId) {
    try {
      if (!visitId) {
        throw new Error('Visit ID is required');
      }

      const visit = await this.visitModel.getVisitWithDetails(visitId);

      return {
        success: true,
        data: visit,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get patient's active visit (in_progress status)
   */
  async getPatientActiveVisit(patientId) {
    try {
      if (!patientId) {
        throw new Error('Patient ID is required');
      }

      const visit = await this.visitModel.getPatientActiveVisit(patientId);

      return visit; // Return visit directly (can be null)
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new visit
   */
  async createVisit(visitData) {
    try {
      const requiredFields = ['patient_id', 'doctor_id'];
      const missingFields = requiredFields.filter((field) => !visitData[field]);

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }


      // Set default values and remove fields not in schema
      // eslint-disable-next-line no-unused-vars
      const { created_by, updated_by, ...cleanVisitData } = visitData;

      const visitToCreate = {
        visit_date: new Date().toISOString(),
        status: 'in_progress',
        payment_status: 'pending',
        ...cleanVisitData,
      };

      const visit = await this.visitModel.create(visitToCreate);


      return {
        success: true,
        data: visit,
        message: 'Visit created successfully',
      };
    } catch (error) {
      logger.error('[VISIT] Error creating visit:', error);
      throw error;
    }
  }

  /**
   * Update visit
   */
  async updateVisit(visitId, updateData) {
    try {
      if (!visitId) {
        throw new Error('Visit ID is required');
      }

      // Remove fields not in schema
      // eslint-disable-next-line no-unused-vars
      const { created_by, updated_by, ...cleanUpdateData } = updateData;

      const visit = await this.visitModel.update(visitId, cleanUpdateData);

      return {
        success: true,
        data: visit,
        message: 'Visit updated successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Complete visit with final calculations
   */
  async completeVisit(visitId, completionData = {}) {
    try {
      if (!visitId) {
        throw new Error('Visit ID is required');
      }

      const completedVisit = await this.visitModel.completeVisit(visitId, completionData);

      return {
        success: true,
        data: completedVisit,
        message: 'Visit completed successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all visits (for admin/reports)
   */
  async getAllVisits(options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        status = null,
        doctor_id = null,
        start_date = null,
        end_date = null,
      } = options;

      const data = await listVisitsWithRelations({
        limit,
        offset,
        status,
        doctor_id,
        start_date,
        end_date,
      });
      return {
        success: true,
        data: data || [],
        total: data?.length || 0,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get visit statistics
   */
  async getVisitStatistics(options = {}) {
    try {
      const { doctor_id = null, start_date = null, end_date = null } = options;

      const stats = await repoVisitStats({ doctor_id, start_date, end_date });
      return { success: true, data: stats };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update visit status
   */
  async updateVisitStatus(visitId, status) {
    try {
      if (!visitId) {
        throw new Error('Visit ID is required');
      }

      if (!status) {
        throw new Error('Status is required');
      }

      // Validate status
      const validStatuses = ['in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      // Update the visit status
      const data = await repoUpdateVisitStatus(visitId, status);
      return {
        success: true,
        data,
        message: `Visit status updated to ${status}`,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete visit
   */
  async deleteVisit(visitId) {
    try {
      if (!visitId) {
        throw new Error('Visit ID is required');
      }

      await this.visitModel.delete(visitId);

      return {
        success: true,
        message: 'Visit deleted successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Export single visit as PDF
   */
  async exportSingleVisitPDF(visitId, user) {
    try {
      const PDFDocument = (await import('pdfkit')).default;

      // Get visit details
      const visit = await this.visitModel.getVisitWithDetails(visitId);

      if (!visit) {
        throw new Error('Visit not found');
      }

      // Authorization check
      if (user.role === 'patient' && user.patient_id !== visit.patient_id) {
        throw new Error('Access denied: You can only download your own visit records');
      }

      // Create PDF document with A4 size
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true,
      });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));

      const pdfPromise = new Promise((resolve) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
      });

      // Helper function to draw a box
      const drawBox = (x, y, width, height, fillColor = '#f8fafc') => {
        doc.rect(x, y, width, height).fillAndStroke(fillColor, '#e2e8f0').fillColor('#000000');
      };

      // Professional Header with colored background
      doc.rect(0, 0, doc.page.width, 120).fillAndStroke('#1e40af', '#1e40af');

      doc
        .fillColor('#ffffff')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text('RealCIS', 50, 30)
        .fontSize(12)
        .font('Helvetica')
        .text('Healthcare System', 50, 62);

      doc.fontSize(20).font('Helvetica-Bold').text('VISIT SUMMARY', 50, 85, { align: 'right' });

      // Reset position after header
      doc.fillColor('#000000');
      let yPos = 140;

      // Patient & Visit Info Box
      drawBox(50, yPos, doc.page.width - 100, 140, '#f0f9ff');
      doc
        .fillColor('#1e40af')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Visit Information', 60, yPos + 10);

      doc
        .fillColor('#374151')
        .fontSize(10)
        .font('Helvetica')
        .text(`Date: `, 60, yPos + 35)
        .font('Helvetica-Bold')
        .text(
          new Date(visit.visit_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          140,
          yPos + 35
        );

      doc
        .font('Helvetica')
        .text(`Visit Type: `, 60, yPos + 55)
        .font('Helvetica-Bold')
        .text(visit.visit_type || 'General Visit', 140, yPos + 55);

      doc
        .font('Helvetica')
        .text(`Doctor: `, 60, yPos + 75)
        .font('Helvetica-Bold')
        .text(
          `Dr. ${visit.doctor?.first_name || ''} ${visit.doctor?.last_name || ''}`,
          140,
          yPos + 75
        );

      doc
        .font('Helvetica')
        .text(`Status: `, 60, yPos + 95)
        .font('Helvetica-Bold')
        .fillColor(visit.status === 'completed' ? '#16a34a' : '#ea580c')
        .text(visit.status?.toUpperCase() || 'N/A', 140, yPos + 95);

      if (visit.chief_complaint) {
        doc
          .fillColor('#374151')
          .font('Helvetica')
          .text(`Chief Complaint: `, 60, yPos + 115)
          .font('Helvetica-Bold')
          .text(visit.chief_complaint, 140, yPos + 115, { width: 350 });
      }

      yPos += 160;

      // Vital Signs Section with Grid Layout
      if (visit.vitals) {
        // Check if we need a new page
        if (yPos > 650) {
          doc.addPage();
          yPos = 50;
        }

        doc
          .fillColor('#dc2626')
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('♥ Vital Signs', 50, yPos);

        yPos += 25;
        const boxWidth = (doc.page.width - 120) / 2;
        const boxHeight = 50;
        let xPos = 50;
        let vitalsCount = 0;

        // Blood Pressure
        if (visit.vitals.blood_pressure_systolic && visit.vitals.blood_pressure_diastolic) {
          drawBox(xPos, yPos, boxWidth, boxHeight, '#fef2f2');
          doc
            .fillColor('#6b7280')
            .fontSize(9)
            .font('Helvetica')
            .text('Blood Pressure', xPos + 10, yPos + 10);
          doc
            .fillColor('#dc2626')
            .fontSize(18)
            .font('Helvetica-Bold')
            .text(
              `${visit.vitals.blood_pressure_systolic}/${visit.vitals.blood_pressure_diastolic}`,
              xPos + 10,
              yPos + 24
            );
          doc
            .fillColor('#6b7280')
            .fontSize(8)
            .text('mmHg', xPos + 10, yPos + 44);
          xPos += boxWidth + 20;
          vitalsCount++;
        }

        // Heart Rate
        if (visit.vitals.heart_rate) {
          if (vitalsCount % 2 === 0) {
            xPos = 50;
            yPos += boxHeight + 10;
          }
          drawBox(xPos, yPos, boxWidth, boxHeight, '#fef2f2');
          doc
            .fillColor('#6b7280')
            .fontSize(9)
            .font('Helvetica')
            .text('Heart Rate', xPos + 10, yPos + 10);
          doc
            .fillColor('#dc2626')
            .fontSize(18)
            .font('Helvetica-Bold')
            .text(visit.vitals.heart_rate, xPos + 10, yPos + 24);
          doc
            .fillColor('#6b7280')
            .fontSize(8)
            .text('bpm', xPos + 10, yPos + 44);
          xPos += boxWidth + 20;
          vitalsCount++;
        }

        // Temperature
        if (visit.vitals.temperature) {
          if (vitalsCount % 2 === 0) {
            xPos = 50;
            yPos += boxHeight + 10;
          }
          drawBox(xPos, yPos, boxWidth, boxHeight, '#fef2f2');
          doc
            .fillColor('#6b7280')
            .fontSize(9)
            .font('Helvetica')
            .text('Temperature', xPos + 10, yPos + 10);
          doc
            .fillColor('#dc2626')
            .fontSize(18)
            .font('Helvetica-Bold')
            .text(visit.vitals.temperature, xPos + 10, yPos + 24);
          doc
            .fillColor('#6b7280')
            .fontSize(8)
            .text(`°${visit.vitals.temperature_unit || 'F'}`, xPos + 10, yPos + 44);
          xPos += boxWidth + 20;
          vitalsCount++;
        }

        // Weight
        if (visit.vitals.weight) {
          if (vitalsCount % 2 === 0) {
            xPos = 50;
            yPos += boxHeight + 10;
          }
          drawBox(xPos, yPos, boxWidth, boxHeight, '#fef2f2');
          doc
            .fillColor('#6b7280')
            .fontSize(9)
            .font('Helvetica')
            .text('Weight', xPos + 10, yPos + 10);
          doc
            .fillColor('#dc2626')
            .fontSize(18)
            .font('Helvetica-Bold')
            .text(visit.vitals.weight, xPos + 10, yPos + 24);
          doc
            .fillColor('#6b7280')
            .fontSize(8)
            .text(visit.vitals.weight_unit || 'kg', xPos + 10, yPos + 44);
          xPos += boxWidth + 20;
          vitalsCount++;
        }

        // Oxygen Saturation
        if (visit.vitals.oxygen_saturation) {
          if (vitalsCount % 2 === 0) {
            xPos = 50;
            yPos += boxHeight + 10;
          }
          drawBox(xPos, yPos, boxWidth, boxHeight, '#fef2f2');
          doc
            .fillColor('#6b7280')
            .fontSize(9)
            .font('Helvetica')
            .text('O₂ Saturation', xPos + 10, yPos + 10);
          doc
            .fillColor('#dc2626')
            .fontSize(18)
            .font('Helvetica-Bold')
            .text(visit.vitals.oxygen_saturation, xPos + 10, yPos + 24);
          doc
            .fillColor('#6b7280')
            .fontSize(8)
            .text('%', xPos + 10, yPos + 44);
          vitalsCount++;
        }

        yPos += boxHeight + 30;
      }

      // Diagnoses Section
      if (visit.visit_diagnoses && visit.visit_diagnoses.length > 0) {
        // Check if we need a new page
        if (yPos > 650) {
          doc.addPage();
          yPos = 50;
        }

        doc
          .fillColor('#7c3aed')
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('⚕ Diagnoses from This Visit', 50, yPos);

        yPos += 25;

        visit.visit_diagnoses.forEach((diagnosis, index) => {
          const boxHeight = diagnosis.clinical_notes ? 90 : 70;

          // Check if we need a new page
          if (yPos + boxHeight > 750) {
            doc.addPage();
            yPos = 50;
          }

          drawBox(50, yPos, doc.page.width - 100, boxHeight, '#faf5ff');

          // Diagnosis number badge
          doc.circle(65, yPos + 15, 12).fillAndStroke('#7c3aed', '#7c3aed');
          doc
            .fillColor('#ffffff')
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(`${index + 1}`, 60, yPos + 10, { width: 10, align: 'center' });

          // Diagnosis name
          doc
            .fillColor('#1f2937')
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(diagnosis.diagnosis_name, 85, yPos + 12, { width: 400 });

          // Code and severity on same line
          const detailsY = yPos + 35;
          if (diagnosis.diagnosis_code) {
            doc
              .fillColor('#6b7280')
              .fontSize(9)
              .font('Helvetica')
              .text('Code: ', 85, detailsY)
              .fillColor('#7c3aed')
              .font('Helvetica-Bold')
              .text(diagnosis.diagnosis_code, 115, detailsY);
          }

          if (diagnosis.severity) {
            const severityColor =
              diagnosis.severity === 'severe'
                ? '#dc2626'
                : diagnosis.severity === 'moderate'
                  ? '#ea580c'
                  : '#16a34a';
            doc
              .fillColor('#6b7280')
              .fontSize(9)
              .font('Helvetica')
              .text('Severity: ', 220, detailsY)
              .fillColor(severityColor)
              .font('Helvetica-Bold')
              .text(diagnosis.severity, 265, detailsY);
          }

          // Clinical notes
          if (diagnosis.clinical_notes) {
            doc
              .fillColor('#4b5563')
              .fontSize(9)
              .font('Helvetica')
              .text(diagnosis.clinical_notes, 85, detailsY + 20, { width: 450 });
          }

          yPos += boxHeight + 10;
        });

        yPos += 10;
      }

      // Prescriptions Section
      if (visit.prescriptions && visit.prescriptions.length > 0) {
        // Check if we need a new page
        if (yPos > 650) {
          doc.addPage();
          yPos = 50;
        }

        doc
          .fillColor('#0284c7')
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('💊 Medications Prescribed', 50, yPos);

        yPos += 25;

        visit.prescriptions.forEach((prescription, index) => {
          const boxHeight = prescription.instructions ? 105 : 85;

          // Check if we need a new page
          if (yPos + boxHeight > 750) {
            doc.addPage();
            yPos = 50;
          }

          drawBox(50, yPos, doc.page.width - 100, boxHeight, '#f0f9ff');

          // Pill icon badge
          doc.circle(65, yPos + 15, 12).fillAndStroke('#0284c7', '#0284c7');
          doc
            .fillColor('#ffffff')
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(`${index + 1}`, 60, yPos + 10, { width: 10, align: 'center' });

          // Medication name
          doc
            .fillColor('#1f2937')
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(prescription.medication_name, 85, yPos + 12, { width: 400 });

          // Status badge
          const isActive = prescription.status === 'active';
          doc
            .rect(480, yPos + 12, 50, 16)
            .fillAndStroke(isActive ? '#dcfce7' : '#f3f4f6', isActive ? '#16a34a' : '#9ca3af');
          doc
            .fillColor(isActive ? '#16a34a' : '#6b7280')
            .fontSize(8)
            .font('Helvetica-Bold')
            .text(prescription.status?.toUpperCase() || 'N/A', 480, yPos + 16, {
              width: 50,
              align: 'center',
            });

          // Dosage and Frequency
          let detailY = yPos + 38;
          doc
            .fillColor('#6b7280')
            .fontSize(9)
            .font('Helvetica')
            .text('Dosage: ', 85, detailY)
            .fillColor('#0284c7')
            .font('Helvetica-Bold')
            .text(prescription.dosage, 130, detailY);

          doc
            .fillColor('#6b7280')
            .font('Helvetica')
            .text('Frequency: ', 280, detailY)
            .fillColor('#0284c7')
            .font('Helvetica-Bold')
            .text(prescription.frequency, 340, detailY);

          // Duration
          if (prescription.duration) {
            detailY += 18;
            doc
              .fillColor('#6b7280')
              .font('Helvetica')
              .text('Duration: ', 85, detailY)
              .fillColor('#0284c7')
              .font('Helvetica-Bold')
              .text(prescription.duration, 130, detailY);
          }

          // Instructions
          if (prescription.instructions) {
            detailY += 18;
            doc
              .fillColor('#6b7280')
              .fontSize(9)
              .font('Helvetica-Oblique')
              .text('Instructions: ', 85, detailY);
            doc
              .fillColor('#4b5563')
              .font('Helvetica')
              .text(prescription.instructions, 85, detailY + 12, { width: 450 });
          }

          yPos += boxHeight + 10;
        });

        yPos += 10;
      }

      // Cost Summary Section
      if (visit.total_cost) {
        // Check if we need a new page
        if (yPos > 680) {
          doc.addPage();
          yPos = 50;
        }

        doc
          .fillColor('#16a34a')
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('💰 Cost Summary', 50, yPos);

        yPos += 25;

        drawBox(50, yPos, doc.page.width - 100, 80, '#f0fdf4');

        // Consultation Fee
        if (visit.consultation_fee) {
          doc
            .fillColor('#6b7280')
            .fontSize(10)
            .font('Helvetica')
            .text('Consultation Fee:', 70, yPos + 15);
          doc
            .fillColor('#16a34a')
            .fontSize(14)
            .font('Helvetica-Bold')
            .text(`$${visit.consultation_fee.toFixed(2)}`, 450, yPos + 13, {
              width: 80,
              align: 'right',
            });
        }

        // Divider line
        doc
          .moveTo(70, yPos + 40)
          .lineTo(530, yPos + 40)
          .strokeColor('#d1d5db')
          .lineWidth(1)
          .stroke();

        // Total Cost
        doc
          .fillColor('#1f2937')
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Total Amount:', 70, yPos + 50);
        doc
          .fillColor('#16a34a')
          .fontSize(16)
          .font('Helvetica-Bold')
          .text(`$${visit.total_cost.toFixed(2)}`, 450, yPos + 48, { width: 80, align: 'right' });

        // Payment Status Badge
        const isPaid = visit.payment_status === 'paid';
        const statusColor = isPaid
          ? '#16a34a'
          : visit.payment_status === 'partial'
            ? '#ea580c'
            : '#ef4444';
        const statusBg = isPaid
          ? '#dcfce7'
          : visit.payment_status === 'partial'
            ? '#fed7aa'
            : '#fee2e2';

        doc
          .rect(380, yPos + 15, 150, 20)
          .fillAndStroke(statusBg, statusColor)
          .lineWidth(1);
        doc
          .fillColor(statusColor)
          .fontSize(10)
          .font('Helvetica-Bold')
          .text((visit.payment_status || 'pending').toUpperCase(), 380, yPos + 20, {
            width: 150,
            align: 'center',
          });

        yPos += 100;
      }

      // Visit Notes Section
      if (visit.notes) {
        // Check if we need a new page
        if (yPos > 650) {
          doc.addPage();
          yPos = 50;
        }

        doc
          .fillColor('#6366f1')
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('📝 Visit Notes', 50, yPos);

        yPos += 25;

        const notesHeight = Math.min(100, doc.heightOfString(visit.notes, { width: 480 }) + 20);
        drawBox(50, yPos, doc.page.width - 100, notesHeight, '#eef2ff');

        doc
          .fillColor('#4b5563')
          .fontSize(10)
          .font('Helvetica')
          .text(visit.notes, 70, yPos + 15, { width: 460 });

        yPos += notesHeight + 20;
      }

      // Footer
      const footerY = doc.page.height - 80;
      doc
        .moveTo(50, footerY)
        .lineTo(doc.page.width - 50, footerY)
        .strokeColor('#e5e7eb')
        .lineWidth(1)
        .stroke();

      doc
        .fillColor('#9ca3af')
        .fontSize(8)
        .font('Helvetica')
        .text(
          'This is a computer-generated document. No signature is required.',
          50,
          footerY + 10,
          { align: 'center' }
        )
        .text(
          `Generated on ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}`,
          50,
          footerY + 25,
          { align: 'center' }
        )
        .text('RealCIS Healthcare System | Confidential Patient Information', 50, footerY + 40, {
          align: 'center',
        });

      doc.end();
      const pdfBuffer = await pdfPromise;

      return {
        success: true,
        pdf: pdfBuffer,
        filename: `visit-summary-${visitId}-${Date.now()}.pdf`,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Export patient visit history as CSV
   */
  async exportVisitHistoryCSV(patientId) {
    try {
      const { Parser } = await import('json2csv');

      // Get all completed visits
      const visits = await this.visitModel.getPatientVisitHistory(patientId, {
        includeCompleted: true,
        includeInProgress: false,
        limit: 1000,
      });

      if (!visits || visits.length === 0) {
        throw new Error('No visit history found for this patient');
      }

      // Flatten the visit data for CSV export
      const flattenedData = visits.map((visit) => ({
        'Visit Date': new Date(visit.visit_date).toLocaleDateString(),
        'Visit Type': visit.visit_type || 'N/A',
        Doctor: visit.doctor ? `Dr. ${visit.doctor.first_name} ${visit.doctor.last_name}` : 'N/A',
        'Chief Complaint': visit.chief_complaint || 'N/A',
        Diagnoses: visit.diagnoses?.map((d) => d.diagnosis_name || d.icd_code).join('; ') || 'N/A',
        Prescriptions:
          visit.prescriptions?.map((p) => `${p.medication_name} (${p.dosage})`).join('; ') ||
          'None',
        'Blood Pressure':
          visit.vitals?.[0]?.blood_pressure_systolic && visit.vitals?.[0]?.blood_pressure_diastolic
            ? `${visit.vitals[0].blood_pressure_systolic}/${visit.vitals[0].blood_pressure_diastolic}`
            : 'N/A',
        'Heart Rate': visit.vitals?.[0]?.heart_rate ? `${visit.vitals[0].heart_rate} bpm` : 'N/A',
        Temperature: visit.vitals?.[0]?.temperature
          ? `${visit.vitals[0].temperature}°${visit.vitals[0].temperature_unit}`
          : 'N/A',
        Weight: visit.vitals?.[0]?.weight
          ? `${visit.vitals[0].weight} ${visit.vitals[0].weight_unit}`
          : 'N/A',
        Status: visit.status || 'N/A',
        Notes: visit.notes || 'N/A',
      }));

      const parser = new Parser();
      const csv = parser.parse(flattenedData);

      return {
        success: true,
        csv,
        filename: `visit-history-${patientId}-${new Date().toISOString().split('T')[0]}.csv`,
      };
    } catch (error) {
      throw new Error(`Failed to export visit history as CSV: ${error.message}`);
    }
  }

  /**
   * Export patient visit history as PDF
   */
  async exportVisitHistoryPDF(patientId) {
    try {
      const PDFDocument = (await import('pdfkit')).default;

      // Get all completed visits
      const visits = await this.visitModel.getPatientVisitHistory(patientId, {
        includeCompleted: true,
        includeInProgress: false,
        limit: 1000,
      });

      if (!visits || visits.length === 0) {
        throw new Error('No visit history found for this patient');
      }

      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      // Collect PDF data into buffer
      doc.on('data', (chunk) => chunks.push(chunk));

      // PDF Header
      doc.fontSize(20).text('Patient Visit History', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);

      // Visit entries
      visits.forEach((visit, index) => {
        // Check if we need a new page
        if (doc.y > 700) {
          doc.addPage();
        }

        // Visit header
        doc
          .fontSize(14)
          .fillColor('#2563eb')
          .text(`Visit ${index + 1}`, { underline: true });
        doc.moveDown(0.5);

        // Visit details
        doc.fontSize(10).fillColor('#000000');
        doc.text(`Date: ${new Date(visit.visit_date).toLocaleDateString()}`);
        doc.text(`Type: ${visit.visit_type || 'N/A'}`);
        doc.text(
          `Doctor: ${visit.doctor ? `Dr. ${visit.doctor.first_name} ${visit.doctor.last_name}` : 'N/A'}`
        );
        doc.text(`Chief Complaint: ${visit.chief_complaint || 'N/A'}`);
        doc.moveDown(0.5);

        // Vitals (if available)
        if (visit.vitals && visit.vitals.length > 0) {
          const v = visit.vitals[0];
          doc.fontSize(11).fillColor('#4b5563').text('Vitals:', { underline: true });
          doc.fontSize(10).fillColor('#000000');
          if (v.blood_pressure_systolic && v.blood_pressure_diastolic) {
            doc.text(
              `  Blood Pressure: ${v.blood_pressure_systolic}/${v.blood_pressure_diastolic} mmHg`
            );
          }
          if (v.heart_rate) {
            doc.text(`  Heart Rate: ${v.heart_rate} bpm`);
          }
          if (v.temperature) {
            doc.text(`  Temperature: ${v.temperature}°${v.temperature_unit}`);
          }
          if (v.weight) {
            doc.text(`  Weight: ${v.weight} ${v.weight_unit}`);
          }
          doc.moveDown(0.5);
        }

        // Diagnoses
        if (visit.diagnoses && visit.diagnoses.length > 0) {
          doc.fontSize(11).fillColor('#4b5563').text('Diagnoses:', { underline: true });
          doc.fontSize(10).fillColor('#000000');
          visit.diagnoses.forEach((d) => {
            doc.text(`  • ${d.diagnosis_name || d.icd_code}`);
          });
          doc.moveDown(0.5);
        }

        // Prescriptions
        if (visit.prescriptions && visit.prescriptions.length > 0) {
          doc.fontSize(11).fillColor('#4b5563').text('Prescriptions:', { underline: true });
          doc.fontSize(10).fillColor('#000000');
          visit.prescriptions.forEach((p) => {
            doc.text(`  • ${p.medication_name} - ${p.dosage}`);
            if (p.instructions) {
              doc.text(`    ${p.instructions}`, { indent: 20 });
            }
          });
          doc.moveDown(0.5);
        }

        // Notes
        if (visit.notes) {
          doc.fontSize(11).fillColor('#4b5563').text('Notes:', { underline: true });
          doc.fontSize(10).fillColor('#000000');
          doc.text(visit.notes, { width: 500 });
        }

        doc.moveDown(1.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);
      });

      // Finalize PDF
      doc.end();

      // Wait for PDF to finish
      const pdf = await new Promise((resolve, reject) => {
        doc.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
        doc.on('error', reject);
      });

      return {
        success: true,
        pdf,
        filename: `visit-history-${patientId}-${new Date().toISOString().split('T')[0]}.pdf`,
      };
    } catch (error) {
      throw new Error(`Failed to export visit history as PDF: ${error.message}`);
    }
  }
}

export default VisitService;
