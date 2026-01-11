import os
from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime, timezone

load_dotenv()
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
supabase = create_client(url, key)

def heavy_repair():
    print("🚀 Iniciando REPARACIÓN PESADA de datos...")
    
    # 1. Asegurar que el Source de CardKingdom es ID 1
    print("Checking sources...")
    source_ck = supabase.table('price_sources').select('*').eq('source_code', 'cardkingdom').execute()
    if not source_ck.data:
        print("Creating CardKingdom source...")
        supabase.table('price_sources').insert({'source_id': 1, 'source_name': 'CardKingdom', 'source_code': 'cardkingdom'}).execute()
        ck_id = 1
    else:
        ck_id = source_ck.data[0]['source_id']
    
    # 2. Corregir registros huérfanos en price_history
    # Si hay registros con source_id raro (como el 16 que vimos), los pasamos al 1
    print("Normalizing price history sources...")
    # Buscamos registros que NO tengan source_id 1
    res = supabase.table('price_history').update({'source_id': ck_id}).neq('source_id', ck_id).execute()
    print(f"Updated {len(res.data) if res.data else 0} records to source_id {ck_id}")

    # 3. Asegurar Condition ID 16 (Near Mint)
    print("Normalizing conditions...")
    res = supabase.table('price_history').update({'condition_id': 16}).neq('condition_id', 16).execute()
    print(f"Updated condition_id to 16 for all records.")

    # 4. POBLAR AGGREGATED_PRICES (El paso más importante para el Grid)
    print("🛠️ Poblando aggregated_prices manualmente...")
    # Obtenemos los precios más recientes por printing_id
    # En un mundo ideal esto es un group by, aquí lo haremos por lotes
    all_prices = []
    offset = 0
    batch_size = 1000
    
    while True:
        resp = supabase.table('price_history').select('printing_id, price_usd, created_at')\
            .order('created_at', desc=True).range(offset, offset + batch_size - 1).execute()
        if not resp.data: break
        all_prices.extend(resp.data)
        if len(resp.data) < batch_size: break
        offset += batch_size
        if offset > 10000: break # Limitemos para no morir en el intento, los más recientes primero

    # Deduplicar por printing_id (quedarse con el más reciente)
    latest_prices = {}
    for p in all_prices:
        pid = p['printing_id']
        if pid not in latest_prices:
            latest_prices[pid] = p['price_usd']
    
    print(f"Ready to upsert {len(latest_prices)} unique prices to aggregated_prices.")
    
    to_upsert = []
    for pid, price in latest_prices.items():
        to_upsert.append({
            'printing_id': pid,
            'condition_id': 16,
            'avg_market_price_usd': price,
            'last_updated': datetime.now(timezone.utc).isoformat()
        })
        
        if len(to_upsert) >= 500:
            try:
                supabase.table('aggregated_prices').upsert(to_upsert, on_conflict='printing_id,condition_id').execute()
                print(f"Upserted batch of 500...")
            except Exception as e:
                print(f"Batch upsert error: {e}")
            to_upsert = []
            
    if to_upsert:
        supabase.table('aggregated_prices').upsert(to_upsert, on_conflict='printing_id,condition_id').execute()

    print("✨ REPARACIÓN COMPLETADA. Los precios deberían aparecer ahora en el Grid.")

if __name__ == "__main__":
    heavy_repair()
