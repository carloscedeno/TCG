# 🧠 SESSION STATE — TCG Hub

> Agente: leer al INICIO de cada sesión. Actualizar al FINAL antes de cerrar.
> Máximo 60 líneas. Si crece, comprimir.

---

## 📅 Última sesión: 2026-11-18 (SortSwift Sync Audit, Matrix Modal & Card Preview)
**Rama activa:** dev
**Estado:** Sistema auditado y verificado en DEV (`dev.geekorium.shop`).
- **Modal de Visualización en Inventario**: Integrado `CardModal` estilo Moxfield en `InventoryPage.tsx` con preview interactivo in-page de cartas singles.
- **Auditoría SortSwift**: 4,072 cartas singles RAW (9,768 unidades físicas) cotejadas contra base de datos DEV. Desglose detallado por TCG (MTG +2,960 singles, PKM, RFB, DGM, GND, FAB, OPC).
- **Descarga CSV Directa**: Generado `sortswift_sync_audit_detail.csv` (4,334 líneas) con descarga directa desde el header y footer de `SortSwiftSyncModal.tsx`.
- **CI / GitHub Pages Fix**: Corregido `.github/workflows/deploy.yml` con `--no-frozen-lockfile` y verificado en vivo con Playwright/Chrome DevTools.

## 📁 Zona Caliente (archivos tocados recientemente)
- frontend/src/components/Admin/SortSwiftSyncModal.tsx — Desglose auditado por TCG de singles y descarga CSV.
- frontend/src/pages/Admin/InventoryPage.tsx — Integración de `CardModal` para cartas y sugerencias.
- frontend/public/sortswift_sync_audit_detail.csv — Archivo CSV de transacciones auditadas.
- .github/workflows/deploy.yml — Flag `--no-frozen-lockfile` para despliegues fluidos en CI.
- scripts/sync/sortswift/generate_sync_audit_report.py — Generador de auditoría y conciliación SortSwift/DB.

## ⏭️ Próxima acción recomendada
Ejecutar ingestión real `LIVE APPLY` (`python scripts/sync/sortswift/sync_sortswift_automated.py`) en DEV para incorporar las 2,960 cartas singles nuevas (6,175 unidades) al catálogo web.

## 🚫 Restricciones activas
- NO usar `npm` — solo `pnpm`
- NO modificar PROD sin backup explícito
- NO tocar `create_order_atomic` RPC sin migration
- Entorno DEV: proyecto Supabase `bqfkqnnostzaqueujdms`
- Entorno PROD: proyecto Supabase `sxuotvogwvmxuvwbsscv`

## 🗺️ Knowledge Graph
- Graphify instalado: ✅ `graphify 0.8.35`
- Grafo construido: ✅ `graphify-out/graph.json`
- Comando para actualizar: `graphify update .`

## ✅ Features estables (no tocar sin razón)
- Sincronizador Dual USD/USB (BCV/Binance) para Odoo mediante pg_cron.
- Corrección de zona horaria de eventos (Caracas UTC-4)
- Checkout E2E + WhatsApp flow & SortSwift 60m Hold
- Bulk Import (cartas y accesorios)
- Sistema de descuentos con fechas NULL
- Carrito unificado (auth + guest)
- Batería de pruebas `/pruebame` (`run_tests.ps1`)
