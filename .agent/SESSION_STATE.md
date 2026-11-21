# 🧠 SESSION STATE — TCG Hub

> Agente: leer al INICIO de cada sesión. Actualizar al FINAL antes de cerrar.
> Máximo 60 líneas. Si crece, comprimir.

---

## 📅 Última sesión: 2026-11-21 (Prehook Karpathy/Seguridad + Auditoría & Hardening DEV)
**Rama activa:** dev
**Estado:** Sistema endurecido y verificado en DEV (`bqfkqnnostzaqueujdms` / `dev.geekorium.shop`).
- **Prehook y Reglas Permanentes**: Integradas las Reglas de Karpathy y Seguridad por Defecto en `.agent/rules/code_discipline_security.md`, `.agent/workflows/prehook.md`, `.agent/AGENTS.md` y `tools/scripts/carlos_prehook.py`.
- **Auditoría de Primera Pasada**: Creado `tools/scripts/security_first_pass_audit.py`. Detectadas y cerradas en DEV: escalación de `profiles.role`, exposición pública de `orders`, monto total en `create_order_atomic`, cabeceras HTTP en `_headers` y desvinculación de `supabase/.env.local` de Git.
- **Migration `20261121000001_security_hardening_rls_and_orders.sql`**: Aplicada vía pooler DEV (`aws-1-us-west-2.pooler.supabase.com`) con trigger `trg_prevent_role_escalation` y RPC `get_order_tracking(uuid)`. Verificado que `GET /orders` anónimo devuelve `[]`.

## 📁 Zona Caliente (archivos tocados recientemente)
- `.agent/workflows/prehook.md` — Integración de Skill 1 (Karpathy) y Skill 2 (Seguridad por Defecto).
- `.agent/rules/code_discipline_security.md` — Reglas maestras permanentes.
- `tools/scripts/carlos_prehook.py` & `tools/scripts/security_first_pass_audit.py` — Validación prehook y auditoría.
- `supabase/migrations/20261121000001_security_hardening_rls_and_orders.sql` — Hardening RLS, trigger y RPC seguro.
- `frontend/src/pages/OrderTrackingPage.tsx` — Consumo vía `supabase.rpc('get_order_tracking')`.
- `frontend/public/_headers` — Cabeceras CSP, HSTS, X-Frame-Options, X-Content-Type-Options.

## ⏭️ Próxima acción recomendada
1. Verificar `dev.geekorium.shop` y validar cuándo promover la migración `20261121000001` a PROD (`sxuotvogwvmxuvwbsscv`).
2. Ejecutar ingestión real `LIVE APPLY` (`python scripts/sync/sortswift/sync_sortswift_automated.py`) en DEV cuando corresponda.

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
