-- Create the webhook trigger for event_registrations
CREATE OR REPLACE FUNCTION public.handle_event_registration_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
BEGIN
  SELECT
    net.http_post(
        url := coalesce(current_setting('app.settings.edge_function_url', true), 'https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/sync-event-registration'),
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
            'type', TG_OP,
            'table', TG_TABLE_NAME,
            'schema', TG_TABLE_SCHEMA,
            'record', row_to_json(NEW),
            'old_record', null
        )
    ) INTO request_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_event_registration_created ON public.event_registrations;
CREATE TRIGGER on_event_registration_created
  AFTER INSERT ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_event_registration_webhook();
