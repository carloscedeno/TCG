import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_ANON_KEY')
supabase = create_client(url, key)

def count_total_sets():
    try:
        # Contar total de sets en la tabla
        res = supabase.table('sets').select('*', count='exact').eq('game_id', 22).execute()
        total_sets = res.count
        
        # Ver el último set procesado o con actividad
        res_latest = supabase.table('card_printings').select('set_code').order('updated_at', desc=True).limit(1).execute()
        last_active = res_latest.data[0]['set_code'] if res_latest.data else "Ninguno"
        
        print(f"--- RECUENTO REAL DE SETS ---")
        print(f"Total de Sets de Magic en Base de Datos: {total_sets}")
        print(f"Último set con actividad detectada: {last_active}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    count_total_sets()
