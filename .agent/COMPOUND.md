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

# ?? COMPOUND: Guest Cart Performance & Context Mapping (v48)

**Date**: 2026-04-15 15:50

## Objective

Resolve the high latency experienced by guest users (non-logged-in) when interacting with the cart. Ensure data consistency across the application state management.

## Knowledge Codification

### 1. Batch-Fetch Strategy for Guests

- **Optimization**: Replaced the sequential fetchCardDetails loop in api.ts with a vectorized approach. 
- **Logic**: 
  1. Extract unique printing_ids from localStorage.
  2. Single .in() query to card_printings.
  3. Single RPC call to get_products_stock_by_printing_ids.
- **Performance**: Reduced network requests from N (number of items) to exactly 2, eliminating the visible delay.

### 2. Defensive Mapping in CartContext

- **Fix**: Updated CartContext.tsx to handle the nested products object returned by the optimized fetchCart.
- **Resilience**: Added fallbacks for price, name, image_url, and set_code to ensure components using useCart().cartItems show correct data.

### 3. TypeScript Build Strictness

- **Rule**: Added a new lesson to lessons_learned.md regarding implicit any types. 
- **Validation**: Verified that npm run build must pass before any push to production.

## Technical Validation

- **Frontend Build**: ? Success.
- **Deployment**: ? Pushed to dev and merged to main (Production).
- **Site Performance**: ? Direct verification shows instant cart updates for guests.

---

*Compounded for Geekorium TCG Ecosystem.*
# 🧠 COMPOUND: Global "Nuevo" Filter & Decoupled Sorting (v49)

**Date**: 2026-04-15 17:35

## Objective

Implement a global "Nuevo" (New) filter across the Marketplace and Admin Dashboard, based on real stock updates (`updated_at`) and decoupled from sorting criteria.

## Knowledge Codification

### 1. The `updated_at` Truth Source
- **Strategy**: Shifted the "Newest" definition from `created_at` (fixed) to `updated_at` (variable).
- **Reasoning**: In a TCG shop, a "new" item is often a "re-stock" of a classic card. This allows the shop to feel dynamic every time inventory is replenished.

### 2. Graceful Fallback (SQL Layer)
- **Logic**: Implemented a "12-day window" filter with a silent fallback.
- **RPC Implementation**: If the 12-day interval results in zero matches, the SQL dynamically ignores the date restriction to show the most recent stock overall. This prevents the "Nuevo" filter from ever leading to a "No products found" dead end.

### 3. Decoupled Filter Architecture
- **UX Rule**: The "Nuevo" indicator is a **pure filter (binary toggle)**, while "Nombre", "Precio", and "Stock" are **sort vectors**.
- **Refinement**: Refactored `Home.tsx` and `InventoryPage.tsx` logic to allow a user to toggle "Nuevo" and *then* sort those new items by Price or Alpha without the button resetting its state.

## Technical Validation

- **Database Migrations**: ✅ Applied `20260415201900_global_new_cards_filter.sql`.
- **Frontend Build**: ✅ Success (`tsc` and `vite build` clean).
- **Unit Tests**: ✅ 28 Passed.
- **Git Push**: ✅ Deployed to `dev` and `main` branches.

---

*Compounded for Geekorium TCG Ecosystem.*

# 🧠 COMPOUND: Strixhaven Visibility & Metadata Restoration (v51)

**Date**: 2026-04-16 23:30 (Local)

## Objective

Restore visibility and operational integrity for the "Secrets of Strixhaven" (SOS/SOA/SOC) editions in the production inventory. Resolve the issue where imported products were hidden from the frontend Marketplace.

## Knowledge Codification

### 1. The Metadata Visibility Barrier
- **Insight**: Even with stock and correct game code (`MTG`), cards remained invisible in the frontend Marketplace.
- **Root Cause**: The React frontend uses `type_line` and `colors` for filtering and rendering logic. Missing metadata in the `products` table causes the API to omit items or the frontend to hide them to prevent broken UI cards.
- **Remediation**: Updated the `sync_product_metadata` PostgreSQL trigger to include `type_line`, `colors`, and `release_date`.

### 2. Mandatory Materialized View Refresh
- **Pattern**: The optimize search endpoint (`get_unique_cards_optimized`) relies on `public.mv_unique_cards`. 
- **Rule**: Any bulk change to prices or visibility-defining metadata (names, types, sets) MUST be followed by `REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_unique_cards;` (or standard `REFRESH` if concurrent is not available) to reflect the changes in the store's primary grid.

### 3. Data Integrity & SQL Types
- **Fix**: Resolved a critical Pydantic/SQL crash in the sync function caused by assuming `price_sources.source_id` was a UUID when it is actually an `integer`.
- **Lesson**: Always verify foreign key types in `information_schema.columns` before assuming ID formats in PL/pgSQL functions.

## Technical Validation

- **Database Logic**: ✅ `sync_product_metadata` V3 applied with fix for `source_id` (integer) and `release_date` (sets join).
- **Data Sync**: ✅ 938 products updated successfully via "Touch" script.
- **Site Visibility**: ✅ Verified on `www.geekorium.shop` with SOS cards now fully visible.
- **Frontend Build**: ✅ Success in production.

---

*Compounded for Geekorium TCG Ecosystem.*

**Date**: 2026-04-16

## Objective

Harden the catalog synchronization workflow (GitHub Actions) to dynamically adapt to `UNIQUE` constraint schema differences between development and production databases during `upsert` operations.

## Knowledge Codification

### 1. Schema-Agnostic PostgREST Error Handling

- **Observation**: Development environments might use `UNIQUE(game_id, set_code)`, whereas legacy or simplified production schemas may rely on `UNIQUE(set_code)`. A mismatch during an `upsert` with `on_conflict` triggers a `42P10` Postgres exception.
- **Solution**: Implemented an explicit catch for `42P10`. The script attempts the `game_id,set_code` constraint first, and if it fails, falls back instantly to `set_code` without breaking the batch loop.
- **Benefit**: Ensures CI/CD sync scripts remain robust and identical across separate Supabase branches, eliminating the need to maintain different scripts per environment.

### 2. Windows vs Linux stdout Consistency

- **Observation**: Python console prints containing emojis (🚀, ✅) crashed with `UnicodeEncodeError: 'charmap' codec can't encode character` when run locally on Windows machines, despite running perfectly on Linux CI runtimes.
- **Solution**: Added a platform-specific `sys.stdout` override forcing `utf-8` using `io.TextIOWrapper` safely.
- **Rule**: All Python tooling designed for CI but testable locally by developers MUST implement explicit `utf-8` buffers if using rich logging characters.

## Technical Validation

- **Backend Logic**: ✅ Fallback mechanism successfully verified to bypass `42P10` and proceed with Upserts.
- **OS Health**: ✅ Windows execution cleared via `sys.platform == 'win32'` catch.
- **Git Push**: ✅ Commited and merged cleanly to `main` branch.

---

*Compounded for Geekorium TCG Ecosystem.*

# 🧠 COMPOUND: Global Pricing Integrity & SKU Sync (v52)

**Date**: 2026-04-17

## Objective

Resolve widespread pricing contamination (foil prices assigned to non-foil versions) across the entire catalog and implement accurate SKU-based synchronization for Strixhaven and modern sets.

## Knowledge Codification

### 1. SKU-Centric Mapping (Rule of Order)
- **Problem**: CardKingdom's `variation` field is unreliable for modern sets. Reliance on name-matching for foils caused extreme price contamination ($800 normal cards).
- **Solution**: Pivot to SKU-parsing as the primary match vector. `[F]SET-NNNN` provides 100% accuracy for both collector number and finish.
- **Rule**: Prefijo `F` = Foil. Suffix `SET-NNNN` = Collector Number (normalized).

### 2. High-Performance Batch `UPDATE` (Law 18)
- **Technique**: Used `UPDATE target FROM (VALUES (...) ) AS v(id, price)` chunked at 2,000 rows.
- **Performance**: 47,000 updates applied in **63 seconds** via pooled connection (port 6543), overcoming the performance wall of `executemany`.
- **Integrity**: Verified key corrections (Diabolic Intent $849 -> $27, Sleight of Hand restore to $0.69).

### 3. Build & CI Integrity (The "Audit" Fixes)
- **Refinement**: Cleaned `src/components/Card/Card.tsx` from unused `updated_at` prop to pass strict TS builds.
- **Resilience**: Hardened `scripts/test_api_endpoints.py` against Windows console `UnicodeEncodeError` by removing non-essential emojis.

## Technical Validation

- **Frontend Build**: ✅ Success (`dist` assets generated).
- **Production Audit**: ✅ Diabolic Intent (PLS) Normal = $27.99, Sleight of Hand (SOA) Normal = $0.69.
- **Git State**: ✅ Clean branch (dev/main) sync ready.

---

*Compounded for Geekorium TCG Ecosystem.*

# 🧠 COMPOUND: Production Checkout Restoration (v53)

**Date**: 2026-04-17

## Objective

Urgently restore the `create_order_atomic` RPC function in production to resolve a critical checkout failure caused by a signature mismatch ("Function not found").

## Knowledge Codification

### 1. Unified Signature with Defaults
- **Problem**: The frontend started sending `p_cart_id` (6 parameters), but the production database only had a 5-parameter version.
- **Solution**: Restored the function with a 6-parameter signature including `DEFAULT NULL` for both `p_guest_info` and `p_cart_id`.
- **Backward Compatibility**: This fix ensures that older calls (4-5 params) from Edge Functions still work while satisfying the new frontend requirements.

### 2. Multi-Cart Awareness in Orders
- **Logic**: The restored RPC now uses the provided `p_cart_id` to clear the correct cart. If null, it falls back to the user's active cart. This prevents users from "purchasing" items from one cart while another remains full.

### 3. Overload Management Risks
- **Lesson**: Automated cleanup of "overloaded" functions must be done with extreme caution. The error `42883: function create_order_atomic(...) does not exist` is often a signature mismatch, not a missing function.

## Technical Validation

- **Database Restoration**: ✅ RPC `create_order_atomic` applied to production with 6-param signature.
- **Backward Compatibility**: ✅ Verified 4-parameter and 6-parameter calls via `scratch/test_order_rpc.py`.
- **Frontend Build**: ✅ Build successful (`npm run build`).
- **Site Status**: ✅ Fixed in production.

---

*Compounded for Geekorium TCG Ecosystem.*
