import gzip
import re
import os

input_file = 'db_cluster-16-07-2025@13-32-15.backup.gz'
output_dir = 'supabase/migrations'
output_file = os.path.join(output_dir, '20250716133215_imported_backup.sql')

# Ensure output directory exists
os.makedirs(output_dir, exist_ok=True)

print(f"Processing {input_file} -> {output_file}...")

system_schemas = {
    'auth', 'extensions', 'graphql', 'graphql_public', 'pgbouncer', 
    'realtime', 'storage', 'supabase_functions', 'vault'
}

with gzip.open(input_file, 'rt', encoding='utf-8', errors='ignore') as fin, \
     open(output_file, 'w', encoding='utf-8') as fout:
    
    started = False
    for line in fin:
        # Skip until we connect to the postgres database
        if not started:
            if line.strip() == '\\connect postgres':
                started = True
            continue
        
        stripped = line.strip()
        
        # Skip the connect line itself
        if stripped.startswith('\\connect'):
            continue

        # Skip ownership changes
        if 'OWNER TO' in line:
            continue
            
        # Skip Create/Alter/Drop Role
        if stripped.startswith('CREATE ROLE') or stripped.startswith('ALTER ROLE') or stripped.startswith('DROP ROLE'):
            continue
        
        # Skip CREATE SCHEMA for system schemas
        # Format: CREATE SCHEMA auth;
        if stripped.startswith('CREATE SCHEMA'):
            schema_name = stripped.split()[2].rstrip(';')
            if schema_name in system_schemas:
                fout.write(f"-- {line}")
                continue

        # Skip CREATE EXTENSION (Supabase manages these, usually)
        # But if we keep them, ensure IF NOT EXISTS is there (it usually is in dumps)
        # If the dump has CREATE EXTENSION without IF NOT EXISTS, we might have issues.
        # The dump I saw had IF NOT EXISTS.
        
        # Skip COMMENT ON EXTENSION (harmless but noisy)
        if stripped.startswith('COMMENT ON EXTENSION'):
            fout.write(f"-- {line}")
            continue

        # Skip COPY for system tables that are read-only or managed
        if stripped.startswith('COPY auth.schema_migrations'):
            fout.write(f"-- Skipped {stripped}\n")
            # Consume lines until \.
            for subline in fin:
                if subline.strip() == r'\.':
                    break
            continue
            
        # Skip DDL for auth schema (managed by Supabase)
        # We can't modify auth schema structure, only data.
        # Patterns to skip: CREATE TABLE auth., ALTER TABLE auth., CREATE INDEX ... ON auth.
        # Note: pg_dump might use "auth".
        is_auth_ddl = False
        lower_line = stripped.lower()
        if (lower_line.startswith('create table auth.') or lower_line.startswith('create table "auth".') or
            lower_line.startswith('alter table auth.') or lower_line.startswith('alter table "auth".') or
            ' on auth.' in lower_line or ' on "auth".' in lower_line):
            is_auth_ddl = True
        
        if is_auth_ddl:
            fout.write(f"-- Skipped DDL: {stripped}\n")
            # If statement doesn't end with ;, skip until it does
            if not stripped.endswith(';'):
                for subline in fin:
                    if subline.strip().endswith(';'):
                        break
            continue

        fout.write(line)

print("Done.")
