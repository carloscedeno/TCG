import os, sys, requests, json
try:
    from dotenv import load_dotenv
    load_dotenv()
except:
    pass

url = os.getenv('SUPABASE_URL') or 'https://sxuotvogwvmxuvwbsscv.supabase.co'
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_KEY') or os.getenv('SUPABASE_ANON_KEY')

headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json'
}

# Query card_printings for these cards with direct REST - much faster
names = ['Goblin Raider', 'Sudden Impact', 'Bloodshot Cyclops', 'Orcish Artillery', 'Balduvian Barbarians', 'Ridgeline Rager']

print("=== Direct REST check for specific cards ===")
for name in names:
    # Search cards table
    r = requests.get(
        f"{url}/rest/v1/cards",
        headers=headers,
        params={'card_name': f'ilike.*{name}*', 'select': 'card_id,card_name', 'limit': 3},
        timeout=10
    )
    if r.status_code == 200:
        cards = r.json()
        for card in cards:
            # Get printings with prices
            r2 = requests.get(
                f"{url}/rest/v1/card_printings",
                headers=headers,
                params={
                    'card_id': f'eq.{card["card_id"]}',
                    'select': 'printing_id,avg_market_price_usd,finish,is_foil',
                    'limit': 5
                },
                timeout=10
            )
            printings = r2.json() if r2.status_code == 200 else []
            prices = [f"{p.get('avg_market_price_usd')}({p.get('finish')})" for p in printings]
            print(f"  {card['card_name']}: {prices if prices else 'NO PRINTINGS'}")
    else:
        print(f"  {name}: ERROR {r.status_code}")

# Count totals
print("\n=== Overall price coverage ===")
r = requests.get(
    f"{url}/rest/v1/card_printings",
    headers=headers,
    params={'avg_market_price_usd': 'is.null', 'select': 'printing_id', 'limit': 1},
    timeout=10
)
print(f"WITHOUT price (status {r.status_code}): checking count header...")
# Use range to count  
r2 = requests.get(
    f"{url}/rest/v1/card_printings",
    headers={**headers, 'Prefer': 'count=exact'},
    params={'avg_market_price_usd': 'is.null', 'select': 'printing_id', 'limit': 1},
    timeout=10
)
print(f"WITHOUT price count: {r2.headers.get('content-range', 'N/A')}")

r3 = requests.get(
    f"{url}/rest/v1/card_printings",
    headers={**headers, 'Prefer': 'count=exact'},
    params={'avg_market_price_usd': 'not.is.null', 'select': 'printing_id', 'limit': 1},
    timeout=10
)
print(f"WITH price count: {r3.headers.get('content-range', 'N/A')}")
