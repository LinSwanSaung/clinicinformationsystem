# Frontend Production Deployment Checklist

This checklist ensures the frontend is ready for production deployment.

## 🔒 Security

- [ ] **Environment Variables**
  - [ ] `VITE_USE_DEV_TOKEN=false` (MUST be false in production)
  - [ ] `VITE_API_BASE_URL` set to production API URL
  - [ ] `VITE_LOG_LEVEL=info` or `warn` (not `debug`)
  - [ ] All sensitive variables are in `.env` (not committed to git)
  - [ ] `.env.example` exists and documents all required variables

- [ ] **Authentication**
  - [ ] Dev token bypass is disabled (`VITE_USE_DEV_TOKEN=false`)
  - [ ] Token storage is secure (localStorage is acceptable for JWTs)
  - [ ] Token refresh mechanism is working
  - [ ] Logout clears all stored data

- [ ] **API Security**
  - [ ] All API calls use HTTPS in production
  - [ ] Authorization headers are properly set
  - [ ] No hardcoded credentials in code
  - [ ] CORS is properly configured on backend

## 🏗️ Build & Configuration

- [ ] **Build Process**
  - [ ] `npm run build` completes without errors
  - [ ] Build output is optimized (check bundle size)
  - [ ] Source maps are disabled or secured for production
  - [ ] No console.log/debug/info statements in production build

- [ ] **Environment Configuration**
  - [ ] `.env.production` file exists (if needed)
  - [ ] Environment variables are properly injected at build time
  - [ ] API base URL is correct for production
  - [ ] All feature flags are set correctly

## 🧪 Testing

- [ ] **Functionality**
  - [ ] Login/logout works correctly
  - [ ] All role-based dashboards load correctly
  - [ ] Critical user flows are tested:
    - [ ] Patient registration
    - [ ] Appointment booking
    - [ ] Medical record viewing/editing
    - [ ] Invoice generation
    - [ ] Queue management

- [ ] **Error Handling**
  - [ ] Error boundary catches and displays errors gracefully
  - [ ] Network errors are handled properly
  - [ ] 401/403 errors redirect to login
  - [ ] User-friendly error messages are shown

- [ ] **Performance**
  - [ ] Initial page load is < 3 seconds
  - [ ] No memory leaks (check with React DevTools)
  - [ ] Images are optimized
  - [ ] Code splitting is working (check Network tab)

## 📦 Dependencies

- [ ] **Security Audit**
  - [ ] Run `npm audit` and fix critical/high vulnerabilities
  - [ ] All dependencies are up to date
  - [ ] No deprecated packages in use

- [ ] **Bundle Size**
  - [ ] Bundle size is reasonable (< 1MB gzipped for initial load)
  - [ ] Unused dependencies are removed
  - [ ] Tree shaking is working

## 🌐 Deployment

- [ ] **Hosting Configuration**
  - [ ] Static file server is configured correctly
  - [ ] Client-side routing is configured (all routes redirect to index.html)
  - [ ] HTTPS is enabled
  - [ ] CDN is configured (if applicable)

- [ ] **Monitoring**
  - [ ] Error tracking is set up (e.g., Sentry, LogRocket)
  - [ ] Analytics is configured (if needed)
  - [ ] Performance monitoring is enabled

## 📝 Documentation

- [ ] **Documentation is Complete**
  - [ ] README.md is up to date
  - [ ] Environment variables are documented
  - [ ] Deployment process is documented
  - [ ] Troubleshooting guide exists

## ✅ Pre-Deployment Verification

1. **Build Test**
   ```bash
   npm run build
   npm run preview  # Test production build locally
   ```

2. **Lint Check**
   ```bash
   npm run lint
   ```

3. **Format Check**
   ```bash
   npm run format:check
   ```

4. **Environment Check**
   - Verify all environment variables are set
   - Test with production API URL
   - Verify dev token is disabled

5. **Browser Testing**
   - Test in Chrome, Firefox, Safari, Edge
   - Test on mobile devices
   - Test with slow network (throttle in DevTools)

## 🚨 Post-Deployment

- [ ] **Verification**
  - [ ] Application loads correctly
  - [ ] All routes are accessible
  - [ ] API calls are working
  - [ ] Authentication is working
  - [ ] No console errors in production

- [ ] **Monitoring**
  - [ ] Check error logs
  - [ ] Monitor performance metrics
  - [ ] Verify analytics is tracking

## 📋 Quick Commands

```bash
# Build for production
npm run build

# Test production build locally
npm run preview

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Check formatting
npm run format:check

# Format code
npm run format

# Security audit
npm audit
npm audit fix
```

## 🔍 Common Issues

1. **Build fails**: Check for syntax errors, missing imports
2. **Routes not working**: Configure server to redirect all routes to index.html
3. **API calls failing**: Verify API_BASE_URL and CORS settings
4. **Authentication issues**: Check token storage and refresh logic
5. **Performance issues**: Check bundle size, enable code splitting

## 📞 Support

If you encounter issues during deployment:
1. Check browser console for errors
2. Verify environment variables
3. Check network requests in DevTools
4. Review error logs
5. Consult deployment documentation

