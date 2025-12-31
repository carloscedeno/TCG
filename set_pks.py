import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def set_pks():
    try:
        conn = psycopg2.connect(
            host=os.getenv('host'),
            port=os.getenv('port'),
            user=os.getenv('user'),
            password=os.getenv('password'),
            dbname=os.getenv('dbname')
        )
        cur = conn.cursor()
        
        pk_configs = [
            ('games', 'game_id'),
            ('sets', 'set_id'),
            ('cards', 'card_id'),
            ('card_printings', 'printing_id'),
            ('conditions', 'condition_id'),
            ('sources', 'source_id')
        ]
        
        for table, column in pk_configs:
            print(f"Setting PK for {table}({column})...")
            try:
                # First ensure the column is NOT NULL
                cur.execute(f"ALTER TABLE {table} ALTER COLUMN {column} SET NOT NULL;")
                # Then add the PK constraint
                cur.execute(f"ALTER TABLE {table} ADD PRIMARY KEY ({column});")
                print(f"  Successfully set PK for {table}")
            except Exception as e:
                print(f"  Failed to set PK for {table}: {e}")
                conn.rollback()
            else:
                conn.commit()

        cur.close()
        conn.close()
        print("\nFinished setting primary keys.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    set_pks()
