# Backend Documentation

This directory contains production-ready documentation for the ThriveCare backend.

## 📚 Documentation

### Core Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture, design patterns, middleware, logging, and import boundaries
- **[SETUP_AND_OPERATIONS.md](./SETUP_AND_OPERATIONS.md)** - Setup, configuration, deployment, database operations, and troubleshooting

## 🔍 Quick Reference

### Schema Verification

```bash
npm run db:verify-schema
```

### Logging

- Production: `LOG_LEVEL=info`
- Development: `LOG_LEVEL=debug`

### Middleware Order

1. CORS
2. Body Parsing
3. Request Logging
4. Rate Limiting
5. Authentication
6. Authorization
7. Route Handlers
8. Error Handler

## 📖 Additional Resources

- Main [README.md](../README.md) - Getting started and API documentation
- [database/README.md](../database/README.md) - Database schema and migrations
