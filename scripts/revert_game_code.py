import psycopg2

def revert_game_code():
    try:
        conn = psycopg2.connect(
            user="postgres.sxuotvogwvmxuvwbsscv",
            password="jLta9LqEmpMzCI5r",
            host="aws-0-us-west-2.pooler.supabase.com",
            port="6543",
            dbname="postgres"
        )
        cur = conn.cursor()
        
        print("Revirtiendo game_code a 'MTG' para restaurar los filtros de la interfaz...")
        cur.execute("UPDATE games SET game_code = 'MTG' WHERE game_id = 22")
        conn.commit()
        print("Hecho.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    revert_game_code()
