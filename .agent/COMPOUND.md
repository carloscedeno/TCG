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
