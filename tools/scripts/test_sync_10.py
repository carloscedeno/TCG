#!/usr/bin/env python3
import os
import sys
import requests
from datetime import datetime, timezone
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env from root
load_dotenv('.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')
GAME_ID = 22  # MTG

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL or SUPABASE_KEY not found.")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def test_sync():
    print("🚀 Running 10-card test sync for MTG...")
    
    # Get just one set to test
    sets_resp = supabase.table('sets').select('set_id,set_code').eq('game_id', GAME_ID).limit(1).execute()
    if not sets_resp.data:
        print("❌ No MTG sets found in DB.")
        return
    
    test_set = sets_resp.data[0]
    print(f"📦 Testing with set {test_set['set_code']} (ID {test_set['set_id']})...")
    
    url = f"https://api.scryfall.com/cards/search?q=e%3A{test_set['set_code']}&unique=prints"
    resp = requests.get(url)
    resp.raise_for_status()
    cards = resp.json()['data'][:10] # Just 10 cards
    
    print(f"📄 Found {len(cards)} cards for test.")
    
    for i, card in enumerate(cards, 1):
        try:
            # Minimal mapping to avoid missing columns
            card_data = {
                'card_id': card['oracle_id'],
                'game_id': GAME_ID,
                'card_name': card['name'],
                'type_line': card.get('type_line'),
                'oracle_text': card.get('oracle_text'),
                'mana_cost': card.get('mana_cost'),
                'cmc': card.get('cmc'),
                'rarity': card.get('rarity'),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
            
            # Upsert card
            supabase.table('cards').upsert(card_data, on_conflict='card_id').execute()
            
            printing_data = {
                'printing_id': card['id'],
                'card_id': card['oracle_id'],
                'set_id': test_set['set_id'],
                'set_code': card.get('set'),
                'collector_number': card.get('collector_number'),
                'image_url': card.get('image_uris', {}).get('normal') if card.get('image_uris') else None,
                'prices': card.get('prices'),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
            
            # Upsert printing
            supabase.table('card_printings').upsert(printing_data, on_conflict='printing_id').execute()
            
            print(f"  ✅ [{i}/10] {card['name']} processed.")
        except Exception as e:
            print(f"  ❌ Error for {card.get('name')}: {e}")

    print("\n🎉 Test sync completed successfully!")

if __name__ == "__main__":
    test_sync()
