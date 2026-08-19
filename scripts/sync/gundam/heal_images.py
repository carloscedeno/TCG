import os
import sys
import requests
from dotenv import load_dotenv
from supabase import create_client
from concurrent.futures import ThreadPoolExecutor

load_dotenv('.env')
supabase = create_client(os.environ['DEV_SUPABASE_URL'], os.environ['DEV_SUPABASE_SERVICE_ROLE_KEY'])

res = supabase.table('card_printings').select('printing_id, image_url').like('image_url', '%exburst.dev%').execute()
printings = res.data

def test_url(url):
    try:
        r = requests.head(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=5)
        return 'image' in r.headers.get('Content-Type', '')
    except Exception:
        return False

def heal_printing(p):
    url = p['image_url']
    if not url: return None
    
    if test_url(url):
        return None 
    
    base = url.split('.webp')[0]
    for s in ['_PR10', '_PR9', '_PR8', '_PR7', '_PR6', '_PR5', '_PR4', '_PR3', '_PR2', '_PR1', '_PR', '_d', '_D']:
        if base.endswith(s):
            base = base[:-len(s)]
            break
            
    for i in range(1, 15):
        guess = f"{base}_p{i}.webp"
        if test_url(guess):
            return {'printing_id': p['printing_id'], 'image_url': guess, 'old': url}
            
    return None

print(f"Checking {len(printings)} printings...")
fixes = []
with ThreadPoolExecutor(max_workers=30) as ex:
    results = ex.map(heal_printing, printings)
    for r in results:
        if r:
            fixes.append(r)
            print(f"Found fix: {r['old']} -> {r['image_url']}")

print(f"Total fixes found: {len(fixes)}")
for f in fixes:
    supabase.table('card_printings').update({'image_url': f['image_url']}).eq('printing_id', f['printing_id']).execute()

print("Heal complete.")
