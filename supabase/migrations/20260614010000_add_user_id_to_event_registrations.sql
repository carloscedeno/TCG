-- Add user_id column to event_registrations table

ALTER TABLE public.event_registrations
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Update the RLS policies if needed
-- Currently it might be insertable by anyone or public, but going forward we might restrict it.
-- Let's just add the column for now to track the user.
