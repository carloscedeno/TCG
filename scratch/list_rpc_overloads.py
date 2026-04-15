import psycopg2
import sys

def list_rpc_overloads(name):
    env_dict = {}
    with open('e:/TCG Web App/.env', 'r') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                env_dict[k] = v
                
    db_url = f"postgresql://{env_dict.get('user')}:{env_dict.get('password')}@{env_dict.get('host')}:{env_dict.get('port')}/{env_dict.get('dbname')}"

    try:
        conn = psycopg2.connect(db_url)
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    n.nspname as schema,
                    p.proname as name,
                    pg_get_function_arguments(p.oid) as arguments
                FROM pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid
                WHERE p.proname = %s
            """, (name,))
            rows = cur.fetchall()
            for row in rows:
                print(f"Schema: {row[0]}, Name: {row[1]}, Args: {row[2]}")
                print("-" * 20)
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_rpc_overloads(sys.argv[1])
