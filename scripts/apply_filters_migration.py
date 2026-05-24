import os
import psycopg2
import sys

def apply():
    try:
        conn = psycopg2.connect("postgresql://postgres.sxuotvogwvmxuvwbsscv:jLta9LqEmpMzCI5r@aws-0-us-west-2.pooler.supabase.com:6543/postgres")
        cur = conn.cursor()
        
        with open("supabase/migrations/20260522000000_update_filters.sql", "r", encoding="utf-8") as f:
            sql = f.read()
            
        cur.execute(sql)
        conn.commit()
        print("Migración aplicada exitosamente")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    apply()
