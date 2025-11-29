# Setup Guide

This guide provides detailed instructions for setting up the ThriveCare Clinic Information System for development and production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Running the Application](#running-the-application)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | v18.0.0+ | JavaScript runtime |
| npm | v9.0.0+ | Package manager |
| Git | Latest | Version control |

### Required Accounts

| Service | Purpose | Sign Up |
|---------|---------|---------|
| Supabase | Database & Auth | [supabase.com](https://supabase.com) |
| Vercel | Frontend hosting | [vercel.com](https://vercel.com) |
| Railway/Render | Backend hosting | [railway.app](https://railway.app) |

---

## Development Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/LinSwanSaung/clinicinformationsystem.git
cd clinicinformationsystem
```

### Step 2: Install Frontend Dependencies

```bash
cd frontend
npm install
```

**Key frontend dependencies:**
- `react` - UI library
- `react-router-dom` - Client-side routing
- `@tanstack/react-query` - Server state management
- `tailwindcss` - Utility-first CSS
- `lucide-react` - Icon library
- `react-i18next` - Internationalization

### Step 3: Install Backend Dependencies

```bash
cd ../backend
npm install
```

**Key backend dependencies:**
- `express` - Web framework
- `@supabase/supabase-js` - Database client
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `cors` - Cross-origin requests
- `helmet` - Security headers

---

## Database Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Enter project details:
   - **Name**: `thrivecare` (or your preferred name)
   - **Database Password**: Save this securely
   - **Region**: Choose closest to your users
4. Wait for project to be created (~2 minutes)

### Step 2: Get Database Credentials

From your Supabase project dashboard:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Run Database Schema

1. In Supabase, go to **SQL Editor**
2. Click "New query"
3. Copy the contents of `backend/database/schema.sql`
4. Paste into the SQL Editor
5. Click "Run" (or press Ctrl/Cmd + Enter)

The schema creates:
- 20+ tables for patients, users, appointments, visits, etc.
- Indexes for performance
- Row Level Security policies
- Database functions and triggers

### Step 4: Add Initial Admin User

Run this SQL to create the admin user:

```sql
-- Create admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
VALUES (
  'admin@clinic.com',
  '$2a$10$rQEY7xXxKqJ8fQZKqJ8fQeKqJ8fQZKqJ8fQZKqJ8fQZKqJ8fQZKqJ',
  'System',
  'Admin',
  'admin',
  true
);
```

> **Note**: For production, generate a proper bcrypt hash for the password.

---

## Environment Configuration

### Frontend Environment Variables

Create `frontend/.env`:

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Optional: Enable debug logging
VITE_DEBUG=true
```

### Backend Environment Variables

Create `backend/.env`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Optional: AI Features (GitHub Models)
GITHUB_TOKEN=your-github-personal-access-token
AI_MODEL=gpt-4o-mini

# Optional: Email Notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@clinic.com

# Optional: Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Backend server port |
| `NODE_ENV` | Yes | `development` or `production` |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `JWT_SECRET` | Yes | Secret for JWT signing (min 32 chars) |
| `JWT_EXPIRES_IN` | No | Token expiration (default: 7d) |
| `GITHUB_TOKEN` | No | For AI features |
| `SMTP_*` | No | For email notifications |

---

## Running the Application

### Development Mode

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run dev
```

Expected output:
```
🚀 Server running on port 3000
📦 Environment: development
🔗 API URL: http://localhost:3000/api
✅ Database connected
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

### Production Build

**Frontend:**
```bash
cd frontend
npm run build
npm run preview  # Test production build locally
```

**Backend:**
```bash
cd backend
npm start
```

---

## Troubleshooting

### Common Issues

#### 1. "Cannot connect to database"

**Cause**: Incorrect Supabase credentials

**Solution**:
- Verify `SUPABASE_URL` is correct
- Check that `SUPABASE_SERVICE_ROLE_KEY` is the service role key (not anon)
- Ensure your IP is not blocked by Supabase

#### 2. "JWT malformed" or "Invalid token"

**Cause**: JWT_SECRET mismatch or invalid token

**Solution**:
- Ensure `JWT_SECRET` is at least 32 characters
- Clear browser localStorage and login again
- Check that frontend and backend use the same JWT configuration

#### 3. "CORS error"

**Cause**: Frontend and backend on different origins

**Solution**:
- Check `VITE_API_URL` matches backend URL
- Verify backend CORS configuration in `backend/src/app.js`

#### 4. "Module not found"

**Cause**: Missing dependencies

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 5. Port already in use

**Cause**: Another process using the port

**Solution**:
```bash
# Find and kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
PORT=3001 npm run dev
```

### Getting Help

If you encounter issues not covered here:

1. Check existing [GitHub Issues](https://github.com/LinSwanSaung/clinicinformationsystem/issues)
2. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version, etc.)

---

## Next Steps

After setup is complete:

1. [Read the API Documentation](API.md)
2. [Understand the Database Schema](DATABASE.md)
3. [Learn How to Deploy](DEPLOYMENT.md)
4. [Explore User Workflows](USER_GUIDE.md)
