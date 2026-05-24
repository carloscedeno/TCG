-- Migration to fix accessory deletion constraint error
-- Date: 2026-05-24
-- Description: Drops the foreign key constraint on accessories_history to allow the delete trigger to insert audit records.

BEGIN;

ALTER TABLE public.accessories_history 
  DROP CONSTRAINT IF EXISTS accessories_history_accessory_id_fkey;

COMMIT;
