# 🧠 SESSION STATE — TCG Hub

> Agente: leer al INICIO de cada sesión. Actualizar al FINAL antes de cerrar.
> Máximo 60 líneas. Si crece, comprimir.

---

## 📅 Última sesión: 2026-10-26
**Rama activa:** `dev`
**Último commit conocido:** 7f001361
**En progreso:** Endurecimiento de Seguridad (Security Hardening). Neutralizadas RPCs críticas `run_migration_sql` y `make_admin_by_email` en DEV y PROD. RLS forzado en `user_collections`. Parcheadas vulnerabilidades críticas en frontend (`handlebars@4.7.10`, `vite@7.3.7`). Desindexado `.env.prod` de Git y reforzado `.gitignore`.

## 📁 Zona Caliente (archivos tocados recientemente)
- `frontend/package.json` & `frontend/pnpm-lock.yaml` — Parches de dependencias críticas y overrides.
- `supabase/migrations/20261026013000_security_hardening_drop_dangerous_rpcs.sql` — Migración de neutralización RPC.
- `.gitignore` — Protección estricta de `.env.*`.

## ⏭️ Próxima acción recomendada
Rotar la contraseña de base de datos de DEV en el dashboard de Supabase y continuar con el roadmap.

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
