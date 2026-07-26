import sys, os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))
sys.path.append('e:/TCG Web App')
from scripts.sync.common.odoo_client import OdooClient
odoo = OdooClient()

# 1. Get model_id for sale.order
model_id = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'ir.model', 'search', [[['model', '=', 'sale.order']]])[0]

# 2. Check if a webhook server action already exists for sale.order
webhook_url = 'https://bqfkqnnostzaqueujdms.supabase.co/functions/v1/odoo-webhook?token=geekorium_secret_2026'

action_id = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'ir.actions.server', 'search', [[
    ['model_id', '=', model_id],
    ['state', '=', 'webhook'],
    ['name', 'like', 'Web']
]])

if not action_id:
    print("Creating new Server Action...")
    action_id = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'ir.actions.server', 'create', [{
        'name': 'Notificar Orden a Tienda Web',
        'model_id': model_id,
        'state': 'webhook',
        'webhook_url': webhook_url
    }])
else:
    action_id = action_id[0]
    print(f"Using existing Server Action ID: {action_id}")
    odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'ir.actions.server', 'write', [[action_id], {'webhook_url': webhook_url}])

# 3. Create Automated Action
automation_id = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'base.automation', 'search', [[
    ['model_id', '=', model_id],
    ['name', 'like', 'Orden a Tienda Web']
]])

if not automation_id:
    print("Creating new Automated Action...")
    # Get the state field id to watch for changes
    state_field_id = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'ir.model.fields', 'search', [[['model_id', '=', model_id], ['name', '=', 'state']]])[0]
    
    automation_id = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'base.automation', 'create', [{
        'name': 'Notificar Orden a Tienda Web',
        'model_id': model_id,
        'trigger': 'on_write',
        'action_server_ids': [(4, action_id)],
        # Note: Depending on Odoo version, it might be trigger_field_ids. Using domain to only send when state='sale'
        # Let's just trigger on_write and let the webhook endpoint filter it.
    }])
    print(f"Created Automated Action ID: {automation_id}")
else:
    print(f"Automated Action already exists ID: {automation_id}")

print("Odoo Webhook for sale.order is now configured!")
