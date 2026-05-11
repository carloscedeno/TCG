# 🧠 COMPOUND: Reparación de Filtros de Producción (MTG & Multi-TCG)

**Date**: 2026-05-11 01:25

## Objective

Restaurar la funcionalidad de filtrado (Color, Tipo, Año, Rareza) en el catálogo de producción (`geekorium.shop`) mediante una actualización quirúrgica del RPC `get_products_filtered`.

## Knowledge Codification

### 1. Mapeo de Metadatos TCG (Frontend vs DB)

- **Patrón**: El frontend envía nombres descriptivos ('White', 'Mythic') mientras que la base de datos utiliza códigos compactos ('W') o minúsculas.
- **Solución**: El RPC debe actuar como capa de normalización, traduciendo `unnest(color_filter)` a códigos internos mediante un `CASE` statement.

### 2. Filtrado de Alto Rendimiento en Arrays

- **Estándar**: Usar el operador de intersección de arrays `&&` para filtrar por colores (`p.colors && v_color_codes`). Es significativamente más rápido que múltiples joins o subconsultas `IN`.

### 3. Sincronización PostgREST (Hotfix)

- **Regla**: Cualquier cambio directo en funciones SQL en Supabase requiere la ejecución de `NOTIFY pgrst, 'reload schema';`. Sin esto, la API HTTP puede seguir sirviendo la firma antigua de la función, rompiendo el contrato con el frontend.

## Technical Validation

- **Frontend Build**: Éxito.
- **SQL Verification**: Filtros de Color, Tipo y Año validados con 100% de precisión.
- **E2E Browser**: Verificado en `geekorium.shop` (Negro + Criatura + 2024).
- **Scripts**: Creado `scripts/test_new_filters.py` para regresiones futuras.

---


**Date**: 2026-05-10 10:45

## Objective

Unify TCG branding and catalog visibility by resolving banner mismatches, RPC filtering errors, and consolidating duplicate game codes in the database.

## Knowledge Codification

### 1. Canonical TCG Code Standard

- **Standard**: All operations (Banners, Filters, Products) MUST use 3-letter canonical codes: `MTG`, `PKM`, `YGO`, `OPC`, `LOR`, `FAB`, `RFB`, `GND`, `DGM`.
- **Bypass**: Removed legacy mapping in `api.ts` that forced `YGO` to `YUGIOH`. The database is now the single source of truth for codes.

### 2. Strict Accessory Filtering

- **Pattern**: The RPC `get_accessories_filtered` now excludes generic accessories (`game_id IS NULL`) when a specific `p_game_id` is provided. This prevents unrelated items (e.g., D&D books) from appearing in TCG-specific catalogs.
- **Rule**: Generic items only appear in the global "Artilugios" view (no game filter).

### 3. Presale Section Visibility

- **UI**: The `PresaleSection` is now hidden in individual TCG catalog views (`activeTab === 'catalog' && filters.games.length > 0`) to maintain focus on the specific game's inventory.

## Technical Validation

- **Frontend Build**: Success.
- **Git Status**: Clean.
- **Database**: Merged legacy IDs (26, 23, 28) into canonical IDs (11, 10, 13). Updated `hero_banners` and `accessories` tables.

---

# dY  COMPOUND: E2E Checkout Remediation & "Por Encargo" Workflow

**Date**: 2026-05-07 00:10

## Objective

Remediate the E2E checkout process by implementing "Por Encargo" logic to bypass strict stock validation and provide clear UI feedback.

## Knowledge Codification

### 1. The "On-Demand" Bypass Pattern

- **Pattern**: Instead of blocking orders with `RAISE EXCEPTION` when stock is low, the system now accepts the order and flags `order_items.is_on_demand = true`.
- **Rule**: Stock can be decremented to 0 (floor) or allowed to go negative depending on the specific product type tracking needs.

### 2. Contextual UI Feedback

- **UI**: Cyan badges (`geeko-cyan`) with black text are used for "POR ENCARGO" labels to ensure high visibility against the dark theme.
- **Badge logic**: `quantity > stock` is the definitive trigger for the "On-Demand" state in the UI.

### 3. Operational WhatsApp Flow

- **Rule**: Every WhatsApp order message MUST identify if it contains on-demand items via a header and per-item markers to alert the sales team of needed sourcing.

## Technical Validation

- **Frontend Build**: Success.
- **Unit Tests**: 28 Passed.
- **Database**: Migration 20260507120000 prepared for remote deployment.
