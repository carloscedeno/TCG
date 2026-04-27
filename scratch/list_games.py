import os, requests
from dotenv import load_dotenv
load_dotenv('frontend/.env')
url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_ANON_KEY')
headers = {'apikey': key, 'Authorization': f'Bearer {key}'}
res = requests.get(f'{url}/rest/v1/games?select=game_id,game_name', headers=headers)
if res.status_code == 200:
    for i in res.json():
        print(f"{i['game_id']}: {i['game_name']}")
