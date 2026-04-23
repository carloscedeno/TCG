import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
try:
    conn = psycopg2.connect(
        user="postgres",
        password="jLta9LqEmpMzCI5r",
        host="db.bqfkqnnostzaqueujdms.supabase.co",
        port="5432",
        dbname="postgres",
        connect_timeout=5
    )
    print("Direct connection success!")
    conn.close()
except Exception as e:
    print(f"Direct connection fail: {e}")
