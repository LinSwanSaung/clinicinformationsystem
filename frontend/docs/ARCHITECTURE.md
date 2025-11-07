# Frontend Architecture

## Overview

The RealCIS frontend is built with React 19, Vite, and Tailwind CSS, following a feature-based architecture pattern.

## Directory Structure

```
src/
├── app/                    # App-level configuration
│   ├── App.jsx            # Root component
│   ├── providers.jsx      # Context providers
│   └── routes.jsx         # Route definitions
├── components/            # Shared components
│   ├── layout/           # Layout components (Navbar, PageLayout, etc.)
│   ├── library/          # Reusable component library
│   └── ui/               # Base UI components (shadcn/ui)
├── features/             # Feature modules (feature-based architecture)
│   ├── appointments/     # Appointment management
│   ├── patients/         # Patient management
│   ├── medical/          # Medical records
│   └── ...
├── pages/                # Page components
├── services/             # Shared services
├── hooks/                # Shared hooks
├── utils/                # Utility functions
├── constants/            # Constants and configuration
└── i18n/                 # Internationalization
```

## Architecture Patterns

### Feature-Based Architecture

Each feature is self-contained with:
- `components/` - Feature-specific components
- `hooks/` - Feature-specific hooks
- `pages/` - Feature pages
- `services/` - Feature API services
- `index.js` - Public exports

### Component Library

Reusable components in `components/library/`:
- **DataTable** - Data tables with sorting/filtering
- **FormModal** - Modal forms
- **EmptyState** - Empty state displays
- **ErrorState** - Error displays
- **LoadingSpinner** - Loading indicators

### Import Rules

- Use path aliases: `@/components`, `@/services`, `@/utils`
- Services must use `@/services/api.js` for API calls
- No direct Supabase imports in UI components
- Use library components instead of feature-specific ones

## State Management

- **React Query** - Server state and caching
- **Context API** - Global state (Auth, etc.)
- **Local State** - Component-level state with `useState`

## Styling

- **Tailwind CSS** - Utility-first CSS
- **Design Tokens** - CSS variables in `src/styles/theme.css`
- **Component Variants** - Using `class-variance-authority`

## Logging

Centralized logging via `@/utils/logger`:
- Development: Debug level enabled
- Production: Error level only
- PII sanitization built-in

## Best Practices

1. **Feature Isolation** - Features should not import from other features
2. **Service Layer** - All API calls go through services
3. **Type Safety** - Use Zod for validation
4. **Error Handling** - Use ErrorBoundary and error states
5. **Performance** - Use React Query caching, lazy loading

