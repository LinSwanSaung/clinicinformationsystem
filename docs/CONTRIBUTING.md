# Contributing to ThriveCare

Thank you for your interest in contributing to ThriveCare! This guide will help you understand our development workflow and design system.

## 🎨 Design System Guidelines

### Using Design Tokens

Always use design tokens from `src/styles/theme.css` instead of hardcoded colors:

#### ✅ Good Examples
```jsx
// Colors
<div className="bg-card text-card-foreground border border-border">
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
<p className="text-muted-foreground">

// Typography
<h1 className="font-sans text-foreground">
<code className="font-mono">

// Spacing
<div className="rounded-lg p-4">
<Card className="shadow-md">
```

#### ❌ Avoid These
```jsx
// Don't use hardcoded colors
<div className="bg-white text-black border border-gray-200">
<button className="bg-blue-500 text-white hover:bg-blue-600">
<p className="text-gray-600">

// Don't use arbitrary values when tokens exist
<div className="rounded-[8px]"> // Use rounded-lg instead
<div className="shadow-[0_4px_6px_rgba(0,0,0,0.1)]"> // Use shadow-md instead
```

### Available Design Tokens

#### Colors
- **Background**: `bg-background`, `bg-card`, `bg-popover`
- **Text**: `text-foreground`, `text-card-foreground`, `text-muted-foreground`
- **Interactive**: `bg-primary`, `bg-secondary`, `bg-accent`, `bg-destructive`
- **Borders**: `border-border`, `border-input`

#### Typography
- **Fonts**: `font-sans` (Outfit), `font-serif`, `font-mono`
- **Colors**: `text-foreground`, `text-muted-foreground`, `text-primary`

#### Spacing & Layout
- **Border Radius**: `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`
- **Shadows**: `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`

### Component Structure

When creating new components:

1. **Use functional components** with React hooks
2. **Import design tokens** via Tailwind classes
3. **Follow responsive design** principles
4. **Include proper TypeScript types** (when converting to TS)

#### Example Component Structure
```jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const MyComponent = ({ title, children, onAction }) => {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground mb-4">
          {children}
        </div>
        <Button 
          onClick={onAction}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Action
        </Button>
      </CardContent>
    </Card>
  );
};

export default MyComponent;
```

## 🔧 Development Workflow

### Getting Started
```bash
npm install
npm run dev
```

### File Organization
- **Components**: Place reusable components in `src/components/`
- **Pages**: Role-specific pages go in `src/pages/[role]/`
- **Styles**: Global styles and themes in `src/styles/`
- **Data**: Sample data in `src/data/`

### Code Style
- Use **ES6+ features** and modern React patterns
- Follow **consistent naming conventions**
- Write **clean, readable code** with proper comments
- Use **semantic HTML** elements for accessibility

### Testing Your Changes
1. Test on multiple screen sizes (mobile, tablet, desktop)
2. Verify both light and dark themes work
3. Ensure proper keyboard navigation
4. Check color contrast for accessibility

## 🚀 Submitting Changes

1. Create a feature branch
2. Make your changes following the guidelines above
3. Test thoroughly
4. Submit a pull request with clear description

## 📚 Resources

- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com/
- **Lucide Icons**: https://lucide.dev/
- **React Router**: https://reactrouter.com/

For questions about the design system or contributing, please open an issue or start a discussion.
