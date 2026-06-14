-- Add payment_status column to event_registrations table
-- Valid values could be 'PENDING', 'PAID', 'CANCELLED'

ALTER TABLE public.event_registrations
ADD COLUMN payment_status text DEFAULT 'PENDING';

-- For existing registrations, we might assume they are PAID if it's an old event, 
-- but PENDING is safer.
