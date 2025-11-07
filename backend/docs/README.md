# Backend Documentation

This directory contains production-ready documentation for the RealCIS backend.

## 📚 Documentation Index

### Architecture & Design

- **[BACKEND_BOUNDARIES.md](./BACKEND_BOUNDARIES.md)** - Architectural boundaries, import rules, and layer separation
- **[MIDDLEWARE_ORDER.md](./MIDDLEWARE_ORDER.md)** - Middleware execution order and configuration

### Database

- **[SCHEMA_VERIFICATION.md](./SCHEMA_VERIFICATION.md)** - Schema verification guide and procedures
- **[DOCTOR_AVAILABILITY.md](./DOCTOR_AVAILABILITY.md)** - Doctor availability system documentation

### Features

- **[DOCTOR_UNAVAILABILITY_SYSTEM.md](./DOCTOR_UNAVAILABILITY_SYSTEM.md)** - Doctor unavailability management system
- **[LOGGER_GUIDE.md](./LOGGER_GUIDE.md)** - Logging system usage and best practices

### Setup & Operations

- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Supabase configuration and setup guide
- **[ROLLBACK.md](./ROLLBACK.md)** - Rollback procedures and recovery steps

## 🔍 Quick Reference

### Schema Verification

```bash
npm run db:verify-schema
```

### Logging

- Production: `LOG_LEVEL=info`
- Development: `LOG_LEVEL=debug`
- See [LOGGER_GUIDE.md](./LOGGER_GUIDE.md) for details

### Middleware Order

1. Request Logger
2. Rate Limiter
3. CORS
4. Body Parser
5. Authentication
6. Authorization
7. Routes
8. Error Handler

See [MIDDLEWARE_ORDER.md](./MIDDLEWARE_ORDER.md) for full details.

## 📖 Additional Resources

- Main [README.md](../README.md) - Getting started and API documentation
- [database/README.md](../database/README.md) - Database schema and migrations
