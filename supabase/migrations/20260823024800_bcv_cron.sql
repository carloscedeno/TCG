-- Crear la tarea programada para ejecutarse todos los días a las 12:01 AM
-- Llamará a nuestra nueva Edge Function odoo-bcv-sync usando el dominio de DEV
select
  cron.schedule(
    'invoke-odoo-bcv-sync',
    '1 0 * * *', -- Minuto 1, Hora 0 (12:01 AM) todos los días
    $$
    select
      net.http_post(
          url:='https://bqfkqnnostzaqueujdms.supabase.co/functions/v1/odoo-bcv-sync',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxZmtxbm5vc3R6YXF1ZXVqZG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgwMDY0NSwiZXhwIjoyMDkxMzc2NjQ1fQ.viEd_jZzUR8KSo5a0RwRKQ6K89iVitCr29QpMEIhIYU"}'::jsonb
      ) as request_id;
    $$
  );
