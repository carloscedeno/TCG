# Changelog: Admin Orders & Inventory Management

## Release: v2.1-admin-orders

Date: 2026-02-16

### Completed Features

1. **Order Items Tracking**:
   - Implemented `order_items` table to store detailed purchase history.
   - **NEW**: Created `create_order_atomic` RPC to handle secure checkout and item recording.
   - Updated frontend to use `image_url` correctly.
   - configured RLS for local demo access.

2. **Manual Stock Management**:
   - Added `update_product_stock` RPC for secure stock updates.
   - Enhanced `InventoryPage.tsx` with inline stock editing capabilities.
   - Added optimistic UI updates for instant feedback.

3. **Order Management & Cancellation**:
   - Created `cancel_order_and_restock` RPC to handle order cancellations atomically.
     - Automatically restores stock for all items in the cancelled order.
     - Updates order status to 'cancelled'.
   - Created `OrdersPage.tsx` (accessible at `/admin/orders`):
     - Lists all orders with status indicators.
     - Expandable view to see purchased items (images, names, quantities).
     - "Cancel Order" button with confirmation.
   - Integrated new page into `AdminDashboard.tsx` navigation.

### Technical Details

- **Database**:
  - `public.order_items`: Foreign keys to `orders(id)` and `products(id)`.
  - `public.cancel_order_and_restock(p_order_id UUID)`: PL/pgSQL function.
  - `public.update_product_stock(p_product_id UUID, p_new_quantity INTEGER)`: PL/pgSQL function.

- **Frontend**:
  - `src/pages/Admin/OrdersPage.tsx`: New component.
  - `src/pages/Admin/InventoryPage.tsx`: Updated with stock editing.
  - `src/pages/Admin/AdminDashboard.tsx`: Added navigation cards.
  - `src/App.tsx`: Added `/admin/orders` route.

### Verification

- Verify that checking out an order correctly populates `order_items`. (Already verified in previous steps).
- Verify that stock can be manually edited in Inventory page.
- Verify that cancelling an order in Orders page restores stock and updates status.
