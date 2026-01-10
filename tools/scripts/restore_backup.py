import psycopg2
import os
import sys

# Connection settings
# Using Supabase Pooler (US West 2 - Oregon)
DB_HOST = "aws-0-us-west-2.pooler.supabase.com"
DB_NAME = "postgres"
# User format for pooler: user.project_ref
DB_USER = "postgres.sxuotvogwvmxuvwbsscv"
DB_PASS = "8F-r!6$Q!cQH?qu"
DB_PORT = "5432"

MIGRATION_FILE = "supabase/migrations/20250716133215_imported_backup.sql"

def restore():
    print("Connecting to database...")
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            port=DB_PORT
        )
        conn.autocommit = True
        cur = conn.cursor()
        print("Connected.")
    except Exception as e:
        print(f"Connection failed: {e}")
        return

    print(f"Reading {MIGRATION_FILE}...")
    
    with open(MIGRATION_FILE, 'r', encoding='utf-8') as f:
        buffer = []
        copy_mode = False
        copy_sql = ""
        copy_buffer = []

        for line in f:
            if copy_mode:
                if line.strip() == r'\.':
                    # End of COPY
                    print(f"Executing COPY {copy_sql.split()[1]}...")
                    try:
                        # Create a file-like object for copy_expert
                        from io import StringIO
                        data = "".join(copy_buffer)
                        cur.copy_expert(copy_sql, StringIO(data))
                    except Exception as e:
                        print(f"Error during COPY: {e}")
                        print("Skipping this table and continuing...")
                        # sys.exit(1)
                    
                    copy_mode = False
                    copy_sql = ""
                    copy_buffer = []
                else:
                    copy_buffer.append(line)
            else:
                # Check for COPY start
                if line.startswith("COPY ") and "FROM stdin;" in line:
                    # Execute pending SQL
                    if buffer:
                        sql = "".join(buffer)
                        if sql.strip():
                            try:
                                cur.execute(sql)
                            except Exception as e:
                                if "empty query" not in str(e):
                                    print(f"Error executing SQL: {e}")
                                    # print(f"SQL start: {sql[:100]}...")
                        buffer = []
                    
                    copy_mode = True
                    copy_sql = line
                else:
                    buffer.append(line)
                    # Optimization: execute buffer if it ends with ; and is not inside a function/transaction?
                    # Dumps usually have ; at end of statements.
                    # But functions ($$) can span lines.
                    # Simple heuristic: if line ends with ; and we are not in a $$ block (hard to track).
                    # For safety, let's just accumulate until COPY or end, BUT for large files without COPY, this consumes memory.
                    # Most dumps use COPY for data, so we will hit COPY often.
                    # But schema creation can be huge.
                    
                    # Let's try to execute on every semicolon if it looks safe?
                    # No, splitting SQL correctly is hard.
                    # But pg_dump puts each statement on new lines usually.
                    pass

        # Execute remaining
        if buffer:
            sql = "".join(buffer)
            if sql.strip():
                print("Executing remaining SQL...")
                try:
                    cur.execute(sql)
                except Exception as e:
                    print(f"Error executing remaining SQL: {e}")
                    # print(f"SQL: {sql[:100]}...")

    print("Restore completed.")
    conn.close()

if __name__ == "__main__":
    restore()
