import httpx
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path('supabase/.env.local'))
supabase_url = 'https://bqfkqnnostzaqueujdms.supabase.co'
webhook_secret = os.environ.get('ODOO_WEBHOOK_SECRET') or 'geekorium_secret_2026'

payload = {
    "records": [
        {
            "id": 2,
            "name": "S00002",
            "state": "sale",
            "client_order_ref": "31dd7c92-9281-44e7-add0-6080082cd982"
        }
    ]
}

response = httpx.post(f"{supabase_url}/functions/v1/odoo-webhook", json=payload, headers={"Authorization": f"Bearer {webhook_secret}"})
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
