import os, psycopg2; from dotenv import load_dotenv

def add_constraint():
    load_dotenv()
    db_url = os.getenv('DATABASE_URL') or f"postgresql://{os.getenv('user')}:{os.getenv('password')}@{os.getenv('host')}:{os.getenv('port')}/{os.getenv('dbname')}"
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    
    try:
        cur.execute('ALTER TABLE public.sets ADD CONSTRAINT sets_game_id_set_code_key UNIQUE (game_id, set_code)')
        conn.commit()
        print('Unique constraint added successfully.')
    except Exception as e:
        print(f'Error: {e}')
        conn.rollback()
        
    conn.close()

if __name__ == "__main__":
    add_constraint()
