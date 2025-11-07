# Middleware Order Documentation

This document describes the middleware execution order in the RealCIS backend API.

## Execution Order

The middleware is applied in the following order (from first to last):

### 1. CORS

- **Location:** `app.js` - `app.use(cors())`
- **Purpose:** Enable Cross-Origin Resource Sharing
- **Scope:** All routes

### 2. Body Parsing

- **Location:** `app.js` - `app.use(express.json())` and `app.use(express.urlencoded())`
- **Purpose:** Parse request bodies (JSON and URL-encoded)
- **Scope:** All routes

### 3. Request Logging

- **Location:** `app.js` - `app.use(requestLogger)`
- **Purpose:** Log incoming requests
- **Scope:** All routes

### 4. Rate Limiting (Per-Route)

- **Location:** Individual route files (e.g., `auth.routes.js`)
- **Purpose:** Limit request rate per IP
- **Scope:** Specific routes (e.g., `/api/auth/login`)
- **Example:** `authRateLimiter` in auth routes

### 5. Authentication (`authenticate`)

- **Location:** Per-route or via `router.use()`
- **Purpose:** Verify JWT token and attach user to `req.user`
- **Scope:** Protected routes
- **Middleware:** `src/middleware/auth.js` - `authenticate`

### 6. Authorization (`authorize`)

- **Location:** Per-route, after `authenticate`
- **Purpose:** Check if user has required role(s)
- **Scope:** Protected routes with role requirements
- **Middleware:** `src/middleware/auth.js` - `authorize(...roles)`
- **Usage:** `authorize('admin', 'doctor')` (varargs, not array)

### 7. Route Handlers

- **Location:** Individual route files
- **Purpose:** Handle business logic
- **Scope:** Specific routes

### 8. 404 Handler

- **Location:** `app.js` - `app.use('*', ...)`
- **Purpose:** Handle unmatched routes
- **Scope:** All unmatched routes

### 9. Error Handler

- **Location:** `app.js` - `app.use(errorHandler)`
- **Purpose:** Global error handling
- **Scope:** All routes
- **Middleware:** `src/middleware/errorHandler.js` - `errorHandler`

## Example Route Configuration

```javascript
// Public route (no auth)
router.post(
  '/login',
  authRateLimiter,
  validateLogin,
  asyncHandler(async (req, res) => {
    // Handler
  })
);

// Protected route (auth required)
router.get(
  '/profile',
  authenticate,
  asyncHandler(async (req, res) => {
    // Handler - req.user is available
  })
);

// Protected route with role requirement
router.delete(
  '/users/:id',
  authenticate,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    // Handler - req.user is available and role is 'admin'
  })
);
```

## Important Notes

1. **`authenticate` must come before `authorize`** - Authorization requires authentication
2. **`authorize` uses varargs** - Use `authorize('admin', 'doctor')` not `authorize(['admin', 'doctor'])`
3. **Rate limiting is per-route** - Not applied globally
4. **Error handler is last** - Catches all errors from previous middleware and routes

## Development Token Bypass

In development (when `USE_DEV_TOKEN=true`), the `authenticate` middleware accepts a special token:

- Token: `test-token`
- Role: Can be set via `x-dev-role` header (defaults to 'nurse')
- **Security:** Only works when `NODE_ENV !== 'production'`

This bypass is **opt-in only** and disabled by default.
