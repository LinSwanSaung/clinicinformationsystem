# RealCIS Backend API

A robust, scalable backend API for the RealCIS Clinic Information System built with Node.js, Express, and Supabase.

## 🏗️ Architecture Overview

```
server/
├── src/
│   ├── app.js                 # Main application entry point
│   ├── config/                # Configuration files
│   │   ├── database.js        # Supabase connection setup
│   │   └── app.config.js      # Application configuration
│   ├── controllers/           # Request handlers (to be created)
│   ├── models/                # Data models and database operations
│   │   ├── BaseModel.js       # Base model with common CRUD operations
│   │   ├── User.model.js      # User model with authentication
│   │   └── Patient.model.js   # Patient model
│   ├── services/              # Business logic layer
│   │   ├── Auth.service.js    # Authentication service
│   │   └── Patient.service.js # Patient management service
│   ├── routes/                # API route definitions
│   │   ├── auth.routes.js     # Authentication endpoints
│   │   └── patient.routes.js  # Patient management endpoints
│   ├── middleware/            # Custom middleware
│   │   ├── auth.js           # Authentication & authorization
│   │   ├── errorHandler.js   # Global error handling
│   │   ├── rateLimiter.js    # Rate limiting
│   │   └── requestLogger.js  # Request logging
│   ├── validators/           # Input validation schemas
│   │   ├── base.validator.js # Common validation schemas
│   │   ├── auth.validator.js # Authentication validation
│   │   └── patient.validator.js # Patient validation
│   └── utils/               # Utility functions
│       ├── responseHelper.js # Standardized API responses
│       └── dateHelper.js    # Date manipulation utilities
├── tests/                   # Test files
│   ├── unit/               # Unit tests
│   └── integration/        # Integration tests
├── database/               # Database related files
│   ├── migrations/         # Database migrations
│   └── seeds/             # Sample data
└── package.json           # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. **Navigate to the server directory:**

   ```bash
   cd server
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Environment Setup:**

   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables:**

   ```env
   NODE_ENV=development
   PORT=5000

   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_role_key

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d

   # CORS Configuration
   CLIENT_URL=http://localhost:5173
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

## 📊 Database Schema

The backend uses the following core tables:

### Users

- Stores all system users (admin, doctor, nurse, receptionist)
- Handles authentication and role-based access

### Patients

- Patient demographics and medical information
- Integrates with appointment and medical record systems

### Appointments

- Appointment scheduling and status tracking
- Links patients with doctors and tracks workflow

### Vitals

- Patient vital signs recorded by nurses
- Timestamps and user tracking for audit trails

### Medical Records

- Doctor notes and clinical observations
- Prescription and treatment tracking

## 🔐 Authentication & Authorization

### JWT-based Authentication

- Stateless authentication using JSON Web Tokens
- Token expiration and refresh handling
- Secure password hashing with bcrypt

### Role-based Access Control

- **Admin**: Full system access, user management
- **Doctor**: Patient records, medical notes, prescriptions
- **Nurse**: Vitals recording, patient status updates
- **Receptionist**: Patient registration, appointment scheduling

### Example Usage

```javascript
// Protected route requiring authentication
router.get('/patients', authenticate, getAllPatients);

// Role-specific route
router.post('/patients', authenticate, authorize('receptionist', 'admin'), createPatient);
```

## 🛡️ Security Features

### Rate Limiting

- General API rate limiting (100 requests/15 minutes)
- Strict authentication rate limiting (5 attempts/15 minutes)
- Upload-specific rate limiting

### Input Validation

- Joi schema validation for all inputs
- SQL injection prevention
- XSS protection with helmet

### Error Handling

- Centralized error handling
- Environment-specific error responses
- Detailed logging for debugging

## 📡 API Endpoints

### Authentication

```
POST   /api/auth/login          # User login
POST   /api/auth/register       # User registration (Admin only)
GET    /api/auth/me            # Get current user
PUT    /api/auth/change-password # Change password
POST   /api/auth/logout        # User logout
```

### Patients

```
GET    /api/patients           # Get all patients
GET    /api/patients/:id       # Get patient by ID
POST   /api/patients           # Create new patient
PUT    /api/patients/:id       # Update patient
DELETE /api/patients/:id       # Delete patient (Admin only)
GET    /api/patients/search/:term # Search patients
```

### Health Check

```
GET    /health                 # API health status
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Individual function and method testing
- **Integration Tests**: API endpoint testing with database
- **Test Coverage**: Comprehensive coverage reporting

## 📈 Performance & Scalability

### Database Optimization

- Proper indexing on frequently queried fields
- Efficient query patterns with Supabase
- Connection pooling and query optimization

### Caching Strategy

- Response caching for static data
- Database query result caching
- CDN integration for file uploads

### Monitoring

- Request logging and performance metrics
- Error tracking and alerting
- Health check endpoints

## 🔧 Development Workflow

### Code Organization Principles

1. **Separation of Concerns**
   - Controllers handle HTTP requests/responses
   - Services contain business logic
   - Models handle data operations
   - Middleware handles cross-cutting concerns

2. **Modularity**
   - Each feature in separate modules
   - Reusable components and utilities
   - Clear dependency management

3. **Error Handling**
   - Centralized error handling
   - Consistent error responses
   - Proper HTTP status codes

### Best Practices

- **Input Validation**: All inputs validated with Joi schemas
- **Security**: Authentication required for all protected routes
- **Logging**: Comprehensive request/response logging
- **Documentation**: Clear API documentation and code comments
- **Testing**: Unit and integration tests for all features

## 🚀 Deployment

### Production Setup

1. Set NODE_ENV=production
2. Use production Supabase instance
3. Configure proper JWT secrets
4. Set up SSL/TLS certificates
5. Configure reverse proxy (nginx/Apache)

### Environment Variables

Ensure all required environment variables are set in production:

- Database credentials
- JWT secrets
- CORS origins
- File upload configurations

## 🤝 Contributing

1. Follow the established directory structure
2. Add appropriate tests for new features
3. Validate all inputs with Joi schemas
4. Use the error handling middleware
5. Follow the coding standards and patterns

## 📚 Additional Resources

### Documentation

- **[docs/](./docs/)** - Production documentation (architecture, setup, guides)
- **[database/README.md](./database/README.md)** - Database schema and migrations

### External Resources

- [Express.js Documentation](https://expressjs.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Joi Validation](https://joi.dev/api/)
- [JWT Authentication](https://jwt.io/)

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check Supabase URL and keys
   - Verify network connectivity
   - Check environment variables

2. **Authentication Errors**
   - Verify JWT secret configuration
   - Check token expiration settings
   - Validate user permissions

3. **Validation Errors**
   - Review input schemas
   - Check required fields
   - Validate data types

For more help, check the logs or create an issue in the project repository.
