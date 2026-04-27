import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
try:
    # Try NEW project ref with port 6543
    conn = psycopg2.connect(
        user="postgres.bqfkqnnostzaqueujdms",
        password="jLta9LqEmpMzCI5r",
        host="aws-0-us-west-2.pooler.supabase.com",
        port="6543",
        dbname="postgres"
    )
    print("Connected successfully to bqfkqnnostzaqueujdms!")
    conn.close()
except Exception as e:
    print(f"Error connecting to bqfkqnnostzaqueujdms: {e}")
