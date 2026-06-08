-- Add personal data columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username text UNIQUE,
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS cedula text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS phone text;

-- Ensure RLS policies allow users to update their own profile
-- Profiles table usually already has a policy for this, but we'll create it safely just in case.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can update own profile.'
    ) THEN
        CREATE POLICY "Users can update own profile."
        ON public.profiles
        FOR UPDATE
        USING ( auth.uid() = id );
    END IF;
END
$$;
