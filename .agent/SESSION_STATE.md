# 🧠 SESSION STATE — TCG Hub

> Agente: leer al INICIO de cada sesión. Actualizar al FINAL antes de cerrar.
> Máximo 60 líneas. Si crece, comprimir.

---

## 📅 Última sesión: 2026-11-21 (Release DEV → PROD + Reset Inventario/Ventas PROD)
**Rama activa:** dev (sincronizada con `main`)
**Estado:** Promoción completa de `dev` a `main` (PROD `sxuotvogwvmxuvwbsscv`).
- **Respaldo y Reset en PROD**: Exportadas 228 órdenes (`1,441` ítems), `21,418` productos y `182` accesorios a CSV en `docs/reports/` (ignorados por git). Vaciadas transaccionalmente `orders`, `order_items`, `carts`, `cart_items`, `products`, `inventory_logs`, `product_offers_history`, `accessories` y `accessories_history`. Catálogo base (`cards`, `card_printings`, `sets`) y `profiles` intactos.
- **Migraciones y Configuración PROD**: Aplicadas las 7 migraciones pendientes (`20260825015900` a `20261121000001`, incluyendo `sortswift_reservation_id`, agrupación de catálogo por carta + juego, RLS hardening, `get_order_tracking` y `trg_prevent_role_escalation`) y sincronizadas claves de `public.system_config` (`SORTSWIFT_API_KEY`, `GITHUB_TOKEN`, `CLOUDFLARE_*`).
- **Edge Functions & Release**: Desplegada `sortswift-sync` en PROD, actualizado `.github/workflows/deploy-functions.yml` para desplegar `api`, `tcg-api`, `odoo-webhook`, `odoo-sync`, `sortswift-sync` y `odoo-polling`, y promovido `dev` → `main` (`git push origin main`).

## 📁 Zona Caliente (archivos tocados recientemente)
- `.github/workflows/deploy-functions.yml` — Despliegue automatizado de todas las Edge Functions activas a PROD.
- `supabase/migrations/20261119000001_group_products_by_card_name.sql` & `20261121000001_security_hardening_rls_and_orders.sql` — Aplicadas en DEV y PROD.
- `supabase/functions/sortswift-sync/index.ts`, `odoo-sync/index.ts`, `odoo-webhook/index.ts` — Sincronización tripartita SortSwift + Supabase + Odoo ERP.
- `frontend/src/pages/OrderTrackingPage.tsx` & `frontend/public/_headers` — Tracking seguro y cabeceras HTTP en producción.

## ⏭️ Próxima acción recomendada
1. Ejecutar sincronización de inventario nuevo en PROD (desde el botón Matrix de SortSwift en Admin o script/Edge Function `sortswift-sync`).
2. Verificar `geekorium.pages.dev` / `geekorium.shop` y desactivar las rutas del Worker `maintenance-geekorium` en Cloudflare cuando el inventario esté cargado.

## 🚫 Restricciones activas
- NO usar `npm` — solo `pnpm`
- NO modificar PROD sin backup explícito
- NO tocar `create_order_atomic` RPC sin migration
- Entorno DEV: proyecto Supabase `bqfkqnnostzaqueujdms` (Pooler: `aws-1-us-west-2.pooler.supabase.com`)
- Entorno PROD: proyecto Supabase `sxuotvogwvmxuvwbsscv`

## 🗺️ Knowledge Graph
- Graphify instalado: ✅ `graphify 0.8.35`
- Grafo construido: ✅ `graphify-out/graph.json`
- Comando para actualizar: `graphify update .`

## ✅ Features estables (no tocar sin razón)
- Sincronizador Dual USD/USB (BCV/Binance) para Odoo mediante pg_cron.
- Corrección de zona horaria de eventos (Caracas UTC-4)
- Checkout E2E + WhatsApp flow & SortSwift 60m Hold
- Bulk Import (cartas y accesorios) & Descuentos con fechas NULL
- Carrito unificado (auth + guest) & Tracking seguro (`get_order_tracking`)
- Batería de pruebas `/pruebame` (`run_tests.ps1`)
