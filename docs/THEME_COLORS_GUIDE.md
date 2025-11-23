# Supabase Theme Color Variables Guide

## Overview
The Supabase theme from TweakCN includes comprehensive color variables for both light and dark modes. All components should use these theme variables instead of hardcoded colors.

## Available Text Color Variables

### Main Text Colors
- `--foreground` → Use with `text-foreground` - Main text color (dark in light mode, light in dark mode)
- `--card-foreground` → Use with `text-card-foreground` - Text on cards
- `--popover-foreground` → Use with `text-popover-foreground` - Text in popovers/dropdowns
- `--muted-foreground` → Use with `text-muted-foreground` - Muted/secondary text
- `--primary-foreground` → Use with `text-primary-foreground` - Text on primary buttons
- `--secondary-foreground` → Use with `text-secondary-foreground` - Text on secondary elements
- `--accent-foreground` → Use with `text-accent-foreground` - Text on accent elements
- `--destructive-foreground` → Use with `text-destructive-foreground` - Text on destructive actions

### Background Colors
- `--background` → Use with `bg-background` - Main page background
- `--card` → Use with `bg-card` - Card backgrounds
- `--popover` → Use with `bg-popover` - Popover/dropdown backgrounds
- `--muted` → Use with `bg-muted` - Muted backgrounds
- `--accent` → Use with `bg-accent` - Accent backgrounds (hover states)
- `--primary` → Use with `bg-primary` - Primary button backgrounds
- `--secondary` → Use with `bg-secondary` - Secondary backgrounds
- `--destructive` → Use with `bg-destructive` - Destructive action backgrounds

### Border Colors
- `--border` → Use with `border-border` - Standard borders
- `--input` → Use with `border-input` or `bg-input` - Input borders/backgrounds
- `--ring` → Use with `ring-ring` - Focus ring colors

## Common Replacements

### ❌ Don't Use (Hardcoded Colors)
```jsx
// White backgrounds
className="bg-white"

// Gray text
className="text-gray-900"
className="text-gray-600"
className="text-gray-500"

// Gray borders
className="border-gray-200"
className="border-gray-300"

// Gray backgrounds
className="bg-gray-100"
className="bg-gray-50"
className="hover:bg-gray-50"
```

### ✅ Use Instead (Theme Variables)
```jsx
// Card/popover backgrounds
className="bg-card"
className="bg-popover"

// Text colors
className="text-foreground"
className="text-card-foreground"
className="text-muted-foreground"
className="text-popover-foreground"

// Borders
className="border-border"

// Backgrounds
className="bg-muted"
className="bg-accent"
className="hover:bg-accent"
```

## Examples

### Notification Dropdown
```jsx
// Before
<div className="bg-white border border-gray-200">
  <h3 className="text-gray-900">Title</h3>
  <p className="text-gray-600">Description</p>
</div>

// After
<div className="bg-popover border border-border">
  <h3 className="text-popover-foreground">Title</h3>
  <p className="text-muted-foreground">Description</p>
</div>
```

### Status Filter Tabs
```jsx
// Before
<div className="bg-white border border-gray-200">
  <button className="bg-white text-gray-900">Active</button>
  <button className="text-gray-500">Inactive</button>
</div>

// After
<div className="bg-card border border-border">
  <button className="bg-card text-card-foreground">Active</button>
  <button className="text-muted-foreground">Inactive</button>
</div>
```

### Cards
```jsx
// Before
<div className="bg-white border border-gray-200 text-gray-900">
  <h4 className="text-gray-900">Card Title</h4>
  <p className="text-gray-600">Card content</p>
</div>

// After
<div className="bg-card border border-border text-card-foreground">
  <h4 className="text-card-foreground">Card Title</h4>
  <p className="text-muted-foreground">Card content</p>
</div>
```

## Dark Mode Support

All theme variables automatically adapt to dark mode when the `dark` class is present on the `<html>` element. The ThemeProvider handles this automatically.

## Files Fixed

### Core Components
1. ✅ `frontend/src/components/ui/input.jsx` - Fixed all hardcoded colors to use theme variables
2. ✅ `frontend/src/components/ui/select.jsx` - Fixed all hardcoded colors to use theme variables
3. ✅ `frontend/src/components/ui/button.jsx` - Fixed ghost variant to use transparent background
4. ✅ `frontend/src/components/layout/Navbar.jsx` - Fixed navigation button backgrounds
5. ✅ `frontend/src/components/layout/NotificationBell.jsx` - Fixed dropdown colors

### Context & Providers
6. ✅ `frontend/src/contexts/ThemeContext.jsx` - Added safety checks for browser environment
7. ✅ `frontend/src/app/providers.jsx` - Fixed provider order (AuthProvider first)

### Auth Pages
8. ✅ `frontend/src/features/auth/pages/AdminLogin.jsx` - Fixed all text colors and backgrounds

### Admin Pages
9. ✅ `frontend/src/features/admin/pages/DoctorAvailability.jsx` - Fixed all text and background colors
10. ✅ `frontend/src/features/admin/pages/EmployeeManagement.jsx` - Fixed all labels and form colors
11. ✅ `frontend/src/features/admin/pages/PaymentTransactions.jsx` - Fixed table and filter colors
12. ✅ `frontend/src/features/admin/pages/AuditLogs.jsx` - Fixed filter and table colors

### Dashboard Pages
13. ✅ `frontend/src/pages/role-dashboards/NurseDashboard.jsx` - Fixed status filter tabs and search icon
14. ✅ `frontend/src/pages/role-dashboards/CashierDashboard.jsx` - Fixed white backgrounds and status colors
15. ✅ `frontend/src/pages/role-dashboards/DoctorDashboard.jsx` - Fixed select element colors
16. ✅ `frontend/src/pages/role-dashboards/ReceptionistDashboard.jsx` - Already using theme variables

### Queue Components
17. ✅ `frontend/src/features/queue/components/QueueDoctorCard.jsx` - Fixed status colors
18. ✅ `frontend/src/features/queue/pages/DoctorQueueDetailPage.jsx` - Fixed all text and background colors
19. ✅ `frontend/src/features/queue/services/queueService.js` - Fixed status and priority color functions

### Visit Components
20. ✅ `frontend/src/features/visits/components/VisitHistoryCard.jsx` - Fixed all text, background, and border colors
21. ✅ `frontend/src/features/visits/pages/PatientMedicalRecord.jsx` - Fixed loading states and modal buttons
22. ✅ `frontend/src/features/visits/pages/PatientMedicalRecordManagement.jsx` - Fixed empty states
23. ✅ `frontend/src/features/visits/pages/ElectronicMedicalRecords.jsx` - Fixed empty states
24. ✅ `frontend/src/features/visits/services/visitService.js` - Fixed status color functions

## Status

All major components have been updated to use theme variables. The application should now fully support both light and dark modes with proper contrast and WCAG compliance.

