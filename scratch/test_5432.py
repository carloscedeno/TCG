import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
try:
    conn = psycopg2.connect(
        user="postgres.bqfkqnnostzaqueujdms",
        password="jLta9LqEmpMzCI5r",
        host="aws-0-us-west-2.pooler.supabase.com",
        port="5432",
        dbname="postgres",
        connect_timeout=5
    )
    print("Success 5432!")
    conn.close()
except Exception as e:
    print(f"Fail 5432: {e}")
