import sys, os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))
sys.path.append('e:/TCG Web App')
from scripts.sync.common.odoo_client import OdooClient
odoo = OdooClient()

# Search for Server Actions that might contain the webhook URL
actions = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'ir.actions.server', 'search_read', [[]], {'fields': ['name', 'state', 'code', 'webhook_url']})

found = False
for action in actions:
    webhook_url = action.get('webhook_url') or ''
    code = action.get('code') or ''
    if 'supabase.co' in webhook_url or 'supabase.co' in code:
        found = True
        print(f"Found action: {action['name']} (ID: {action['id']})")
        if 'sxuotvogwvmxuvwbsscv' in webhook_url:
            print("Action uses PRODUCTION webhook_url. Updating to DEV...")
            new_url = webhook_url.replace('sxuotvogwvmxuvwbsscv', 'bqfkqnnostzaqueujdms')
            odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'ir.actions.server', 'write', [[action['id']], {'webhook_url': new_url}])
            print("Update successful!")
        elif 'sxuotvogwvmxuvwbsscv' in code:
            print("Action uses PRODUCTION URL in code. Updating to DEV...")
            new_code = code.replace('sxuotvogwvmxuvwbsscv', 'bqfkqnnostzaqueujdms')
            odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'ir.actions.server', 'write', [[action['id']], {'code': new_code}])
            print("Update successful!")

if not found:
    print("No Odoo Server Actions found containing a Supabase URL.")
