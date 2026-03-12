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
