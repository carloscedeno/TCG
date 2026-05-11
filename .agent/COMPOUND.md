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
