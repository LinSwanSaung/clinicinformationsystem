# Backend Documentation

This directory contains documentation for the ThriveCare backend API.

## 📚 Documentation Index

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Architecture, design patterns, middleware, logging, and import boundaries |
| [SETUP_AND_OPERATIONS.md](./SETUP_AND_OPERATIONS.md) | Setup, configuration, database operations, and troubleshooting |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Backend deployment guide for Railway |

## 🔍 Quick Reference

### Development Commands

```bash
npm run dev      # Start development server
npm run start    # Start production server
npm run lint     # Run ESLint
npm run lint:fix # Fix ESLint errors
```

### Logging Levels

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

- [Main README](../README.md) - Backend API overview
- [Database Schema](../database/schema.sql) - Database structure
- [Project Documentation](../../docs/) - Project-level documentation
