# Backend Deployment to Railway

This guide covers deploying the ThriveCare backend API to Railway.

## Prerequisites

1. Railway account (sign up at https://railway.app)
2. GitHub repository connected
3. Backend environment variables ready

## Step 1: Create New Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository: `clinicinformationsystem`
5. Railway will detect the repository

## Step 2: Configure Service

1. Railway will show you the repository
2. Click "Add Service" → "GitHub Repo"
3. Select your repository again
4. Railway will auto-detect it's a Node.js project

## Step 3: Configure Settings

1. Click on the service
2. Go to **Settings** tab
3. Set **Root Directory**: `backend`
4. Set **Start Command**: `npm start`
5. Railway will auto-detect:
   - **Build Command**: `npm install` (or leave empty, Railway handles it)
   - **Node Version**: 20 (or latest)

## Step 4: Add Environment Variables

1. Go to **Variables** tab
2. Add the following environment variables:

```env
NODE_ENV=production
PORT=5000

# JWT Configuration
JWT_SECRET=your-strong-secret-key-here
JWT_EXPIRES_IN=7d

# CORS - Update with your frontend URL
CLIENT_URL=https://your-frontend.vercel.app

# Supabase Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# Email Configuration (if using)
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

**Important**: Replace placeholder values with your actual credentials.

## Step 5: Deploy

1. Railway will automatically start building and deploying
2. Watch the build logs in the **Deployments** tab
3. Once deployed, Railway will provide a URL like: `https://your-app.railway.app`

## Step 6: Get Your Backend URL

1. Go to **Settings** → **Networking**
2. Click "Generate Domain"
3. Copy the generated domain (e.g., `your-app.railway.app`)
4. Your API will be available at: `https://your-app.railway.app/api`

## Step 7: Update Frontend Environment Variable

1. Go to your Vercel project
2. Go to **Settings** → **Environment Variables**
3. Update `VITE_API_URL` to: `https://your-app.railway.app/api`
4. Redeploy frontend (or wait for next push)

## Step 8: Verify Deployment

1. Test the health endpoint:
   ```bash
   curl https://your-app.railway.app/api/health
   ```
   Should return: `{"status":"ok","message":"ThriveCare API is running"}`

2. Check Railway logs:
   - Go to **Deployments** tab
   - Click on latest deployment
   - View logs to ensure no errors

## Step 9: Set Up Custom Domain (Optional)

1. Go to **Settings** → **Networking**
2. Click "Custom Domain"
3. Add your domain (e.g., `api.yourdomain.com`)
4. Follow DNS configuration instructions
5. Update `VITE_API_URL` in Vercel with new domain

## Monitoring

### View Logs

1. Go to your service in Railway
2. Click **Deployments** tab
3. Click on any deployment to view logs
4. Use **Logs** tab for real-time logs

### Metrics

Railway provides:
- CPU usage
- Memory usage
- Network traffic
- Request count

View in the **Metrics** tab.

## Troubleshooting

### Build Fails

- Check build logs for errors
- Verify `package.json` has correct scripts
- Ensure Node.js version is compatible (20+)

### Application Crashes

- Check application logs
- Verify all environment variables are set
- Check database connection
- Review error messages in logs

### CORS Errors

- Verify `CLIENT_URL` matches your frontend URL exactly
- Check CORS middleware configuration
- Ensure credentials are allowed

### Database Connection Issues

- Verify Supabase credentials are correct
- Check Supabase project is active
- Review network connectivity

## Auto-Deployments

Railway automatically deploys on:
- Push to `main` branch (if connected)
- Manual trigger from dashboard

To disable auto-deploy:
1. Go to **Settings** → **Source**
2. Toggle "Auto Deploy" off

## Cost Management

Railway free tier includes:
- $5 credit per month
- 500 hours of usage
- 100GB bandwidth

Monitor usage in **Settings** → **Usage**.

## Next Steps

1. ✅ Backend deployed to Railway
2. ✅ Frontend deployed to Vercel
3. ✅ Environment variables configured
4. ✅ API accessible
5. 🔄 Test full application flow
6. 🔄 Set up monitoring/alerts
7. 🔄 Configure custom domains

---

**Need Help?**
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for general deployment info

