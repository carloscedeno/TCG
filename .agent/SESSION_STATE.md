# 🧠 SESSION STATE — TCG Hub

> Agente: leer al INICIO de cada sesión. Actualizar al FINAL antes de cerrar.
> Máximo 60 líneas. Si crece, comprimir.

---

## 📅 Última sesión: 2026-09-08
**Rama activa:** `dev` (sincronizada y subida a `dev` y `main` producida)
**Último commit conocido:** 634e41ae (fix: resolve Unknown Set issue in edition printings display)
**En progreso:** Sesión finalizada con éxito. Solucionado error de "Unknown Set" en el panel de impresiones/ediciones de cartas y desplegado a dev y produccion.

## 📁 Zona Caliente (archivos tocados recientemente)
- frontend/src/utils/api.ts — Helper functions getSetName/getSetCode y preservación de versiones de API
- frontend/src/pages/CardDetail.tsx — Fallbacks resilientes en versionGroups y renderizado de número de coleccionista

## ⏭️ Próxima acción recomendada
Verificar el despliegue automático en Cloudflare Pages / Vercel para dev y prod.

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
