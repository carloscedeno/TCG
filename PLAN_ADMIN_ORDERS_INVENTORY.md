# Plan: Admin Orders & Inventory Management

## Overview

This plan outlines the steps to implement the requested admin features: manual stock adjustment, detailed order history, and order cancellation with stock recovery.

## Phases

### Phase 1: Database Schema & Backend (Checkout Flow)

**Objective**: Enable the system to record what items are sold.

1. **Migration**: Create a new Supabase migration file `supabase/migrations/xxxx_create_order_items.sql`.
    - Define `order_items` table with foreign keys to `orders` and `products`.
    - Add `quantity` and `price_at_purchase` columns.
    - Add Row Level Security (RLS) policies if needed (admins read all, users read own).
2. **Checkout Logic**: Update `src/api/services/cart_service.py` (`CartService.checkout`).
    - Modify the transaction to insert into `order_items` table right after creating the order.
    - Ensure this works atomically with stock deduction.

### Phase 2: Stock Management (Admin)

**Objective**: Allow manual stock corrections.

1. **RPC/API**: Create a Supabase RPC or API endpoint `update_product_stock`.
    - Input: `product_id`, `new_quantity`.
    - Logic: `UPDATE products SET stock = new_quantity WHERE id = product_id`.
2. **Frontend**: Update the Admin Inventory view (or create a new specialized component based on `QuickStockItem.tsx` proposed in other PRD).
    - Add an input field for stock.
    - Add a "Save" button that calls the new API.

### Phase 3: Order Cancellation & Recovery

### Phase 3: Order Cancellation & Recovery (COMPLETED ✅)

**Implementation**:

- Replaced `cancel_order_and_restock` with a robust **Order Lifecycle State Machine**.
- Created `update_order_status` RPC that handles all status transitions (e.g., `cancelled` -> Restock, `returned` -> Restock, `paid` -> Deduct).
- Updated `orders` table to support extended status list (`pending_payment`, `paid`, `ready_for_pickup`, etc.).
- Updated Admin UI with status dropdowns and real-time filtering.

## Next Steps

1. User approval of this plan.
2. Execute Phase 1 immediately to start capturing data for new orders.

## Maintenance & Fixes (2026-02-16)

- **Admin API Connection**: Resolved `ERR_CONNECTION_REFUSED` by starting the backend service (`uvicorn`) on port 8000.
- **Stats Timeout Fix**: Updated `AdminDashboard` to use `estimated` counts for large tables (`card_printings`, `price_history`) to prevent 500 errors.
- **Task Runner**: Re-enabled task polling in Admin Dashboard now that backend is accessible.
- **UI Translation (Admin)**: Full Spanish translation of Admin Dashboard, Orders, and Inventory management pages.
- **Documentation**: Created `docs/TRANSLATION_SUMMARY.md`.
- **Order Price Fix**:
  - Resolved issue where orders showed $0.00.
  - Created migration `supabase/migrations/20260216_fix_cart_price_fallback.sql` to ensure cart items always have a price (fallback to market price).
  - Executed `scripts/fix_order_prices.py` to retroactively fix existing orders with $0.00.
