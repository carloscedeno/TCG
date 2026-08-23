import os, httpx

sql = """
ALTER TABLE products ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE products ALTER COLUMN updated_at SET DEFAULT now();
"""

url = 'https://bqfkqnnostzaqueujdms.supabase.co/functions/v1/exec-sql'
r = httpx.post(url, json={'query': sql})
print(r.status_code)
print(r.text)
