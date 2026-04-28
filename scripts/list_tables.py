import psycopg2
import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def list_tables():
    try:
        DB_USER = "postgres.sxuotvogwvmxuvwbsscv"
        DB_PASS = "jLta9LqEmpMzCI5r"
        DB_HOST = "aws-0-us-west-2.pooler.supabase.com"
        DB_PORT = "6543"
        DB_NAME = "postgres"
        
        conn = psycopg2.connect(
            user=DB_USER,
            password=DB_PASS,
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME
        )
        cur = conn.cursor()
        
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        """)
        rows = cur.fetchall()
        print("Tables in public schema:")
        for r in rows:
            print(r[0])
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    list_tables()
