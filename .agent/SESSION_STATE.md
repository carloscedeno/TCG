# 🧠 SESSION STATE — TCG Hub

> Agente: leer al INICIO de cada sesión. Actualizar al FINAL antes de cerrar.
> Máximo 60 líneas. Si crece, comprimir.

---

## 📅 Última sesión: 2026-09-09
**Rama activa:** `dev` (sincronizada y desplegada a `dev` y `main`)
**Último commit conocido:** 85f512ad (fix(sync): bulletproof CardKingdom price sync and add automated canary health check)
**En progreso:** Sincronizador de precios y stock blindado y desplegado a producción (`main`). Eliminado el bug de 800 cartas en `ck_sync.py`, creados índices en `price_history`, implementado Direct Values Engine (16s de ejecución), saneados 4,361 precios de tienda y añadido Canary Health Check en GitHub Actions.

## 📁 Zona Caliente (archivos tocados recientemente)
- `scripts/sync/mtg/ck_sync.py` — Motor Direct Values, circuit breakers anti-cero, sin cuellos de botella.
- `scripts/sync/verify_sync_health.py` — Auditoría automática Canary Check (exit code 0).
- `.github/workflows/ck-sync.yml` — Flujo de GitHub Actions con canary audit automático.
- `scripts/sync_cardkingdom_api.py` — Delegación unificada a `ck_sync.py`.

## ⏭️ Próxima acción recomendada
Realizar commit y push de las mejoras a la rama `dev` para que el flujo de GitHub Actions quede actualizado.

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
