# Database Schema

## Overview

This directory contains the database schema for the ThriveCare Clinic Information System.

## Files

### `schema.sql`

**Single source of truth** for the database schema. This file contains:

- All tables and columns
- Indexes and constraints
- Views
- Functions and triggers
- RLS policies
- Extensions

## Setup

To set up the database:

1. Create a new Supabase project
2. Go to the SQL Editor
3. Copy and paste the contents of `schema.sql`
4. Run the SQL

## Schema Changes

When making schema changes:

1. Update `schema.sql` directly
2. Apply changes to your database via Supabase SQL Editor
3. Test thoroughly before deploying
