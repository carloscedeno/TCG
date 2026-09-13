# 🧠 SESSION STATE — TCG Hub

> Agente: leer al INICIO de cada sesión. Actualizar al FINAL antes de cerrar.
> Máximo 60 líneas. Si crece, comprimir.

---

## 📅 Última sesión: 2026-09-13
**Rama activa:** `dev` (sincronizada con `main`)
**Último commit conocido:** e734a2d0
**En progreso:** Resolución de alerta en GitHub Actions (#88). La sincronización funcionó correctamente (3,956 ítems actualizados en 68s), pero el Canary Check detectó 3 productos nuevos agregados manualmente sin la columna `price_usd`. Se aplicó trigger de base de datos `trg_sync_product_prices` para mantener sincronizados `price` y `price_usd` permanentemente, y paso de auto-sanación en `ck_sync.py`.

## 📁 Zona Caliente (archivos tocados recientemente)
- `scripts/sync/mtg/ck_sync.py` — Auto-sanación integrada de consistencia `price`/`price_usd`.
- `supabase/migrations/20260913094500_sync_product_prices_trigger.sql` — Trigger Postgres en `products`.
- `scripts/sync/verify_sync_health.py` — Canary Check verificado (100% pasando).

## ⏭️ Próxima acción recomendada
Desplegar commit a `dev` y `main` y re-ejecutar el workflow de GitHub Actions.

## 🚫 Restricciones activas
- NO usar `npm` — solo `pnpm`
- NO modificar PROD sin backup explícito
- NO tocar `create_order_atomic` RPC sin migration
- Entorno DEV: proyecto Supabase `bqfkqnnostzaqueujdms`
- Entorno PROD: proyecto Supabase `sxuotvogwvmxuvwbsscv`

## 🗺️ Knowledge Graph
- Graphify instalado: ✅ `graphify 0.8.35`
- Grafo construido: ✅ `graphify-out/graph.json`
- God nodes: `useAuth()` (29 aristas), `useCart()` (17 aristas), `CardProps` (7 aristas)
- Comando para actualizar: `graphify update frontend/src --no-viz`

## ✅ Features estables (no tocar sin razón)
- Sincronizador Dual USD/USB (BCV/Binance) para Odoo mediante pg_cron.
- Corrección de zona horaria de eventos (Caracas UTC-4)
- Checkout E2E + WhatsApp flow
- Bulk Import (cartas y accesorios)
- Sistema de descuentos con fechas NULL
- Carrito unificado (auth + guest)
- Libreta de Direcciones Múltiples (Envío/Facturación)
- Filtros y estimaciones de preventa en el historial de órdenes
