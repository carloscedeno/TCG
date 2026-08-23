import os, httpx
from dotenv import load_dotenv
load_dotenv('supabase/.env.local')

sql = """
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_products_modtime ON products;

CREATE TRIGGER update_products_modtime
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Update existing rows where updated_at is null to have the current timestamp
UPDATE products SET updated_at = now() WHERE updated_at IS NULL;
"""

url = 'https://bqfkqnnostzaqueujdms.supabase.co/functions/v1/exec-sql'
r = httpx.post(url, json={'query': sql})
print(r.status_code)
print(r.text)
