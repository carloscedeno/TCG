import psycopg2

def migrate_game_ids():
    try:
        conn = psycopg2.connect(
            user="postgres.sxuotvogwvmxuvwbsscv",
            password="jLta9LqEmpMzCI5r",
            host="aws-0-us-west-2.pooler.supabase.com",
            port="6543",
            dbname="postgres"
        )
        cur = conn.cursor()
        
        print("Migrando valores de la columna 'game' en la tabla 'products'...")
        
        # Count before
        cur.execute("SELECT count(*) FROM products WHERE game IN ('MTG', 'Magic') AND printing_id IS NOT NULL")
        to_move = cur.fetchone()[0]
        print(f"Encontrados {to_move} productos con 'MTG' o 'Magic' (con printing_id).")
        
        if to_move > 0:
            cur.execute("UPDATE products SET game = '22' WHERE game IN ('MTG', 'Magic') AND printing_id IS NOT NULL")
            conn.commit()
            print(f"Se han actualizado {to_move} productos satisfactoriamente.")
        else:
            print("No hay productos que necesiten migracion.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error durante la migracion: {e}")

if __name__ == "__main__":
    migrate_game_ids()
