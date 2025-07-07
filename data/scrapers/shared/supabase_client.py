import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def insert_card_price(card_price: dict, table: str = "price_history"):
    resp = supabase.table(table).insert(card_price).execute()
    if resp.status_code == 201:
        print(f"[Supabase] Precio insertado correctamente en {table}.")
    else:
        print(f"[Supabase] Error al insertar: {resp.data}") 