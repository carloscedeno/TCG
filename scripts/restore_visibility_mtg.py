import psycopg2

def migrate_to_mtg_standard():
    try:
        conn = psycopg2.connect(
            user="postgres.sxuotvogwvmxuvwbsscv",
            password="jLta9LqEmpMzCI5r",
            host="aws-0-us-west-2.pooler.supabase.com",
            port="6543",
            dbname="postgres"
        )
        cur = conn.cursor()
        
        print("RESTAURANDO VISIBILIDAD: Migrando TODO el inventario al estandar 'MTG'...")
        
        # Count items to move
        cur.execute("SELECT count(*) FROM products WHERE game IN ('22', 'Magic')")
        to_move = cur.fetchone()[0]
        print(f"Encontrados {to_move} productos para migrar a 'MTG'.")
        
        if to_move > 0:
            cur.execute("UPDATE products SET game = 'MTG' WHERE game IN ('22', 'Magic')")
            conn.commit()
            print(f"Se han migrado {to_move} productos a 'MTG' satisfactoriamente.")
        else:
            print("Todos los productos ya estan en 'MTG' o no hay nada que migrar.")
            
        # Verify specific SOS/SOA/SOC items
        cur.execute("SELECT count(*) FROM products WHERE set_code IN ('sos', 'soa', 'soc') AND game = 'MTG'")
        strix_count = cur.fetchone()[0]
        print(f"Productos de Strixhaven ahora visibles (game='MTG'): {strix_count}")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error durante la migracion: {e}")

if __name__ == "__main__":
    migrate_to_mtg_standard()
