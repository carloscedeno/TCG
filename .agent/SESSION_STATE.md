# 🧠 SESSION STATE — TCG Hub

> Agente: leer al INICIO de cada sesión. Actualizar al FINAL antes de cerrar.
> Máximo 60 líneas. Si crece, comprimir.

---

## 📅 Última sesión: 2026-11-07
**Rama activa:** dev
**En progreso:** Suite E2E completa de 3 tests completada y verificada al 100% en DEV (`scripts/tests/e2e_full_checkout_sortswift_test.py`). Flujo gobernado por la Web:
1. Web Checkout -> Hold temporal 60m en SortSwift (`order_items.sortswift_reservation_id`) -> Bloqueo web stock a 0 -> Odoo SO creada.
2. Odoo Factura Pagada/Entrega -> Webhook confirma en DB -> Commit permanente en SortSwift (carta removida de inventario físico).
3. Odoo Cancelación -> Webhook libera hold en SortSwift (`reservedQuantity` vuelve a 0) -> Orden cancelada en DB.
4. Venta Directa en Tienda (POS Odoo) -> Picking Done -> Deducción directa física inmediata en SortSwift.
Solucionada condición de carrera en webhook de `sale.order` para proteger items y reservas web. Build de frontend verificado sin errores.

## 📁 Zona Caliente (archivos tocados recientemente)
- supabase/functions/odoo-sync/index.ts — Hook de reserva física en SortSwift al crear orden de compra web.
- supabase/functions/odoo-webhook/index.ts — Protección de items web frente a sobreescritura de Odoo; Hooks de commit y release de SortSwift.
- scripts/sync/common/sortswift_client.py — Cliente SortSwift Python con métodos `reserve_card`, `commit_reservation`, `release_reservation`, `deduct_card`, `reset_sandbox`.
- scripts/tests/e2e_full_checkout_sortswift_test.py — Suite automatizada de pruebas E2E (3/3 pasando 100%).
- frontend/src/utils/api.ts — Normalización de variantes y sanitización de finish.

## ⏭️ Próxima acción recomendada
Verificar en el catálogo/admin de DEV (dev.geekorium.shop / /admin/inventory) la visualización de las cartas sincronizadas con su coordenada física y costo.
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
