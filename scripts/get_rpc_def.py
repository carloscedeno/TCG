import os
import psycopg2

def get_obj_def():
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
            with open('e:/TCG Web App/rpc_output.txt', 'w', encoding='utf-8') as out:
                cur.execute("""
                    SELECT prosrc 
                    FROM pg_proc 
                    WHERE proname = 'get_products_filtered';
                """)
                row = cur.fetchone()
                if row:
                    out.write("--- get_products_filtered ---\n")
                    out.write(row[0] + "\n")
                
                cur.execute("""
                    SELECT prosrc 
                    FROM pg_proc 
                    WHERE proname = 'get_unique_cards_optimized';
                """)
                row2 = cur.fetchone()
                if row2:
                    out.write("\n--- get_unique_cards_optimized ---\n")
                    out.write(row2[0] + "\n")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_obj_def()
