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
- RLS policies
- Extensions

**For fresh installations:** Run `schema.sql` directly in your Supabase SQL Editor to bootstrap the entire database.

## Migrations

### `_archived_migrations/`

Contains historical migration files that were applied to existing deployments. These are archived for reference but are **not used for fresh installations**.

**Note:** Migrations have been archived because:

- The schema.sql file is comprehensive and up-to-date
- Fresh installs can bootstrap from schema.sql
- Existing deployments already have migrations applied

If you need to reference historical migrations, see the `_archived_migrations/` directory.

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
