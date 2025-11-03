import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import patientRoutes from './routes/patient.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import vitalsRoutes from './routes/vitals.routes.js';
import medicalRecordRoutes from './routes/medicalRecord.routes.js';
import documentRoutes from './routes/document.routes.js';
import doctorAvailabilityRoutes from './routes/doctorAvailability.routes.js';
import clinicSettingsRoutes from './routes/clinicSettings.routes.js';
import queueRoutes from './routes/queue.routes.js';
import patientAllergyRoutes from './routes/patientAllergy.routes.js';
import patientDiagnosisRoutes from './routes/patientDiagnosis.routes.js';
import visitRoutes from './routes/visit.routes.js';
import prescriptionRoutes from './routes/prescription.routes.js';
import doctorNoteRoutes from './routes/doctorNote.routes.js';
import serviceRoutes from './routes/service.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import patientPortalRoutes from './routes/patientPortal.routes.js';
import auditLogRoutes from './routes/auditLog.routes.js';
import adminRoutes from './routes/admin.routes.js';
import aiRoutes from './routes/ai.routes.js';
import { testConnection } from './config/database.js';
import tokenScheduler from './services/TokenScheduler.service.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Disable HTTP caching for API responses to prevent 304 Not Modified issues
app.set('etag', false);
app.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    Pragma: 'no-cache',
    Expires: '0'
  });
  next();
});

// Simple CORS - Allow everything in development
app.use(cors());

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Health check endpoint (includes DB connectivity)
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.status(200).json({
    status: 'OK',
    message: 'RealCIS API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    db: {
      connected: dbConnected
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/doctor-availability', doctorAvailabilityRoutes);
app.use('/api/clinic-settings', clinicSettingsRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/patient-allergies', patientAllergyRoutes);
app.use('/api/patient-diagnoses', patientDiagnosisRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/doctor-notes', doctorNoteRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/me', patientPortalRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 RealCIS API Server running on port ${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  
  // Start automatic token scheduler
  console.log('\n⏰ Starting Token Scheduler...');
  tokenScheduler.start();
  console.log('✓ Token Scheduler started - will check for missed tokens every 5 minutes\n');
});

export default app;
