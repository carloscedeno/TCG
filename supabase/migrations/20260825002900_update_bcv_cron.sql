-- Eliminar la tarea programada anterior (que corría solo a las 12:01 AM)
select cron.unschedule('invoke-odoo-bcv-sync');

-- Crear la nueva tarea programada para ejecutarse a las 8AM, 11AM, 1PM y 5PM (Hora VZLA)
-- Ajustado a UTC sumando 4 horas: 12:00, 15:00, 17:00, 21:00
select
  cron.schedule(
    'invoke-odoo-bcv-sync',
    '0 12,15,17,21 * * *',
    $$
    select
      net.http_post(
          url:='https://bqfkqnnostzaqueujdms.supabase.co/functions/v1/odoo-bcv-sync',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZmtxbm5vc3R6YXF1ZXVqZG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgwMDY0NSwiZXhwIjoyMDkxMzc2NjQ1fQ.viEd_jZzUR8KSo5a0RwRKQ6K89iVitCr29QpMEIhIYU"}'::jsonb
      ) as request_id;
    $$
  );
