import sys
import os
from pathlib import Path
from datetime import datetime, timezone, timedelta
import psycopg2

# Add parent path to resolve common modules
PROJECT_ROOT = Path(__file__).parent.parent.parent
sys.path.append(str(PROJECT_ROOT))
sys.path.append(str(PROJECT_ROOT / "scripts" / "sync"))

# Ensure UTF-8 stdout for Windows consoles
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from common.db import get_db_connection

def run_health_audit():
    print("=" * 60)
    print("🛡️ INICIANDO AUDITORÍA DE SALUD Y PRECIOS (CANARY CHECK)")
    print("=" * 60)
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    failures = []
    
    # 1. Verificar última sincronización en price_update_jobs
    print("\n[1/4] Verificando historial de sincronización (price_update_jobs)...")
    cur.execute("""
        SELECT id, status, started_at, completed_at, duration_ms, items_updated, error_log
        FROM public.price_update_jobs
        WHERE source = 'CardKingdom Sync'
        ORDER BY started_at DESC
        LIMIT 1;
    """)
    job = cur.fetchone()
    if not job:
        failures.append("No se encontró ningún registro de CardKingdom Sync en price_update_jobs.")
        print("   ❌ Error: Sin registros de ejecución.")
    else:
        job_id, status, started_at, completed_at, duration_ms, items_updated, error_log = job
        now = datetime.now(timezone.utc)
        age = now - started_at if started_at else timedelta(days=99)
        
        if status != 'completed':
            failures.append(f"El último job ({job_id}) terminó en estado '{status}'. Error: {error_log}")
            print(f"   ❌ Fallo: Estado '{status}'. Log: {error_log}")
        elif age > timedelta(hours=28):
            failures.append(f"La última sincronización exitosa ocurrió hace {age.total_seconds() / 3600:.1f} horas (> 28h).")
            print(f"   ❌ Alerta: Sincronización atrasada ({age.total_seconds() / 3600:.1f}h).")
        else:
            print(f"   ✅ Último job ({job_id[:8]}...): Status='{status}', Items={items_updated}, Duración={duration_ms/1000:.1f}s, Hace={age.total_seconds()/3600:.1f}h.")

    # 2. Verificar productos activos con precio 0 o NULL
    print("\n[2/4] Verificando productos en tienda con precio inválido (0 o NULL)...")
    cur.execute("""
        SELECT COUNT(*) 
        FROM public.products
        WHERE price IS NULL OR price <= 0 OR price_usd IS NULL OR price_usd <= 0;
    """)
    invalid_product_count = cur.fetchone()[0]
    if invalid_product_count > 0:
        failures.append(f"Existen {invalid_product_count} productos en la tienda con precio en cero o NULL.")
        print(f"   ❌ Alerta: {invalid_product_count} productos con precio inválido.")
    else:
        print("   ✅ 0 productos con precio en 0 o NULL.")

    # 3. Verificar cobertura de precios en card_printings
    print("\n[3/4] Verificando cobertura de precios en catálogo (card_printings)...")
    cur.execute("""
        SELECT 
            COUNT(*) AS total_with_scryfall,
            COUNT(*) FILTER (WHERE avg_market_price_usd IS NOT NULL OR avg_market_price_foil_usd IS NOT NULL) AS with_market_price
        FROM public.card_printings
        WHERE scryfall_id IS NOT NULL;
    """)
    total_cards, with_prices = cur.fetchone()
    coverage_pct = (with_prices / total_cards * 100) if total_cards else 0
    print(f"   📊 Cobertura de mercado: {with_prices:,} de {total_cards:,} cartas ({coverage_pct:.1f}%).")
    if coverage_pct < 80.0:
        failures.append(f"La cobertura de precios de mercado es anormalmente baja ({coverage_pct:.1f}% < 80%).")
        print("   ❌ Alerta: Cobertura por debajo del umbral mínimo (80%).")
    else:
        print("   ✅ Cobertura dentro del rango operativo normal (>80%).")

    # 4. Verificar consistencia entre products y card_printings
    print("\n[4/4] Verificando discrepancias graves tienda vs catálogo...")
    cur.execute("""
        SELECT COUNT(*)
        FROM public.products p
        JOIN public.card_printings cp ON p.printing_id = cp.printing_id
        WHERE p.price > 0 
          AND cp.avg_market_price_usd > 0
          AND LOWER(COALESCE(p.finish, 'nonfoil')) NOT IN ('foil', 'etched')
          AND ABS(p.price - cp.avg_market_price_usd) > 0.05;
    """)
    discrepancy_count = cur.fetchone()[0]
    if discrepancy_count > 20:
        failures.append(f"Existen {discrepancy_count} productos desfasados (> $0.05 de diferencia con precio de mercado).")
        print(f"   ⚠️ Advertencia: {discrepancy_count} productos con desfase de precio.")
    else:
        print(f"   ✅ Consistencia de precios óptima ({discrepancy_count} desfases menores/tolerados).")

    cur.close()
    conn.close()

    print("\n" + "=" * 60)
    if failures:
        print("🚨 AUDITORÍA FINALIZADA CON FALLOS:")
        for f in failures:
            print(f"   - {f}")
        print("=" * 60)
        sys.exit(1)
    else:
        print("🎉 AUDITORÍA FINALIZADA: SISTEMA DE PRECIOS 100% SALUDABLE")
        print("=" * 60)
        sys.exit(0)

if __name__ == "__main__":
    run_health_audit()
