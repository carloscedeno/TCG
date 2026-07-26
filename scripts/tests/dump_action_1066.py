import sys, os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))
sys.path.append('e:/TCG Web App')
from scripts.sync.common.odoo_client import OdooClient
odoo = OdooClient()

action = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'ir.actions.server', 'read', [[1066]], {})[0]
for k, v in action.items():
    print(f"{k}: {v}")
