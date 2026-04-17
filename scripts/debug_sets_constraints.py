import os
import psycopg2
from dotenv import load_dotenv

def check_sets_schema():
    load_dotenv()
    
    # Try to build connection string from individual variables or use URL if available
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        user = os.getenv('DB_USER') or os.getenv('user')
        password = os.getenv('DB_PASSWORD') or os.getenv('password')
        host = os.getenv('DB_HOST') or os.getenv('host')
        port = os.getenv('DB_PORT') or '5432'
        dbname = os.getenv('DB_NAME') or os.getenv('dbname')
        db_url = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"

    try:
        conn = psycopg2.connect(db_url)
        with conn.cursor() as cur:
            print("--- Table: sets ---")
            
            # Check unique constraints
            cur.execute("""
                SELECT
                    conname as constraint_name,
                    pg_get_constraintdef(c.oid) as constraint_definition
                FROM pg_constraint c
                JOIN pg_namespace n ON n.oid = c.connamespace
                WHERE contype = 'u' AND conrelid = 'public.sets'::regclass;
            """)
            constraints = cur.fetchall()
            print("\nUnique Constraints:")
            for c in constraints:
                print(f"  {c[0]}: {c[1]}")
                
            # Check indexes
            cur.execute("""
                SELECT
                    indexname,
                    indexdef
                FROM pg_indexes
                WHERE tablename = 'sets' AND schemaname = 'public';
            """)
            indexes = cur.fetchall()
            print("\nIndexes:")
            for i in indexes:
                print(f"  {i[0]}: {i[1]}")
                
            # Check columns
            cur.execute("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'sets' AND table_schema = 'public'
                ORDER BY ordinal_position;
            """)
            columns = cur.fetchall()
            print("\nColumns:")
            for col in columns:
                print(f"  {col[0]} ({col[1]}), Nullable: {col[2]}")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_sets_schema()
