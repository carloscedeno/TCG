# PRD - Admin Orders & Inventory Management

## 1. Context & Objective

Admin users have requested better control over inventory and order management. Currently, there is a lack of visibility into what specific items were sold in an order, and no easy way to manually adjust stock or recover stock from cancelled orders. This PRD addresses these gaps to improve operational efficiency and data integrity.

## 2. Problem Statement

1. **No Itemized Order History**: The system records the total amount of an order but not the specific cards purchased. This makes it impossible to know what was sold or to handle returns/cancellations accurately.
2. **Manual Stock Adjustment**: Admins need a direct way to modify the quantity of a specific single card manually.
3. **Cancellation & Restocking**: When an order is cancelled, the items are not automatically returned to inventory, leading to stock discrepancies.

## 3. Scope & Requirements

### 3.1. Inventory Management

- **Manual Quantity Adjustment**:
  - Allow admins to edit the `stock` quantity of a specific product directly from the admin interface.
  - Validate that stock cannot be negative.
  - Log this adjustment (optional but recommended for audit).

### 3.2. Order Management (New)

- **Detailed Order Records**:
  - Create an `order_items` table to store the snapshot of items purchased in each order (product_id, quantity, price_at_purchase).
  - Update the Checkout process to populate `order_items` when an order is created.
- **Order Cancellation**:
  - Provide an admin function to cancel an order.
  - When an order is cancelled:
        1. Update order status to `cancelled`.
        2. Automatically restore the `quantity` of each item in `order_items` back to the `products` inventory.

## 4. Technical Architecture

### 4.1. Database Schema Updates

- **New Table: `order_items`**
  - `id` (UUID, PK)
  - `order_id` (UUID, FK to orders)
  - `product_id` (UUID, FK to products)
  - `quantity` (Integer)
  - `price` (Numeric, snapshot of price at time of sale)
  - `created_at` (Timestamp)

### 4.2. API / Backend Logic

- **Update `CartService.checkout`**:
  - Insert records into `order_items` immediately after creating the `order` and before clearing the cart.
- **New Endpoint: `POST /api/admin/inventory/update`**:
  - Inputs: `product_id`, `new_stock`.
  - Logic: Update `products.stock`.
- **New Endpoint: `POST /api/admin/orders/{order_id}/cancel`**:
  - Logic:
    - Verify order exists and is not already cancelled.
    - Transaction start.
    - Update `orders.status` = 'cancelled'.
    - Iterate `order_items` for this order.
    - For each item, `UPDATE products SET stock = stock + item.quantity WHERE id = item.product_id`.
    - Transaction commit.

### 4.3. Frontend (Admin UI)

- **Inventory View**: Add a "Edit Stock" button/input next to products.
- **Orders View**:
  - Show list of orders.
  - Expand order to see `order_items` (cards sold).
  - "Cancel Order" button with confirmation.
- **Dashboard Widget**:
  - Quick view of recent orders and their items.

## 5. Implementation Plan

### Phase 1: Database & Checkout (Critical)

1. Create migration for `order_items` table.
2. Refactor `CartService.checkout` to populate `order_items`.
3. Deploy and verify that new orders now represent sold items correctly.

### Phase 2: Stock Management

1. Implement `upsert_inventory` or specific `update_stock` RPC/API.
2. Update Admin UI to allow stock editing.

### Phase 3: Cancellation Flow

1. Implement `cancel_order` RPC/API logic.
2. Add Cancel button to Admin Orders UI.

## 6. Acceptance Criteria

1. **Stock Edit**: Admin can change a Card X stock from 5 to 10, and it reflects in the database immediately.
2. **Order History**: A new order placed for "Sol Ring x2" appears in the `order_items` table with correct price and quantity.
3. **Cancellation**: Cancelling the above order automatically updates "Sol Ring" stock from N to N+2.
