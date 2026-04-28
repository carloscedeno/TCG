from scripts.sync.common.db import get_db_connection
try:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    tables = cur.fetchall()
    print(f"Tables: {[t[0] for t in tables]}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
