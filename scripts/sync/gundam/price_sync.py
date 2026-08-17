import os
import sys
import json
import time
import httpx
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('TCGPlayer_Sync')

# Asegurar que se puede importar código raíz si es necesario
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
sys.path.append(root_dir)

load_dotenv()

# --- Configuración TCGPlayer ---
TCG_PUBLIC_KEY = os.getenv("TCGPLAYER_PUBLIC_KEY")
TCG_PRIVATE_KEY = os.getenv("TCGPLAYER_PRIVATE_KEY")
TCG_API_VERSION = "v1.39.0"
TCG_BASE_URL = f"https://api.tcgplayer.com/{TCG_API_VERSION}"
TOKEN_CACHE_FILE = os.path.join(current_dir, ".tcgplayer_token.json")

# --- Configuración Supabase ---
from supabase import create_client, Client
SUPABASE_URL = os.environ.get("DEV_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("DEV_SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Faltan credenciales de Supabase en entorno DEV.")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class TCGPlayerClient:
    def __init__(self):
        self.public_key = TCG_PUBLIC_KEY
        self.private_key = TCG_PRIVATE_KEY
        self.token = None
        self.token_expiry = None
        self.client = httpx.Client(timeout=30.0)
        self._load_cached_token()

    def _load_cached_token(self):
        if os.path.exists(TOKEN_CACHE_FILE):
            try:
                with open(TOKEN_CACHE_FILE, 'r') as f:
                    data = json.load(f)
                expiry = datetime.fromisoformat(data['expiry'])
                if datetime.now() < expiry - timedelta(hours=1):
                    self.token = data['access_token']
                    self.token_expiry = expiry
                    logger.info("Token de TCGPlayer cargado desde caché local.")
                    return
            except Exception as e:
                logger.warning(f"Error cargando token caché: {e}")

        self._fetch_new_token()

    def _fetch_new_token(self):
        logger.info("Solicitando nuevo token de TCGPlayer...")
        if not self.public_key or not self.private_key:
            raise ValueError("Faltan TCGPLAYER_PUBLIC_KEY o TCGPLAYER_PRIVATE_KEY en .env")

        token_url = "https://api.tcgplayer.com/token"
        headers = {'Content-Type': 'application/x-www-form-urlencoded'}
        data = {
            'grant_type': 'client_credentials',
            'client_id': self.public_key,
            'client_secret': self.private_key
        }

        resp = httpx.post(token_url, headers=headers, data=data)
        resp.raise_for_status()
        resp_data = resp.json()
        
        self.token = resp_data['access_token']
        expires_in = resp_data['expires_in'] # suele ser 14 dias
        self.token_expiry = datetime.now() + timedelta(seconds=expires_in)

        # Cachear en disco
        with open(TOKEN_CACHE_FILE, 'w') as f:
            json.dump({
                'access_token': self.token,
                'expiry': self.token_expiry.isoformat()
            }, f)
        logger.info("Nuevo token TCGPlayer obtenido y cacheado.")

    def get_auth_headers(self):
        if not self.token or datetime.now() >= self.token_expiry - timedelta(hours=1):
            self._fetch_new_token()
        return {
            'Authorization': f'Bearer {self.token}',
            'Accept': 'application/json'
        }

    def _request_with_backoff(self, method, endpoint, params=None):
        url = f"{TCG_BASE_URL}/{endpoint}"
        max_retries = 5
        base_delay = 2

        for attempt in range(max_retries):
            headers = self.get_auth_headers()
            try:
                resp = self.client.request(method, url, headers=headers, params=params)
                
                # Check rate limits
                if resp.status_code == 429:
                    retry_after = resp.headers.get('Retry-After')
                    delay = int(retry_after) if retry_after else base_delay * (2 ** attempt)
                    logger.warning(f"HTTP 429 Too Many Requests. Retrying in {delay} seconds (Attempt {attempt+1}/{max_retries})...")
                    time.sleep(delay)
                    continue
                
                resp.raise_for_status()
                return resp.json()

            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP Error: {e.response.text}")
                raise e
            except Exception as e:
                logger.error(f"Request Error: {e}")
                delay = base_delay * (2 ** attempt)
                time.sleep(delay)
        
        raise Exception(f"Failed after {max_retries} retries on {url}")

    def get_categories(self):
        # We need pagination since limit is usually 10-100
        categories = []
        offset = 0
        limit = 50
        while True:
            resp = self._request_with_backoff("GET", "catalog/categories", {"offset": offset, "limit": limit})
            results = resp.get('results', [])
            categories.extend(results)
            if not results or len(results) < limit:
                break
            offset += limit
        return categories

    def get_groups(self, category_id):
        groups = []
        offset = 0
        limit = 50
        while True:
            resp = self._request_with_backoff("GET", f"catalog/categories/{category_id}/groups", {"offset": offset, "limit": limit})
            results = resp.get('results', [])
            groups.extend(results)
            if not results or len(results) < limit:
                break
            offset += limit
        return groups

    def get_products(self, category_id, group_id):
        products = []
        offset = 0
        limit = 100
        while True:
            resp = self._request_with_backoff("GET", "catalog/products", {
                "categoryId": category_id,
                "groupId": group_id,
                "getExtendedFields": "true",
                "offset": offset,
                "limit": limit
            })
            results = resp.get('results', [])
            products.extend(results)
            if not results or len(results) < limit:
                break
            offset += limit
            time.sleep(0.2) # Basic throttling courtesy
        return products

    def get_market_prices(self, product_ids):
        # TCGPlayer allows passing multiple product IDs separated by commas.
        # Max is typically 250 per request for pricing
        prices_dict = {}
        chunk_size = 200
        
        for i in range(0, len(product_ids), chunk_size):
            chunk = product_ids[i:i+chunk_size]
            chunk_str = ",".join(map(str, chunk))
            
            resp = self._request_with_backoff("GET", f"pricing/product/{chunk_str}")
            results = resp.get('results', [])
            
            for p in results:
                # p has productId, lowPrice, midPrice, highPrice, marketPrice, subTypeName (Normal, Foil)
                pid = p['productId']
                if pid not in prices_dict:
                    prices_dict[pid] = {'normal': None, 'foil': None}
                
                if p['subTypeName'] == 'Normal':
                    prices_dict[pid]['normal'] = p['marketPrice']
                elif p['subTypeName'] == 'Foil':
                    prices_dict[pid]['foil'] = p['marketPrice']
            
            time.sleep(0.5) # Anti-throttling between chunks
            
        return prices_dict

def main():
    logger.info("Iniciando TCGPlayer Pricing Sync para Gundam...")
    tcg = TCGPlayerClient()
    
    # 1. Encontrar Category ID de Gundam
    categories = tcg.get_categories()
    gundam_cat = next((c for c in categories if "Gundam" in c['name'] or "Gundam Card Game" in c['name']), None)
    
    if not gundam_cat:
        logger.error("No se encontró categoría para Gundam en TCGPlayer.")
        return
        
    category_id = gundam_cat['categoryId']
    logger.info(f"Categoría Gundam encontrada: {gundam_cat['name']} (ID: {category_id})")
    
    # 2. Encontrar todos los Groups (Sets)
    groups = tcg.get_groups(category_id)
    logger.info(f"Se encontraron {len(groups)} grupos (Sets) para Gundam en TCGPlayer.")
    
    # 3. Obtener productos y cruzar contra BD
    all_products = []
    for g in groups:
        logger.info(f"Extrayendo productos del set: {g['name']}...")
        prods = tcg.get_products(category_id, g['groupId'])
        all_products.extend(prods)
        
    logger.info(f"Total de productos extraídos de TCGPlayer: {len(all_products)}")
    
    # Extraer IDs para batch pricing
    product_ids = [p['productId'] for p in all_products]
    logger.info("Descargando precios de mercado desde TCGPlayer en bulk...")
    prices = tcg.get_market_prices(product_ids)
    
    logger.info("Precios descargados. Iniciando actualización en la base de datos DEV (Supabase)...")
    
    # TODO: Matchear product_name y set con card_printings de Gundam (game_id = 17)
    # y hacer upsert del avg_market_price_usd y tcg_specific_attributes (tcgplayer_id).
    
    logger.info("TCGPlayer Sync Finalizado Exitosamente.")

if __name__ == "__main__":
    main()
