import os
import requests
from dotenv import load_dotenv

load_dotenv('frontend/.env')
url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_ANON_KEY')

headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}'
}

def scan_accessories():
    res = requests.get(f'{url}/rest/v1/accessories?select=id,name,category,game_id&limit=100', headers=headers)
    if res.status_code == 200:
        items = res.json()
        print(f"{'ID':<5} | {'GAME':<5} | {'NAME'}")
        print("-" * 50)
        for item in items:
            game = item.get('game_id', 'N/A')
            print(f"{item['id']:<5} | {str(game):<5} | {item['name']}")
    else:
        print(f"Error: {res.status_code}")

if __name__ == '__main__':
    scan_accessories()
