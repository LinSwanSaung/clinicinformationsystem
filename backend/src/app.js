import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { authenticate } from './middleware/auth.js';
import { requestLogger } from './middleware/requestLogger.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import config from './config/app.config.js';
import logger from './config/logger.js';

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
import dispenseRoutes from './routes/dispense.routes.js';
import { testConnection } from './config/database.js';
import tokenScheduler from './services/TokenScheduler.service.js';
import appointmentAutoCancel from './jobs/autoCancelAppointments.js';
import { startAppointmentReminders } from './jobs/appointmentReminders.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// MIDDLEWARE ORDER (CRITICAL - Order matters!)
// ============================================================================

// 1. Trust proxy - Must be first if behind reverse proxy (nginx, load balancer)
// This ensures rate limiting and IP detection work correctly
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? true : 1);

// 2. Security headers - Protect against common vulnerabilities
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding if needed
  })
);

// 3. CORS - Configure properly based on environment
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(',')
      : [config.cors.origin];

    // In development, allow localhost on any port
    if (process.env.NODE_ENV === 'development') {
      if (
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1') ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }
    }

    // In production, only allow configured origins
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: config.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'x-dev-role',
    'Cache-Control',
    'Pragma',
  ],
  exposedHeaders: ['RateLimit-Reset', 'RateLimit-Remaining', 'RateLimit-Limit'],
};
app.use(cors(corsOptions));

// 4. Response compression - Compress responses to reduce bandwidth
app.use(compression());

// 5. Body parsers - Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Request logger - Log all incoming requests
app.use(requestLogger);

// 7. Disable HTTP caching for API responses to prevent 304 Not Modified issues
app.set('etag', false);
app.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    Pragma: 'no-cache',
    Expires: '0',
  });
  next();
});

// 8. Global rate limiter - Apply to all routes except health check
// Health check should be exempt to allow monitoring systems to check status
app.use((req, res, next) => {
  if (req.path === '/health') {
    return next(); // Skip rate limiting for health check
  }
  rateLimiter(req, res, next);
});

// Health check endpoint (includes DB connectivity) - Must be before routes
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.status(200).json({
    status: 'OK',
    message: 'RealCIS API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    db: {
      connected: dbConnected,
    },
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
// Protect prescriptions endpoints with authentication
app.use('/api/prescriptions', authenticate, prescriptionRoutes);
// Protect doctor-notes endpoints with authentication; roles enforced per-route
app.use('/api/doctor-notes', authenticate, doctorNoteRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dispenses', dispenseRoutes);
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
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 RealCIS API Server running on port ${PORT}`);
  logger.info(`📋 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🏥 Health check: http://localhost:${PORT}/health`);

  // Start automatic token scheduler
  logger.info('⏰ Starting Token Scheduler...');
  tokenScheduler.start();
  logger.info('✓ Token Scheduler started - will check for missed tokens every 5 minutes');

  // Start automatic appointment auto-cancel job
  logger.info('⏰ Starting Appointment Auto-Cancel Job...');
  appointmentAutoCancel.start();
  logger.info(
    `✓ Appointment Auto-Cancel started - ${appointmentAutoCancel.getScheduleDescription()}`
  );

  // Start appointment reminder job (runs every 5 minutes)
  startAppointmentReminders();
});

export default app;
