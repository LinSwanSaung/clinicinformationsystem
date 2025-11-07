# Database Schema Management

## Overview

This directory contains the database schema and related files for the RealCIS Clinic Information System.

## Schema Files

### `schema.sql`

**Single source of truth** for the database schema. This file contains the complete, up-to-date schema definition including:

- All tables, columns, constraints
- Indexes
- Views
- Functions
- Triggers
- RLS policies
- Extensions

**For fresh installations:** Run `schema.sql` directly in your Supabase SQL Editor to bootstrap the entire database.

**Location:** `backend/database/schema.sql` (consolidated from previous `db/` folder)

**Verification:** This schema has been verified to match the current database exactly (20 tables confirmed).

## Migrations

**All historical migrations have been removed.** The `schema.sql` file is the **single source of truth**.

**Why migrations were removed:**

- ✅ Schema verification confirmed `schema.sql` matches the current database exactly (20 tables verified)
- ✅ Fresh installs bootstrap directly from `schema.sql`
- ✅ Existing deployments already have all migrations applied
- ✅ Maintaining duplicate migration files was a maintenance burden

**Verification:**
Run `npm run db:verify-schema` or `node database/verify-schema.js` to verify `schema.sql` matches your database.

**If you need to reference historical changes:**

- Check git history for previous migration files (they were removed in commit `2ffc928`)
- All changes are reflected in the current `schema.sql`

## Seeds

### `seeds/`

Contains seed data files for development/testing:

- `001_sample_data.sql` - Sample users, patients, etc.
- `002_visit_history.sql` - Sample visit history

## Verification

To verify that `schema.sql` matches your current database:

```bash
npm run db:verify-schema
```

This will:

1. Apply schema.sql to a clean database
2. Generate a schema dump
3. Compare with your current database schema
4. Report any differences

## Schema Changes

When making schema changes:

1. **Update `schema.sql`** - This is the single source of truth
2. **Test locally** - Apply schema.sql to a test database
3. **Verify** - Run `npm run db:verify-schema`
4. **Document** - Update this README if needed

**Do not** create new migration files. Update `schema.sql` directly.
