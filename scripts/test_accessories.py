import psycopg2
import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def test_accessories():
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
        
        cur.execute("SELECT count(*) FROM public.accessories")
        count = cur.fetchone()[0]
        print(f"Count in accessories: {count}")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_accessories()
