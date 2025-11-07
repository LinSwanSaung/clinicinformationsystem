# Frontend Documentation

This directory contains production-ready documentation for the RealCIS frontend.

## 📚 Documentation

### Core Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture, design patterns, component structure, and best practices
- **[SETUP_AND_DEPLOYMENT.md](./SETUP_AND_DEPLOYMENT.md)** - Setup, configuration, build, and deployment guide
- **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** - Production deployment checklist and verification steps

## 🔍 Quick Reference

### Development

```bash
npm run dev          # Start development server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
```

### Build

```bash
npm run build        # Build for production
npm run preview      # Preview production build
```

### Logging

- Development: `VITE_LOG_LEVEL=debug` (default)
- Production: `VITE_LOG_LEVEL=error` (recommended)

Use the logger utility:
```javascript
import logger from '@/utils/logger';

logger.debug('Debug message');  // Only in development
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');
```

## 📖 Additional Resources

- Main [README.md](../README.md) - Getting started
- [styles/README.md](../src/styles/README.md) - Design system and theming

