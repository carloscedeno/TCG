# Geekorium — Log de Compuesto (COMPOUND)

## 2026-03-12 — Extreme Performance & Request Cancellation

**Qué pasó:** Los filtros del marketplace sufrían de timeouts persistentes (500) debido a joins costosos. Se aplicó denormalización extrema en el backend y cancelación de peticiones en el frontend.
**Lo que cambió:**
- `lessons_learned.md` → Lecciones #72 (Denormalización) y #73 (AbortController)
- `LEYES_DEL_SISTEMA.md` → Ley 6 (Performance Garantizado)
- `AGENTS.md` → Features Implementadas (Performance)
- `supabase/migrations/20260312_extreme_denormalization.sql` → Migración de arquitectura product-centric
- `frontend/src/pages/Home.tsx` → Integración de AbortController
**Artefacto creado:** Walkthrough de Performance.
**Regla derivada:** Denormalización obligatoria para queries >200ms en tablas grandes.

---

## 2026-03-12 — Fix Foil Visualization (Global Remediación)

**Qué pasó:** Los productos eran incorrectamente marcados como "foil" debido a un fallo en la lógica de detección de la Edge Function (matching parcial de "nonfoil"). Se corrigió la función y se realizó una limpieza masiva de ~9,000 registros mediante SQL.
**Lo que cambió:**
- `lessons_learned.md` → Lección #71 (Lógica de Detección de Foil)
- `LEYES_DEL_SISTEMA.md` → Regla de Negocio 5 (Integridad de Acabados)
- `supabase/functions/api/index.ts` → Refactor de detección de finish
- `SQL Editor` → Remediación de 7,000+ registros incorrectos
**Artefacto creado:** Walkthrough v2.
**Regla derivada:** Nunca permitir foil si la impresión base no lo soporta.

---

## 2026-03-12 — Fix Missing Card Prices ("S/P")


**Qué pasó:** Se detectó que cartas en stock (8th Edition y otras) mostraban "S/P" debido a falta de metadata de precio en impresiones variadas (starred numbers).
**Lo que cambió:**
- `lessons_learned.md` → Lección #70 (Price Fallback Chain)
- `LEYES_DEL_SISTEMA.md` → Regla 1 (Fallback automático de precios)
- `PROGRESS.md` → Reporte de fix en buscador
- `supabase/migrations/20260312_fix_products_price_fallback.sql` → Nuevo fallback en RPC
**Artefacto creado:** Walkthrough del fix.
**Regla derivada:** Todo RPC de inventario debe implementar fallbacks de precio entre acabados.

---
