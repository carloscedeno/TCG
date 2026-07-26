import sys, os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))
sys.path.append('e:/TCG Web App')
from scripts.sync.common.odoo_client import OdooClient
odoo = OdooClient()

model_id = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'ir.model', 'search', [[['model', '=', 'sale.order']]])[0]
fields = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'ir.model.fields', 'search_read', [[
    ['model_id', '=', model_id],
    ['name', 'in', ['name', 'state', 'client_order_ref']]
]], {'fields': ['id', 'name']})

field_ids = [f['id'] for f in fields]
print(f"sale.order Field IDs: {field_ids}")

action_id = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'ir.actions.server', 'search', [[
    ['model_id', '=', model_id],
    ['name', '=', 'Notificar Orden a Tienda Web']
]])[0]

odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'ir.actions.server', 'write', [[action_id], {'webhook_field_ids': [(6, 0, field_ids)]}])
print("Updated Server Action with webhook_field_ids!")
