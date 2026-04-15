import psycopg2
import sys

def get_rpc_def(name):
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
            cur.execute("SELECT prosrc FROM pg_proc WHERE proname = %s", (name,))
            row = cur.fetchone()
            if row:
                print(row[0])
            else:
                print(f"Function {name} not found")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_rpc_def(sys.argv[1])
