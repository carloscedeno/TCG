from scripts.sync.common.db import get_db_connection
try:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%external%'")
    print(f"Tables matching 'external': {cur.fetchall()}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
