import os
import random
import requests
import time
from dotenv import load_dotenv
from supabase import create_client

# Cargar variables de entorno
load_dotenv('.env')

SUPABASE_URL = os.environ.get('DEV_SUPABASE_URL')
SUPABASE_KEY = os.environ.get('DEV_SUPABASE_SERVICE_ROLE_KEY')

# ==============================================================================
# INSTRUCCIÓN: DEBES COLOCAR TU TOKEN DE API DE CARDTRADER AQUÍ
# Entra a tu cuenta en CardTrader -> Settings -> API -> Generate Token
# O ponlo en tu archivo .env como CARDTRADER_API_TOKEN=xxx
# ==============================================================================
CARDTRADER_API_TOKEN = os.environ.get('CARDTRADER_API_TOKEN', 'TU_TOKEN_AQUI')

CT_HEADERS = {
    'Authorization': f'Bearer {CARDTRADER_API_TOKEN}',
    'Accept': 'application/json'
}

# ID del juego Gundam en CardTrader (es 23)
CT_GUNDAM_GAME_ID = 23

def main():
    if CARDTRADER_API_TOKEN == 'TU_TOKEN_AQUI' or not CARDTRADER_API_TOKEN:
        print("❌ ERROR: Necesitas colocar tu Token de API de CardTrader en el archivo .env (CARDTRADER_API_TOKEN=xxx).")
        print("Consíguelo gratis en tu cuenta: https://www.cardtrader.com/en/users/api")
        return

    print("🚀 Iniciando conexión con Supabase...")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # 1. Obtener 100 cartas random de Gundam desde Supabase
    print("📦 Buscando 100 cartas aleatorias de Gundam (game_id = 17) en Supabase...")
    # Buscamos en 'cards' que sean Gundam y unimos con 'card_printings'
    cards_response = supabase.table('cards').select('id, card_name, game_id, card_printings(*)').eq('game_id', 17).limit(500).execute()
    
    if not cards_response.data:
        print("❌ No se encontraron cartas de Gundam en la base de datos.")
        return

    # Aplanamos la lista y tomamos 100 random printings
    all_printings = []
    for card in cards_response.data:
        for p in card['card_printings']:
            p['card_name'] = card['card_name']
            all_printings.append(p)
    
    sample_printings = random.sample(all_printings, min(100, len(all_printings)))
    print(f"✅ Seleccionadas {len(sample_printings)} cartas para actualizar desde CardTrader.")

    # 2. Descargar el catálogo de Blueprints de Gundam desde CardTrader
    # El endpoint /api/v2/blueprints/export?game_id=23 nos da el JSON de TODO el catálogo de Gundam
    print("🌐 Descargando catálogo oficial de Gundam desde la API de CardTrader (esto puede tardar unos segundos)...")
    bp_resp = requests.get(f'https://api.cardtrader.com/api/v2/blueprints/export?game_id={CT_GUNDAM_GAME_ID}', headers=CT_HEADERS)
    if bp_resp.status_code != 200:
        print(f"❌ Error al consultar la API de CardTrader: {bp_resp.status_code}")
        print(bp_resp.text)
        return
    
    ct_blueprints = bp_resp.json()
    print(f"✅ Descargados {len(ct_blueprints)} blueprints de Gundam desde CardTrader.")

    # 3. Match y Actualización en Base de Datos
    match_count = 0
    for printing in sample_printings:
        card_name = printing.get('card_name', '')
        
        # Buscamos la carta en el JSON oficial de CardTrader por nombre
        # Ignoramos mayúsculas/minúsculas para mejor coincidencia
        match = next((bp for bp in ct_blueprints if bp.get('name', '').lower() == card_name.lower()), None)
        
        if match:
            match_count += 1
            ct_id = match['id']
            # Construimos la URL definitiva usando el formato oficial y el ID interno de CardTrader
            slug = match.get('slug', str(ct_id))
            real_ct_url = f"https://www.cardtrader.com/cards/{ct_id}-{slug}"
            
            print(f"🔗 Match: '{card_name}' -> URL Oficial: {real_ct_url}")
            
            # 3.1 Actualizamos la tabla card_printings agregando el link exacto en related_uris
            current_uris = printing.get('related_uris') or {}
            current_uris['cardtrader'] = real_ct_url
            
            supabase.table('card_printings').update({
                'related_uris': current_uris
            }).eq('printing_id', printing['printing_id']).execute()

            # 3.2 (Futuro) Extraer los precios de tu CSV e inyectarlos en la tabla products
            # Aquí es donde leeremos tu CSV o el endpoint de precios para actualizar el valor a $48.23 etc.
            
        else:
            print(f"⚠️ No se encontró '{card_name}' en CardTrader. (Nombre distinto o la carta es muy nueva)")

    print(f"\n🎉 Finalizado! Se encontraron e insertaron links directos para {match_count} de las {len(sample_printings)} cartas procesadas.")

if __name__ == '__main__':
    main()
