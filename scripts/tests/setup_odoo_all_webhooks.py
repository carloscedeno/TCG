import sys, os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))
sys.path.append('e:/TCG Web App')
from scripts.sync.common.odoo_client import OdooClient
odoo = OdooClient()

webhook_url = 'https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/odoo-webhook?token=geekorium_secret_2026'

def setup_webhook_for_model(model_name, action_name, automation_name, trigger='on_create_or_write'):
    print(f"\n--- Setting up Webhook for {model_name} ---")
    model_ids = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'ir.model', 'search', [[['model', '=', model_name]]])
    if not model_ids:
        print(f"Error: Model {model_name} not found!")
        return
    model_id = model_ids[0]

    # 1. Server action
    actions = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'ir.actions.server', 'search_read', [[
        ['model_id', '=', model_id],
        ['state', '=', 'webhook'],
        ['name', '=', action_name]
    ]], {'fields': ['id', 'webhook_url']})

    if not actions:
        action_id = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'ir.actions.server', 'create', [{
            'name': action_name,
            'model_id': model_id,
            'state': 'webhook',
            'webhook_url': webhook_url
        }])
        print(f"Created Server Action ID: {action_id}")
    else:
        action_id = actions[0]['id']
        odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'ir.actions.server', 'write', [[action_id], {'webhook_url': webhook_url}])
        print(f"Updated Server Action ID: {action_id}")

    # 2. Automated action
    automations = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'base.automation', 'search_read', [[
        ['model_id', '=', model_id],
        ['name', '=', automation_name]
    ]], {'fields': ['id', 'active']})

    if not automations:
        auto_id = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'base.automation', 'create', [{
            'name': automation_name,
            'model_id': model_id,
            'trigger': trigger,
            'action_server_ids': [(4, action_id)],
            'active': True
        }])
        print(f"Created Automated Action ID: {auto_id}")
    else:
        auto_id = automations[0]['id']
        odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'base.automation', 'write', [[auto_id], {
            'action_server_ids': [(4, action_id)],
            'active': True
        }])
        print(f"Updated Automated Action ID: {auto_id}")

# 1. stock.picking (Entregas / Validaciones de Stock)
setup_webhook_for_model('stock.picking', 'Notificar Transferencia a Tienda Web', 'Sync Picking to Supabase on Save')

# 2. account.move (Facturas / Pagos / Reversiones / Notas de Crédito)
setup_webhook_for_model('account.move', 'Notificar Factura a Tienda Web', 'Sync Invoice to Supabase on Save')

print("\nAll Webhooks Configured in Odoo!")
