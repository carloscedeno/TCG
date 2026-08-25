# 🧠 SESSION STATE — TCG Hub

> Agente: leer al INICIO de cada sesión. Actualizar al FINAL antes de cerrar.
> Máximo 60 líneas. Si crece, comprimir.

---

## 📅 Última sesión: 2026-08-25
**Rama activa:** `dev`
**Último commit conocido:** feat(cron): update Odoo sync schedule to 8am, 11am, 1pm, and 5pm VET
**En progreso:** Automatizaciones de Odoo, Sincronización de Tasas Múltiples (BCV/Binance).

## 📁 Zona Caliente (archivos tocados recientemente)
- supabase/functions/odoo-invite/index.ts — Corrección de seguridad (eliminado webhook secret quemado)
- supabase/migrations/20260825002900_update_bcv_cron.sql — Cron job para sincronización en horario comercial
- supabase/functions/odoo-bcv-sync/index.ts — Sincronizador de tasas Oficial/Binance con Odoo

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
