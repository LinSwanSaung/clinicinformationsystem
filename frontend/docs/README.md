# Frontend Documentation

This directory contains documentation for the ThriveCare frontend application.

## 📚 Documentation Index

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Architecture, design patterns, component structure, and best practices |
| [SETUP_AND_DEPLOYMENT.md](./SETUP_AND_DEPLOYMENT.md) | Setup, configuration, build, and deployment guide |
| [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) | Production deployment checklist and verification steps |
| [THEME_COLORS_GUIDE.md](./THEME_COLORS_GUIDE.md) | Supabase theme color variables and styling guide |

## 🔍 Quick Reference

### Development Commands

```bash
npm run dev          # Start development server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run build        # Build for production
npm run preview      # Preview production build
```

### Logging

- Development: `VITE_LOG_LEVEL=debug` (default)
- Production: `VITE_LOG_LEVEL=error` (recommended)

```javascript
import logger from '@/utils/logger';

logger.debug('Debug message');  // Only in development
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');
```

## 📖 Additional Resources

- [Main README](../README.md) - Frontend overview
- [Styles README](../src/styles/README.md) - Design system and theming
- [Project Documentation](../../docs/) - Project-level documentation

