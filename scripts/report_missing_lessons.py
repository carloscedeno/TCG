import psycopg2

def identify_missing_lessons():
    try:
        conn = psycopg2.connect(
            user="postgres.sxuotvogwvmxuvwbsscv",
            password="jLta9LqEmpMzCI5r",
            host="aws-0-us-west-2.pooler.supabase.com",
            port="6543",
            dbname="postgres"
        )
        cur = conn.cursor()
        
        print("--- IDENTIFICANDO LECCIONES FALTANTES PARA STRIXHAVEN (sos, soa, soc) ---")
        cur.execute("""
            SELECT cp.printing_id, c.card_name, cp.set_code, c.type_line
            FROM card_printings cp
            JOIN cards c ON cp.card_id = c.card_id
            LEFT JOIN products p ON cp.printing_id = p.printing_id
            WHERE c.type_line ILIKE '%Lesson%' 
              AND cp.set_code IN ('sos', 'soa', 'soc')
              AND p.printing_id IS NULL
        """)
        rows = cur.fetchall()
        
        if not rows:
            print("No faltan lecciones en la tabla products para estos sets.")
        else:
            print(f"Se encontraron {len(rows)} lecciones en el catálogo pero sin existencias en products:")
            print("| Card Name | Set Code | Printing ID |")
            print("|-----------|----------|-------------|")
            for r in rows:
                print(f"| {r[1]} | {r[2]} | {r[0]} |")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    identify_missing_lessons()
