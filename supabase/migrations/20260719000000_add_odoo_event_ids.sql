-- Add Odoo reference columns for Event synchronization
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS odoo_id INTEGER;
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS odoo_attendee_id INTEGER;
