export default {
  // Server Configuration
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  // CORS Configuration
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  },

  // File Upload
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    path: process.env.UPLOAD_PATH || 'uploads/',
  },

  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },

  // Security
  security: {
    bcryptRounds: 12,
    passwordMinLength: 8,
  },

  // Email / SMTP
  email: {
    smtp: {
      host: process.env.SMTP_HOST || null,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      user: process.env.SMTP_USER || null,
      pass: process.env.SMTP_PASS || null,
    },
    from: process.env.EMAIL_FROM || 'no-reply@realcis.local',
  },

  // Portal URL for CTAs in emails
  portalUrl: process.env.PORTAL_URL || process.env.APP_BASE_URL || 'https://portal.example.com',
};
