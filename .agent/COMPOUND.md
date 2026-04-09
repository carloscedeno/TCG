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
