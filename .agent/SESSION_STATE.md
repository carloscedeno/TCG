# 🧠 SESSION STATE — TCG Hub

> Agente: leer al INICIO de cada sesión. Actualizar al FINAL antes de cerrar.
> Máximo 60 líneas. Si crece, comprimir.

---

## 📅 Última sesión: 2026-11-23 (Promoción DEV → PROD, Reset Inventario/Ventas, Flujo Tripartito E2E & CI Cron Fix)
**Rama activa:** dev (sincronizada 1:1 con `main`)
**Estado:** Producción (`sxuotvogwvmxuvwbsscv`) y Desarrollo (`bqfkqnnostzaqueujdms`) 100% operativos, verificados E2E.
- **Respaldo & Reset PROD**: Exportadas órdenes, ítems, productos y accesorios a CSV (`docs/reports/`, protegidos por `.gitignore`) y vaciadas tablas transaccionales conservando `cards`, `card_printings`, `sets` y `profiles`.
- **Migraciones & Índices PROD**: Aplicadas las 8 migraciones pendientes (`20260825015900` a `20261121000002`, incluyendo `idx_card_printings_api_source_id`, agrupación por carta + juego, RLS hardening, `get_order_tracking` y flexibilización de `fn_validate_tcg_attributes`).
- **Cloudflare Pages Fix (`pnpm v9`)**: Eliminado `frontend/pnpm-workspace.yaml` inválido y sincronizado `frontend/pnpm-lock.yaml` con `pnpm v9.15.9 --frozen-lockfile`.
- **Flujo Tripartito E2E & Moneda USD en Odoo**: Desplegados `sortswift-sync` (`v1`), `odoo-sync` (`v11`, lista de precios `Por defecto` forzada a `USD` / `$`) y `odoo-webhook` (restock automático en cancelación). Probados ciclos completos `SS ↔ Página ↔ Odoo` (Commit + `/return` y Cancel + Release).
- **CI Cron Workflows (`sortswift-sync.yml` & `verify_sync_health.py`)**: `sortswift-sync.yml` ahora invoca la Edge Function `sortswift-sync` (`v4.0`) en `12.7s` (`4,054` SKUs en paridad) y `verify_sync_health.py` excluye `p.sortswift_id IS NULL` en la auditoría de precios CardKingdom.

## 📁 Zona Caliente (archivos tocados recientemente)
- `supabase/functions/odoo-sync/index.ts` & `odoo-webhook/index.ts` — Moneda USD (`pricelist_id: 1, currency_id: 1`) y restock en cancelación SortSwift.
- `supabase/migrations/20261121000002_add_card_printings_api_source_id_index.sql` — Índice `idx_card_printings_api_source_id` y `fn_validate_tcg_attributes`.
- `.github/workflows/sortswift-sync.yml` & `deploy-functions.yml` — Cron conectado a Edge Function `sortswift-sync` v4.0.
- `scripts/sync/verify_sync_health.py` — Exclusión de ítems SortSwift en Canary check de CardKingdom.
- `frontend/src/components/Admin/SortSwiftSyncModal.tsx` — Detección dinámica de nodo `PROD` / `DEV`.

## ⏭️ Próxima acción recomendada
1. Retirar las rutas `geekorium.shop/*` del Worker `maintenance-geekorium` en Cloudflare cuando se desee abrir la tienda al público.
2. Monitorear las primeras órdenes reales en Producción (`S00038+` en Odoo ERP).

## 🚫 Restricciones activas
- NO usar `npm` — solo `pnpm`
- NO modificar PROD sin backup explícito
- NO tocar `create_order_atomic` RPC sin migration
- Entorno DEV: proyecto Supabase `bqfkqnnostzaqueujdms`
- Entorno PROD: proyecto Supabase `sxuotvogwvmxuvwbsscv`

## 🗺️ Knowledge Graph
- Graphify instalado: ✅ `graphify 0.8.35` (`graphify-out/graph.json`)

## ✅ Features estables (no tocar sin razón)
- Flujo Tripartito E2E (`SortSwift ↔ Supabase PROD ↔ Odoo ERP` en `USD`)
- Batería de pruebas `/pruebame` (`run_tests.ps1`)
