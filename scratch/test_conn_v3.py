import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
try:
    # Try with the OLD project ref from logs
    conn = psycopg2.connect(
        user=os.getenv("DB_USER_PROD"),
        password=os.getenv("DB_PASSWORD"),
        host="aws-0-us-west-2.pooler.supabase.com",
        port="6543",
        dbname="postgres"
    )
    print("Connected successfully with sxuotvogwvmxuvwbsscv!")
    conn.close()
except Exception as e:
    print(f"Error with sxuotvogwvmxuvwbsscv: {e}")

try:
    # Try with the NEW project ref from .env but DIFFERENT host
    conn = psycopg2.connect(
        user=os.getenv("DB_USER_DEV"),
        password=os.getenv("DB_PASSWORD"),
        host="aws-0-us-east-1.pooler.supabase.com",
        port="6543",
        dbname="postgres"
    )
    print("Connected successfully with bqfkqnnostzaqueujdms on us-east-1!")
    conn.close()
except Exception as e:
    print(f"Error with bqfkqnnostzaqueujdms on us-east-1: {e}")
