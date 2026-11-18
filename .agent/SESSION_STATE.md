# 🧠 SESSION STATE — TCG Hub

> Agente: leer al INICIO de cada sesión. Actualizar al FINAL antes de cerrar.
> Máximo 60 líneas. Si crece, comprimir.

---

## 📅 Última sesión: 2026-11-18 (Modern Web Guidance + Playwright 1.65.1 verificados en dev)
**Rama activa:** dev
**En progreso:** Batería integral de pruebas y gate `/pruebame` implementados y verificados al 100% (`.\run_tests.ps1 -Mode smoke`):
- Python Unit (`tests/unit`, incl. `test_system_contracts.py`): 34 passed.
- Frontend Unit (`Jest` en `frontend/src/tests/`): 6 suites / 30 tests passed (`Card`, `CardGrid`, `CartContext`, `txt_parser`, `url_and_images`, `translations_and_codes`).
- Playwright E2E Smoke (`frontend/tests/e2e/smoke.spec.ts` + `smoke_full_system.spec.ts`, `playwright.config.ts` actualizado a `pnpm dev` + proyecto `smoke`): 6 passed.
- Workflow `/pruebame` creado en `.agent/workflows/pruebame.md`.

## 📁 Zona Caliente (archivos tocados recientemente)
- run_tests.ps1 — Orquestador unificado (`-Mode smoke | unit | e2e | full`) con carga de `.env` raíz.
- .agent/workflows/pruebame.md — Workflow `/pruebame` para validar regresión tras inyectar features.
- frontend/playwright.config.ts — Fix `pnpm dev` y proyecto `smoke` sin dependencia de auth admin.
- frontend/src/tests/ — Suites unitarias (`Card.test.tsx`, `CartContext.test.tsx`, `url_and_images.test.ts`, `translations_and_codes.test.ts`).
- tests/unit/test_system_contracts.py — Contratos SortSwift sandbox, segregación DEV/PROD y códigos canónicos TCG.

## ⏭️ Próxima acción recomendada
Ejecutar `/pruebame` (`.\run_tests.ps1 -Mode smoke` o `-Mode full`) al inyectar nuevas features y antes de hacer merge a `main`.

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
- Comando para actualizar: `graphify update .`

## ✅ Features estables (no tocar sin razón)
- Sincronizador Dual USD/USB (BCV/Binance) para Odoo mediante pg_cron.
- Corrección de zona horaria de eventos (Caracas UTC-4)
- Checkout E2E + WhatsApp flow & SortSwift 60m Hold
- Bulk Import (cartas y accesorios)
- Sistema de descuentos con fechas NULL
- Carrito unificado (auth + guest)
- Libreta de Direcciones Múltiples (Envío/Facturación)
- Batería de pruebas `/pruebame` (`run_tests.ps1`)
