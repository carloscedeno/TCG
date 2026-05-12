# dY  COMPOUND: Bulk Catalog Import & Validation Hardening

**Date**: 2026-05-12 17:45

## Objective

Implement a high-performance bulk import system for the accessory catalog, bypassing image requirements and standardizing category ingestion.

## Knowledge Codification

### 1. Catalog Import Architecture (Edge Function)

- **Feature**: Added `catalog` import type to `tcg-api`. It maps CSV headers to the `accessories` table and performs batch insertions.
- **Optimization**: Implemented `.trim()` on `category_code` within the Edge Function to prevent foreign key violations caused by hidden whitespace in CSV files.
- **Flexibility**: Updated validation to allow `price: 0.00` for promotional or free items, using `isNaN()` instead of truthy checks.

### 2. Intelligent Auto-mapping (BulkImport.tsx)

- **Pattern**: Implemented a "Catalog Detection" mode. If headers match the system template (`category_code`, `suggested_price`), the UI pre-selects all mappings automatically.
- **Language**: Standardized example data and templates to **English** by default, aligning with international TCG standards while maintaining local currency support.

### 3. Product-Centric UI Integration

- **Component**: Created `BulkImportCatalogModal.tsx` following the "Geeko Noir" design system (GlassCard, Geeko Cyan accents).
- **Placement**: Integrated into `CatalogPage.tsx` as a primary administrative action alongside manual creation.

## Technical Validation

- **Frontend Build**: Success.
- **Git Status**: Pushed to `dev`.
- **Edge Function**: Deployed and verified with a 10-row test file (`TEST_IMPORT_FUNCIONA.csv`).

---


# dY  COMPOUND: Banner Regression & React "Phantom Zero" Remediation

**Date**: 2026-05-12 16:45

## Objective

Remediate a UI regression where global banners were overwriting game-specific TCG banners, and eliminate "stray 0" artifacts from the product grid.

## Knowledge Codification

### 1. Banner Category Shadowing (Home.tsx)

- **Regression**: In a recent refactor, `gameCode` was being forced to `undefined` when `activeTab === 'catalog'`, causing the `HeroSection` to fallback to global home banners even when a specific TCG was filtered.
- **Fix**: Restored the direct link between `filters.games` and `HeroSection`. The banner logic now respects the selected TCG regardless of the active viewing mode (Cartas vs Accesorios).
- **Rule**: Never override state-derived props with hardcoded defaults in the top-level page unless a specific view explicitly forbids it.

### 2. The "Phantom Zero" React Anti-pattern

- **Discovery**: In React, `{number && <Component />}` evaluates to `0` and renders it if the number is `0`.
- **Lesson**: Transitioned components to `{!!number && <Component />}` or `number > 0 && <Component />`.
- **Reference**: Added to `.agent/lessons_learned.md` as Lesson #155.

## Technical Validation

- **Frontend Build**: Success.
- **Git Status**: Clean.
- **TCG Testing**: MTG and Pokémon banners verified via browser subagent.
- **Unit Tests**: 28 Passed.

---


# dY  COMPOUND: Unified Cart & Discount Synchronization

**Date**: 2026-05-11 22:00

## Objective

Finalize the unified cart architecture to ensure cards and accessories are handled consistently, with real-time discount synchronization across authenticated and guest sessions.

## Knowledge Codification

### 1. Unified Cart Mapping (RPC Trust)

- **Standard**: The frontend `fetchCart` now trusts the `get_user_cart` RPC as the single source of truth for all cart item metadata and price calculations.
- **Bypass**: Removed complex client-side normalization and fallback queries in `api.ts` to favor server-side consistency.

### 2. Guest Discount Parity

- **Pattern**: Guest cart processing in `api.ts` now mirrors the backend's discount logic.
- **Rule**: Prices for accessories and cards in local storage are dynamically recalculated based on active offers (`discount_percentage` and expiration dates) to prevent pricing drift.

### 3. Detail Fetching Hierarchy

- **Hierarchy**: When fetching product details by UUID, always check the `accessories` table BEFORE falling back to the Edge Function (Scryfall/Cards). 
- **Logging**: Added diagnostic logging to distinguish between store-local inventory (Accessories) and global catalog data (Cards), resolving 404 console errors.

## Technical Validation

- **Frontend Build**: Success.
- **E2E Verification**: Confirmed via browser subagent (Auth & Guest flows).
- **Console Audit**: Zero 404s for accessory details.

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
