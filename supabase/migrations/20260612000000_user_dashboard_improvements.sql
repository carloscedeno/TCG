-- Migration: User Dashboard Improvements (Player IDs & Libreta de Direcciones)
-- Date: 2026-06-12

-- 1. Add Player ID columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wizards_email TEXT,
ADD COLUMN IF NOT EXISTS pokemon_id TEXT,
ADD COLUMN IF NOT EXISTS bandai_id TEXT;

-- 2. Add release_date to accessories table for pre-orders
ALTER TABLE public.accessories
ADD COLUMN IF NOT EXISTS release_date DATE;

-- 3. Create user_addresses table
CREATE TABLE IF NOT EXISTS public.user_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. 'Casa', 'Oficina'
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL DEFAULT 'Caracas',
    state TEXT NOT NULL DEFAULT 'Distrito Capital',
    zip_code TEXT,
    country TEXT NOT NULL DEFAULT 'Venezuela',
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_billing BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS) on user_addresses
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for user_addresses
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.user_addresses;
CREATE POLICY "Users can manage own addresses" ON public.user_addresses
    FOR ALL TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all addresses" ON public.user_addresses;
CREATE POLICY "Admins can read all addresses" ON public.user_addresses
    FOR SELECT TO authenticated
    USING ( public.is_admin() );

-- 6. Create trigger function to handle default/billing unicidad per user
CREATE OR REPLACE FUNCTION public.handle_address_defaults()
RETURNS trigger AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE public.user_addresses
        SET is_default = false
        WHERE user_id = NEW.user_id AND id <> NEW.id;
    END IF;
    IF NEW.is_billing = true THEN
        UPDATE public.user_addresses
        SET is_billing = false
        WHERE user_id = NEW.user_id AND id <> NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_address_defaults_trigger ON public.user_addresses;
CREATE TRIGGER user_address_defaults_trigger
BEFORE INSERT OR UPDATE ON public.user_addresses
FOR EACH ROW
EXECUTE FUNCTION public.handle_address_defaults();
