import sys, os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('supabase/.env.local'))
sys.path.append('e:/TCG Web App')
from scripts.sync.common.odoo_client import OdooClient
odoo = OdooClient()

print("Buscando módulo base_automation...")
module_ids = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'ir.module.module', 'search', [[['name', '=', 'base_automation']]])

if module_ids:
    module_id = module_ids[0]
    module_info = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'ir.module.module', 'read', [module_id], {'fields': ['state']})[0]
    state = module_info.get('state')
    print(f"Estado del módulo: {state}")
    
    if state != 'installed':
        print("Instalando módulo...")
        odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'ir.module.module', 'button_immediate_install', [module_ids])
        print("Módulo instalado exitosamente.")
    else:
        print("El módulo ya está instalado.")
else:
    print("No se encontró el módulo base_automation.")
