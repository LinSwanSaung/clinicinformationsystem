# Deployment Guide for ThriveCare

This guide covers deploying the ThriveCare Clinic Information System to production.

## Architecture Overview

The application consists of two main components:
- **Frontend**: React + Vite application (deployed to Vercel)
- **Backend**: Node.js + Express API (deployed separately - see options below)

## Prerequisites

1. GitHub account with repository access
2. Vercel account (free tier available)
3. Backend hosting service (Railway, Render, or similar)
4. Supabase project (for database)
5. Environment variables configured

## Frontend Deployment (Vercel)

### Step 1: Connect GitHub to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Select the repository: `clinicinformationsystem`

### Step 2: Configure Project Settings

**Root Directory**: Leave empty (project root)

**Build Settings**:
- **Framework Preset**: Vite
- **Build Command**: `cd frontend && npm run build`
- **Output Directory**: `frontend/dist`
- **Install Command**: `cd frontend && npm install`

### Step 3: Configure Environment Variables

In Vercel project settings, add these environment variables:

```
VITE_API_URL=https://your-backend-api.com/api
```

Replace `https://your-backend-api.com/api` with your actual backend API URL.

### Step 4: Deploy

1. Click "Deploy"
2. Vercel will automatically build and deploy your frontend
3. Your site will be available at `https://your-project.vercel.app`

### Step 5: Set Up Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Backend Deployment Options

### Option 1: Railway (Recommended)

1. Go to [Railway](https://railway.app)
2. Create a new project from GitHub
3. Select your repository
4. Set root directory to `backend`
5. Add environment variables (see below)
6. Railway will auto-detect Node.js and deploy

**Environment Variables for Railway**:
```
NODE_ENV=production
PORT=5000
JWT_SECRET=your-secret-key
CLIENT_URL=https://your-frontend.vercel.app
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
# ... other required env vars
```

### Option 2: Render

1. Go to [Render](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables
6. Deploy

### Option 3: Vercel Serverless Functions

If you want to deploy backend to Vercel as serverless functions:

1. Create `api/` directory in project root
2. Convert Express routes to serverless functions
3. Update `vercel.json` to include API routes

**Note**: This requires significant refactoring. Railway/Render is recommended for Express apps.

## GitHub Actions CI/CD Pipeline

The repository includes GitHub Actions workflows for automated CI/CD:

### Workflows

1. **`.github/workflows/deploy.yml`**: Frontend deployment to Vercel
2. **`.github/workflows/backend-deploy.yml`**: Backend linting (CD configured separately)

### Setting Up GitHub Actions Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

```
VERCEL_TOKEN=your-vercel-token
VITE_API_URL=https://your-backend-api.com/api
```

**To get Vercel Token**:
1. Go to Vercel Dashboard → Settings → Tokens
2. Create a new token
3. Copy and add to GitHub Secrets

### How It Works

1. **On Push to Main**: 
   - Lints frontend and backend
   - Builds frontend
   - Deploys to Vercel production

2. **On Pull Request**:
   - Runs linting checks
   - Creates preview deployment (if configured)

3. **Manual Trigger**:
   - Use "workflow_dispatch" to manually trigger deployment

## Environment Variables

### Frontend (Vercel)

```env
VITE_API_URL=https://your-backend-api.com/api
```

### Backend (Railway/Render)

```env
NODE_ENV=production
PORT=5000

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# CORS
CLIENT_URL=https://your-frontend.vercel.app

# Database (Supabase)
SUPABASE_URL=your-supabase-project-url
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@thrivecare.com

# App URLs
PORTAL_URL=https://your-frontend.vercel.app
APP_BASE_URL=https://your-frontend.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/
```

## Post-Deployment Checklist

- [ ] Frontend deployed and accessible
- [ ] Backend API deployed and accessible
- [ ] Environment variables configured
- [ ] CORS configured to allow frontend domain
- [ ] Database connection working
- [ ] Authentication flow working
- [ ] File uploads working (if using Supabase Storage)
- [ ] Email notifications working (if configured)
- [ ] SSL/HTTPS enabled
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring/logging set up

## Troubleshooting

### Frontend Build Fails

- Check Node.js version (should be 18+)
- Verify all dependencies are installed
- Check for TypeScript/ESLint errors
- Review build logs in Vercel dashboard

### Backend Deployment Fails

- Verify environment variables are set
- Check database connection
- Review application logs
- Ensure PORT is correctly configured

### CORS Errors

- Verify `CLIENT_URL` in backend matches frontend URL
- Check CORS middleware configuration
- Ensure credentials are allowed

### API Connection Issues

- Verify `VITE_API_URL` in frontend matches backend URL
- Check network tab in browser DevTools
- Verify backend is running and accessible
- Check CORS configuration

## Monitoring

### Vercel Analytics

Enable Vercel Analytics in project settings for frontend monitoring.

### Backend Monitoring

For backend monitoring, consider:
- Railway/Render built-in logs
- Sentry for error tracking
- LogRocket for session replay
- Custom logging to Supabase or external service

## Updates and Maintenance

### Automatic Deployments

- Pushes to `main` branch automatically trigger deployment
- Pull requests create preview deployments

### Manual Deployments

1. Via Vercel Dashboard: Click "Redeploy"
2. Via GitHub Actions: Use "workflow_dispatch" trigger
3. Via CLI: `vercel --prod`

## Support

For issues or questions:
1. Check application logs
2. Review GitHub Actions workflow runs
3. Check Vercel/Railway deployment logs
4. Review this documentation

---

**Last Updated**: 2025-01-21
**System**: ThriveCare Clinic Information System

