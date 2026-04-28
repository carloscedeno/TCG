import psycopg2
import sys
import io
import os

# Forzar UTF-8 en la salida de consola
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def restore_production():
    try:
        # DB Configuration from existing scripts
        DB_USER = "postgres.sxuotvogwvmxuvwbsscv"
        DB_PASS = "jLta9LqEmpMzCI5r"
        DB_HOST = "aws-0-us-west-2.pooler.supabase.com"
        DB_PORT = "6543"
        DB_NAME = "postgres"
        
        print(f"Connecting to production database ({DB_HOST})...")
        conn = psycopg2.connect(
            user=DB_USER,
            password=DB_PASS,
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME
        )
        cur = conn.cursor()
        
        print("🛠️  Reading restoration SQL script...")
        sql_path = os.path.join(os.path.dirname(__file__), "..", "supabase", "fix_production_rpcs.sql")
        with open(sql_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
            
        print("🚀 Executing restoration script...")
        cur.execute(sql_content)
        conn.commit()
        
        print("✨ ¡Producción restaurada con éxito!")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error restaurando producción: {e}")
        if 'conn' in locals() and conn:
            conn.rollback()

if __name__ == "__main__":
    restore_production()
