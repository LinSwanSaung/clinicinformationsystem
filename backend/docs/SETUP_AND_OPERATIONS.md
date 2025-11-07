# Setup and Operations Guide

This document covers setup, configuration, deployment, and operational procedures for the RealCIS backend.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

### Installation

1. **Navigate to the backend directory:**

   ```bash
   cd backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Environment Setup:**

   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables:**

   ```env
   NODE_ENV=development
   PORT=5000

   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_role_key

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d

   # CORS Configuration
   CLIENT_URL=http://localhost:5173

   # Logging
   LOG_LEVEL=debug  # or error, warn, info, debug
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

## 🗄️ Database Setup

### Supabase Setup

1. **Create Supabase Account & Project:**
   - Visit: https://supabase.com
   - Click "Start your project"
   - Sign up with GitHub or email
   - Create new project: `realcis-clinic`
   - Choose region and plan (Free tier available)

2. **Get API Keys:**
   - Navigate to Settings → API
   - Copy:
     - **Project URL**: `https://xxxxx.supabase.co`
     - **anon public** key (safe for frontend)
     - **service_role** key (keep secret - for backend only)

3. **Update .env File:**
   ```env
   SUPABASE_URL=https://your-actual-project-id.supabase.co
   SUPABASE_ANON_KEY=your_actual_anon_key_from_supabase
   SUPABASE_SERVICE_KEY=your_actual_service_role_key_from_supabase
   ```

### Database Schema

The database schema is defined in `database/schema.sql` - this is the **single source of truth**.

**For fresh installations:**

1. Open Supabase SQL Editor
2. Copy and paste the entire contents of `database/schema.sql`
3. Execute the script

**Important Notes:**

- Never commit your `.env` file to git (it's already in `.gitignore`)
- Keep your `service_role` key secret - it has full database access
- The `anon` key is safe for frontend use

### Schema Verification

Verify that `database/schema.sql` matches your current database:

```bash
npm run db:verify-schema
```

This script:

- ✅ Reads `database/schema.sql`
- ✅ Connects to your database
- ✅ Compares table names
- ✅ Reports any differences

**Expected Output:**

```
✅ SCHEMA VERIFICATION PASSED
   All tables from schema.sql exist in the database
   No extra tables found in database
   Schema.sql matches the current database state
```

**Troubleshooting:**

- Connection issues: Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `.env`
- Missing tables: Apply `schema.sql` in Supabase SQL Editor
- Extra tables: Add them to `schema.sql` or remove from database

### Database Seeds

Sample data is available in `database/seeds/`:

```bash
# Run seeds (if needed)
npm run db:seed
```

## 🔧 Configuration

### Environment Variables

| Variable               | Description                           | Default                      | Required |
| ---------------------- | ------------------------------------- | ---------------------------- | -------- |
| `NODE_ENV`             | Environment (development/production)  | `development`                | Yes      |
| `PORT`                 | Server port                           | `5000`                       | Yes      |
| `SUPABASE_URL`         | Supabase project URL                  | -                            | Yes      |
| `SUPABASE_ANON_KEY`    | Supabase anonymous key                | -                            | Yes      |
| `SUPABASE_SERVICE_KEY` | Supabase service role key             | -                            | Yes      |
| `JWT_SECRET`           | JWT signing secret                    | -                            | Yes      |
| `JWT_EXPIRES_IN`       | JWT expiration time                   | `7d`                         | No       |
| `CLIENT_URL`           | Frontend URL for CORS                 | `http://localhost:5173`      | No       |
| `LOG_LEVEL`            | Logging level (error/warn/info/debug) | `info` (prod), `debug` (dev) | No       |
| `USE_DEV_TOKEN`        | Enable dev token bypass               | `false`                      | No       |

### Logging Configuration

**Production:**

```env
LOG_LEVEL=info  # Logs ERROR, WARN, INFO
```

**Development:**

```env
LOG_LEVEL=debug  # Logs all levels
```

## 🚢 Deployment

### Production Setup

1. **Set environment variables:**

   ```env
   NODE_ENV=production
   PORT=5000
   LOG_LEVEL=info
   # ... other production values
   ```

2. **Build and start:**

   ```bash
   npm install --production
   npm start
   ```

3. **Use process manager (PM2 recommended):**
   ```bash
   npm install -g pm2
   pm2 start src/app.js --name realcis-backend
   pm2 save
   pm2 startup
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["node", "src/app.js"]
```

### Environment-Specific Considerations

- **SSL/TLS**: Use reverse proxy (nginx/Apache) for HTTPS
- **Database**: Use production Supabase instance
- **JWT Secrets**: Use strong, unique secrets
- **CORS**: Configure allowed origins for production
- **Logging**: Send logs to centralized service (CloudWatch, Datadog)
- **Monitoring**: Set up health checks and alerts

## 🔄 Rollback Procedures

### Quick Rollback

If you need to revert changes:

```bash
# Find the commit before changes
git log --oneline

# Reset to previous commit
git reset --hard <commit-hash>

# Force push (if already pushed)
git push -f origin <branch-name>
```

### Partial Rollback

Restore specific files:

```bash
# Restore specific file
git checkout <commit-hash> -- path/to/file.js

# Restore entire directory
git checkout <commit-hash> -- src/services/
```

### Verification After Rollback

1. **Test server startup:**

   ```bash
   npm run dev
   ```

2. **Test basic routes:**

   ```bash
   curl http://localhost:5000/health
   ```

3. **Run lint:**
   ```bash
   npm run lint
   ```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Individual function and method testing
- **Integration Tests**: API endpoint testing with database
- **Test Coverage**: Comprehensive coverage reporting

## 📊 Monitoring & Health Checks

### Health Check Endpoint

```bash
GET /health
```

Returns server status and basic health information.

### Monitoring Checklist

- ✅ Server uptime
- ✅ Database connectivity
- ✅ Error rates
- ✅ Response times
- ✅ Log volume
- ✅ Memory usage

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check Supabase URL and keys
   - Verify network connectivity
   - Check environment variables

2. **Authentication Errors**
   - Verify JWT secret configuration
   - Check token expiration settings
   - Validate user permissions

3. **Validation Errors**
   - Review input schemas
   - Check required fields
   - Validate data types

4. **Schema Verification Fails**
   - Compare `database/schema.sql` with actual database
   - Check for missing tables or columns
   - Verify RLS policies

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
```

This will log detailed information for troubleshooting.

## 📚 Additional Resources

- Main [README.md](../README.md) - Getting started and API documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture and design patterns
- [database/README.md](../database/README.md) - Database schema documentation

## 🔐 Security Checklist

- [ ] JWT secrets are strong and unique
- [ ] `service_role` key is kept secret
- [ ] CORS is configured for production
- [ ] Rate limiting is enabled
- [ ] Input validation is in place
- [ ] Error messages don't leak sensitive information
- [ ] Logs don't contain PII
- [ ] SSL/TLS is configured
- [ ] Environment variables are secure
- [ ] Database backups are configured

## 📞 Support

For issues or questions:

1. Check logs for error messages
2. Review this documentation
3. Check git history for recent changes
4. Verify environment configuration
