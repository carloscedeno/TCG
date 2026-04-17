import psycopg2

def fix_game_code_mapping():
    try:
        conn = psycopg2.connect(
            user="postgres.sxuotvogwvmxuvwbsscv",
            password="jLta9LqEmpMzCI5r",
            host="aws-0-us-west-2.pooler.supabase.com",
            port="6543",
            dbname="postgres"
        )
        cur = conn.cursor()
        
        print("Corrección definitiva: Sincronizando tabla 'games' con el valor esperado por el inventario ('22').")
        
        # 1. Update the games table so the trigger uses '22'
        cur.execute("UPDATE games SET game_code = '22' WHERE game_id = 22")
        
        # 2. Force a sync on all products that have 'MTG'
        cur.execute("UPDATE products SET game = '22' WHERE game = 'MTG' AND printing_id IS NOT NULL")
        
        conn.commit()
        print("Sincronización completada. Ahora el gatillo (trigger) mantendrá '22' automáticamente.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_game_code_mapping()
