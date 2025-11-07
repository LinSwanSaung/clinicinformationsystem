# Rollback Guide

This document describes how to rollback the Stage 7 backend restructure changes if needed.

## Quick Rollback

If you need to revert all changes:

```bash
# Find the commit before Stage 7
git log --oneline | grep -i "stage 7"

# Reset to previous commit (replace <commit-hash> with actual hash)
git reset --hard <commit-hash-before-stage-7>

# Force push (if already pushed)
git push -f origin refactor/stage-7-backend
```

## Partial Rollback

If you need to rollback specific changes:

### 1. Restore Migrations

```bash
# Move migrations back
mv database/_archived_migrations/* database/migrations/
rmdir database/_archived_migrations
```

### 2. Restore Debug Scripts

```bash
# Move scripts back
mv scripts/legacy/* .
rmdir scripts/legacy
```

### 3. Restore Schema Files

```bash
# Move v2schema.sql back
mv database/_archived_schemas/v2schema.sql database/
rmdir database/_archived_schemas
```

### 4. Revert Service Changes

If services were updated to use repositories, you can:

1. Check git diff for the service file
2. Restore the original version:
   ```bash
   git checkout HEAD~1 -- src/services/Queue.service.js
   ```

### 5. Remove New Repositories

If you want to remove the new repositories:

```bash
rm src/services/repositories/AuditLogRepo.js
rm src/services/repositories/NotificationsRepo.js
rm src/services/repositories/PatientDiagnosisRepo.js
rm src/services/repositories/QueueRepo.js
rm src/services/repositories/DoctorAvailabilityRepo.js
```

Then restore services to their original state.

## Verification After Rollback

1. **Test server startup:**

   ```bash
   npm run dev
   ```

2. **Test basic routes:**

   ```bash
   curl http://localhost:3001/health
   ```

3. **Run lint:**
   ```bash
   npm run lint
   ```

## What Gets Rolled Back

### Files Created

- `src/config/logger.js`
- `src/services/repositories/AuditLogRepo.js`
- `src/services/repositories/NotificationsRepo.js`
- `src/services/repositories/PatientDiagnosisRepo.js`
- `src/services/repositories/QueueRepo.js`
- `src/services/repositories/DoctorAvailabilityRepo.js`
- Documentation files (MIDDLEWARE_ORDER.md, LOGGER_GUIDE.md, etc.)

### Files Modified

- `package.json` (path aliases)
- `.eslintrc.cjs` (import restrictions)
- `src/middleware/errorHandler.js` (logger usage)
- `src/routes/clinicSettings.routes.js` (authorize fix)
- Service files (to use repositories)

### Files Moved

- `database/migrations/` → `database/_archived_migrations/`
- `database/v2schema.sql` → `database/_archived_schemas/v2schema.sql`
- Debug scripts → `scripts/legacy/`

## Important Notes

1. **No data changes** - This restructure only changes code organization, not database schema or data
2. **Behavior preserved** - All API endpoints should work identically after rollback
3. **Git history** - All changes are in git, so rollback is safe
4. **Test after rollback** - Always verify the application works after rolling back

## If Rollback Fails

If rollback causes issues:

1. **Check git status:**

   ```bash
   git status
   ```

2. **Check for uncommitted changes:**

   ```bash
   git diff
   ```

3. **Restore from backup branch:**

   ```bash
   # If you created a backup branch
   git checkout backup-branch
   git branch -D refactor/stage-7-backend
   git checkout -b refactor/stage-7-backend
   ```

4. **Manual file restoration:**
   - Use git to restore individual files
   - Check git log for file history
   - Restore from previous commits

## Contact

If rollback fails or causes issues, check:

1. Git history for the file
2. Previous commits for working versions
3. Backup branches if created
