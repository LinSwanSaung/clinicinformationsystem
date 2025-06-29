<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# RealCIS - Clinic Information System

This is a modern React-based Clinic Information System designed for low-resource healthcare settings.

## Project Structure
- **Frontend**: Vite + React + TailwindCSS + shadcn/ui
- **Backend**: Node.js + Supabase (PostgreSQL) - (To be implemented)
- **Authentication**: Supabase Auth (Currently using dummy authentication)

## Key Features
- Multi-role support: Admin, Receptionist, Nurse, Doctor
- Employee Management System
- Modern, responsive UI following Supabase design patterns
- Role-based access control

## Development Guidelines
- Use functional components with React hooks
- Follow TailwindCSS utility-first approach
- Implement shadcn/ui components for consistency
- Use proper TypeScript types when converting to TS
- Follow React Router v6 patterns for navigation
- Maintain responsive design principles
- Use Lucide React for icons

## Current Implementation Status
- ✅ Project setup with Vite, React, TailwindCSS
- ✅ Admin login page with dummy authentication
- ✅ Admin dashboard with stats and quick actions
- ✅ Employee management with CRUD operations
- ✅ Responsive design following Supabase theme
- 🔄 Backend integration (Next phase)
- 🔄 Real authentication (Next phase)
- 🔄 Other role interfaces (Next phase)

## Dummy Authentication
- Admin: admin@clinic.com / admin123

When implementing new features, maintain consistency with the existing design patterns and ensure all components are responsive and accessible.
