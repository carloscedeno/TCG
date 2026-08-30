# 🧠 SESSION STATE — TCG Hub

> Agente: leer al INICIO de cada sesión. Actualizar al FINAL antes de cerrar.
> Máximo 60 líneas. Si crece, comprimir.

---

## 📅 Última sesión: 2026-08-30
**Rama activa:** `dev`
**Último commit conocido:** ed9166cf (style: remove inventory movements from profile view)
**En progreso:** Sesión finalizada con éxito. Todos los cambios probados y desplegados en `dev`.

## 📁 Zona Caliente (archivos tocados recientemente)
- frontend/src/components/Profile/DebtsList.tsx — Vista interactiva de Cuentas Pendientes
- frontend/src/pages/Profile.tsx — Integración de Cuentas por Pagar y remoción de movimientos
- frontend/src/pages/TournamentHub.tsx — Corrección de contraste en modo claro
- supabase/functions/odoo-event-sync/index.ts — Webhook sincronizador Odoo -> Supabase DEV

## ⏭️ Próxima acción recomendada
Realizar pruebas de usuario en la Preview de `dev` (Cloudflare Pages) sobre la creación de eventos en Odoo y consulta de deudas en perfil.

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
