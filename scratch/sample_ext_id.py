from scripts.sync.common.db import get_db_connection
try:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM external_identifiers LIMIT 5")
    rows = cur.fetchall()
    print(f"Samples: {rows}")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
