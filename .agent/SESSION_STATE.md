# 🧠 SESSION STATE — TCG Hub

> Agente: leer al INICIO de cada sesión. Actualizar al FINAL antes de cerrar.
> Máximo 60 líneas. Si crece, comprimir.

---

## 📅 Última sesión: 2026-08-23
**Rama activa:** `dev`
**Último commit conocido:** feat(odoo): add Edge Function odoo-bcv-sync for automated dual-rate BCV/Binance synchronization
**En progreso:** Automatizaciones de Odoo, Sincronización de Tasas.

## 📁 Zona Caliente (archivos tocados recientemente)
- supabase/functions/odoo-bcv-sync/index.ts — Sincronizador de tasas Oficial/Binance con Odoo
- supabase/migrations/20260823024800_bcv_cron.sql — Tarea programada (pg_cron)
- supabase/functions/odoo-sync/index.ts — Lógica base de conexión Odoo RPC

## ⏭️ Próxima acción recomendada
Realizar compra de prueba desde el Frontend en modo local asegurando que la tasa USB y USD se apliquen correctamente tras la sincronización del Odoo.

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
