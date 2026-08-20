import os
import random
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env')
SUPABASE_URL = os.environ.get('DEV_SUPABASE_URL')
SUPABASE_KEY = os.environ.get('DEV_SUPABASE_SERVICE_ROLE_KEY')

def main():
    print("🚀 Iniciando conexión con Supabase...")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    print("📦 Buscando 10 cartas aleatorias de Gundam (game_id = 17)...")
    cards_response = supabase.table('cards').select('card_id, card_name, game_id, card_printings(*)').eq('game_id', 17).limit(500).execute()
    
    all_printings = []
    for card in cards_response.data:
        for p in card['card_printings']:
            p['card_name'] = card['card_name']
            all_printings.append(p)
            
    sample_printings = random.sample(all_printings, min(10, len(all_printings)))
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    match_count = 0
    for printing in sample_printings:
        card_name = printing.get('card_name', '')
        # Limpiamos caracteres especiales para la búsqueda
        clean_name = ''.join(e for e in card_name if e.isalnum() or e.isspace())
        
        search_url = f"https://www.cardtrader.com/search?search_text={requests.utils.quote(clean_name)}&game_id=23"
        print(f"Buscando: {clean_name} ...")
        
        try:
            r = requests.get(search_url, headers=headers, timeout=10)
            soup = BeautifulSoup(r.text, 'html.parser')
            
            # Buscar el primer enlace a una carta
            first_link = None
            for a in soup.find_all('a', href=True):
                if '/cards/' in a['href']:
                    first_link = a['href']
                    break
                    
            if first_link:
                real_url = f"https://www.cardtrader.com{first_link}"
                print(f"🔗 Encontrado: {real_url}")
                
                # Actualizar DB
                current_uris = printing.get('related_uris') or {}
                current_uris['cardtrader'] = real_url
                
                # Simulamos precio
                fake_price = round(random.uniform(5.0, 50.0), 2)
                
                supabase.table('card_printings').update({
                    'related_uris': current_uris,
                    'avg_market_price_usd': fake_price
                }).eq('printing_id', printing['printing_id']).execute()
                
                match_count += 1
            else:
                print(f"⚠️ No encontrado en CardTrader.")
                
        except Exception as e:
            print(f"Error buscando {clean_name}: {e}")

    print(f"\n🎉 ¡Finalizado! Actualizadas {match_count} cartas con precios de mercado simulados y links reales extraídos del buscador de CardTrader.")

if __name__ == '__main__':
    main()
