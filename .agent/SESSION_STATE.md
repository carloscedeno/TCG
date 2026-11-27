# 🧠 SESSION STATE — TCG Hub

> Agente: leer al INICIO de cada sesión. Actualizar al FINAL antes de cerrar.
> Máximo 60 líneas. Si crece, comprimir.

---

## 📅 Última sesión: 2026-11-27 (Sync PROD→DEV + Bloque A SEO Interno + Consola Admin Filtros + Bloque B SEO Externo → PROD)
**Rama activa:** `dev` (promovida 1:1 a `main` para Cloudflare Pages PROD)
**Estado:** DEV (`bqfkqnnostzaqueujdms`) y PROD (`sxuotvogwvmxuvwbsscv`) actualizados y sincronizados 1:1 con catálogo/inventario (`39,454` cards, `102,092` printings, `4,263` products) y migraciones SEO/Search aplicadas.
- **Bloque A (SEO Interno & Buscador Dinámico)**:
  - `20261127000001_search_trgm_and_intent_analytics.sql` + `20261127000002_search_intelligence_filters.sql` aplicadas en DEV y PROD: `idx_products_name_trgm`, `search_card_names` con subcadena + prioridad stock, `get_products_filtered` con tolerancia typos (`pg_trgm`), tabla `internal_search_events` (RLS solo Admin), `log_search_intent` (upsert por `search_session_id` + filtros activos) y `get_search_intelligence` (filtros de fecha desde/hasta, juego, tipo, rareza, resolución, tab, texto + enriquecimiento `cards`/`products`).
  - Tracker `frontend/src/utils/searchAnalytics.ts` conectado a `SearchBar.tsx` y `Home.tsx`.
  - Consola dedicada `/admin/search-analytics` (`SearchAnalyticsPage.tsx` + `SearchIntelligencePanel.tsx` + exportación CSV) y tarjeta **"SEO & BÚSQUEDAS"** en `AdminDashboard.tsx`.
- **Bloque B (SEO Externo, Schema.org & Sitemap Vivo)**:
  - `frontend/src/hooks/useSeoMeta.ts` (`Product`/`Offer`, `Store`/`WebSite`, `Event` JSON-LD + OG/canonical dinámicos) en `Home.tsx`, `CardDetail.tsx`, `CardModal.tsx`, `TournamentHub.tsx`, `RankingsPage.tsx`, `WishlistPage.tsx`, `HelpPage.tsx` y `LegalPage.tsx`.
  - Corregido `viewport` en `frontend/index.html`, `VITE_ROBOTS` en `vite.config.ts` / `deploy.yml`, enlaces `/card/:id` en `Card.tsx`, `robots.txt` y `sitemap.xml` dinámico en `postbuild.js`.

## 📁 Zona Caliente (archivos tocados recientemente)
- `supabase/migrations/20261127000001_*.sql` & `20261127000002_*.sql` — Trigram search + `internal_search_events` + filtros Admin.
- `frontend/src/utils/searchAnalytics.ts` & `pages/Admin/SearchAnalyticsPage.tsx` — Search Intent Folding & Consola `/admin/search-analytics`.
- `frontend/src/hooks/useSeoMeta.ts` & `frontend/postbuild.js` — Meta tags/JSON-LD dinámicos y sitemap vivo.

## ⏭️ Próxima acción recomendada
1. Revisar en `geekorium.shop/admin/search-analytics` las primeras búsquedas reales de usuarios filtrando por fecha, juego, tipo y rareza.
2. Evaluar Cloudflare Pages Function opcional si se requieren previews OG SSR en WhatsApp/Discord para `/card/:id`.

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
