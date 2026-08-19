import os, httpx
from dotenv import load_dotenv
load_dotenv('supabase/.env.local')
sql_setup = """
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;
"""

sql_schedule = """
SELECT cron.schedule(
  'odoo-polling-cron',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://bqfkqnnostzaqueujdms.supabase.co/functions/v1/odoo-polling',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
"""

url = 'https://bqfkqnnostzaqueujdms.supabase.co/functions/v1/exec-sql'

r1 = httpx.post(url, json={'query': sql_setup})
print("Setup:", r1.text)

r2 = httpx.post(url, json={'query': sql_schedule})
print("Schedule:", r2.text)
