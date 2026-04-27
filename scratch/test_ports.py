import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
try:
    # Try port 5432
    conn = psycopg2.connect(
        user="postgres.bqfkqnnostzaqueujdms",
        password="jLta9LqEmpMzCI5r",
        host="aws-0-us-west-2.pooler.supabase.com",
        port="5432",
        dbname="postgres"
    )
    print("Connected successfully on port 5432!")
    conn.close()
except Exception as e:
    print(f"Error on 5432: {e}")

try:
    # Try port 6543
    conn = psycopg2.connect(
        user="postgres.bqfkqnnostzaqueujdms",
        password="jLta9LqEmpMzCI5r",
        host="aws-0-us-west-2.pooler.supabase.com",
        port="6543",
        dbname="postgres"
    )
    print("Connected successfully on port 6543!")
    conn.close()
except Exception as e:
    print(f"Error on 6543: {e}")
