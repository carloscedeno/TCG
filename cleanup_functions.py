import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def cleanup_functions():
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur = conn.cursor()
    
    # Query to find all get_products_filtered functions
    query = """
    SELECT 'DROP FUNCTION public.' || proname || '(' || pg_get_function_identity_arguments(p.oid) || ');' 
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE p.proname = 'get_products_filtered' AND n.nspname = 'public'
    """
    
    cur.execute(query)
    drops = cur.fetchall()
    
    if not drops:
        print("No functions found to drop.")
    
    for drop_stmt in drops:
        stmt = drop_stmt[0]
        print(f"Executing: {stmt}")
        try:
            cur.execute(stmt)
            print("Successfully dropped.")
        except Exception as e:
            print(f"Error dropping function: {e}")
            conn.rollback()
            continue
            
    conn.commit()
    cur.close()
    conn.close()

if __name__ == "__main__":
    cleanup_functions()
