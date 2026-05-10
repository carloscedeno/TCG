# dY  COMPOUND: TCG Code Consolidation & Banner Sync

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
