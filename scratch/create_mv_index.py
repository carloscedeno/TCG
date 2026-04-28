from scripts.sync.common.db import get_db_connection
try:
    conn = get_db_connection()
    conn.autocommit = True
    cur = conn.cursor()
    print("Creating unique index on mv_unique_cards...")
    cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_unique_cards_printing_id ON mv_unique_cards (printing_id)")
    print("Index created successfully.")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
