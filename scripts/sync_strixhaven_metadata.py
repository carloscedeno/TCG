import psycopg2

def sync_all_strixhaven_metadata():
    try:
        conn = psycopg2.connect(
            user="postgres.sxuotvogwvmxuvwbsscv",
            password="jLta9LqEmpMzCI5r",
            host="aws-0-us-west-2.pooler.supabase.com",
            port="6543",
            dbname="postgres"
        )
        cur = conn.cursor()
        
        print("INICIANDO REPARACION DE METADATOS (Type, Colors, Release Date)...")
        
        # 1. Total records without metadata
        cur.execute("SELECT count(*) FROM products WHERE type_line IS NULL AND game = 'MTG'")
        to_fix = cur.fetchone()[0]
        print(f"Encontrados {to_fix} productos sin metadatos básicos.")
        
        if to_fix > 0:
            # Triggering the BEFORE UPDATE trigger by re-setting the printing_id to itself
            cur.execute("UPDATE products SET printing_id = printing_id WHERE type_line IS NULL AND game = 'MTG'")
            conn.commit()
            print(f"Se han sincronizado {to_fix} productos satisfactoriamente.")
        else:
            print("Todos los productos ya tienen metadatos.")

        # 2. Final verification for a few samples
        print("\nVerificando resultado final (muestras):")
        cur.execute("""
            SELECT name, set_name, type_line, colors, release_date 
            FROM products 
            WHERE set_code IN ('sos', 'soa', 'soc') 
            LIMIT 5
        """)
        rows = cur.fetchall()
        for r in rows:
            print(f"Card: {r[0]} | Type: {r[2]} | Colors: {r[3]}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error durante la reparacion: {e}")

if __name__ == "__main__":
    sync_all_strixhaven_metadata()
