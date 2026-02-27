# PRD: Order Status Lifecycle & Management System

## 1. Problem Statement

**Context**: Currently, the order management system relies on a simplistic status model (`pending`, `completed`, `cancelled`). This creates ambiguity in the fulfillment process. e.g., an order can be "pending" but paid, or "pending" but unpaid. There is no clear way to track if an order is ready for pickup, or if it was returned.
**Pain Points**:

- No way to distinguish between "Paid & Waiting Pickup" vs "Unpaid & Reserved".
- Lack of "Returned" status for restocking items that were sold but brought back.
- No "Missing Stock" status if an inventory error occurs post-order.
- Inability to "Resume" a cancelled order without manually re-creating it.

## 2. Objective

Implement a robust **Order Lifecycle State Machine** that covers all real-world scenarios for a TCG store (picking, packing, shipping/pickup, returns). This includes database updates, UI controls for Admins to transition statuses, and automated inventory adjustments where applicable.

## 3. Proposed Order Status Workflow

### 3.1. The Statuses (Estados)

| Status Key        | Label (ES)          | Description | Inventory Impact |
|-------------------|---------------------|-------------|------------------|
| `pending_payment` | **Pendiente de Pago** | Created, stock reserved, awaiting payment confirmation. | **Reserved** (Already deducted on create) |
| `paid`            | **Pagado**          | Payment confirmed. Ready for processing. | **Reserved** |
| `processing`      | **En Preparación**    | Admin is picking/packing the cards. | **Reserved** |
| `ready_for_pickup`| **Listo para Retirar**| Packed and waiting at the counter. | **Reserved** |
| `shipped`         | **Enviado**         | Handed to courier (if applicable). | **Deducted** (Finalized) |
| `delivered`       | **Entregado**       | Customer received the order. Final state. | **Deducted** |
| `cancelled`       | **Cancelado**       | Order voided before fulfillment. | **Restocked** (+Quantity) |
| `returned`        | **Devuelto**        | Item returned after delivery. | **Restocked** (+Quantity) |
| `refunded`        | **Reembolsado**     | Money returned, items may or may not be returned (handled manually or via 'returned'). This might be a financial status, but for simplicity, we can treat it as a terminal state often linked with 'cancelled'. | **No Change** (unless linked to return) |
| `on_hold`         | **En Espera**       | Issue with order (e.g., verifying stock). | **Reserved** |

### 3.2. State Transitions & Rules

1. **Creation**:
    - `New Order` -> `pending_payment` (Standard flow).
    - Inventory is decremented immediately upon creation (Atomic).

2. **Payment & Processing**:
    - `pending_payment` -> `paid` (Manual or Auto via Gateway).
    - `paid` -> `processing` (Admin starts working).
    - `processing` -> `ready_for_pickup` (Admin finishes packing).

3. **Completion**:
    - `ready_for_pickup` -> `delivered` (Customer picks up).
    - `processing` -> `shipped` (If shipping).
    - `shipped` -> `delivered`.

4. **Cancellation (Critical Path)**:
    - **From**: `pending_payment`, `paid`, `processing`, `ready_for_pickup`, `on_hold`.
    - **To**: `cancelled`.
    - **Action**: **AUTO-RESTOCK**. The system must add the items back to the `products` inventory.

5. **Returns**:
    - **From**: `delivered`.
    - **To**: `returned`.
    - **Action**: **AUTO-RESTOCK**. Similar to cancellation, stock is added back.

6. **Restoring/Resuming**:
    - **From**: `cancelled` (Mistake or customer changed mind).
    - **To**: `pending_payment` or `paid`.
    - **Action**: **RE-DEDUCT STOCK**. *Constraint*: Must check if stock is still available. If not, cannot resume.

## 4. Technical Implementation Requirements

### 4.1. Database Schema Updates

- Update `orders.status` column to supporting all new enum values (or check constraint).
- Ensure `orders` table has a `payment_status` column if we want to decouple payment from fulfillment, but for now `status` covering both is acceptable for V1.

### 4.2. Backend Logic (Supabase RPCs)

- **`update_order_status(order_id, new_status)`**:
  - Validate transition.
  - If `new_status` == 'cancelled' OR 'returned':
    - Iterate order items -> `UPDATE products SET stock = stock + quantity`.
  - If `old_status` == 'cancelled' AND `new_status` != 'cancelled':
    - Check current stock levels.
    - If sufficient -> `UPDATE products SET stock = stock - quantity`.
    - If insufficient -> Throw Error "Cannot restore order, insufficient stock".

### 4.3. Frontend (Admin Orders Page)

- **Status Dropdown**: Visible in the Order Item row (or detail view). Allows Admin to select the next logical status.
- **Visuals**:
  - `pending_payment`: Yellow badge.
  - `paid`: Blue badge.
  - `ready_for_pickup`: Purple badge (Highlight!).
  - `delivered`: Green badge.
  - `cancelled`: Red badge/strikethrough.
- **Filters**: Filter orders by status (e.g., "Show only Ready for Pickup").

## 5. Acceptance Criteria

- [ ] Admin can change an order from `pending` to `paid`, `processing`, `ready`, `delivered`.
- [ ] Changing to `cancelled` automatically replenishes inventory.
- [ ] Changing from `cancelled` back to `pending` (if allowed) re-deducts inventory or errors if out of stock.
- [ ] UI clearly distinguishes different states with colors/icons.
- [ ] "No Stock / Inventory Error" scenario handling (manually marking an item as missing? -> Out of scope for this V1, will handle via partial refund/edit order in V2).
