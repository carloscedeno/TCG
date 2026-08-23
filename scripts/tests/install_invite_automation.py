import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))
sys.path.append('e:/TCG Web App')
from scripts.sync.common.odoo_client import OdooClient
from scripts.sync.common.db import get_supabase
import os
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("InstallInviteWebhook")

odoo = OdooClient()

SUPABASE_URL = os.getenv("SUPABASE_URL_OVERRIDE") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
WEBHOOK_URL = f"{SUPABASE_URL}/functions/v1/odoo-invite?apikey={SUPABASE_KEY}"

partner_model = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'ir.model', 'search_read', [[('model', '=', 'res.partner')]], {'fields': ['id']})
model_id = partner_model[0]['id']

# Use native webhook state
server_action_data = {
    'name': 'Supabase: Invite Webhook Action',
    'model_id': model_id,
    'state': 'webhook',
    'webhook_url': WEBHOOK_URL,
    'webhook_field_ids': [(6, 0, [])], # Default fields
}

try:
    action_id = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'ir.actions.server', 'create', [server_action_data])
    
    automation_data = {
        'name': 'Supabase: Send Invite on Customer Create',
        'model_id': model_id,
        'trigger': 'on_create',
        'active': True,
        'action_server_ids': [(4, action_id)]
    }
    odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'base.automation', 'create', [automation_data])
    logger.info("Automation successfully installed using native webhook.")
except Exception as e:
    logger.error("Failed to install: " + str(e))
