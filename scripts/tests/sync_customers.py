import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))
sys.path.append('e:/TCG Web App')
from scripts.sync.common.odoo_client import OdooClient
from scripts.sync.common.db import get_supabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SyncCustomers")

odoo = OdooClient()
db = get_supabase()

# Fetch all users from Supabase auth
users = db.auth.admin.list_users()
logger.info(f"Found {len(users)} users in Supabase auth.")

# Fetch profiles to map names
profiles = {p['id']: p for p in db.table('profiles').select('*').execute().data}

for user in users:
    email = getattr(user, 'email', None)
    if not email:
        continue
    
    uid = getattr(user, 'id', None)
    profile = profiles.get(uid, {})
    
    # Check if exists in Odoo
    existing = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'res.partner', 'search_read', [[('email', '=', email)]], {'fields': ['id', 'name']})
    
    name = f"{profile.get('first_name') or ''} {profile.get('last_name') or ''}".strip()
    if not name:
        name = email.split('@')[0]
        
    phone = profile.get('phone') or False
        
    if existing:
        logger.info(f"Customer {email} already exists in Odoo. Updating name/phone.")
        odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'res.partner', 'write', [[existing[0]['id']], {
            'name': name,
            'phone': phone,
            'customer_rank': 1
        }])
    else:
        logger.info(f"Creating customer {email} in Odoo.")
        odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'res.partner', 'create', [{
            'name': name,
            'email': email,
            'phone': phone,
            'customer_rank': 1
        }])

logger.info("Customer sync completed.")
