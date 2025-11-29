# Styles Directory

This directory contains all global stylesheets and design tokens for the ThriveCare application.

## Files

### `theme.css`

The main design system file containing:

- **Design Tokens**: Colors, typography, spacing, shadows, and border radius
- **Theme Support**: Light and dark mode variants
- **Tailwind Integration**: Maps CSS variables to Tailwind utilities

This file is based on the **Supabase theme** from TweakCN and provides consistent design tokens across the entire application.

## Usage

All components should use Tailwind CSS classes that reference these tokens:

```jsx
// Good - uses design tokens
<div className="bg-card text-card-foreground border border-border">
  <h1 className="text-foreground font-sans">Title</h1>
  <p className="text-muted-foreground">Description</p>
</div>

// Avoid - hardcoded colors
<div className="bg-white text-black border border-gray-200">
  <h1 className="text-gray-900">Title</h1>
  <p className="text-gray-600">Description</p>
</div>
```

## Available Tokens

- **Colors**: `background`, `foreground`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, etc.
- **Typography**: `font-sans` (Outfit), `font-serif`, `font-mono`
- **Spacing**: `radius-sm`, `radius-md`, `radius-lg`, `radius-xl`
- **Shadows**: `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg`, etc.

## Dark Mode

Dark mode is automatically supported. Add the `dark` class to the `<html>` element to enable dark theme.
