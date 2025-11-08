# Adding Features - Structure Maintenance Guide

This guide explains how to add new features while maintaining the clean code and folder structure we've established.

## 📁 Current Structure

```
src/
├── components/
│   ├── ui/              # Base UI primitives (shadcn/ui)
│   ├── library/         # Application-level reusable components
│   └── layout/          # Layout components (Navbar, PageLayout, etc.)
├── features/            # Feature-based modules
│   └── [feature-name]/
│       ├── components/   # Feature-specific components
│       ├── hooks/       # Custom hooks for the feature
│       ├── pages/       # Feature pages
│       ├── services/    # API services for the feature
│       └── index.js      # Barrel file for exports
├── services/            # Global API services
├── utils/               # Utility functions
└── contexts/            # React contexts
```

## 🎯 Adding a New Feature

### Step 1: Create Feature Folder

```bash
src/features/[feature-name]/
├── components/
├── hooks/
├── pages/
├── services/
└── index.js
```

**Example: Adding a "Reports" feature**

```bash
src/features/reports/
├── components/
│   ├── ReportCard.jsx
│   └── ReportFilters.jsx
├── hooks/
│   ├── useReports.js
│   └── useReportGeneration.js
├── pages/
│   ├── ReportsPage.jsx
│   └── ReportDetailPage.jsx
├── services/
│   └── reportService.js
└── index.js
```

### Step 2: Create Barrel File (index.js)

```javascript
// src/features/reports/index.js
export { default as ReportsPage } from './pages/ReportsPage';
export { default as ReportDetailPage } from './pages/ReportDetailPage';
export { useReports, useReportGeneration } from './hooks';
export { default as reportService } from './services/reportService';
```

### Step 3: Component Placement Rules

**Use `components/ui/` for:**
- Base UI primitives (buttons, inputs, cards)
- Components from shadcn/ui
- Components with NO business logic

**Use `components/library/` for:**
- Application-level reusable components
- Components that use UI primitives
- Components with some business logic but reusable across features

**Use `features/[feature]/components/` for:**
- Feature-specific components
- Components tightly coupled to the feature
- Components that won't be reused elsewhere

**Example:**
```javascript
// ✅ CORRECT: Feature-specific component
// src/features/reports/components/ReportCard.jsx
import { Card } from '@/components/ui/card';  // Base primitive
import { StatusBadge } from '@/components/library';  // Application component

// ✅ CORRECT: Reusable application component
// src/components/library/reports/ReportChart.jsx
import { Card } from '@/components/ui/card';
import { LineChart } from 'recharts';

// ❌ WRONG: Don't put feature components in ui/
// src/components/ui/ReportCard.jsx  // NO - has business logic
```

### Step 4: Service Layer

**Feature Services (`features/[feature]/services/`):**
- API calls specific to the feature
- Uses global `api.js` service
- Encapsulates feature-specific data fetching

```javascript
// src/features/reports/services/reportService.js
import api from '@/services/api';

class ReportService {
  async getReports(params) {
    return api.get('/reports', { params });
  }
  
  async generateReport(reportId) {
    return api.post(`/reports/${reportId}/generate`);
  }
}

export default new ReportService();
```

**Global Services (`services/`):**
- Only for services used across multiple features
- Examples: `api.js`, `notificationService.js`, `clinicSettingsService.js`

### Step 5: Custom Hooks

```javascript
// src/features/reports/hooks/useReports.js
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../index';

export function useReports(filters) {
  return useQuery({
    queryKey: ['reports', filters],
    queryFn: () => reportService.getReports(filters),
  });
}
```

### Step 6: Error Handling & Logging

**Always use the logger utility:**

```javascript
import logger from '@/utils/logger';

// ✅ CORRECT
try {
  const data = await reportService.getReports();
} catch (error) {
  logger.error('Failed to fetch reports:', error);
  // Handle error
}

// ❌ WRONG
try {
  const data = await reportService.getReports();
} catch (error) {
  console.error('Failed to fetch reports:', error);  // NO
}
```

### Step 7: Import Patterns

**Use path aliases:**

```javascript
// ✅ CORRECT
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/library';
import { useReports } from '@/features/reports';
import logger from '@/utils/logger';

// ❌ WRONG
import { Card } from '../../../components/ui/card';  // NO deep relative imports
import { useReports } from '../../features/reports';  // NO relative imports
```

## 🔍 Code Quality Checklist

When adding a new feature, ensure:

- [ ] Feature folder follows the structure: `components/`, `hooks/`, `pages/`, `services/`, `index.js`
- [ ] Barrel file (`index.js`) exports all public APIs
- [ ] Components are in the correct location (ui/ vs library/ vs feature/)
- [ ] All `console.*` statements use `logger` instead
- [ ] Imports use path aliases (`@/`) not relative paths
- [ ] Error handling uses `logger.error`
- [ ] No `React.memo` - use `memo` from 'react' directly
- [ ] No `import React from 'react'` (React 19 automatic JSX transform)
- [ ] ESLint passes: `npm run lint`
- [ ] Code is formatted: `npm run format`

## 📝 Example: Complete Feature

```javascript
// src/features/reports/index.js
export { default as ReportsPage } from './pages/ReportsPage';
export { useReports } from './hooks/useReports';
export { default as reportService } from './services/reportService';

// src/features/reports/services/reportService.js
import api from '@/services/api';
import logger from '@/utils/logger';

class ReportService {
  async getReports(params) {
    try {
      return await api.get('/reports', { params });
    } catch (error) {
      logger.error('Failed to fetch reports:', error);
      throw error;
    }
  }
}

export default new ReportService();

// src/features/reports/hooks/useReports.js
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../index';

export function useReports(filters) {
  return useQuery({
    queryKey: ['reports', filters],
    queryFn: () => reportService.getReports(filters),
  });
}

// src/features/reports/pages/ReportsPage.jsx
import { useReports } from '@/features/reports';
import { Card } from '@/components/ui/card';
import { LoadingSpinner, ErrorState } from '@/components/library';
import PageLayout from '@/components/layout/PageLayout';

export default function ReportsPage() {
  const { data, isLoading, error } = useReports();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} />;
  
  return (
    <PageLayout title="Reports">
      {/* Report content */}
    </PageLayout>
  );
}
```

## 🚫 Common Mistakes to Avoid

1. **Putting feature components in `ui/`**
   - `ui/` is only for base primitives
   - Feature components go in `features/[feature]/components/`

2. **Using relative imports**
   - Always use `@/` path aliases
   - Never use `../../../`

3. **Using `console.*` instead of `logger`**
   - All logging should use the logger utility
   - Logger has PII sanitization and log levels

4. **Importing React unnecessarily**
   - React 19 has automatic JSX transform
   - Only import specific hooks: `import { useState, useEffect } from 'react'`
   - Use `memo` not `React.memo`

5. **Creating global services for feature-specific logic**
   - Feature services go in `features/[feature]/services/`
   - Only truly global services go in `services/`

## 🔄 Maintaining Structure

**When adding new features:**
1. Follow the feature folder structure
2. Use barrel files for clean imports
3. Place components in the correct location
4. Use the logger utility
5. Follow import patterns
6. Run linting and formatting

**I can help maintain this structure by:**
- Enforcing component placement rules
- Ensuring proper import patterns
- Standardizing error handling
- Maintaining documentation
- Running linting/formatting checks

## 📚 Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall architecture
- [SETUP_AND_DEPLOYMENT.md](./SETUP_AND_DEPLOYMENT.md) - Setup guide
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) - Production readiness

