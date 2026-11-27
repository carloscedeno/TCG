# 🧠 SESSION STATE — TCG Hub

> Agente: leer al INICIO de cada sesión. Actualizar al FINAL antes de cerrar.
> Máximo 60 líneas. Si crece, comprimir.

---

## 📅 Última sesión: 2026-11-27 (Sincronización PROD→DEV + SEO Interno & Buscador Dinámico + SEO Externo)
**Rama activa:** `dev` (Bloques A & B listos para validar en `dev.geekorium.shop`)
**Estado:** DEV (`bqfkqnnostzaqueujdms`) sincronizado 1:1 con catálogo/inventario de PROD (`sxuotvogwvmxuvwbsscv`: `39,454` cards, `102,092` printings, `4,263` products).
- **Bloque A (SEO Interno & Buscador Dinámico)**:
  - Migración `20261127000001_search_trgm_and_intent_analytics.sql` aplicada en DEV (`bqfkqnnostzaqueujdms`): `idx_products_name_trgm`, `search_card_names` con subcadena + prioridad de stock, `get_products_filtered` con tolerancia a typos (`pg_trgm`), tabla `internal_search_events` (RLS solo Admin), `log_search_intent` (upsert por `search_session_id`) y `get_search_intelligence`.
  - Tracker `frontend/src/utils/searchAnalytics.ts` (*Search Intent Folding*) conectado a `SearchBar.tsx` y `Home.tsx`, y panel `SearchIntelligencePanel.tsx` en `AdminDashboard.tsx`.
- **Bloque B (SEO Externo, Schema.org & Sitemap Vivo)**:
  - `frontend/src/hooks/useSeoMeta.ts` (`Product`/`Offer`, `Store`/`WebSite`, `Event` JSON-LD + OG/canonical dinámicos) en `Home.tsx`, `CardDetail.tsx`, `CardModal.tsx`, `TournamentHub.tsx`, `RankingsPage.tsx`, `WishlistPage.tsx`, `HelpPage.tsx` y `LegalPage.tsx`.
  - Corregido `viewport` en `frontend/index.html`, `VITE_ROBOTS` fallback en `vite.config.ts` + `noindex, nofollow` en `.github/workflows/deploy.yml`, enlaces `/card/:id` en `Card.tsx`, `robots.txt` y `sitemap.xml` dinámico en `postbuild.js`.

## 📁 Zona Caliente (archivos tocados recientemente)
- `supabase/migrations/20261127000001_search_trgm_and_intent_analytics.sql` — Trigram search + `internal_search_events` (aplicada en DEV; pendiente promover a PROD tras QA).
- `frontend/src/utils/searchAnalytics.ts` & `components/Admin/SearchIntelligencePanel.tsx` — Search Intent Folding & Panel Admin.
- `frontend/src/hooks/useSeoMeta.ts` & `frontend/postbuild.js` — Meta tags/JSON-LD dinámicos y sitemap vivo.

## ⏭️ Próxima acción recomendada
1. Validar Bloque A + Bloque B en `dev.geekorium.shop` (buscador `'bolt'`, `'lightnng'`, telemetría en `/admin`, meta tags y `sitemap.xml`).
2. Promover migración `20261127000001` a PROD (`sxuotvogwvmxuvwbsscv`) y mergear `dev → main` cuando el usuario apruebe.

## 🚫 Restricciones activas
- NO usar `npm` — solo `pnpm`
- NO modificar PROD sin backup explícito
- NO tocar `create_order_atomic` RPC sin migration
- Entorno DEV: proyecto Supabase `bqfkqnnostzaqueujdms` (pooler `aws-1-us-west-2`)
- Entorno PROD: proyecto Supabase `sxuotvogwvmxuvwbsscv` (pooler `aws-0-us-west-2`)

## 🗺️ Knowledge Graph
- Graphify instalado: ✅ `graphify 0.8.35` (`graphify-out/graph.json`)

## ✅ Features estables (no tocar sin razón)
- Flujo Tripartito E2E (`SortSwift ↔ Supabase PROD ↔ Odoo ERP` en `USD`)
- Batería de pruebas `/pruebame` (`run_tests.ps1`)
