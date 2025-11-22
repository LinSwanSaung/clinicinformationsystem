# Quick Start: Deploy to Vercel

This is a quick guide to deploy ThriveCare frontend to Vercel with GitHub Actions CI/CD.

## Step 1: Get Vercel Token

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your profile → Settings → Tokens
3. Create a new token (name it "GitHub Actions" or similar)
4. Copy the token (you'll need it for Step 3)

## Step 2: Connect Repository to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository: `clinicinformationsystem`
4. Configure project:
   - **Framework Preset**: Vite (auto-detected)
   - **Root Directory**: Leave empty
   - **Build Command**: `cd frontend && npm run build` (auto-filled)
   - **Output Directory**: `frontend/dist` (auto-filled)
   - **Install Command**: `cd frontend && npm install` (auto-filled)

5. **Add Environment Variable**:
   - Key: `VITE_API_URL`
   - Value: Your backend API URL (e.g., `https://your-backend.railway.app/api`)
   - Click "Add"

6. Click "Deploy" (don't worry about the first deployment, we'll set up CI/CD next)

## Step 3: Set Up GitHub Actions Secrets

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click "New repository secret"
4. Add these secrets:

   **Secret 1: VERCEL_TOKEN**
   - Name: `VERCEL_TOKEN`
   - Value: The token you copied in Step 1
   - Click "Add secret"

   **Secret 2: VITE_API_URL** (optional, if you want to override)
   - Name: `VITE_API_URL`
   - Value: Your backend API URL
   - Click "Add secret"

## Step 4: Verify GitHub Actions Workflow

1. Go to your GitHub repository
2. Navigate to: **Actions** tab
3. You should see "Deploy to Vercel" workflow
4. The workflow will run automatically on:
   - Push to `main` branch
   - Pull requests to `main`
   - Manual trigger (workflow_dispatch)

## Step 5: Test the Deployment

1. Make a small change to your code
2. Push to `main` branch:
   ```bash
   git add .
   git commit -m "test: verify CI/CD pipeline"
   git push origin main
   ```
3. Go to GitHub → Actions tab
4. Watch the workflow run
5. Once complete, check Vercel dashboard for the new deployment

## What Happens Automatically

✅ **On every push to `main`:**
- Frontend is linted
- Backend is linted
- Frontend is built
- Frontend is deployed to Vercel production

✅ **On pull requests:**
- Code is linted
- Preview deployment is created (if configured)

## Troubleshooting

### Build Fails
- Check GitHub Actions logs
- Verify Node.js version (should be 20)
- Check for linting errors

### Deployment Fails
- Verify `VERCEL_TOKEN` secret is set correctly
- Check Vercel project is connected
- Review Vercel deployment logs

### Environment Variables Not Working
- Verify `VITE_API_URL` is set in Vercel project settings
- Rebuild after adding environment variables

## Next Steps

1. **Backend Deployment**: Deploy backend to Railway or Render (see [DEPLOYMENT.md](./docs/DEPLOYMENT.md))
2. **Custom Domain**: Add your domain in Vercel project settings
3. **Monitoring**: Enable Vercel Analytics for performance tracking

## Need Help?

- Check [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed instructions
- Review Vercel documentation: https://vercel.com/docs
- Review GitHub Actions logs for errors

---

**That's it!** Your CI/CD pipeline is now set up. Every push to `main` will automatically deploy to Vercel. 🚀

