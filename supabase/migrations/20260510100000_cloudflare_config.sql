-- Migration: Create system_config table for secure administrative settings
-- Date: 2026-05-10

BEGIN;

CREATE TABLE IF NOT EXISTS public.system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Secure the table: Only admins can see or modify settings
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access on system_config" ON public.system_config;
CREATE POLICY "Admins full access on system_config" 
ON public.system_config 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Note: Insert credentials manually into public.system_config or via MCP tool.
-- The credentials provided by the user have already been applied to the database via direct migration.

COMMIT;
