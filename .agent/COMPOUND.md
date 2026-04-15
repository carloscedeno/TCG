# 🧠 COMPOUND: Bulk Egress & Audit Module

**Date**: 2026-04-04 23:57

## Objective

Implement a secure, admin-only bulk stock deduction feature with CSV support and automated auditing logs.

## Knowledge Codification

### 1. The "Rose-Neon" Administrative Pattern

- **Pattern**: Used `Rose-500` themed Glassmorphism for destructive or "Deduction" operations (Egress) to distinguish them from additive operations (Import - Purple/Emerald).
- **Component**: `EgressInventoryModal.tsx` handles parsing, staging, and confirmation.

### 2. Atomic Bulk Deduction (RPC)

- **Logic**: Use `jsonb_to_recordset` in PostgreSQL for fast decoding, followed by a CTE-based aggregation of totals per (printing, condition, finish).
- **Integrity**: Check `current_stock - requested < 0` for any row in the lottery. If true, `RAISE EXCEPTION` to rollback the entire CSV processing.

### 3. Inventory Logging (Audit Trail)

- **Table**: `inventory_logs` captures `old_stock`, `new_stock`, and `reason` metadata.
- **Rule**: Every bulk action must result in a log entry to maintain the single-source-of-truth audit trail for Geekorium.

## Technical Validation

- **Frontend Build**: ✅ Success
- **Unit Tests**: ✅ 28 Passed
- **Production Integration**: ✅ Database Migrations (Remote), Frontend Pushed (Cloudflare).

---

*Compounded for Geekorium TCG Ecosystem.*

# 🧠 COMPOUND: Multi-Cart Remediation (Terminal v16)

**Date**: 2026-04-07 01:30

## Objective

Remediate the functional failure of the administrative multi-cart manager. Restore visibility and isolation between concurrent customer carts.

## Knowledge Codification

### 1. POS Terminal v16 Architecture

- **Pattern**: Unified "Service Terminal" aesthetic using `geeko-cyan` for POS-ready operations.
- **RPC Logic**: Shifted from manual RLS bypasses to secure, server-side RPCs scoped strictly by `auth.uid()`.

### 2. Active Cart Synchronization

- **Logic**: Use an `is_active` boolean flag on the `carts` table.
- **Atomicity**: `switch_active_cart(p_cart_id)` ensures only one cart is active per user session in a single transaction.
- **Interface**: `CartContext.tsx` now polls and identifies the `activeCartName` to provide visual feedback of the current customer.

## Technical Validation

- **Database Migration**: ✅ Applied (v16 remediation)
- **Frontend Sync**: ✅ CartContext & api.ts updated to match new RPC signatures.
- **Deployment**: ✅ Pushed to production.

---

*Compounded for Geekorium TCG Ecosystem.*

# 🧠 COMPOUND: Order Receipt & WhatsApp Detail Fix

**Date**: 2026-04-08

## Objective

Respond to operational feedback: orders were confirmed via WhatsApp with only aggregate card counts (e.g., "Normal: 5, Foil: 2") instead of a full itemized breakdown. Additionally, the "Download PDF" button was a bare `window.print()` with no styling — not usable as a real comprobante.

## Knowledge Codification

### 1. WhatsApp Message Must Be Itemized

- **Bug**: The `CheckoutPage.tsx` WA message was simplified to type-counts during the April 6 frictionless checkout session, regressing from the behavior documented in `AGENTS.md` (Lesson #84).
- **Fix**: Replaced aggregate count logic with a `items.slice(0, 40).map(...)` that produces lines like `• 2x Black Lotus [LEA] [FOIL] - $35.00`.
- **Overflow**: Orders > 40 items append `_(+N ítems más — ver correo)_` to keep the WA message manageable while directing to email for full detail.

### 2. Real PDF Receipt via New Window

- **Pattern**: No external library needed. `generateReceiptHTML()` builds a self-contained HTML page (Inter font via Google Fonts, full CSS, branding) and opens it in a new tab via `window.open()`. The page auto-fires `window.print()` after load.
- **Content**: Order ID, customer name/phone/email, itemized card table with finish badges, total, date, and status tag.
- **Location**: Receipt button lives in `CheckoutSuccessPage` — the correct place, after the order is confirmed.

### 3. Pass customerInfo Through Navigate State

- **Pattern**: `CheckoutPage` now passes `{ orderId, total, items, customerInfo: { full_name, whatsapp, email } }` in the `navigate('/checkout/success')` call so the success page can include buyer data in the PDF without making a DB round-trip.

## Files Changed

- `frontend/src/pages/CheckoutPage.tsx` — WA message logic, navigate state
- `frontend/src/pages/CheckoutSuccessPage.tsx` — full rewrite with `generateReceiptHTML` and `handleDownloadPDF`

## Technical Validation

- **Frontend Build**: ✅ Exit code 0 (`tsc -b && vite build && postbuild`)
- **Git Push**: ✅ Pushed to `main` (commit e965b97)

---

*Compounded for Geekorium TCG Ecosystem.*

# 🧠 COMPOUND: POS Terminal Stabilization (v44)

**Date**: 2026-04-09

## Objective

Stabilize the POS Terminal session persistence and data integrity. Resolve critical bugs causing $0.00 pricing, $NaN subtotal calculations, and failed cart additions due to schema mismatches and identifier confusion.

## Knowledge Codification

### 1. The "Bulletproof" Master RPC Policy

- **Pattern**: `add_to_cart_v2` acts as a polymorphic entry point. 
- **Flexibility**: It accepts **Identifier Strings** (both `product_id` and `printing_id`) and automatically strips synthetic suffixes (e.g., `-foil`, `-nonfoil`) provided by the frontend.
- **Auto-Repair**: If a product record is missing or lacks a price/image, the RPC performs an immediate lookup in the master TCG catalog (`card_printings`) and "self-heals" the products table to ensure no item ever shows as $0.00 or broken.

### 2. Schema Integrity & Persistence

- **Bug**: Missing `updated_at` column in the production `cart_items` table was causing silent SQL failures when updating quantities.
- **Fix**: Applied `ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();` and updated RPC to explicitly touch this column.
- **Session Layer**: Validated that `currentIsPos` and `activeCartName` must persist through `localStorage` hints to ensure the "Managing: [Customer]" banner survives browser refreshes and page transitions.

### 3. Direct Pass-Through Mapping

- **Logic**: Replaced error-prone frontend data translation layers with a "Direct Pass-Through" from Database JSON to UI.
- **Rule**: Pricing data must remain a `numeric` type throughout the SQL -> RPC -> API -> Context pipeline to prevent Javascript's `NaN` errors during aggregate calculations.

## Technical Validation

- **Frontend Build**: ✅ Corrected JSX syntax error in `InventoryPage.tsx` and removed unused icons.
- **Database Logic**: ✅ RPC `add_to_cart_v2` verified working in production with Sol Ring and dual-face card test cases.
- **Git Sync**: ✅ All changes pushed to `main`.

---

*Compounded for Geekorium TCG Ecosystem.*
# 🧠 COMPOUND: Order Item Deletion & Fixes
**Date**: 2026-04-09 16:35

## Objective
Implement a secure, administrative feature to remove individual items from existing orders. Ensure stock is correctly restored to the inventory and the order total is recalculated atomically. Resolve production build failures and browser-level event conflicts.

## Knowledge Codification

### 1. Atomic Order Item Deletion (v1)
- **RPC Logic**: `delete_order_item_v1` handles the entire transaction.
- **Stock Restoration**: Automatically increments `products.stock` for the deleted item if the order status is active (not cancelled/returned).
- **Snapshot Integrity**: Recalculates `orders.total_amount` using a `SUM` of remaining items to ensure the total is always accurate after removal.

### 2. Inline UI Confirmation Pattern
- **Problem**: `window.confirm()` was auto-cancelling in production due to event collisions or browser policies.
- **Solution**: Implemented a state-based confirmation (`confirmingItemId`). The UI transforms the button into a "Confirm (Check) / Cancel (X)" set of icons. 
- **Rule**: For destructive actions in the Admin Panel, prioritize "Inline Confirmation" over native browser dialogs for better reliability and UX.

### 3. Production Build Integrity (TS6133)
- **Issue**: Build failed due to unused imports in `InventoryPage.tsx` and `OrdersPage.tsx`.
- **Action**: Cleaned all unused imports (`AlertTriangle`, `ShieldAlert`, `RotateCcw`) to satisfy the `noUnusedParameters: true` constraint in `tsconfig.json`.

## Technical Validation
- **Database Logic**: ✅ RPC `delete_order_item_v1` verified and applied.
- **Frontend Build**: ✅ Build successful after removing unused imports.
- **Git Push**: ✅ Pushed to production (main).

---

*Compounded for Geekorium TCG Ecosystem.*

# 🧠 COMPOUND: Environment Duplication & Connectivity (v45)

**Date**: 2026-04-12

## Objective

Successfully recreate the `dev` environment and duplicate production catalog/inventory data to a fresh branch, overcoming local network restrictions.

## Knowledge Codification

### 1. HTTPS/REST Sync Pattern
- **Problem**: Direct Postgres connections (port 5432) reported `getaddrinfo failed` or `Connection Reset`, blocking standard migration tools.
- **Solution**: Developed a synchronization layer using the Supabase REST API (PostgREST). HTTPS (Port 443) is significantly more resilient to local DNS and corporate firewall restrictions.
- **Logic**: Implemented `sync_inventory_only.py` which uses `Prefer: resolution=merge-duplicates` for idempotent upserts.

### 2. Catalog Filtering by Inventory
- **Strategy**: Instead of a full 33k card dump, the sync identifies the **14,136 items in active inventory** and fetches only their related card and printing ancestors.
- **Benefit**: Reduced data volume by ~60%, leading to faster branch performance and lower storage costs.

### 3. Schema Metadata Alignment
- **Observation**: `create_branch` in certain Supabase environments might miss specific table columns if they weren't part of the initial migration.
- **Fix**: Performed a manual metadata audit using `information_schema` and reconstructed the catalog tables (`cards`, `card_printings`) with 100% column parity before the sync.

## Technical Validation
- **Database Logic**: ✅ Dev branch `bqfkqnnostzaqueujdms` fully populated and verified via SQL counts.
- **Frontend Sync**: ✅ `frontend/.env.local` updated and verified connecting to the new branch.
- **Environment Parity**: ✅ Verified that `MTG` games, sets, and 14k+ products match production state.

---

*Compounded for Geekorium TCG Ecosystem.*

# 🧠 COMPOUND: Multi-Cart Data Parsing Fallback

**Date**: 2026-04-14

## Objective

Fix the critical UI bug in the POS Multi-Cart where items appear with empty names, missing images, and `$0.00` prices despite possessing a correct quantity, ensuring resilience across differing RPC payload schemas.

## Knowledge Codification

### 1. The Database vs UI Mismatch

- **Observation**: `get_user_cart` RPC has evolved. Older or alternate variants returned a flat `cart_items` shape (only `product_id`), while the UI strictly expects nested product structures (`item.products.image_url`, `price`, etc).
- **Impact**: Without defensive mapping, missing product data attributes evaluate to `undefined`, which the React component renders as empty visual fields and `$0.00` values, hiding the item completely.

### 2. The Universal Extraction Fallback

- **Solution**: Developed a universal parsing function in `api.ts` -> `fetchCart()`.
- **Logic**: 
  - Iteratively probe multiple potential access paths (`item.products.name`, `item.product_name`, `item.name`).
  - If still missing (due to an old flat RPC), seamlessly `await supabase.from('products')` to fetch and graft the explicit product details on-the-fly (`pData.name`, `pData.price`).

## Technical Validation

- **Frontend Sync**: ✅ `api.ts` updated.
- **Resilience**: ✅ TS compiler success, gracefully handles sparse legacy SQL structures.
- **Git Push**: ✅ Pushed securely to `main` branch deployed to production via CI/CD.

---

*Compounded for Geekorium TCG Ecosystem.*

# 🧠 COMPOUND: Fast-Add Reactivation & Price Sync (v46)

**Date**: 2026-04-15 09:45

## Objective

Reactivate the "Quick Add to Cart" feature with refined UX and ensure consistent pricing across the catalog and inventory tables.

## Knowledge Codification

### 1. Overlay UX Pattern

- **Pattern**: Moved the Add to Cart button from the text area to an image overlay (`absolute bottom-3 right-3`).
- **Visibility**: Used `isHovered` state for smooth scale/opacity transitions, keeping the grid clean while idle but responsive on interaction.
- **Affordance**: Added "Por encargo" (On Order) fallback for items with zero stock to maintain the Geekorium business model.

### 2. Polymorphic Identifier Handling

- **Logic**: Updated `Card.tsx` to pass the `finish` prop explicitly to `addToCart`.
- **Resilience**: The backend RPC `add_to_cart_v2` was verified to handle polymorphic identifiers (stripping `-foil` synthetic suffixes) and idempotent product creation/price-healing.

### 3. Cross-Table Price Synchronization

- **Scripting**: Modified `sync_cardkingdom_api.py` to include an atomic `UPDATE public.products` step.
- **Rule**: Prices in the `products` (Inventory) table now automatically match the `card_printings` (Catalog) market data, mapped strictly by `finish`.

## Technical Validation

- **Frontend Build**: ✅ Success (`dist/assets` generated correctly).
- **Unit Tests**: ✅ 28 Passed (after resolving `fastapi-mail` dependency).
- **Git Push**: 🚀 Proceeding to synchronization.

---

*Compounded for Geekorium TCG Ecosystem.*
# 🧠 COMPOUND: Touch-First Quick Add & Production Visibility (v47)

**Date**: 2026-04-15 13:20

## Objective

Solve the persistent visibility issues of the "Quick Add" button reported by the user, ensuring it works on mobile/touch devices and correctly propagates to the production environment.

## Knowledge Codification

### 1. Breaking the Hover Dependency

- **Insight**: Many users browse TCGs on mobile. Hover-based UI triggers (`group-hover:opacity-100`) are invisible on mobile.
- **Implementation**: Forced `opacity-100` and `translate-y-0` as the base state for critical action buttons.
- **Branding**: used `bg-geeko-cyan` for the button background to provide high contrast against card artwork.

### 2. The React.memo Ghost Bug

- **Discovery**: A manual comparison function in `React.memo(Card, (prev, next) => ...)` was causing a silent failure where the component wouldn't update if `showCartButton` changed.
- **Resolution**: Removed the manual comparison to allow React to perform standard shallow diffing, restoring reactive behavior to the prop.

### 3. Production Branch Synchronization

- **Process**: Verified that production deployment tracks `main`. Merged `dev` into `main` after local validation to ensure the "missing button" bug was resolved on `www.geekorium.shop`.
- **UI Styling**: Implemented a smooth width-expansion hover effect using `transition-all duration-300` and `whitespace-nowrap` to show "AÑADIR AL CARRITO" without disrupting the card layout.

## Technical Validation

- **Frontend Build**: ✅ Success in `dev` and `main`.
- **Site Check**: ✅ Verified visibility on `www.geekorium.shop`.
- **Unit Tests**: ✅ 28 Passed.

---

*Compounded for Geekorium TCG Ecosystem.*
