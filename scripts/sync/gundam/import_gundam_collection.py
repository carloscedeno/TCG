import os
import sys
import csv
import logging
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('GND_Importer')

current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
sys.path.append(root_dir)

load_dotenv()
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("DEV_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("DEV_SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Faltan credenciales de Supabase en DEV.")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def import_csv(csv_path: str):
    logger.info(f"Leyendo inventario desde {csv_path}...")
    if not os.path.exists(csv_path):
        logger.error("Archivo CSV no encontrado.")
        return

    # TODO: Logica de cruce entre CSV y BD (card_printings) para Gundam (game_id = 17)
    
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python import_gundam_collection.py <ruta_al_csv>")
        sys.exit(1)
    import_csv(sys.argv[1])
