import psycopg2

def check_soa_metadata():
    try:
        conn = psycopg2.connect(
            user="postgres.sxuotvogwvmxuvwbsscv",
            password="jLta9LqEmpMzCI5r",
            host="aws-0-us-west-2.pooler.supabase.com",
            port="6543",
            dbname="postgres"
        )
        cur = conn.cursor()
        
        print("--- Metadata for SOA #22 ---")
        cur.execute("""
            SELECT cp.printing_id, cp.scryfall_id, s.set_name, c.card_name
            FROM card_printings cp
            JOIN cards c ON cp.card_id = c.card_id
            JOIN sets s ON cp.set_id = s.set_id
            WHERE s.set_code = 'soa' AND cp.collector_number = '22'
        """)
        row = cur.fetchone()
        if row:
            print(f"Printing ID: {row[0]}")
            print(f"Scryfall ID: {row[1]}")
            print(f"Set Name: {row[2]}")
            print(f"Card Name: {row[3]}")
        else:
            print("SOA #22 not found in DB!")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_soa_metadata()
