import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
regions = ["us-east-1", "us-east-2", "us-west-1", "us-west-2", "eu-central-1", "eu-west-1"]

for region in regions:
    host = f"aws-0-{region}.pooler.supabase.com"
    try:
        conn = psycopg2.connect(
            user="postgres.bqfkqnnostzaqueujdms",
            password="jLta9LqEmpMzCI5r",
            host=host,
            port="6543",
            dbname="postgres",
            connect_timeout=3
        )
        print(f"SUCCESS: Connected to bqfkqnnostzaqueujdms on {region}!")
        conn.close()
        break
    except Exception as e:
        print(f"Failed {region}: {e}")
