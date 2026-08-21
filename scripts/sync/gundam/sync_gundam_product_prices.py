import os
import sys
from dotenv import load_dotenv
from supabase import create_client

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv('.env')
SUPABASE_URL = os.environ.get('DEV_SUPABASE_URL')
SUPABASE_KEY = os.environ.get('DEV_SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def main():
    print("🚀 Sincronizando precios de la tabla 'products' con el precio de mercado de CardTrader...")
    
    # 1. Obtener todos los productos de Gundam
    res_products = supabase.table('products').select('id, printing_id, price').eq('game', 'GND').execute()
    products = res_products.data
    print(f"Encontrados {len(products)} productos de Gundam en la base de datos.")
    
    if not products:
        print("No hay productos de Gundam que actualizar.")
        return
        
    # 2. Obtener los printings correspondientes
    printing_ids = [p['printing_id'] for p in products if p['printing_id']]
    res_printings = supabase.table('card_printings').select('printing_id, avg_market_price_usd').in_('printing_id', printing_ids).execute()
    printings_map = {p['printing_id']: p['avg_market_price_usd'] for p in res_printings.data}
    
    updated_count = 0
    for p in products:
        pid = p['printing_id']
        if not pid or pid not in printings_map:
            continue
            
        market_price = printings_map[pid]
        # Si el precio de mercado es válido (no nulo, mayor que 0)
        if market_price is not None and market_price > 0:
            supabase.table('products').update({
                'price': market_price
            }).eq('id', p['id']).execute()
            updated_count += 1
            print(f"Producto {p['id']} actualizado a precio de mercado: ${market_price}")
            
    print(f"✅ Se actualizaron {updated_count} productos de Gundam con su precio real de CardTrader.")

if __name__ == '__main__':
    main()
