# Logger Guide

## Overview

The RealCIS backend uses a centralized logger located at `src/config/logger.js`. This logger provides structured logging with levels and PII (Personally Identifiable Information) protection.

## Usage

### Import

```javascript
import logger from '../config/logger.js';
// or
import logger from '@config/logger.js'; // if using path aliases
```

### Log Levels

The logger supports four levels (in order of severity):

1. **ERROR** - Critical errors that require attention
2. **WARN** - Warnings about potential issues
3. **INFO** - General informational messages
4. **DEBUG** - Detailed debugging information

### Log Level Configuration

The log level is controlled by the `LOG_LEVEL` environment variable:

- **Production:** Defaults to `info` (logs ERROR, WARN, INFO)
- **Development:** Defaults to `debug` (logs all levels)

Set `LOG_LEVEL` in your `.env` file:

```env
LOG_LEVEL=debug  # or error, warn, info, debug
```

### Examples

```javascript
// Error logging
logger.error('Failed to fetch user:', error);
logger.error('Database connection failed:', { error: error.message, url: dbUrl });

// Warning logging
logger.warn('Rate limit approaching:', { userId, requests: count });

// Info logging
logger.info('User logged in:', { userId, role });
logger.info('Server started:', { port: 3001, env: process.env.NODE_ENV });

// Debug logging
logger.debug('Processing request:', { method: req.method, url: req.url });
logger.debug('Cache hit:', { key: cacheKey, ttl: remaining });
```

## PII Protection

The logger automatically sanitizes sensitive fields to prevent PII from being logged:

**Sanitized fields:**

- `password`
- `password_hash`
- `token`
- `access_token`
- `refresh_token`
- `ssn`
- `credit_card`

When these fields are detected in log data, they are replaced with `[REDACTED]`.

### Example

```javascript
const userData = {
  id: '123',
  email: 'user@example.com',
  password: 'secret123', // Will be redacted
  token: 'abc123', // Will be redacted
};

logger.info('User data:', userData);
// Logs: [INFO] User data: { id: '123', email: 'user@example.com', password: '[REDACTED]', token: '[REDACTED]' }
```

## Migration from console.\*

### Current Status

Many files still use `console.*` directly. The migration strategy is:

1. **Hot paths** (errorHandler, auth middleware) - ✅ Already migrated
2. **Services** - Gradually migrate as we refactor
3. **Other files** - Add `// TODO: Replace console.* with logger` comments

### Migration Pattern

**Before:**

```javascript
console.error('Error:', error);
console.log('User created:', userId);
```

**After:**

```javascript
import logger from '../config/logger.js';

logger.error('Error:', error);
logger.info('User created:', { userId });
```

## Best Practices

1. **Use appropriate log levels:**
   - `error` - For exceptions and critical failures
   - `warn` - For recoverable issues or deprecations
   - `info` - For important business events (login, creation, etc.)
   - `debug` - For detailed troubleshooting information

2. **Include context:**

   ```javascript
   // Good
   logger.error('Failed to create appointment:', { error, patientId, doctorId });

   // Less useful
   logger.error('Failed');
   ```

3. **Avoid logging PII:**
   - Never log passwords, tokens, or sensitive personal information
   - The logger will redact known fields, but be careful with custom fields

4. **Use structured data:**

   ```javascript
   // Good - structured
   logger.info('Appointment created:', { appointmentId, patientId, doctorId });

   // Less useful - string concatenation
   logger.info(`Appointment ${appointmentId} created for patient ${patientId}`);
   ```

## Production Considerations

In production:

- Log level should be `info` or `warn` (not `debug`)
- Ensure logs are sent to a centralized logging service (e.g., CloudWatch, Datadog)
- Monitor log volume to avoid excessive costs
- Set up alerts for ERROR level logs
