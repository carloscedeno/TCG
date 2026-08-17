import sys, os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path('.env.dev'))
sys.path.append('e:/TCG Web App')
from scripts.sync.common.odoo_client import OdooClient

def test_bilateral():
    odoo = OdooClient()
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    supabase = create_client(supabase_url, supabase_key)

    print("=== TEST 1: Crear Evento en Odoo ===")
    event_data = {
        'name': 'Test Event Odoo -> Web',
        'date_begin': '2026-08-01 15:00:00',
        'date_end': '2026-08-01 18:00:00',
        'seats_max': 20
    }
    odoo_event_id = odoo.models.execute_kw(odoo.db, odoo.uid, odoo.password, 'event.event', 'create', [event_data])
    print(f"✅ Evento creado en Odoo con ID: {odoo_event_id}")
    print("Odoo enviará el webhook hacia Supabase. Esto debería crear/actualizar el evento en la tabla 'events'.")

    print("\n=== TEST 2: Crear Evento en Supabase ===")
    web_event_data = {
        'name': 'Test Event Web -> Odoo',
        'event_date': '2026-08-05 10:00:00',
        'capacity': 100,
        'is_active': True
    }
    res = supabase.table('events').insert(web_event_data).execute()
    web_event_id = res.data[0]['id']
    print(f"✅ Evento creado en Supabase con UUID: {web_event_id}")
    print("Supabase disparará un Database Webhook (odoo-sync-event) para crearlo en Odoo y luego actualizar su odoo_id localmente.")
    
    print("\nAmbas pruebas lanzadas. Revisa el dashboard de Supabase (Logs de Edge Functions) y Odoo (Aplicación de Eventos) para verificar.")

if __name__ == '__main__':
    test_bilateral()
