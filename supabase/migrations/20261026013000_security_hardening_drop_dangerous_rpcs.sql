-- Security Hardening: Drop high-risk development helper RPCs and enforce RLS
-- Date: 2026-10-26

-- 1. Drop run_migration_sql (Arbitrary SQL execution vulnerability)
DROP FUNCTION IF EXISTS public.run_migration_sql(text);

-- 2. Drop make_admin_by_email (Unauthenticated privilege escalation vulnerability)
DROP FUNCTION IF EXISTS public.make_admin_by_email(text);

-- 3. Enforce RLS on user_collections if not already enabled
ALTER TABLE IF EXISTS public.user_collections ENABLE ROW LEVEL SECURITY;
