-- Create notification_logs table
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    order_id TEXT NOT NULL,
    recipient TEXT NOT NULL,
    type TEXT NOT NULL, -- 'customer' or 'admin'
    status TEXT NOT NULL, -- 'success' or 'error'
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS (Disable for convenience since it's a log table for internal use, but safe practice is to stay consistent)
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything
CREATE POLICY "Service role full access" ON public.notification_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Create function to cleanup old logs (keep only 100)
CREATE OR REPLACE FUNCTION public.cleanup_notification_logs()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.notification_logs
    WHERE id NOT IN (
        SELECT id FROM public.notification_logs
        ORDER BY created_at DESC
        LIMIT 1000
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run cleanup after insert
CREATE TRIGGER trigger_cleanup_notification_logs
AFTER INSERT ON public.notification_logs
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_notification_logs();
