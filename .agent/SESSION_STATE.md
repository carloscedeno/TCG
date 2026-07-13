# 🧠 SESSION STATE — TCG Hub

> Agente: leer al INICIO de cada sesión. Actualizar al FINAL antes de cerrar.
> Máximo 60 líneas. Si crece, comprimir.

---

## 📅 Última sesión: 2026-07-13
**Rama activa:** `dev`
**Último commit conocido:** fix: resolve initial card flip issue on Card Details by preserving card_faces from router state
**En progreso:** Corrección de la carga inicial de imágenes flip (Doble Cara) en los detalles de producto.

## 📁 Zona Caliente (archivos tocados recientemente)
- frontend/src/pages/RankingsPage.tsx — Modal para selección dinámica de temporada de ranking de TCG.
- supabase/functions/odoo-sync/index.ts — Enviar client_order_ref a Odoo y buscar accesorios por odoo_id.
- supabase/functions/odoo-webhook/index.ts — Recibir webhooks de sale.order y actualizar status de orders en supabase.
- frontend/src/utils/api.ts — Trigger de odoo-sync en checkout.

## ⏭️ Próxima acción recomendada
Validar el nuevo webhook de sale.order desde Odoo cuando el administrador apruebe crear la Acción Automatizada en Odoo. Probar el flujo end-to-end de compras.

## 🚫 Restricciones activas
- NO usar `npm` — solo `pnpm`
- NO modificar PROD sin backup explícito
- NO tocar `create_order_atomic` RPC sin migration
- Entorno DEV: proyecto Supabase `bqfkqnnostzaqueujdms`
- Entorno PROD: proyecto Supabase `sxuotvogwvmxuvwbsscv`

## 🗺️ Knowledge Graph
- Graphify instalado: ✅ `graphify 0.8.35`
- Grafo construido: ✅ `graphify-out/graph.json` (299 nodos, 595 aristas, 11 comunidades)
- God nodes: `useAuth()` (29 aristas), `useCart()` (17 aristas), `CardProps` (7 aristas)
- Última actualización del grafo: 2026-06-12 (mediante post-commit hook)
- Comando para actualizar: `graphify update frontend/src --no-viz`

## ✅ Features estables (no tocar sin razón)
- Corrección de zona horaria de eventos (Caracas UTC-4)
- Checkout E2E + WhatsApp flow
- Bulk Import (cartas y accesorios)
- Sistema de descuentos con fechas NULL
- Carrito unificado (auth + guest)
- Libreta de Direcciones Múltiples (Envío/Facturación)
- Identificadores de jugador TCG (Wizards, Pokémon, Bandai) en perfil
- Filtros y estimaciones de preventa en el historial de órdenes
