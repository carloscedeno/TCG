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
---

## 2026-03-13 — Foil Import Reliability & Robust Matching

**Qué pasó:** Se detectó una inconsistencia en la importación de "Wan Shi Tong, Librarian" donde una carta foil se guardó como normal. Se identificó la causa en el RPC de importación (ignoraba el array `finishes`). Se robusteció el backend y se añadió validación proactiva en el frontend.
**Lo que cambió:**
- `lessons_learned.md` → Lección #74 (Foil Matching & Finishes)
- `LEYES_DEL_SISTEMA.md` → Regla de Negocio 6 (Importación Robusta)
- `AGENTS.md` → Features Implementadas (Foil Reliability)
- `BulkImport.tsx` → Validación de precios altos vs acabado
- `bulk_import_inventory` RPC → Soporte para array `finishes`
**Artefacto creado:** Walkthrough final.
**Regla derivada:** Validar siempre finishes array y emitir alertas de precio/finish en frontend.
## 2026-03-13 — Admin Experience & Price Integrity

**Qué pasó:** Se mejoró significativamente el panel de administración para mostrar datos del comprador y detalles de envío. Además, se detectó y corrigió un error masivo de precios a $0.00 en 1,000 productos del inventario.
**Lo que cambió:**
- `lessons_learned.md` → Lecciones #75, #76 y #77
- `LEYES_DEL_SISTEMA.md` → Regla de Negocio 7 (Cero Tolerancia a Precio 0)
- `AGENTS.md` → Features Implementadas (Buyer Info & Price Sweep)
- `OrdersPage.tsx` → UI de detalles del comprador y envío corregida
- `Database` → Precio de 1,000 ítems restaurados mediante sweep programático
**Artefacto creado:** Walkthrough de Resolución de Precios.
**Regla derivada:** Los datos del comprador deben priorizar `guest_info` y fallbacks de `shipping_address`.
