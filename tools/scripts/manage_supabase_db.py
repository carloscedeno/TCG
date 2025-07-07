#!/usr/bin/env python3
"""
Script maestro para gestionar la base de datos de Supabase:
- Migraciones
- Seeds
- Reset
- Estado
- Despliegue de funciones

Uso:
    python manage_supabase_db.py migrate   # Aplica todas las migraciones
    python manage_supabase_db.py seed      # Ejecuta los seeds
    python manage_supabase_db.py reset     # Resetea la base de datos y aplica migraciones + seeds
    python manage_supabase_db.py status    # Muestra el estado de la base de datos
    python manage_supabase_db.py deploy    # Despliega funciones y migraciones
    python manage_supabase_db.py help      # Muestra esta ayuda

Requiere tener la CLI de Supabase instalada y configurada.
"""
import subprocess
import sys
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
MIGRATIONS = ROOT / 'docs' / 'TechDocs' / 'database' / 'migrations'
SEEDS = ROOT / 'docs' / 'TechDocs' / 'database' / 'seeds'
SUPABASE_DIR = ROOT / 'supabase'

# Utilidad para ejecutar comandos de shell
def run(cmd, cwd=ROOT, check=True):
    print(f"\n$ {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    result = subprocess.run(cmd, cwd=cwd, shell=isinstance(cmd, str), check=check)
    return result.returncode

def migrate():
    print("==> Aplicando migraciones SQL...")
    for sql_file in sorted(MIGRATIONS.glob('*.sql')):
        print(f"  Ejecutando: {sql_file.name}")
        run(["supabase", "db", "query", str(sql_file)])
    print("==> Migraciones completadas.")

def seed():
    print("==> Ejecutando seeds SQL...")
    for sql_file in sorted(SEEDS.glob('*.sql')):
        print(f"  Ejecutando: {sql_file.name}")
        run(["supabase", "db", "query", str(sql_file)])
    print("==> Seeds completados.")

def reset():
    print("==> Reseteando la base de datos Supabase...")
    run(["supabase", "db", "reset"])
    migrate()
    seed()
    print("==> Reset y carga inicial completados.")

def status():
    print("==> Estado de la base de datos Supabase:")
    run(["supabase", "db", "status"])

def deploy():
    print("==> Desplegando funciones y migraciones a Supabase...")
    run(["supabase", "functions", "deploy", "tcg-api"])
    run(["supabase", "db", "push"])
    print("==> Despliegue completado.")

def help():
    print(__doc__)

def main():
    if len(sys.argv) < 2:
        help()
        sys.exit(1)
    cmd = sys.argv[1].lower()
    if cmd == 'migrate':
        migrate()
    elif cmd == 'seed':
        seed()
    elif cmd == 'reset':
        reset()
    elif cmd == 'status':
        status()
    elif cmd == 'deploy':
        deploy()
    elif cmd == 'help':
        help()
    else:
        print(f"Comando desconocido: {cmd}")
        help()
        sys.exit(1)

if __name__ == "__main__":
    main() 