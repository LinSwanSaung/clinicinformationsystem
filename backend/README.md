# ThriveCare Backend API

A robust, scalable backend API for the ThriveCare Clinic Information System built with Node.js, Express, and Supabase.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

## 📚 Documentation

- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Architecture, design patterns, middleware, logging
- **[docs/SETUP_AND_OPERATIONS.md](./docs/SETUP_AND_OPERATIONS.md)** - Setup, configuration, deployment, operations
- **[database/README.md](./database/README.md)** - Database schema and migrations

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── app.js                 # Main application entry point
│   ├── config/                # Configuration files
│   ├── routes/                # API route definitions
│   ├── services/              # Business logic layer
│   │   └── repositories/     # Data access layer
│   ├── middleware/            # Custom middleware
│   ├── models/                # Data models (legacy)
│   ├── validators/            # Input validation schemas
│   └── utils/                # Utility functions
├── database/
│   └── schema.sql            # Database schema (single source of truth)
└── docs/                     # Production documentation
```

## 🔐 Authentication & Authorization

- **JWT-based Authentication** - Stateless token-based auth
- **Role-based Access Control** - Admin, Doctor, Nurse, Receptionist, Cashier, Pharmacist
- **Middleware**: `authenticate` (verify token) → `authorize(...roles)` (check permissions)

## 📡 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (Admin only)
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/change-password` - Change password

### Health Check

- `GET /health` - API health status

See detailed API documentation in [docs/](./docs/).

## 🛡️ Security Features

- Rate limiting (general & auth-specific)
- Input validation (Joi schemas)
- SQL injection prevention
- XSS protection (helmet)
- PII sanitization in logs

## 🧪 Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

## 📊 Database

- **Schema**: `database/schema.sql` (single source of truth)
- **Provider**: Supabase (PostgreSQL)

## 🔧 Development

### Available Scripts

```bash
npm run dev           # Start development server
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
npm run format        # Format code with Prettier
```

### Environment Variables

See [docs/SETUP_AND_OPERATIONS.md](./docs/SETUP_AND_OPERATIONS.md) for complete configuration guide.

## 🚀 Deployment

See [docs/SETUP_AND_OPERATIONS.md](./docs/SETUP_AND_OPERATIONS.md) for deployment instructions.

## 📖 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Joi Validation](https://joi.dev/api/)
- [JWT Authentication](https://jwt.io/)
