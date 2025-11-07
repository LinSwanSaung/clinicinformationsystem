# Schema Verification

This document describes how to verify that `database/schema.sql` matches your current database schema.

## Quick Verification

Run the verification script:

```bash
node scripts/verify-schema.js
```

This script:

- ✅ Reads `database/schema.sql`
- ✅ Connects to your database
- ✅ Compares table names (basic check)
- ✅ Reports any differences

## Full Verification (Recommended)

For a complete schema comparison, use `pg_dump`:

### Step 1: Generate Current Schema Dump

```bash
# Using Supabase connection string
pg_dump \
  --schema-only \
  --no-owner \
  --no-privileges \
  -h <your-supabase-host> \
  -U postgres \
  -d postgres \
  > current_schema.sql
```

Or using Supabase CLI:

```bash
supabase db dump --schema-only > current_schema.sql
```

### Step 2: Normalize Both Files

Remove comments, whitespace, and normalize:

```bash
# Normalize schema.sql
sed 's/--.*$//' database/schema.sql | tr -s ' ' | sort > schema_normalized.sql

# Normalize current_schema.sql
sed 's/--.*$//' current_schema.sql | tr -s ' ' | sort > current_normalized.sql
```

### Step 3: Compare

```bash
diff schema_normalized.sql current_normalized.sql
```

If there are no differences, the output will be empty (exit code 0).

## Automated Verification

Add to `package.json`:

```json
{
  "scripts": {
    "db:verify-schema": "node scripts/verify-schema.js"
  }
}
```

Then run:

```bash
npm run db:verify-schema
```

## What Gets Compared

The verification checks:

1. **Table names** - All tables in schema.sql exist in database
2. **Table structure** - Column names, types, constraints (with pg_dump)
3. **Indexes** - All indexes match
4. **Functions** - All functions match
5. **RLS Policies** - All policies match

## Expected Output

### Success

```
🔍 Starting schema verification...

✅ Read database/schema.sql
✅ Found 25 tables in schema.sql
✅ Connected to database

✅ Schema verification passed (table names match)
   Found 25 tables in both schema.sql and database
```

### Differences Found

```
⚠️  Schema differences detected:
   Tables in schema.sql but not in database: new_table
   Tables in database but not in schema.sql: old_table

   Note: Full schema verification requires pg_dump --schema-only
```

## Troubleshooting

### Connection Issues

- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `.env`
- Check network connectivity
- Verify Supabase project is active

### Missing Tables

- If tables are missing in database, apply `schema.sql`:
  ```bash
  # In Supabase SQL Editor, paste contents of database/schema.sql
  ```

### Extra Tables

- If database has extra tables not in schema.sql:
  - Add them to schema.sql (if they should be kept)
  - Or remove them from database (if they're legacy)

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/verify-schema.yml
- name: Verify Schema
  run: |
    npm run db:verify-schema
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
```

## Notes

- The basic script only compares table names
- For full verification, use `pg_dump --schema-only`
- Schema differences don't necessarily indicate problems (could be migrations in progress)
- Always verify in a test environment before production
