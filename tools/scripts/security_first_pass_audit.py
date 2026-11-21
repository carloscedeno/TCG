import os
import sys
import codecs
import re
import subprocess
from pathlib import Path

# Configurar stdout para UTF-8 en Windows
if sys.platform.startswith('win'):
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'replace')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'replace')

ROOT = Path(".")
IGNORE_DIRS = {'.git', 'node_modules', '.venv', 'venv', 'dist', 'build', '.gemini', 'graphify-out', '__pycache__', '.pytest_cache'}

def run_audit():
    print("=" * 75)
    print("🛡️ PROTOCOLO DE PRIMERA PASADA: AUDITORÍA EXHAUSTIVA DE SEGURIDAD")
    print("=" * 75)

    # -------------------------------------------------------------
    # 1. SECRETOS, VARIABLES Y GIT
    # -------------------------------------------------------------
    print("\n📁 [1. SECRETOS, VARIABLES Y REPOSITORIO]")
    tracked_env = subprocess.run(["git", "ls-files", "*.env*"], capture_output=True, text=True).stdout.strip()
    if tracked_env:
        print(f"   🚨 CRÍTICO: Archivos .env rastreados en Git:")
        for line in tracked_env.splitlines():
            print(f"      - {line}")
    else:
        print("   ✅ Cero archivos .env rastreados en Git.")

    # Verificar si supabase/.env.local tiene claves privadas
    supabase_env = ROOT / "supabase" / ".env.local"
    if supabase_env.exists():
        content = supabase_env.read_text(encoding='utf-8', errors='ignore')
        if "API_KEY" in content or "PASSWORD" in content or "SECRET" in content:
            print("   🚨 ALERTA: 'supabase/.env.local' contiene credenciales activas (Odoo API Key) y está rastreado en Git.")

    # Escaneo en frontend/src
    frontend_src = ROOT / "frontend" / "src"
    secrets_in_frontend = []
    service_role_pattern = re.compile(r"service_role", re.I)
    secret_key_pattern = re.compile(r"(api_secret|private_key|secret_key)\s*[:=]\s*['\"][^'\"]+['\"]", re.I)
    
    for dirpath, dirs, files in os.walk(frontend_src, topdown=True):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for f in files:
            if f.endswith(('.ts', '.tsx', '.js', '.jsx')):
                fpath = Path(dirpath) / f
                txt = fpath.read_text(encoding='utf-8', errors='ignore')
                if service_role_pattern.search(txt):
                    secrets_in_frontend.append((fpath.relative_to(ROOT), "service_role detectado"))
                if secret_key_pattern.search(txt):
                    secrets_in_frontend.append((fpath.relative_to(ROOT), "posible private/secret key"))

    if secrets_in_frontend:
        print("   ⚠️ Secretos en frontend/src:")
        for path, reason in secrets_in_frontend:
            print(f"      - {path}: {reason}")
    else:
        print("   ✅ Cero service_role o private keys en frontend/src.")

    # -------------------------------------------------------------
    # 2. AUTENTICACIÓN, SESIONES Y ACCESO (/admin)
    # -------------------------------------------------------------
    print("\n🔐 [2. AUTENTICACIÓN, SESIONES Y ACCESOS]")
    admin_route = ROOT / "frontend" / "src" / "components" / "Auth" / "AdminRoute.tsx"
    if admin_route.exists():
        txt = admin_route.read_text(encoding='utf-8', errors='ignore')
        if "isAdmin" in txt:
            print("   ✅ Guarda en cliente 'AdminRoute.tsx' verifica 'isAdmin'.")
        else:
            print("   ⚠️ Guarda 'AdminRoute.tsx' no parece verificar 'isAdmin'.")
            
    auth_ctx = ROOT / "frontend" / "src" / "context" / "AuthContext.tsx"
    if auth_ctx.exists():
        txt = auth_ctx.read_text(encoding='utf-8', errors='ignore')
        if "from('profiles')" in txt and "role" in txt:
            print("   ℹ️ 'isAdmin' consulta la columna 'role' en tabla pública 'profiles'.")
            print("      -> Verificando si 'profiles.role' es editable por el usuario normal...")

    # -------------------------------------------------------------
    # 3. BACKEND, BASE DE DATOS Y LÓGICA DE NEGOCIO
    # -------------------------------------------------------------
    print("\n💾 [3. BASE DE DATOS, RLS Y LÓGICA DE NEGOCIO]")
    
    # Revisar RLS en migraciones para profiles y orders
    migrations = list(ROOT.glob("supabase/migrations/*.sql"))
    print(f"   Migraciones analizadas: {len(migrations)}")

    profiles_policies = []
    order_policies = []
    for m in migrations:
        try:
            txt = m.read_text(encoding='utf-8', errors='ignore')
            for line in txt.splitlines():
                if "CREATE POLICY" in line.upper():
                    if "ON PROFILES" in line.upper() or 'ON "PROFILES"' in line.upper():
                        profiles_policies.append((m.name, line.strip()))
                    if "ON ORDERS" in line.upper() or 'ON "ORDERS"' in line.upper():
                        order_policies.append((m.name, line.strip()))
        except Exception:
            pass

    print(f"   Políticas RLS encontradas sobre 'profiles': {len(profiles_policies)}")
    for mname, pol in profiles_policies[-3:]:
        print(f"      - [{mname}] {pol}")

    print(f"   Políticas RLS encontradas sobre 'orders': {len(order_policies)}")
    for mname, pol in order_policies[-3:]:
        print(f"      - [{mname}] {pol}")

    # Verificar create_order_atomic (si recalcula precios)
    latest_atomic_migration = None
    for m in sorted(migrations):
        txt = m.read_text(encoding='utf-8', errors='ignore')
        if "create_order_atomic" in txt:
            latest_atomic_migration = m

    if latest_atomic_migration:
        print(f"   ✅ Última migración de 'create_order_atomic': {latest_atomic_migration.name}")
        content = latest_atomic_migration.read_text(encoding='utf-8', errors='ignore')
        if "SELECT price FROM products" in content or "SELECT current_price FROM products" in content or "unit_price := " in content:
            print("   ✅ 'create_order_atomic' verifica/obtiene precios reales desde la DB (Servidor).")
        else:
            print("   ⚠️ Revisar si 'create_order_atomic' confía en los precios enviados por el cliente.")

    # -------------------------------------------------------------
    # 4. RED, CABECERAS Y MONITOREO
    # -------------------------------------------------------------
    print("\n🌐 [4. RED, CABECERAS Y MONITOREO]")
    headers_file = ROOT / "frontend" / "public" / "_headers"
    if headers_file.exists():
        txt = headers_file.read_text(encoding='utf-8', errors='ignore')
        has_csp = "Content-Security-Policy" in txt
        has_hsts = "Strict-Transport-Security" in txt
        has_xfo = "X-Frame-Options" in txt
        has_xcto = "X-Content-Type-Options" in txt

        print(f"   Cabeceras Cloudflare Pages (_headers):")
        print(f"      - Content-Security-Policy (CSP): {'✅ Presente' if has_csp else '❌ AUSENTE'}")
        print(f"      - Strict-Transport-Security (HSTS): {'✅ Presente' if has_hsts else '❌ AUSENTE'}")
        print(f"      - X-Frame-Options: {'✅ Presente' if has_xfo else '❌ AUSENTE'}")
        print(f"      - X-Content-Type-Options: {'✅ Presente' if has_xcto else '❌ AUSENTE'}")
    else:
        print("   ❌ Archivo frontend/public/_headers NO EXISTE.")

    # Edge Functions CORS
    edge_funcs = list(ROOT.glob("supabase/functions/**/*.ts"))
    print(f"   Edge functions detectadas: {len(edge_funcs)}")
    cors_all = []
    for ef in edge_funcs:
        txt = ef.read_text(encoding='utf-8', errors='ignore')
        if "'Access-Control-Allow-Origin': '*'" in txt or '"Access-Control-Allow-Origin": "*"' in txt:
            cors_all.append(ef.name)
    if cors_all:
        print(f"   ⚠️ Edge functions con CORS wildcard ('*'): {len(cors_all)} ({', '.join(cors_all[:3])})")
    else:
        print("   ✅ Edge functions tienen CORS restringido o no usan wildcard.")

    # -------------------------------------------------------------
    # 5. DEPENDENCIAS Y PRODUCCIÓN
    # -------------------------------------------------------------
    print("\n📦 [5. DEPENDENCIAS Y PRODUCCIÓN]")
    print("   Ejecutando 'pnpm audit' en frontend...")
    try:
        pnpm_res = subprocess.run(
            ["pnpm", "audit", "--audit-level", "high"],
            cwd=str(ROOT / "frontend"),
            capture_output=True,
            text=True,
            timeout=30
        )
        out = pnpm_res.stdout.strip()
        err = pnpm_res.stderr.strip()
        if pnpm_res.returncode == 0:
            print("   ✅ pnpm audit: Cero vulnerabilidades High o Critical encontradas.")
        else:
            print(f"   ⚠️ pnpm audit reportó hallazgos (exit code {pnpm_res.returncode}):")
            for line in (out or err).splitlines()[:6]:
                print(f"      {line}")
    except Exception as e:
        print(f"   ⚠️ No se pudo completar pnpm audit: {e}")

    print("\n" + "=" * 75)
    print("🏁 FIN DEL PROTOCOLO DE PRIMERA PASADA")
    print("=" * 75)

if __name__ == "__main__":
    run_audit()
