# AGENTS — Geekorium Project Context & Rules

Este directorio contiene las reglas de arquitectura modular del proyecto. Garantizan consistencia y alta calidad en el output de todos los agentes que trabajan en el sistema.

## 🎯 Objetivo Principal

Geekorium es un **marketplace TCG de venta asistida** para coleccionistas. El objetivo técnico es reducir la fricción entre la selección del producto y la comunicación con el Geeko-Asesor, manteniendo integridad de datos y una UX premium mobile-first.

## 🏗️ Stack Actual (Feb 2026)

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Backend | Supabase Edge Functions (Deno/TypeScript) |
| Base de Datos | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage (payment-proofs) |
| Deploy | GitHub Pages (frontend) + Supabase (backend) |
| Scripts Admin | Python 3.12 + scripts/ |

## 📂 Documentación de Referencia

Cargar según la tarea específica:

1. **[PRD Master](../docs/PRD_MASTER.md)** — Fuente de verdad. Estado actual + features pendientes.
2. **[Core Methodology](reference/methodology.md)** — PRD-first, reglas modulares, context resets.
3. **[Frontend Standards](reference/frontend.md)** — React, Tailwind, aesthetics premium.
4. **[Backend & API](reference/api.md)** — Supabase Edge Functions, modelos, business logic.
5. **[Scraper & Data](reference/scrapers.md)** — Calidad de datos, detección de variantes.
6. **[Documentation](reference/documentation.md)** — Gestión del PRD y docs/.
7. **[Lessons Learned](lessons_learned.md)** — Bugs críticos, soluciones, anti-patrones.

## 🛠️ Workflows Disponibles

- `/import` — Implementar y verificar el Bulk Import feature
- `/nightly-sync` — Ejecución autónoma del framework Strata

## ✅ Features Implementadas (Feb 2026)

- Catálogo completo con filtros (juego, rareza, color, tipo, set)
- CardModal: versiones, precios dinámicos, foil toggle, DFC flip
- CarKingdom links (DFC: solo nombre de cara frontal)
- Carrito con persistencia localStorage
- Checkout: datos + comprobante + WhatsApp handshake
- Admin panel: órdenes, gestión de inventario, QuickStock panel
- Bulk import ManaBox TXT/CSV con reporte de errores
- Símbolos de maná (mana-font)
- Auth completo (login/logout/session)
- Precios de mercado via Scryfall sync
- Soporte foil virtual (detectado por `prices.usd_foil`)

## 🚧 Features Pendientes

- Swipe-down cierre modal en móvil
- Stale-While-Revalidate para Scryfall
- Virtualización del grid (performance)
- Dashboard "cartas más buscadas sin stock" (admin)
- Tests unitarios parser ManaBox

## ⚠️ Reglas Críticas del Sistema

1. **CardModal**: Nunca filtrar `all_versions` al cambiar printing — preservar en estado.
2. **Precios**: Centralizados en Edge Function `tcg-api`. Nunca calcular en cliente.
3. **Build check**: `npm run build` antes de cualquier push a `frontend/src/`.
4. **Sin `any` implícito** en `map`/`filter`/`forEach` — rompe el pipeline de CI/CD.
5. **Foil virtual**: No son registros separados en DB. Se detectan por `prices.usd_foil IS NOT NULL`.
6. **Consultar `lessons_learned.md`** antes de tocar lógica de DB, filtros, o CardModal.

---
*Geekorium — Geeko-Engineering Division | Limpieza: 2026-02-26*
