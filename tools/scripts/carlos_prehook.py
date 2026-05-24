import os
import sys
import codecs
import subprocess
from pathlib import Path

# Configurar stdout y stderr para soportar UTF-8 en terminales Windows
if sys.platform.startswith('win'):
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'replace')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'replace')

def run_cmd(cmd):
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True, encoding='utf-8', errors='replace')
        return True, result.stdout.strip()
    except subprocess.CalledProcessError as e:
        return False, (e.stderr.strip() if e.stderr else e.stdout.strip())

def check_git():
    print("🔍 [1/4] Verificando estado de Git...")
    success, branch = run_cmd("git rev-parse --abbrev-ref HEAD")
    if not success:
        print("   ❌ Error al obtener rama de Git.")
        return False

    success, status = run_cmd("git status --porcelain")
    is_clean = len(status) == 0

    print(f"   ✅ Rama actual: '{branch}'")
    if branch != "dev":
        print("   ⚠️ ATENCIÓN: No te encuentras en la rama 'dev'. Verifica si es intencional según las leyes del sistema.")
    
    if is_clean:
        print("   ✅ Working tree: Limpio sin cambios pendientes.")
    else:
        print(f"   ⚠️ Working tree: Modificado ({len(status.splitlines())} archivos sin commitear).")
    return True

def check_env():
    print("\n🔍 [2/4] Verificando variables de entorno...")
    root_path = Path(__file__).resolve().parent.parent.parent
    env_file = root_path / ".env"
    
    if not env_file.exists():
        print("   ❌ No se encontró el archivo .env en la raíz del proyecto.")
        return False
        
    content = env_file.read_text(encoding='utf-8', errors='ignore')
    if "VITE_SUPABASE_PROJECT_ID" in content or "SUPABASE_URL" in content:
        print("   ✅ Variables clave de Supabase encontradas en .env")
        return True
    else:
        print("   ⚠️ ATENCIÓN: Faltan variables de Supabase en .env.")
        return False

def check_laws():
    print("\n🔍 [3/4] Verificando Leyes del Sistema y Contexto (Anti-Desvarío)...")
    root_path = Path(__file__).resolve().parent.parent.parent
    
    critical_files = [
        (".agent/AGENTS.md", "Reglas y Arquitectura de Agentes"),
        ("LEYES_DEL_SISTEMA.md", "Leyes Fundamentales del Proyecto"),
        (".agent/lessons_learned.md", "Lecciones y Anti-patrones Acumulados")
    ]
    
    all_ok = True
    for file_rel, desc in critical_files:
        file_path = root_path / file_rel
        if file_path.exists():
            print(f"   ✅ {desc} ({file_rel}): Presente.")
        else:
            print(f"   ❌ {desc} ({file_rel}): NO ENCONTRADO.")
            all_ok = False
    return all_ok

def print_summary():
    print("\n" + "="*70)
    print("🛡️ CARLOS AI FRAMEWORK — PREHOOK VERIFICATION COMPLETED 🛡️")
    print("="*70)
    print("📋 DIRECTIVA PARA EL AGENTE:")
    print("1. Antes de codificar, asegúrate de haber asimilado las LEYES_DEL_SISTEMA.")
    print("2. Si la tarea es de producto, consulta y mantén apego estricto al PRD_MASTER.")
    print("3. Si NO hay PRD aplicable (tareas ad-hoc, refactor, creación de herramientas):")
    print("   sigue con precisión las instrucciones del usuario y asimila el contexto del código.")
    print("4. NO desvaríes ni alucines terminología ajena al Carlos AI Framework.")
    print("="*70)

def main():
    print("🚀 Iniciando Carlos AI Framework Prehook Tool...\n")
    check_git()
    check_env()
    check_laws()
    print_summary()

if __name__ == "__main__":
    main()
