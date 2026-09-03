# 🧠 SESSION STATE — TCG Hub

> Agente: leer al INICIO de cada sesión. Actualizar al FINAL antes de cerrar.
> Máximo 60 líneas. Si crece, comprimir.

---

## 📅 Última sesión: 2026-09-02
**Rama activa:** `dev` (sincronizada con `main` producida)
**Último commit conocido:** de5ca997 (fix: silence harmless AbortError logs) y 5a49fb18 (merge main release)
**En progreso:** Sesión finalizada con éxito. Descuentos masivos por Tipo/Rareza probados y desplegados a producción.

## 📁 Zona Caliente (archivos tocados recientemente)
- frontend/src/components/Admin/BulkRarityOfferModal.tsx — Rediseño para soporte de filtro por Tipo de Carta y Rareza
- frontend/src/pages/Admin/InventoryPage.tsx — Controles de filtrado por Rareza y Tipo en barra de administración
- frontend/src/pages/Home.tsx — Acceso rápido % Oferta y manejo de iconos
- frontend/src/utils/api.ts — Actualización de RPCs, sanitización de UUIDs e ignorado de AbortError
- supabase/migrations/20260902000000_bulk_offers_by_type.sql — Migración RPC ofertas masivas por tipo
- supabase/migrations/20260902000001_inventory_list_filters.sql — Migración RPC filtro inventario
- supabase/migrations/20260902000002_fix_get_products_filtered_null_end_date.sql — Migración RPC catálogo con ofertas permanentes

## ⏭️ Próxima acción recomendada
Monitorear el uso de ofertas masivas en producción y continuar con las siguientes características planificadas.

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
