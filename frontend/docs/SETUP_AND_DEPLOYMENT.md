# Setup and Deployment Guide

## Prerequisites

- Node.js 18+ and npm
- Backend API running (see backend docs)

## Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Set `VITE_API_BASE_URL` to your backend URL.

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access the app:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

## Building for Production

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Preview production build:**
   ```bash
   npm run preview
   ```

3. **Output:**
   - Production files in `dist/`
   - Ready to deploy to static hosting

## Deployment

### Static Hosting (Vercel, Netlify, etc.)

1. Connect your repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Set environment variables:
   - `VITE_API_BASE_URL` - Backend API URL
   - `VITE_LOG_LEVEL` - `error` (recommended for production)

### Docker Deployment

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Environment Variables

- `VITE_API_BASE_URL` - Backend API URL (required)
- `VITE_LOG_LEVEL` - Logging level: `debug`, `info`, `warn`, `error` (default: `debug` in dev, `error` in prod)
- `VITE_USE_DEV_TOKEN` - Use dev token bypass (development only)

## Troubleshooting

### Build Errors

- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

### API Connection Issues

- Verify `VITE_API_BASE_URL` is correct
- Check CORS settings on backend
- Verify backend is running

### Performance Issues

- Check React Query cache settings
- Review bundle size: `npm run build -- --analyze`
- Enable production optimizations

