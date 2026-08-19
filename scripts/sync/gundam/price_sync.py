import os
import sys
import time
import httpx
import logging
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('Gundam_CT_Sync')

current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
sys.path.append(root_dir)

load_dotenv()

CARDTRADER_API_KEY = os.environ.get("CARDTRADER_API_KEY")
CT_BASE_URL = "https://api.cardtrader.com/api/v2"

from supabase import create_client, Client
SUPABASE_URL = os.environ.get("DEV_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("DEV_SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Faltan credenciales de Supabase en entorno DEV.")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class CardTraderClient:
    def __init__(self):
        if not CARDTRADER_API_KEY:
            logger.error("CARDTRADER_API_KEY no encontrada en .env")
            sys.exit(1)
        self.headers = {
            'Authorization': f'Bearer {CARDTRADER_API_KEY}',
            'Accept': 'application/json'
        }
        self.client = httpx.Client(headers=self.headers, timeout=60.0)

    def get_gundam_expansions(self):
        url = f"{CT_BASE_URL}/expansions"
        resp = self.client.get(url)
        resp.raise_for_status()
        expansions = resp.json()
        # Gundam ID interno comprobado = 23
        return [e for e in expansions if e['game_id'] == 23]

    def get_blueprints_for_expansion(self, expansion_id):
        url = f"{CT_BASE_URL}/blueprints/export?expansion_id={expansion_id}"
        resp = self.client.get(url)
        if resp.status_code == 200:
            return resp.json()
        return []

    def get_market_price(self, blueprint_id):
        """Devuelve el promedio de las 3-5 ofertas mas baratas en Ingles y NM/LP"""
        url = f"{CT_BASE_URL}/marketplace/products?blueprint_id={blueprint_id}"
        try:
            resp = self.client.get(url)
            if resp.status_code != 200:
                return None
        except Exception as e:
            logger.warning(f"Error de red al consultar {blueprint_id}: {e}")
            return None
            
        data = resp.json()
        prices_en = []
        
        # Iterar el diccionario raro de CT
        for k, v in data.items():
            if isinstance(v, list):
                for p in v:
                    props = p.get('properties_hash', {})
                    # Filtro anti-trampas: Inglés, Buena condicion, No foil (por ahora)
                    if props.get('mtg_language') == 'en' and props.get('condition') in ['Near Mint', 'Lightly Played'] and not props.get('mtg_foil'):
                        prices_en.append(p['price']['cents'] / 100.0)
                        
        if not prices_en:
            return None
            
        prices_en.sort()
        # Promedio anti-scalping (los 5 más baratos)
        top_5 = prices_en[:5]
        return round(sum(top_5) / len(top_5), 2)


def run_sync():
    logger.info("Iniciando Sincronización de Precios Gundam (CardTrader)...")
    ct = CardTraderClient()
    
    # 1. Obtener todas las expansiones de Gundam en CT
    ct_exps = ct.get_gundam_expansions()
    logger.info(f"Encontradas {len(ct_exps)} expansiones de Gundam en CardTrader.")
    
    # 2. Cargar todos los blueprints de esas expansiones en memoria
    import re
    def sanitize(name):
        return re.sub(r'[^a-z0-9]', '', str(name).lower())

    # Dict para mapear: sanitized_name -> blueprint_id
    blueprint_map = {}
    for exp in ct_exps:
        bps = ct.get_blueprints_for_expansion(exp['id'])
        if isinstance(bps, list):
            for bp in bps:
                clean_name = sanitize(bp['name'])
                blueprint_map[clean_name] = bp['id']
        time.sleep(0.2) # Rate limit genérico
    
    logger.info(f"Cargados {len(blueprint_map)} blueprints (cartas unicas) en memoria.")
    
    # 3. Obtener nuestras cartas de Gundam desde Supabase DEV
    logger.info("Obteniendo cartas de Gundam desde BD...")
    res = supabase.table('cards').select('card_id, card_name').eq('game_id', 17).execute()
    db_cards = res.data
    
    if not db_cards:
        logger.warning("No hay cartas de Gundam en la base de datos.")
        return
        
    updated_count = 0
    not_found_count = 0
    
    # 4. Sincronizar
    for db_card in db_cards:
        c_name = sanitize(db_card['card_name'])
        bp_id = blueprint_map.get(c_name)
        
        if not bp_id:
            not_found_count += 1
            continue
            
        # Obtenemos precio de CT
        market_price = ct.get_market_price(bp_id)
        time.sleep(0.1) # Rate limit products (10 req/s)
        
        if market_price is not None:
            # Actualizamos todos los printings de esta carta con el precio global (simplificado)
            update_res = supabase.table('card_printings').update({
                'avg_market_price_usd': market_price,
                'updated_at': 'now()'
            }).eq('card_id', db_card['card_id']).execute()
            
            if update_res.data:
                updated_count += len(update_res.data)
                logger.info(f"Actualizado: {db_card['card_name']} -> ${market_price}")
    
    logger.info(f"Sincronización Completada. Printings actualizados: {updated_count}. Sin match en CT: {not_found_count}")


if __name__ == "__main__":
    run_sync()
