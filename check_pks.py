import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def check_pks():
    try:
        conn = psycopg2.connect(
            host=os.getenv('host'),
            port=os.getenv('port'),
            user=os.getenv('user'),
            password=os.getenv('password'),
            dbname=os.getenv('dbname')
        )
        cur = conn.cursor()
        
        tables = ['cards', 'sets', 'card_printings']
        for table in tables:
            print(f"\nChecking table: {table}")
            # Check for PK
            cur.execute(f"SELECT conname FROM pg_constraint WHERE conrelid = '{table}'::regclass AND contype = 'p'")
            pk = cur.fetchone()
            print(f"  Primary Key: {pk}")
            
            # Check for Unique constraints
            cur.execute(f"SELECT conname FROM pg_constraint WHERE conrelid = '{table}'::regclass AND contype = 'u'")
            unique = cur.fetchall()
            print(f"  Unique Constraints: {unique}")

        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_pks()
