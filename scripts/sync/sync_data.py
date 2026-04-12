import psycopg2
from psycopg2.extras import RealDictCursor

# Config
# Note: Using port 5432 and the direct db.<ref> host
PROD_DB = "postgresql://postgres.sxuotvogwvmxuvwbsscv:jLta9LqEmpMzCI5r@db.sxuotvogwvmxuvwbsscv.supabase.co:5432/postgres"
DEV_DB = "postgresql://postgres.bqfkqnnostzaqueujdms:jLta9LqEmpMzCI5r@db.bqfkqnnostzaqueujdms.supabase.co:5432/postgres"

def test_and_sync():
    print("Connecting to Prod...")
    try:
        p_conn = psycopg2.connect(PROD_DB)
        print("Prod Connected.")
    except Exception as e:
        print(f"Prod Connection Failed: {e}")
        return

    print("Connecting to Dev...")
    try:
        d_conn = psycopg2.connect(DEV_DB)
        print("Dev Connected.")
    except Exception as e:
        print(f"Dev Connection Failed: {e}")
        p_conn.close()
        return

    # Sync Core Data (Sets, Cards, Printings)
    tables = ["sets", "cards", "card_printings", "products"]
    
    p_cur = p_conn.cursor(cursor_factory=RealDictCursor)
    d_cur = d_conn.cursor()

    for table in tables:
        print(f"Syncing {table}...")
        p_cur.execute(f"SELECT * FROM public.{table};")
        
        # Use fetchall in batches or one go if manageable
        rows = p_cur.fetchall()
        if not rows:
            continue
            
        columns = rows[0].keys()
        cols_str = ", ".join(columns)
        placeholders = ", ".join(["%s"] * len(columns))
        query = f"INSERT INTO public.{table} ({cols_str}) VALUES ({placeholders}) ON CONFLICT DO NOTHING;"
        
        data = [[row[col] for col in columns] for row in rows]
        
        # Batch insert
        batch_size = 1000
        for i in range(0, len(data), batch_size):
            batch = data[i:i + batch_size]
            d_cur.executemany(query, batch)
            d_conn.commit()
            print(f"Inserted {min(i + batch_size, len(data))} / {len(data)} rows into {table}")

    p_conn.close()
    d_conn.close()

if __name__ == "__main__":
    test_and_sync()
