-- Migration: Admin Category Management RLS
-- Description: Adds INSERT, UPDATE, DELETE policies for accessory_categories for admins.

BEGIN;

-- Enable RLS for insert/update/delete by admins
DROP POLICY IF EXISTS "Admin insert access for accessory_categories" ON public.accessory_categories;
CREATE POLICY "Admin insert access for accessory_categories"
    ON public.accessory_categories FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admin update access for accessory_categories" ON public.accessory_categories;
CREATE POLICY "Admin update access for accessory_categories"
    ON public.accessory_categories FOR UPDATE
    USING (auth.role() = 'authenticated' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admin delete access for accessory_categories" ON public.accessory_categories;
CREATE POLICY "Admin delete access for accessory_categories"
    ON public.accessory_categories FOR DELETE
    USING (auth.role() = 'authenticated' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

COMMIT;
