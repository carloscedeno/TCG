-- Migration: Drop redundant create_order_atomic overload
-- Date: 2026-05-19
-- Description: Drops the outdated create_order_atomic function overload to prevent ambiguity errors during checkout.

BEGIN;

DROP FUNCTION IF EXISTS public.create_order_atomic(uuid, uuid, numeric, jsonb, jsonb, jsonb);

COMMIT;
